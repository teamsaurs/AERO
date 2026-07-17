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
    <div className="space-y-6" id="manager-summary-view">
      
      {/* Executive KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="kpi-cards-grid">
        {/* Total Parts */}
        <div className="bg-white p-5 border border-[#D1D1CD] rounded-none flex items-center gap-4">
          <div className="p-3 bg-[#E9E9E5] text-[#1A1A1A]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">관리 대상 품목</span>
            <span className="text-xl font-bold text-[#1A1A1A] font-mono mt-0.5 block">{stats.total} <span className="text-xs text-[#555555]">종</span></span>
          </div>
        </div>

        {/* Shortages Alert */}
        <div className="bg-white p-5 border border-[#D1D1CD] rounded-none flex items-center gap-4">
          <div className={`p-3 ${stats.shortages > 0 ? "bg-red-50 text-red-600 animate-pulse border border-red-200" : "bg-[#E9E9E5] text-[#1A1A1A]"}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">결품/부족 (Shortage)</span>
            <span className={`text-xl font-bold font-mono mt-0.5 block ${stats.shortages > 0 ? "text-red-700 font-extrabold" : "text-[#1A1A1A]"}`}>
              {stats.shortages} <span className="text-xs font-semibold">품목</span>
            </span>
          </div>
        </div>

        {/* Active Discrepancies */}
        <div className="bg-white p-5 border border-[#D1D1CD] rounded-none flex items-center gap-4">
          <div className={`p-3 ${stats.discrepancies > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-[#E9E9E5] text-[#1A1A1A]"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">데이터 불일치 (Mismatches)</span>
            <span className={`text-xl font-bold font-mono mt-0.5 block ${stats.discrepancies > 0 ? "text-amber-700 font-extrabold" : "text-[#1A1A1A]"}`}>
              {stats.discrepancies} <span className="text-xs font-semibold">건</span>
            </span>
          </div>
        </div>

        {/* Localization development percentage */}
        <div className="bg-white p-5 border border-[#D1D1CD] rounded-none flex items-center gap-4">
          <div className="p-3 bg-[#E9E9E5] text-[#1a1a1a]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">핵심 부품 국산화율</span>
            <span className="text-xl font-bold text-[#1A1A1A] font-mono mt-0.5 block">
              {stats.localizedRate}% <span className="text-xs text-[#555555]">({stats.localizedCount}/{stats.total})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Progress and Real-time Discrepancy Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="manager-boards">
        
        {/* Left Column: Progress status chart (SVG) and Schedule alerts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Subsystem Health Progress list */}
          <div className="bg-white p-5 border border-[#D1D1CD] rounded-none space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#D1D1CD]">
              <h3 className="font-bold text-xs text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#1a1a1a]" /> 하위 체계 가용도 (Health)
              </h3>
              <span className="text-[10px] font-mono text-[#666666]">TOTAL: {stats.total} EA</span>
            </div>

            <div className="space-y-4">
              {subsystemSummary.map(sub => (
                <div key={sub.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#1A1A1A]">{sub.name}</span>
                    <span className="font-mono text-xs text-[#555555]">가용: <strong className="text-[#1A1A1A]">{sub.health}%</strong></span>
                  </div>
                  {/* Gauge indicator */}
                  <div className="h-2 w-full bg-[#E9E9E5] rounded-none overflow-hidden flex">
                    <div 
                      className={`h-full transition-all ${
                        sub.health > 80 ? "bg-[#1A1A1A]" : sub.health > 50 ? "bg-[#888888]" : "bg-red-700"
                      }`}
                      style={{ width: `${sub.health}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#666666] font-mono">
                    <span>정상: {sub.total - sub.shortages - sub.discrepancies}</span>
                    <span className="flex gap-2">
                      {sub.shortages > 0 && <span className="text-red-700 font-bold">부족 {sub.shortages}</span>}
                      {sub.discrepancies > 0 && <span className="text-amber-700 font-bold">불일치 {sub.discrepancies}</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Threat Warning board (L/T warnings) */}
          <div className="bg-white p-5 border border-[#D1D1CD] rounded-none space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#D1D1CD]">
              <h3 className="font-bold text-xs text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" /> 리드타임(L/T) 일정 침해 품목
              </h3>
              <span className="bg-red-100 text-red-900 text-[9px] font-bold px-1.5 py-0.5 tracking-wider uppercase border border-red-200">고위험</span>
            </div>

            <div className="space-y-3">
              {highRiskScheduleParts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-[#F4F4F2]/30 border border-[#D1D1CD]/40">
                  <CheckCircle className="w-8 h-8 text-green-700 mx-auto mb-2" />
                  <span className="font-serif italic">현재 투입 일정 내 공급 위협 부품이 없습니다.</span>
                </div>
              ) : (
                highRiskScheduleParts.map(part => {
                  return (
                    <div 
                      key={part.id} 
                      onClick={() => onSelectPart(part.id)}
                      className="p-3 bg-red-50/50 hover:bg-red-50/80 border border-red-200 rounded-none cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] text-red-900 font-bold tracking-wider">{part.partNumber}</span>
                        <span className="text-[9px] bg-red-100 text-red-900 px-1.5 py-0.5 font-bold uppercase tracking-wider">L/T {part.leadTimeDays}D</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#1A1A1A] leading-tight mt-0.5">{part.partName}</h4>
                      <p className="text-[10px] text-red-800 pt-1 font-serif italic">
                        • 조립일정({part.scheduledDate}) 대비 리드타임 경과 위험!
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
          <div className="bg-white border border-[#D1D1CD] rounded-none p-5 space-y-4" id="discrepancy-board-container">
            <div className="flex flex-col gap-1 pb-2 border-b border-[#D1D1CD]">
              <h3 className="font-bold text-xs text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> 데이터 불일치 자동 정합성 분석 테이블
              </h3>
              <p className="text-[11px] text-slate-500 font-serif italic">설계 3D 모델(CATIA) vs 사내전산(ERP) vs 현장 보관 실물의 정합 수량을 동시 비교 진단합니다.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#E9E9E5] border-b border-[#D1D1CD] text-[#444444] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">품목 코드</th>
                    <th className="py-2.5 px-3">품명 (하위체계)</th>
                    <th className="py-2.5 px-3 text-center bg-gray-100/50">CATIA (A)</th>
                    <th className="py-2.5 px-3 text-center bg-gray-100">ERP 전산 (B)</th>
                    <th className="py-2.5 px-3 text-center bg-[#E9E9E5]/60 text-[#1a1a1a]">현장 실물 (C)</th>
                    <th className="py-2.5 px-3">불일치 진단 소견</th>
                    <th className="py-2.5 px-3 text-right">조치</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1D1CD]">
                  {discrepancyList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-[#666666] font-serif italic">
                        데이터 정합성이 100% 만족하는 완벽한 상태입니다!
                      </td>
                    </tr>
                  ) : (
                    discrepancyList.map((part) => {
                      const hasCatiaErpDiff = part.catiaQty !== part.erpQty;
                      const hasErpPhysDiff = part.erpQty !== part.physicalQty;

                      return (
                        <tr key={part.id} className="hover:bg-[#F4F4F2]/30">
                          <td className="py-3 px-3 font-mono text-[10px] text-slate-500 uppercase tracking-wider">{part.partNumber}</td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-[#1A1A1A]">{part.partName}</span>
                              <span className="text-[10px] text-[#666666] font-mono uppercase tracking-wider">{part.subsystem}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold bg-gray-50/50 text-slate-700">{part.catiaQty}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold bg-gray-100/50 text-slate-800">{part.erpQty}</td>
                          <td className="py-3 px-3 text-center font-mono font-black bg-red-50/40 text-red-800">{part.physicalQty}</td>
                          <td className="py-3 px-3 text-[11px] font-serif">
                            {hasCatiaErpDiff && (
                              <span className="text-blue-700 block">설계변경 승인누락 (CATIA {part.catiaQty} ↔ ERP {part.erpQty})</span>
                            )}
                            {hasErpPhysDiff && (
                              <span className="text-red-700 block italic">• 현장 실물 결손 위험 (ERP {part.erpQty} ↔ 실물 {part.physicalQty})</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              id={`btn-manager-examine-${part.id}`}
                              onClick={() => onSelectPart(part.id)}
                              className="px-2.5 py-1 bg-[#1A1A1A] text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-wider rounded-none flex items-center gap-1 ml-auto transition-all cursor-pointer"
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
          <div className="bg-[#1A1A1A] text-slate-100 rounded-none p-5 border border-[#1A1A1A] flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <h4 className="text-xs uppercase tracking-widest font-bold text-white flex items-center gap-1.5">
                <RefreshCcw className="w-4 h-4 text-white" />
                프로토타입 가상 시나리오 초기화 (RESET)
              </h4>
              <p className="text-[11px] text-[#888888] font-serif italic">
                시연 과정에서 조정한 임의 입출고 데이터 및 불량 변경 이력을 공장 초기화 데이터셋으로 복원합니다.
              </p>
            </div>
            <button
              id="btn-reset-demo-data"
              onClick={onResetData}
              className="px-4 py-2 bg-white text-[#1A1A1A] hover:bg-[#E9E9E5] text-[10px] font-bold uppercase tracking-wider rounded-none shrink-0 flex items-center gap-1.5 transition-all cursor-pointer border border-transparent"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> 데이터 리셋
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
