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
  Activity,
  Star,
  Plus
} from "lucide-react";
import { Part, PartStatus, HistoryType } from "../types";

interface DesignerDashboardProps {
  parts: Part[];
  selectedPartId: string;
  onSelectPart: (id: string) => void;
  onToggleAlert: (id: string) => void;
  onAddComment: (id: string, comment: string) => void;
  onAddPart: (newPart: Part) => void;
  onToggleLocalization: (id: string) => void;
}

export default function DesignerDashboard({
  parts,
  selectedPartId,
  onSelectPart,
  onToggleAlert,
  onAddComment,
  onAddPart,
  onToggleLocalization,
}: DesignerDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubsystem, setSelectedSubsystem] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [showDiscrepancyOnly, setShowDiscrepancyOnly] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Add Part Form State
  const [showAddPartForm, setShowAddPartForm] = useState(false);
  const [newPartNumber, setNewPartNumber] = useState("");
  const [newPartName, setNewPartName] = useState("");
  const [newSubsystem, setNewSubsystem] = useState("포탑 (Turret)");
  const [newCatiaQty, setNewCatiaQty] = useState(1);
  const [newErpQty, setNewErpQty] = useState(1);
  const [newPhysicalQty, setNewPhysicalQty] = useState(1);
  const [newWarehouseLocation, setNewWarehouseLocation] = useState("A동 1층 대형고");
  const [newLeadTimeDays, setNewLeadTimeDays] = useState(30);
  const [newIsCriticalLocal, setNewIsCriticalLocal] = useState(false);
  const [newScheduledDate, setNewScheduledDate] = useState("2026-08-15");
  const [formError, setFormError] = useState("");

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

  const handleRegisterPart = (e: FormEvent) => {
    e.preventDefault();
    if (!newPartNumber.trim() || !newPartName.trim()) {
      setFormError("품번과 품명은 필수 입력 사항입니다.");
      return;
    }

    if (parts.some(p => p.partNumber.toLowerCase() === newPartNumber.trim().toLowerCase())) {
      setFormError("이미 등록되어 있는 품번입니다.");
      return;
    }

    setFormError("");

    let initialStatus = PartStatus.AVAILABLE;
    if (newPhysicalQty < newCatiaQty) {
      initialStatus = PartStatus.SHORTAGE;
    }
    if (newCatiaQty !== newErpQty) {
      initialStatus = PartStatus.DISCREPANCY;
    }

    const newPartId = `p_new_${Date.now()}`;
    const newPartObj: Part = {
      id: newPartId,
      partNumber: newPartNumber.trim().toUpperCase(),
      partName: newPartName.trim(),
      subsystem: newSubsystem,
      catiaQty: newCatiaQty,
      erpQty: newErpQty,
      physicalQty: newPhysicalQty,
      status: initialStatus,
      warehouseLocation: newWarehouseLocation || "미정",
      leadTimeDays: newLeadTimeDays,
      isCriticalLocalPart: newIsCriticalLocal,
      alertOnStock: false,
      scheduledDate: newScheduledDate || "2026-08-15",
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: "김민재 선임 (설계)",
      comments: "설계 마스터에서 신규 부품 수동 등록 완료.",
      history: [
        {
          id: `hist_init_${Date.now()}`,
          partId: newPartId,
          type: HistoryType.IN,
          quantityChange: newPhysicalQty,
          timestamp: new Date().toISOString(),
          operator: "김민재 선임 (설계)",
          details: `설계 시스템 신규 부품 등록 완료 (CATIA: ${newCatiaQty} EA / ERP: ${newErpQty} EA / 실물: ${newPhysicalQty} EA)`
        }
      ]
    };

    onAddPart(newPartObj);

    setNewPartNumber("");
    setNewPartName("");
    setNewSubsystem("포탑 (Turret)");
    setNewCatiaQty(1);
    setNewErpQty(1);
    setNewPhysicalQty(1);
    setNewWarehouseLocation("A동 1층 대형고");
    setNewLeadTimeDays(30);
    setNewIsCriticalLocal(false);
    setNewScheduledDate("2026-08-15");
    setShowAddPartForm(false);
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
      case PartStatus.OUTBOUND:
        return {
          bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          dot: "bg-indigo-600"
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
      case PartStatus.OUTBOUND: return "출고중";
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="designer-dashboard-view">
      {/* Left Column: Filter and BOM Table */}
      <div className="lg:col-span-8 flex flex-col space-y-6" id="bom-inventory-panel">
        
        {/* Filter Section */}
        <div className="bg-apple-canvas p-6 rounded-[18px] border border-apple-hairline/60 space-y-5" id="bom-filters">
          <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
            {/* Search & Add Button Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
              <div className="relative w-full lg:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-apple-muted">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  id="part-search-input"
                  type="text"
                  placeholder="품번 또는 품명 검색..."
                  className="w-full pl-10 pr-4 py-2.5 border border-apple-hairline rounded-full text-xs bg-apple-parchment/50 focus:bg-apple-canvas focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition-all text-apple-ink"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                id="btn-show-add-part-form"
                onClick={() => setShowAddPartForm(!showAddPartForm)}
                className="px-4.5 py-2.5 bg-apple-blue hover:bg-apple-focus text-white text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 cursor-pointer active-scale shadow-sm shrink-0 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                신규 자재 추가
              </button>
            </div>

            {/* Subsystem Select (Pill Tags) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
              <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted flex items-center gap-1 shrink-0 font-sans">
                <Layers className="w-3.5 h-3.5" /> 하위체계:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {subsystems.map((sub) => (
                  <button
                    key={sub}
                    id={`filter-sub-${sub}`}
                    onClick={() => setSelectedSubsystem(sub)}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-tight border transition-all cursor-pointer active-scale ${
                      selectedSubsystem === sub
                        ? "bg-apple-blue border-apple-blue text-white font-semibold"
                        : "bg-apple-pearl border-apple-hairline/80 text-apple-ink hover:bg-apple-parchment"
                    }`}
                  >
                    {sub === "All" ? "전체" : sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-4 border-t border-apple-hairline/60 justify-between">
            {/* Status filters */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted flex items-center gap-1 shrink-0 font-sans">
                <Filter className="w-3.5 h-3.5" /> 상태 필터:
              </span>
              <select
                id="status-filter-select"
                className="text-xs border border-apple-hairline rounded-full px-4 py-1.5 bg-apple-pearl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue text-apple-ink cursor-pointer"
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
            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="toggle-critical-parts"
                  type="checkbox"
                  className="w-4 h-4 text-apple-blue focus:ring-apple-blue/20 border-apple-hairline rounded"
                  checked={showCriticalOnly}
                  onChange={(e) => setShowCriticalOnly(e.target.checked)}
                />
                <span className="text-xs font-medium text-apple-ink flex items-center gap-1">
                  ★ 국산화 핵심 부품
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="toggle-discrepancy-parts"
                  type="checkbox"
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500/20 border-apple-hairline rounded"
                  checked={showDiscrepancyOnly}
                  onChange={(e) => setShowDiscrepancyOnly(e.target.checked)}
                />
                <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  데이터 불일치 항목
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Register New Device Form Block */}
        {showAddPartForm && (
          <div className="bg-white p-6 rounded-[18px] border border-apple-hairline/80 space-y-5 animate-fade-in shadow-sm" id="register-new-device-form">
            <div className="flex justify-between items-center pb-3 border-b border-apple-hairline/60">
              <h3 className="text-xs font-bold uppercase tracking-widest text-apple-ink flex items-center gap-2 font-sans">
                <Plus className="w-4 h-4 text-apple-blue" />
                신규 자재 품목 등록 (Input New Device)
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddPartForm(false)}
                className="text-apple-muted hover:text-apple-ink text-xs font-semibold cursor-pointer"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleRegisterPart} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 font-semibold rounded-xl" id="register-form-error">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Part Number */}
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">품번 (Part Number) *</label>
                  <input
                    id="new-part-number-input"
                    type="text"
                    required
                    placeholder="예: HW-K9-TUR-120"
                    className="w-full px-4 py-2.5 border border-apple-hairline rounded-xl bg-apple-pearl/50 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-apple-ink"
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                  />
                </div>

                {/* Part Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">품명 (Part Name) *</label>
                  <input
                    id="new-part-name-input"
                    type="text"
                    required
                    placeholder="예: 제동기 가압 유압밸브"
                    className="w-full px-4 py-2.5 border border-apple-hairline rounded-xl bg-apple-pearl/50 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-apple-ink"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Subsystem */}
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">하위 체계 (Subsystem)</label>
                  <select
                    id="new-part-subsystem"
                    className="w-full px-4 py-2.5 border border-apple-hairline rounded-xl bg-apple-pearl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-apple-ink cursor-pointer"
                    value={newSubsystem}
                    onChange={(e) => setNewSubsystem(e.target.value)}
                  >
                    <option value="포탑 (Turret)">포탑 (Turret)</option>
                    <option value="차체 (Chassis)">차체 (Chassis)</option>
                    <option value="사격통제 (Fire Control)">사격통제 (Fire Control)</option>
                    <option value="엔진/변속기 (Engine)">엔진/변속기 (Engine)</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                {/* Warehouse Location */}
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">창고 위치 (Warehouse Location)</label>
                  <input
                    id="new-part-location"
                    type="text"
                    placeholder="예: B동 1층 부품함 B-5"
                    className="w-full px-4 py-2.5 border border-apple-hairline rounded-xl bg-apple-pearl/50 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-apple-ink"
                    value={newWarehouseLocation}
                    onChange={(e) => setNewWarehouseLocation(e.target.value)}
                  />
                </div>

                {/* Lead Time */}
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">발주 리드타임 (Days)</label>
                  <input
                    id="new-part-leadtime"
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 border border-apple-hairline rounded-xl bg-apple-pearl/50 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-apple-ink"
                    value={newLeadTimeDays}
                    onChange={(e) => setNewLeadTimeDays(parseInt(e.target.value) || 30)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CATIA Qty */}
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">3D CATIA 설계 수량 (EA)</label>
                  <input
                    id="new-part-catia-qty"
                    type="number"
                    min="0"
                    className="w-full px-4 py-2.5 border border-apple-hairline rounded-xl bg-apple-pearl/50 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-apple-ink"
                    value={newCatiaQty}
                    onChange={(e) => setNewCatiaQty(parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* ERP Qty */}
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">ERP 전산 재고 수량 (EA)</label>
                  <input
                    id="new-part-erp-qty"
                    type="number"
                    min="0"
                    className="w-full px-4 py-2.5 border border-apple-hairline rounded-xl bg-apple-pearl/50 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-apple-ink"
                    value={newErpQty}
                    onChange={(e) => setNewErpQty(parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Physical Qty */}
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">실제 창고 실물 수량 (EA)</label>
                  <input
                    id="new-part-physical-qty"
                    type="number"
                    min="0"
                    className="w-full px-4 py-2.5 border border-apple-hairline rounded-xl bg-apple-pearl/50 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-apple-ink"
                    value={newPhysicalQty}
                    onChange={(e) => setNewPhysicalQty(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Scheduled Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">생산 투입 예정일</label>
                  <input
                    id="new-part-scheduled-date"
                    type="date"
                    className="w-full px-4 py-2.5 border border-apple-hairline rounded-xl bg-apple-pearl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-apple-ink"
                    value={newScheduledDate}
                    onChange={(e) => setNewScheduledDate(e.target.value)}
                  />
                </div>

                {/* Localization checkbox toggle */}
                <div className="pt-4 flex items-center">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      id="new-part-critical-checkbox"
                      type="checkbox"
                      className="w-5 h-5 text-apple-blue focus:ring-apple-blue/20 border-apple-hairline rounded-lg"
                      checked={newIsCriticalLocal}
                      onChange={(e) => setNewIsCriticalLocal(e.target.checked)}
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-apple-ink block">국산화 핵심 부품 여부 (Critical Local Part)</span>
                      <span className="text-[10px] text-apple-muted block">국내 기술로 자체 설계/제안되는 국산화 연구 개발 자재</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-apple-hairline/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartForm(false)}
                  className="px-5 py-2.5 border border-apple-hairline hover:bg-apple-parchment text-apple-ink rounded-full font-semibold cursor-pointer active-scale transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  id="btn-submit-new-part"
                  className="px-6 py-2.5 bg-apple-blue hover:bg-apple-focus text-white rounded-full font-bold cursor-pointer active-scale shadow-sm transition-all"
                >
                  자재 등록 완료
                </button>
              </div>
            </form>
          </div>
        )}

        {/* BOM List Table */}
        <div className="bg-apple-canvas rounded-[18px] border border-apple-hairline/60 overflow-hidden" id="bom-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-apple-parchment border-b border-apple-hairline/80 text-apple-muted text-[10px] uppercase tracking-widest font-bold">
                  <th className="py-4 px-5">하위체계</th>
                  <th className="py-4 px-5">품번 / 품명</th>
                  <th className="py-4 px-5 text-center">3D CATIA</th>
                  <th className="py-4 px-5 text-center">ERP 전산</th>
                  <th className="py-4 px-5 text-center">현장 실물</th>
                  <th className="py-4 px-5">창고 위치</th>
                  <th className="py-4 px-5">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-hairline text-xs">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-apple-muted bg-apple-canvas">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Info className="w-8 h-8 text-apple-hairline" />
                        <span className="font-medium text-sm">조건에 부합하는 부품 데이터가 없습니다.</span>
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
                        className={`hover:bg-apple-parchment/40 cursor-pointer transition-colors ${
                          isSelected ? "bg-apple-parchment/80 font-medium border-l-4 border-l-apple-blue" : ""
                        }`}
                      >
                        <td className="py-4 px-5 font-mono text-[10px] uppercase tracking-wider text-apple-muted">
                          {part.subsystem}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-apple-muted flex items-center gap-1.5">
                              {/* Interactive Star icon to toggle device localization */}
                              <button
                                type="button"
                                title={part.isCriticalLocalPart ? "클릭하여 국산화 부품 지정 해제" : "클릭하여 국산화 핵심 부품 지정"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLocalization(part.id);
                                }}
                                className="focus:outline-none hover:bg-apple-pearl/80 p-0.5 rounded transition-all shrink-0 cursor-pointer"
                              >
                                <Star 
                                  className={`w-3.5 h-3.5 transition-all ${
                                    part.isCriticalLocalPart 
                                      ? "text-amber-500 fill-amber-500 hover:scale-115" 
                                      : "text-slate-300 hover:text-amber-500 hover:scale-115"
                                  }`} 
                                />
                              </button>
                              <span>{part.partNumber}</span>
                              {part.isCriticalLocalPart && (
                                <span className="bg-[#1d1d1f] text-white text-[8px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider scale-95 origin-left">
                                  국산화
                                </span>
                              )}
                            </span>
                            <span className="font-semibold text-apple-ink mt-0.5">{part.partName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center font-mono text-xs text-apple-ink">
                          {part.catiaQty} EA
                        </td>
                        <td className="py-4 px-5 text-center font-mono text-xs text-apple-ink">
                          {part.erpQty} EA
                        </td>
                        <td className={`py-4 px-5 text-center font-mono font-bold text-xs ${
                          hasDiscrepancy ? "text-rose-700 bg-rose-50/50" : "text-apple-ink"
                        }`}>
                          {part.physicalQty} EA
                        </td>
                        <td className="py-4 px-5 text-apple-ink">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-apple-muted" />
                            <span className="font-mono text-[11px] text-apple-ink">{part.warehouseLocation}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${statusStyles.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`} />
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
          <div className="bg-apple-parchment/60 px-5 py-3 border-t border-apple-hairline text-[10px] text-apple-muted flex flex-col sm:flex-row justify-between gap-2 font-mono uppercase tracking-wider">
            <span>FILTERED PARTS: <strong>{filteredParts.length}</strong> / TOTAL <strong>{parts.length}</strong> UNITS</span>
            <span className="text-rose-600 font-bold">* RED SHADED VALUES INDICATE CRITICAL SYSTEM-FIELD DISCREPANCIES</span>
          </div>
        </div>
      </div>

      {/* Right Column: Deep Analysis Detail Pane */}
      <div className="lg:col-span-4" id="designer-detail-panel">
        {!selectedPart ? (
          <div className="bg-apple-canvas border border-apple-hairline/60 rounded-[18px] p-8 text-center text-apple-muted space-y-3 sticky top-4">
            <AlertTriangle className="w-12 h-12 text-apple-muted/60 mx-auto animate-pulse" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-apple-ink">수정 대상 자재 미선택</h4>
            <p className="text-xs leading-relaxed font-sans text-apple-muted">
              상세 진단 정보 및 감사 추적(Audit Trail) 이력을 조회하거나 알림 상태를 관리하려면 왼쪽 목록에서 자재 품목을 선택해 주십시오.
            </p>
          </div>
        ) : (
          <div className="bg-apple-canvas border border-apple-hairline/60 rounded-[18px] p-6 space-y-6 sticky top-4 shadow-sm" style={{ backgroundColor: "#FFFFFF" }}>
            
            {/* Header Title */}
            <div className="border-b border-apple-hairline/60 pb-5 space-y-2">
              <span className="text-[10px] font-mono font-bold text-apple-muted block uppercase tracking-widest">
                {selectedPart.subsystem} · {selectedPart.partNumber}
              </span>
              <h3 className="text-xl font-semibold text-apple-ink leading-tight tracking-tight">
                {selectedPart.partName}
              </h3>
              <div className="pt-2.5 flex flex-wrap gap-2 items-center justify-between">
                {/* Critical/General tag */}
                {selectedPart.isCriticalLocalPart ? (
                  <button
                    type="button"
                    title="클릭하여 표준 수입자재로 변경"
                    onClick={() => onToggleLocalization(selectedPart.id)}
                    className="bg-apple-ink hover:bg-neutral-800 text-white text-[9px] font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded-[6px] flex items-center gap-1.5 transition-all cursor-pointer active-scale"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> 국산화 개발부품
                  </button>
                ) : (
                  <button
                    type="button"
                    title="클릭하여 국산화 개발부품으로 변경"
                    onClick={() => onToggleLocalization(selectedPart.id)}
                    className="bg-apple-pearl hover:bg-apple-parchment text-apple-ink text-[9px] font-medium uppercase tracking-wider px-2.5 py-1.5 border border-apple-hairline rounded-[6px] flex items-center gap-1.5 transition-all cursor-pointer active-scale"
                  >
                    <Star className="w-3.5 h-3.5 text-slate-300" /> 표준 수입자재
                  </button>
                )}

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(selectedPart.status).bg}`}>
                  {getStatusLabel(selectedPart.status)}
                </span>
              </div>
            </div>

            {/* Triple Check Comparison (Core Algorithm Demonstration) */}
            <div className="space-y-4 bg-apple-parchment/50 p-5 border border-apple-hairline/60 rounded-xl">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-apple-ink flex items-center gap-1.5 font-sans">
                <Cpu className="w-3.5 h-3.5 text-apple-blue" />
                정합성 정밀 진단 (TRIPLE-CHECK)
              </h4>
              
              <div className="space-y-3 pt-1 text-xs">
                {/* CATIA */}
                <div className="flex items-center justify-between">
                  <span className="text-apple-muted font-medium">3D CATIA 설계 수량</span>
                  <span className="font-mono font-bold text-apple-ink">{selectedPart.catiaQty} EA</span>
                </div>
                
                {/* ERP */}
                <div className="flex items-center justify-between">
                  <span className="text-apple-muted font-medium">ERP 전산 재고 수량</span>
                  <span className="font-mono font-bold text-apple-ink">{selectedPart.erpQty} EA</span>
                </div>

                {/* Physical */}
                <div className="flex items-center justify-between">
                  <span className="text-apple-muted font-medium">실물 현장 창고 수량</span>
                  <span className={`font-mono font-bold ${
                    selectedPart.physicalQty !== selectedPart.catiaQty ? "text-rose-600 font-black" : "text-apple-blue"
                  }`}>
                    {selectedPart.physicalQty} EA
                  </span>
                </div>

                {/* Visual Meter Bar (Apple rounded clean progress bar) */}
                <div className="pt-3 space-y-1.5">
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-apple-hairline/50 border border-apple-hairline/30">
                    <div 
                      title={`CATIA: ${selectedPart.catiaQty}`}
                      className="bg-apple-ink transition-all rounded-full" 
                      style={{ width: `${Math.min(100, (selectedPart.catiaQty / Math.max(selectedPart.catiaQty, selectedPart.erpQty, selectedPart.physicalQty, 1)) * 100)}%` }}
                    />
                    <div 
                      title={`ERP: ${selectedPart.erpQty}`}
                      className="bg-apple-muted transition-all rounded-full border-l border-white" 
                      style={{ width: `${Math.min(100, (selectedPart.erpQty / Math.max(selectedPart.catiaQty, selectedPart.erpQty, selectedPart.physicalQty, 1)) * 100)}%` }}
                    />
                    <div 
                      title={`Physical: ${selectedPart.physicalQty}`}
                      className="bg-apple-blue transition-all rounded-full border-l border-white" 
                      style={{ width: `${Math.min(100, (selectedPart.physicalQty / Math.max(selectedPart.catiaQty, selectedPart.erpQty, selectedPart.physicalQty, 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-apple-muted font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-apple-ink rounded-full"></span>CATIA</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-apple-muted rounded-full"></span>ERP</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-apple-blue rounded-full"></span>창고실물</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Alert box if discrepancy exists */}
              {(selectedPart.catiaQty !== selectedPart.erpQty || selectedPart.erpQty !== selectedPart.physicalQty) && (
                <div className="mt-3 p-3.5 bg-rose-50/50 border border-rose-100 text-xs text-rose-900 space-y-1.5 rounded-xl">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span>경고: 정합성 불일치 감지</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-rose-700">
                    {selectedPart.catiaQty !== selectedPart.erpQty && "• CATIA 3D 도면 수정사항이 ERP 전산 자재 원장에 반영되지 않았습니다.\n"}
                    {selectedPart.erpQty !== selectedPart.physicalQty && "• 전산 상 재고 수량과 조립 대기 중인 실제 창고 수량이 다릅니다 (오차 조정 필요).\n"}
                  </p>
                </div>
              )}
            </div>

            {/* Lead Time & Scheduling Predictor */}
            {selectedPart.scheduledDate && (
              <div className="p-5 border border-apple-hairline/60 bg-apple-canvas rounded-xl space-y-3">
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-apple-ink flex items-center gap-1.5 font-sans">
                  <Calendar className="w-3.5 h-3.5 text-apple-muted" />
                  조립 투입 스케줄 검토 (L/T)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-apple-hairline/40">
                  <div>
                    <span className="text-apple-muted text-[10px] uppercase block tracking-wider">발주 리드타임</span>
                    <span className="font-bold text-apple-ink font-mono text-sm">{selectedPart.leadTimeDays} 일 (DAYS)</span>
                  </div>
                  <div>
                    <span className="text-apple-muted text-[10px] uppercase block tracking-wider">조립 투입 예정일</span>
                    <span className="font-bold text-apple-ink font-mono text-sm">{selectedPart.scheduledDate}</span>
                  </div>
                </div>

                {leadTimeWarning && (
                  <div className={`mt-2 p-3 border rounded-xl text-xs ${
                    leadTimeWarning.isRisky 
                      ? "bg-rose-50 border-rose-100 text-rose-900" 
                      : "bg-emerald-50 border-emerald-100 text-emerald-900"
                  }`}>
                    <div className="flex items-start gap-2">
                      {leadTimeWarning.isRisky ? (
                        <>
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold uppercase text-[10px] tracking-wider text-rose-800">일정 지연 심각 위험!</p>
                            <p className="text-[11px] leading-relaxed text-rose-700 mt-1 font-normal">
                              생산 투입까지 남은 기간은 {leadTimeWarning.daysRemaining}일인데 비해, 발주 리드타임이 {selectedPart.leadTimeDays}일입니다. ({leadTimeWarning.gapDays}일 지연 발생) 즉시 공급망 추적이 요구됩니다.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold uppercase text-[10px] tracking-wider text-emerald-800">생산 일정 안정</p>
                            <p className="text-[11px] text-emerald-700 mt-1 font-normal">
                              자재 조립까지 {leadTimeWarning.daysRemaining}일 확보되었습니다. 안정적인 공정 상태입니다.
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
            <div className="border-t border-apple-hairline/60 pt-5 flex items-center justify-between gap-4">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-bold text-apple-ink flex items-center gap-1.5">
                  {selectedPart.alertOnStock ? <Bell className="w-4 h-4 text-apple-blue animate-pulse" /> : <BellOff className="w-4 h-4 text-apple-muted" />}
                  현장 입고 즉시 알림 구독
                </span>
                <p className="text-[11px] text-apple-muted leading-relaxed">
                  창고에서 부품 실물 입고 시 메신저 및 푸시 알림 전송
                </p>
              </div>
              <button
                id={`btn-subscribe-alert-${selectedPart.id}`}
                onClick={() => onToggleAlert(selectedPart.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer shrink-0 active-scale ${
                  selectedPart.alertOnStock
                    ? "bg-apple-blue border-apple-blue text-white hover:bg-apple-focus"
                    : "bg-apple-pearl border-apple-hairline text-apple-ink hover:bg-apple-parchment"
                }`}
              >
                {selectedPart.alertOnStock ? "구독 중" : "알림 설정"}
              </button>
            </div>

            {/* Comments & History Logs */}
            <div className="border-t border-apple-hairline/60 pt-5 space-y-4">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-apple-ink">
                이력 및 현장 코멘트
              </h4>

              {/* Existing comments */}
              {selectedPart.comments && (
                <div className="p-3.5 bg-apple-parchment/70 border border-apple-hairline/50 text-xs text-apple-ink rounded-xl font-normal leading-relaxed italic">
                  &ldquo;{selectedPart.comments}&rdquo;
                </div>
              )}

              {/* Add Comment Form (Apple pill-shaped input, blue submit) */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  id="comment-input-field"
                  type="text"
                  placeholder="코멘트나 이슈사항을 적어보세요..."
                  className="flex-1 px-4 py-2 border border-apple-hairline rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue bg-apple-pearl text-apple-ink"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  id="btn-comment-submit"
                  type="submit"
                  className="px-4 py-2 bg-apple-ink text-white text-xs font-semibold rounded-full hover:bg-neutral-800 cursor-pointer active-scale"
                >
                  등록
                </button>
              </form>

              {/* Audit Trail Timeline */}
              <div className="space-y-4 pt-3">
                <span className="text-[10px] text-apple-muted font-bold uppercase tracking-widest block font-sans">
                  전산 & 실사 감사 추적 (AUDIT TRAIL)
                </span>
                <div className="relative border-l border-apple-hairline pl-4 space-y-4">
                  {selectedPart.history.map((hist) => (
                    <div key={hist.id} className="relative text-xs">
                      <span className="absolute -left-[24.5px] top-0 bg-white p-0.5 rounded-full border border-apple-hairline flex items-center justify-center">
                        {getHistoryIcon(hist.type)}
                      </span>
                      <div className="flex justify-between text-[10px] text-apple-muted font-mono">
                        <span className="font-semibold text-apple-ink">{hist.operator}</span>
                        <span>{new Date(hist.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-apple-ink font-medium mt-1 leading-relaxed">{hist.details}</p>
                      {hist.quantityChange && (
                        <span className={`inline-block text-[10px] font-mono font-semibold mt-1 px-2 py-0.5 rounded-full border ${
                          hist.quantityChange > 0 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                            : "bg-rose-50 text-rose-800 border-rose-100"
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
