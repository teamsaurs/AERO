/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent } from "react";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Layers, 
  Bell, 
  BellOff, 
  MapPin, 
  Cpu, 
  ShieldAlert,
  Calendar,
  Info,
  Activity
} from "lucide-react";
import { Part, PartStatus, HistoryType } from "../types";

interface DesignerDashboardProps {
  parts: Part[];
  selectedPartId: string;
  onSelectPart: (id: string) => void;
  onToggleAlert: (id: string) => void;
  onAddComment: (id: string, comment: string) => void;
}

export default function DesignerDashboard({
  parts,
  selectedPartId,
  onSelectPart,
  onToggleAlert,
  onAddComment,
}: DesignerDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubsystem, setSelectedSubsystem] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [showDiscrepancyOnly, setShowDiscrepancyOnly] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Get unique subsystems for filter
  const subsystems = useMemo(() => {
    const list = new Set(parts.map((p) => p.subsystem));
    return ["All", ...Array.from(list)];
  }, [parts]);

  // Selected Part
  const selectedPart = useMemo(() => {
    return parts.find((p) => p.id === selectedPartId) || parts[0];
  }, [parts, selectedPartId]);

  // Lead time alert calculation
  const leadTimeWarning = useMemo(() => {
    if (!selectedPart || !selectedPart.scheduledDate) return null;
    const scheduled = new Date(selectedPart.scheduledDate);
    const today = new Date("2026-07-16"); // Current local time as per instructions
    const diffTime = scheduled.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isRisky = diffDays < selectedPart.leadTimeDays && selectedPart.physicalQty < selectedPart.catiaQty;
    return {
      daysRemaining: diffDays,
      isRisky,
      gapDays: selectedPart.leadTimeDays - diffDays
    };
  }, [selectedPart]);

  // Filtered Parts
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const matchesSearch = 
        part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubsystem = selectedSubsystem === "All" || part.subsystem === selectedSubsystem;
      const matchesStatus = selectedStatus === "All" || part.status === selectedStatus;
      const matchesCritical = !showCriticalOnly || part.isCriticalLocalPart;
      
      const hasDiscrepancy = 
        part.catiaQty !== part.erpQty || 
        part.erpQty !== part.physicalQty || 
        part.catiaQty !== part.physicalQty || 
        part.status === PartStatus.DISCREPANCY;
      const matchesDiscrepancy = !showDiscrepancyOnly || hasDiscrepancy;

      return matchesSearch && matchesSubsystem && matchesStatus && matchesCritical && matchesDiscrepancy;
    });
  }, [parts, searchTerm, selectedSubsystem, selectedStatus, showCriticalOnly, showDiscrepancyOnly]);

  const handleCommentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPart) return;
    onAddComment(selectedPart.id, commentText.trim());
    setCommentText("");
  };

  const getStatusColor = (status: PartStatus) => {
    switch (status) {
      case PartStatus.AVAILABLE:
        return {
          bg: "bg-green-50 text-green-800 border-green-200",
          dot: "bg-green-600"
        };
      case PartStatus.ORDERED:
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          dot: "bg-blue-600"
        };
      case PartStatus.SHORTAGE:
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          dot: "bg-rose-600"
        };
      case PartStatus.DISCREPANCY:
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          dot: "bg-amber-600"
        };
      case PartStatus.DEFECTIVE:
        return {
          bg: "bg-purple-50 text-purple-800 border-purple-200",
          dot: "bg-purple-600"
        };
      case PartStatus.INSPECTING:
        return {
          bg: "bg-cyan-50 text-cyan-800 border-cyan-200",
          dot: "bg-cyan-600"
        };
      default:
        return {
          bg: "bg-[#E9E9E5] text-[#1A1A1A] border-[#D1D1CD]",
          dot: "bg-[#1A1A1A]"
        };
    }
  };

  const getStatusLabel = (status: PartStatus) => {
    switch (status) {
      case PartStatus.AVAILABLE: return "즉시 사용 가능";
      case PartStatus.ORDERED: return "발주 공급 중";
      case PartStatus.SHORTAGE: return "현장 결품";
      case PartStatus.DISCREPANCY: return "데이터 불일치";
      case PartStatus.DEFECTIVE: return "불량 반납 처리";
      case PartStatus.INSPECTING: return "수입 검사 중";
      default: return status;
    }
  };

  const getHistoryIcon = (type: HistoryType) => {
    switch (type) {
      case HistoryType.IN:
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case HistoryType.DEFECT_REPORTED:
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      case HistoryType.DISCREPANCY_FOUND:
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case HistoryType.INSPECT_START:
        return <Activity className="w-4 h-4 text-cyan-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="designer-dashboard-view">
      {/* Left Column: Filter and BOM Table */}
      <div className="lg:col-span-8 flex flex-col space-y-4" id="bom-inventory-panel">
        
        {/* Filter Section */}
        <div className="bg-white p-5 rounded-none border border-[#D1D1CD] space-y-4" id="bom-filters">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#888888]">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="part-search-input"
                type="text"
                placeholder="품번 또는 품명 검색..."
                className="w-full pl-9 pr-4 py-2 border border-[#D1D1CD] rounded-none text-xs bg-[#F4F4F2]/30 focus:bg-white focus:outline-none focus:border-[#1A1A1A] transition-all text-[#1A1A1A]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Subsystem Select */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#666666] flex items-center gap-1 shrink-0">
                <Layers className="w-3.5 h-3.5 text-[#888888]" /> 하위체계:
              </span>
              <div className="flex flex-wrap gap-1">
                {subsystems.map((sub) => (
                  <button
                    key={sub}
                    id={`filter-sub-${sub}`}
                    onClick={() => setSelectedSubsystem(sub)}
                    className={`px-3 py-1 text-[11px] font-mono uppercase border transition-all cursor-pointer ${
                      selectedSubsystem === sub
                        ? "bg-[#1A1A1A] border-[#1A1A1A] text-white font-bold"
                        : "bg-white/50 border-[#D1D1CD] text-[#1A1A1A] hover:bg-white"
                    }`}
                  >
                    {sub === "All" ? "ALL" : sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-3 border-t border-[#D1D1CD] justify-between">
            {/* Status filters */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#666666] flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#888888]" /> 상태 필터:
              </span>
              <select
                id="status-filter-select"
                className="text-xs border border-[#D1D1CD] rounded-none px-3 py-1.5 bg-white focus:outline-none focus:border-[#1A1A1A] text-[#1A1A1A]"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">전체 상태 (ALL)</option>
                {Object.values(PartStatus).map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="toggle-critical-parts"
                  type="checkbox"
                  className="w-4 h-4 accent-[#1A1A1A] rounded-none border-[#D1D1CD]"
                  checked={showCriticalOnly}
                  onChange={(e) => setShowCriticalOnly(e.target.checked)}
                />
                <span className="text-xs font-medium text-[#1A1A1A] flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-none bg-[#1A1A1A]"></span>
                  국산화 핵심 부품만
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="toggle-discrepancy-parts"
                  type="checkbox"
                  className="w-4 h-4 accent-red-600 rounded-none border-[#D1D1CD]"
                  checked={showDiscrepancyOnly}
                  onChange={(e) => setShowDiscrepancyOnly(e.target.checked)}
                />
                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  데이터 불일치 항목만
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* BOM List Table */}
        <div className="bg-white rounded-none border border-[#D1D1CD] overflow-hidden" id="bom-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E9E9E5] border-b border-[#D1D1CD] text-[#444444] text-[10px] uppercase tracking-widest font-bold">
                  <th className="py-3 px-4">구분</th>
                  <th className="py-3 px-4">품번 / 품명</th>
                  <th className="py-3 px-4 text-center">3D CATIA</th>
                  <th className="py-3 px-4 text-center">ERP 전산</th>
                  <th className="py-3 px-4 text-center">현장 실물</th>
                  <th className="py-3 px-4">창고 위치</th>
                  <th className="py-3 px-4">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1D1CD] text-xs">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#666666] bg-white">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Info className="w-8 h-8 text-[#cbd5e1]" />
                        <span className="font-serif italic text-sm">조건에 부합하는 부품 데이터가 없습니다.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((part) => {
                    const hasDiscrepancy = 
                      part.catiaQty !== part.erpQty || 
                      part.erpQty !== part.physicalQty || 
                      part.catiaQty !== part.physicalQty;
                    const isSelected = part.id === selectedPartId;
                    const statusStyles = getStatusColor(part.status);

                    return (
                      <tr
                        key={part.id}
                        id={`part-row-${part.id}`}
                        onClick={() => onSelectPart(part.id)}
                        className={`hover:bg-[#F4F4F2]/50 cursor-pointer transition-colors ${
                          isSelected ? "bg-[#E9E9E5] font-semibold border-l-2 border-l-[#1A1A1A]" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                          {part.subsystem}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-[#666666] flex items-center gap-1.5">
                              {part.partNumber}
                              {part.isCriticalLocalPart && (
                                <span className="bg-[#1A1A1A] text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                                  국산화
                                </span>
                              )}
                            </span>
                            <span className="font-bold text-[#1A1A1A] mt-0.5">{part.partName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-[#1A1A1A]">
                          {part.catiaQty} EA
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-[#1A1A1A]">
                          {part.erpQty} EA
                        </td>
                        <td className={`py-3.5 px-4 text-center font-mono font-bold text-xs ${
                          hasDiscrepancy ? "text-red-700 bg-red-50/60" : "text-[#1A1A1A]"
                        }`}>
                          {part.physicalQty} EA
                        </td>
                        <td className="py-3.5 px-4 text-[#555555]">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#888888]" />
                            <span className="font-mono text-[11px]">{part.warehouseLocation}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase border ${statusStyles.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-none ${statusStyles.dot}`} />
                            {getStatusLabel(part.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-[#E9E9E5] px-4 py-2.5 border-t border-[#D1D1CD] text-[10px] text-[#666666] flex flex-col sm:flex-row justify-between gap-1 font-mono uppercase tracking-wider">
            <span>FILTERED PARTS: <strong>{filteredParts.length}</strong> / TOTAL <strong>{parts.length}</strong> UNITS</span>
            <span className="text-red-700 font-bold">* RED SHADED VALUES INDICATE CRITICAL SYSTEM-FIELD DISCREPANCIES</span>
          </div>
        </div>
      </div>

      {/* Right Column: Deep Analysis Detail Pane */}
      <div className="lg:col-span-4" id="designer-detail-panel">
        {!selectedPart ? (
          <div className="bg-white border border-[#D1D1CD] rounded-none p-8 text-center text-[#666666] space-y-3 sticky top-4">
            <AlertTriangle className="w-12 h-12 text-[#888888] mx-auto animate-pulse" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">수정 대상 자재 미선택</h4>
            <p className="text-xs leading-relaxed font-serif italic">
              상세 진단 정보 및 감사 추적(Audit Trail) 이력을 조회하거나 알림 상태를 관리하려면 왼쪽 목록에서 자재 품목을 선택해 주십시오.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#D1D1CD] rounded-none p-5 space-y-6 sticky top-4" style={{ backgroundColor: "#FFFFFF" }}>
            
            {/* Header Title */}
            <div className="border-b border-[#D1D1CD] pb-4 space-y-1.5">
              <span className="text-[9px] font-mono font-bold text-[#666666] block uppercase tracking-widest">
                {selectedPart.subsystem} · {selectedPart.partNumber}
              </span>
              <h3 className="text-xl font-bold font-serif italic text-[#1A1A1A] leading-tight">
                {selectedPart.partName}
              </h3>
              <div className="pt-2 flex flex-wrap gap-2 items-center justify-between">
                {/* Critical/General tag */}
                {selectedPart.isCriticalLocalPart ? (
                  <span className="bg-[#1A1A1A] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                    ★ 국산화 개발부품
                  </span>
                ) : (
                  <span className="bg-[#E9E9E5] text-[#1A1A1A] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border border-[#D1D1CD]">
                    표준 수입자재
                  </span>
                )}

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase border ${getStatusColor(selectedPart.status).bg}`}>
                  {getStatusLabel(selectedPart.status)}
                </span>
              </div>
            </div>

            {/* Triple Check Comparison (Core Algorithm Demonstration) */}
            <div className="space-y-3 bg-[#F4F4F2]/50 p-4 border border-[#D1D1CD]">
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#1A1A1A]" />
                정합성 정밀 진단 (TRIPLE-CHECK)
              </h4>
              
              <div className="space-y-2.5 pt-1 text-xs">
                {/* CATIA */}
                <div className="flex items-center justify-between">
                  <span className="text-[#555555]">3D CATIA 설계 수량</span>
                  <span className="font-mono font-bold text-[#1A1A1A]">{selectedPart.catiaQty} EA</span>
                </div>
                
                {/* ERP */}
                <div className="flex items-center justify-between">
                  <span className="text-[#555555]">ERP 전산 재고 수량</span>
                  <span className="font-mono font-bold text-[#1A1A1A]">{selectedPart.erpQty} EA</span>
                </div>

                {/* Physical */}
                <div className="flex items-center justify-between">
                  <span className="text-[#555555] font-medium">실물 현장 창고 수량</span>
                  <span className={`font-mono font-black ${
                    selectedPart.physicalQty !== selectedPart.catiaQty ? "text-red-700 font-black" : "text-[#1A1A1A]"
                  }`}>
                    {selectedPart.physicalQty} EA
                  </span>
                </div>

                {/* Visual Meter Bar */}
                <div className="pt-2.5 space-y-1">
                  <div className="flex h-3 rounded-none overflow-hidden bg-[#E9E9E5] border border-[#D1D1CD]">
                    <div 
                      title={`CATIA: ${selectedPart.catiaQty}`}
                      className="bg-[#1A1A1A] transition-all" 
                      style={{ width: `${Math.min(100, (selectedPart.catiaQty / Math.max(selectedPart.catiaQty, selectedPart.erpQty, selectedPart.physicalQty, 1)) * 100)}%` }}
                    />
                    <div 
                      title={`ERP: ${selectedPart.erpQty}`}
                      className="bg-[#888888] transition-all border-l border-white" 
                      style={{ width: `${Math.min(100, (selectedPart.erpQty / Math.max(selectedPart.catiaQty, selectedPart.erpQty, selectedPart.physicalQty, 1)) * 100)}%` }}
                    />
                    <div 
                      title={`Physical: ${selectedPart.physicalQty}`}
                      className="bg-[#D1D1CD] transition-all border-l border-white" 
                      style={{ width: `${Math.min(100, (selectedPart.physicalQty / Math.max(selectedPart.catiaQty, selectedPart.erpQty, selectedPart.physicalQty, 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#666666] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#1A1A1A] inline-block"></span>CATIA</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#888888] inline-block"></span>ERP</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#D1D1CD] inline-block"></span>창고실물</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Alert box if discrepancy exists */}
              {(selectedPart.catiaQty !== selectedPart.erpQty || selectedPart.erpQty !== selectedPart.physicalQty) && (
                <div className="mt-3 p-3 bg-red-50/50 border border-red-200 text-xs text-red-900 space-y-1 rounded-none">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                    <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                    <span>경고: 정합성 불일치 감지</span>
                  </div>
                  <p className="leading-relaxed text-[11px] font-serif italic text-red-800">
                    {selectedPart.catiaQty !== selectedPart.erpQty && "• CATIA 설계 변경분이 ERP 전산에 승인/반영되지 않았습니다.\n"}
                    {selectedPart.erpQty !== selectedPart.physicalQty && "• ERP 전산 수량과 실제 창고 보유 수량이 다릅니다 (현장 소실 혹은 품질 격리 가능성).\n"}
                  </p>
                </div>
              )}
            </div>

            {/* Lead Time & Scheduling Predictor */}
            {selectedPart.scheduledDate && (
              <div className="p-4 border border-[#D1D1CD] bg-white space-y-2">
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                  조립 투입 스케줄 검토 (L/T)
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[#666666] text-[10px] uppercase block tracking-wider">발주 리드타임</span>
                    <span className="font-bold text-[#1A1A1A] font-mono text-xs">{selectedPart.leadTimeDays} 일 (DAYS)</span>
                  </div>
                  <div>
                    <span className="text-[#666666] text-[10px] uppercase block tracking-wider">조립 예정일</span>
                    <span className="font-bold text-[#1A1A1A] font-mono text-xs">{selectedPart.scheduledDate}</span>
                  </div>
                </div>

                {leadTimeWarning && (
                  <div className={`mt-2 p-2.5 border rounded-none text-xs ${
                    leadTimeWarning.isRisky 
                      ? "bg-rose-50 border-rose-200 text-rose-900" 
                      : "bg-green-50 border-green-200 text-green-900"
                  }`}>
                    <div className="flex items-start gap-1.5">
                      {leadTimeWarning.isRisky ? (
                        <>
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold uppercase text-[10px] tracking-wider text-rose-900">일정 지연 심각 위험!</p>
                            <p className="text-[11px] leading-relaxed text-rose-800 mt-0.5 font-serif italic">
                              투입까지 남은 기간은 {leadTimeWarning.daysRemaining}일인데 비해, 리드타임이 {selectedPart.leadTimeDays}일입니다. ({leadTimeWarning.gapDays}일 부족) 즉시 발주 추적이 요구됩니다.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold uppercase text-[10px] tracking-wider text-green-900">일정 여유 확보</p>
                            <p className="text-[11px] text-green-800 mt-0.5 font-serif italic">
                              부품 투입까지 {leadTimeWarning.daysRemaining}일 남았습니다. 안정적인 생산 일정입니다.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Real-time Push Alert Subscription */}
            <div className="border-t border-[#D1D1CD] pt-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1">
                  {selectedPart.alertOnStock ? <Bell className="w-3.5 h-3.5 text-orange-600 animate-pulse" /> : <BellOff className="w-3.5 h-3.5 text-[#888888]" />}
                  현장 입고 즉시 알림 구독
                </span>
                <p className="text-[11px] text-[#555555]">
                  창고에서 부품 실물 입고 시 설계팀 메신저로 푸시 전송
                </p>
              </div>
              <button
                id={`btn-subscribe-alert-${selectedPart.id}`}
                onClick={() => onToggleAlert(selectedPart.id)}
                className={`px-4 py-2 text-xs font-bold border uppercase tracking-wider cursor-pointer shrink-0 ${
                  selectedPart.alertOnStock
                    ? "bg-[#1A1A1A] border-[#1A1A1A] text-white hover:bg-neutral-800"
                    : "bg-white border-[#D1D1CD] text-[#1A1A1A] hover:bg-slate-50"
                }`}
              >
                {selectedPart.alertOnStock ? "구독 중" : "알림 설정"}
              </button>
            </div>

            {/* Comments & History Logs */}
            <div className="border-t border-[#D1D1CD] pt-4 space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">
                이력 및 현장 코멘트
              </h4>

              {/* Existing comments */}
              {selectedPart.comments && (
                <div className="p-3 bg-[#F4F4F2]/50 border border-[#D1D1CD] text-xs text-[#1A1A1A] font-serif italic leading-relaxed">
                  &ldquo;{selectedPart.comments}&rdquo;
                </div>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="flex gap-1.5">
                <input
                  id="comment-input-field"
                  type="text"
                  placeholder="코멘트나 이슈사항을 적어보세요..."
                  className="flex-1 px-3 py-2 border border-[#D1D1CD] rounded-none text-xs focus:outline-none focus:border-[#1A1A1A] bg-white text-[#1A1A1A]"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  id="btn-comment-submit"
                  type="submit"
                  className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
                >
                  등록
                </button>
              </form>

              {/* Audit Trail Timeline */}
              <div className="space-y-3 pt-2">
                <span className="text-[9px] text-[#666666] font-bold uppercase tracking-widest block">
                  전산 & 실사 감사 추적 (AUDIT TRAIL)
                </span>
                <div className="relative border-l border-[#D1D1CD] pl-4 space-y-4">
                  {selectedPart.history.map((hist) => (
                    <div key={hist.id} className="relative text-xs">
                      <span className="absolute -left-[24.5px] top-0 bg-white p-0.5 rounded-none border border-[#D1D1CD] flex items-center justify-center">
                        {getHistoryIcon(hist.type)}
                      </span>
                      <div className="flex justify-between text-[10px] text-[#666666] font-mono">
                        <span className="font-bold">{hist.operator}</span>
                        <span>{new Date(hist.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[#1A1A1A] font-medium mt-0.5">{hist.details}</p>
                      {hist.quantityChange && (
                        <span className={`inline-block text-[10px] font-mono font-bold mt-1 px-1.5 border ${
                          hist.quantityChange > 0 
                            ? "bg-green-50 text-green-800 border-green-200" 
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          수량 변동: {hist.quantityChange > 0 ? `+${hist.quantityChange}` : hist.quantityChange} EA
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
