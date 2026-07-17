/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Cpu, 
  RefreshCcw, 
  ArrowRight,
  TrendingDown,
  Activity
} from "lucide-react";
import { Part, PartStatus } from "../types";

interface ManagerSummaryProps {
  parts: Part[];
  onSelectPart: (id: string) => void;
  onResetData: () => void;
}

export default function ManagerSummary({
  parts,
  onSelectPart,
  onResetData,
}: ManagerSummaryProps) {

  // Statistics calculations
  const stats = useMemo(() => {
    const total = parts.length;
    
    // Discrepancies: physical !== erp OR erp !== catia
    const discrepancies = parts.filter(p => 
      p.catiaQty !== p.erpQty || p.erpQty !== p.physicalQty
    ).length;

    // Shortages: physical < catia or status is SHORTAGE
    const shortages = parts.filter(p => 
      p.physicalQty < p.catiaQty || p.status === PartStatus.SHORTAGE
    ).length;

    // Localized development parts
    const localizedParts = parts.filter(p => p.isCriticalLocalPart);
    const localizedCount = localizedParts.length;
    const localizedRate = total > 0 ? Math.round((localizedCount / total) * 100) : 0;

    // Available count
    const availableCount = parts.filter(p => p.status === PartStatus.AVAILABLE).length;
    const healthRate = total > 0 ? Math.round((availableCount / total) * 100) : 0;

    // Defective item count
    const defectives = parts.filter(p => p.status === PartStatus.DEFECTIVE).length;

    return {
      total,
      discrepancies,
      shortages,
      localizedCount,
      localizedRate,
      healthRate,
      defectives
    };
  }, [parts]);

  // Grouped subsystems status summary
  const subsystemSummary = useMemo(() => {
    const subsystems = Array.from(new Set(parts.map(p => p.subsystem)));
    return subsystems.map(sub => {
      const subParts = parts.filter(p => p.subsystem === sub);
      const total = subParts.length;
      const discrepancyCount = subParts.filter(p => p.catiaQty !== p.erpQty || p.erpQty !== p.physicalQty).length;
      const shortageCount = subParts.filter(p => p.physicalQty < p.catiaQty).length;
      const availableCount = subParts.filter(p => p.status === PartStatus.AVAILABLE).length;
      const health = total > 0 ? Math.round((availableCount / total) * 100) : 0;

      return {
        name: sub,
        total,
        discrepancies: discrepancyCount,
        shortages: shortageCount,
        health
      };
    });
  }, [parts]);

  // Identify high-risk parts (Lead time threats)
  const highRiskScheduleParts = useMemo(() => {
    return parts.filter(p => {
      if (!p.scheduledDate || p.physicalQty >= p.catiaQty) return false;
      const scheduled = new Date(p.scheduledDate);
      const today = new Date("2026-07-16");
      const diffTime = scheduled.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays < p.leadTimeDays;
    });
  }, [parts]);

  // List of active discrepancies
  const discrepancyList = useMemo(() => {
    return parts.filter(p => p.catiaQty !== p.erpQty || p.erpQty !== p.physicalQty);
  }, [parts]);

  return (
    <div className="space-y-8" id="manager-summary-view">
      
      {/* Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="kpi-cards-grid">
        {/* Total Parts */}
        <div className="bg-white p-6 border border-apple-hairline/60 rounded-[18px] flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-apple-pearl text-apple-ink rounded-full">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">관리 대상 품목</span>
            <span className="text-2xl font-semibold text-apple-ink font-mono mt-0.5 block">{stats.total} <span className="text-xs text-apple-muted font-sans font-medium">종</span></span>
          </div>
        </div>

        {/* Shortages Alert */}
        <div className="bg-white p-6 border border-apple-hairline/60 rounded-[18px] flex items-center gap-4 shadow-sm">
          <div className={`p-3 rounded-full transition-all ${stats.shortages > 0 ? "bg-rose-50 text-rose-600 animate-pulse border border-rose-100" : "bg-apple-pearl text-apple-ink"}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">결품/부족 (Shortage)</span>
            <span className={`text-2xl font-bold font-mono mt-0.5 block ${stats.shortages > 0 ? "text-rose-600" : "text-apple-ink"}`}>
              {stats.shortages} <span className="text-xs font-semibold font-sans">품목</span>
            </span>
          </div>
        </div>

        {/* Active Discrepancies */}
        <div className="bg-white p-6 border border-apple-hairline/60 rounded-[18px] flex items-center gap-4 shadow-sm">
          <div className={`p-3 rounded-full transition-all ${stats.discrepancies > 0 ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-apple-pearl text-apple-ink"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">데이터 불일치 (Mismatches)</span>
            <span className={`text-2xl font-bold font-mono mt-0.5 block ${stats.discrepancies > 0 ? "text-amber-600" : "text-apple-ink"}`}>
              {stats.discrepancies} <span className="text-xs font-semibold font-sans">건</span>
            </span>
          </div>
        </div>

        {/* Localization development percentage */}
        <div className="bg-white p-6 border border-apple-hairline/60 rounded-[18px] flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-apple-pearl text-apple-ink rounded-full">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">핵심 부품 국산화율</span>
            <span className="text-2xl font-semibold text-apple-ink font-mono mt-0.5 block">
              {stats.localizedRate}% <span className="text-xs text-apple-muted font-sans font-medium">({stats.localizedCount}/{stats.total})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Progress and Real-time Discrepancy Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="manager-boards">
        
        {/* Left Column: Progress status chart (SVG) and Schedule alerts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Subsystem Health Progress list */}
          <div className="bg-white p-6 border border-apple-hairline/60 rounded-[18px] space-y-5 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-apple-hairline/60">
              <h3 className="font-semibold text-xs text-apple-ink uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Activity className="w-4 h-4 text-apple-blue" /> 하위 체계 가용도 (Health)
              </h3>
              <span className="text-[10px] font-mono text-apple-muted font-semibold">BOM계통 {stats.total} EA</span>
            </div>

            <div className="space-y-4">
              {subsystemSummary.map(sub => (
                <div key={sub.name} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-apple-ink">{sub.name}</span>
                    <span className="font-mono text-xs text-apple-muted">가용: <strong className="text-apple-ink">{sub.health}%</strong></span>
                  </div>
                  {/* Gauge indicator */}
                  <div className="h-2.5 w-full bg-apple-hairline/40 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all rounded-full ${
                        sub.health > 80 ? "bg-apple-blue" : sub.health > 50 ? "bg-apple-muted" : "bg-rose-600"
                      }`}
                      style={{ width: `${sub.health}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-apple-muted font-mono uppercase tracking-wider">
                    <span>정상: {sub.total - sub.shortages - sub.discrepancies}</span>
                    <span className="flex gap-2">
                      {sub.shortages > 0 && <span className="text-rose-600 font-bold">부족 {sub.shortages}</span>}
                      {sub.discrepancies > 0 && <span className="text-amber-600 font-bold">불일치 {sub.discrepancies}</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Threat Warning board (L/T warnings) */}
          <div className="bg-white p-6 border border-apple-hairline/60 rounded-[18px] space-y-5 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-apple-hairline/60">
              <h3 className="font-semibold text-xs text-rose-600 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <TrendingDown className="w-4 h-4" /> 리드타임(L/T) 일정 침해 품목
              </h3>
              <span className="bg-rose-100 text-rose-900 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border border-rose-200">고위험</span>
            </div>

            <div className="space-y-3.5">
              {highRiskScheduleParts.length === 0 ? (
                <div className="text-center py-10 text-xs text-apple-muted bg-apple-pearl border border-apple-hairline/40 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <span className="font-sans font-medium">현재 투입 일정 내 공급 위협 부품이 없습니다.</span>
                </div>
              ) : (
                highRiskScheduleParts.map(part => {
                  return (
                    <div 
                      key={part.id} 
                      onClick={() => onSelectPart(part.id)}
                      className="p-4 bg-rose-50/40 hover:bg-rose-50/80 border border-rose-100/80 rounded-xl cursor-pointer transition-all space-y-1.5 active-scale"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] text-rose-900 font-bold tracking-wider">{part.partNumber}</span>
                        <span className="text-[9px] bg-rose-100 text-rose-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider">L/T {part.leadTimeDays}D</span>
                      </div>
                      <h4 className="text-xs font-bold text-apple-ink leading-tight mt-1">{part.partName}</h4>
                      <p className="text-[10px] text-rose-700 pt-1 font-sans">
                        • 조립일정({part.scheduledDate}) 대비 발주 지연 위험군
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Discrepancy & Shortage Board */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-apple-hairline/60 rounded-[18px] p-6 space-y-5 shadow-sm" id="discrepancy-board-container">
            <div className="flex flex-col gap-1 pb-3 border-b border-apple-hairline/60">
              <h3 className="font-semibold text-xs text-apple-ink uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> 데이터 불일치 자동 정합성 분석 테이블
              </h3>
              <p className="text-[11px] text-apple-muted font-sans">설계 3D 모델(CATIA) vs 사내전산(ERP) vs 현장 보관 실물의 정합 수량을 실시간 비교 진단합니다.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-apple-parchment border-b border-apple-hairline/80 text-apple-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">품목 코드</th>
                    <th className="py-3 px-3">품명 (하위체계)</th>
                    <th className="py-3 px-3 text-center">CATIA (A)</th>
                    <th className="py-3 px-3 text-center">ERP 전산 (B)</th>
                    <th className="py-3 px-3 text-center text-apple-ink">현장 실물 (C)</th>
                    <th className="py-3 px-3">불일치 진단 소견</th>
                    <th className="py-3 px-3 text-right">조치</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-hairline">
                  {discrepancyList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-apple-muted font-sans font-medium">
                        데이터 정합성이 100% 만족하는 정상적 상태입니다.
                      </td>
                    </tr>
                  ) : (
                    discrepancyList.map((part) => {
                      const hasCatiaErpDiff = part.catiaQty !== part.erpQty;
                      const hasErpPhysDiff = part.erpQty !== part.physicalQty;

                      return (
                        <tr key={part.id} className="hover:bg-apple-parchment/30 transition-colors">
                          <td className="py-3.5 px-3 font-mono text-[10px] text-apple-muted uppercase tracking-wider">{part.partNumber}</td>
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-apple-ink">{part.partName}</span>
                              <span className="text-[10px] text-apple-muted font-mono uppercase tracking-wider mt-0.5">{part.subsystem}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-apple-muted">{part.catiaQty}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-apple-muted">{part.erpQty}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-black bg-rose-50/50 text-rose-700">{part.physicalQty}</td>
                          <td className="py-3.5 px-3 text-[11px]">
                            {hasCatiaErpDiff && (
                              <span className="text-apple-blue font-medium block">설계변경 승인누락 (CATIA {part.catiaQty} ↔ ERP {part.erpQty})</span>
                            )}
                            {hasErpPhysDiff && (
                              <span className="text-rose-600 block font-medium">• 현장 실물 불일치 위험 (ERP {part.erpQty} ↔ 실물 {part.physicalQty})</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              id={`btn-manager-examine-${part.id}`}
                              onClick={() => onSelectPart(part.id)}
                              className="px-3 py-1.5 bg-apple-ink text-white hover:bg-neutral-800 text-[10px] font-semibold tracking-tight rounded-full flex items-center gap-1.5 ml-auto transition-all cursor-pointer active-scale"
                            >
                              진단실사 <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reset Helper Panel */}
          <div className="bg-[#1d1d1f] text-slate-100 rounded-[18px] p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
            <div className="space-y-1.5 text-left">
              <h4 className="text-xs uppercase tracking-widest font-bold text-white flex items-center gap-1.5 font-sans">
                <RefreshCcw className="w-4 h-4 text-white" />
                프로토타입 가상 시나리오 초기화 (RESET)
              </h4>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                시연 과정에서 조정한 임의 입출고 데이터 및 불량 변경 이력을 공장 초기화 데이터셋으로 복원합니다.
              </p>
            </div>
            <button
              id="btn-reset-demo-data"
              onClick={onResetData}
              className="px-4.5 py-2.5 bg-white text-[#1d1d1f] hover:bg-apple-pearl text-xs font-semibold tracking-tight rounded-full shrink-0 flex items-center gap-1.5 transition-all cursor-pointer border border-transparent active-scale"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> 데이터 리셋
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
