/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent } from "react";
import { 
  User, 
  MapPin, 
  Camera, 
  ShieldAlert, 
  CornerDownLeft, 
  Search, 
  Plus, 
  Minus, 
  Check, 
  LogOut, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { Part, PartStatus, HistoryType, Employee } from "../types";

interface FieldKioskProps {
  parts: Part[];
  employees: Employee[];
  onUpdatePartStock: (
    partId: string, 
    type: HistoryType, 
    qtyChange: number, 
    operator: string, 
    location: string, 
    details: string,
    imageUrl?: string
  ) => void;
  onAddEmployee: (newEmployee: Employee) => void;
}

export default function FieldKiosk({
  parts,
  employees,
  onUpdatePartStock,
  onAddEmployee,
}: FieldKioskProps) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [qtyInput, setQtyInput] = useState<number>(1);
  const [selectedLocation, setSelectedLocation] = useState("A동 1층 대형고");
  const [transactionType, setTransactionType] = useState<HistoryType>(HistoryType.IN);
  const [defectDetails, setDefectDetails] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cameraSimulated, setCameraSimulated] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Operator Creation Form State
  const [showAddOperatorForm, setShowAddOperatorForm] = useState(false);
  const [opName, setOpName] = useState("");
  const [opDept, setOpDept] = useState("");
  const [operatorError, setOperatorError] = useState("");

  // Locations list
  const warehouseLocations = [
    "A동 1층 대형고",
    "A동 2층 일반고",
    "B동 1층 정밀고",
    "B동 2층 중량물고",
    "C동 1층 수입검사실",
    "C동 2층 온습도제어실",
    "불량품 격리소"
  ];

  // Filter parts
  const filteredParts = useMemo(() => {
    return parts.filter(p => 
      p.partName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [parts, searchTerm]);

  // Selected Part
  const selectedPart = useMemo(() => {
    return parts.find(p => p.id === selectedPartId);
  }, [parts, selectedPartId]);

  // Handle Login
  const handleLogin = (emp: Employee) => {
    setCurrentUser(emp);
    setSuccessMessage(null);
  };

  const handleRegisterOperator = (e: FormEvent) => {
    e.preventDefault();
    if (!opName.trim() || !opDept.trim()) {
      setOperatorError("성명과 소속 부서는 필수 입력 사항입니다.");
      return;
    }

    const newEmpId = `EMP-${Date.now().toString().slice(-4)}`;
    const newEmp: Employee = {
      id: newEmpId,
      name: opName.trim(),
      department: opDept.trim(),
    };

    onAddEmployee(newEmp);

    setOpName("");
    setOpDept("");
    setOperatorError("");
    setShowAddOperatorForm(false);
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedPartId("");
    setCapturedImage(null);
    setCameraSimulated(false);
  };

  // Simulated Camera Action
  const triggerCameraSimulation = () => {
    setCameraSimulated(true);
    // Mimics taking an image of a real industrial part
    setTimeout(() => {
      setCapturedImage("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=300");
      setCameraSimulated(false);
    }, 1200);
  };

  const clearCamera = () => {
    setCapturedImage(null);
  };

  // Submit Inventory Adjustment
  const handleSubmitAdjustment = () => {
    if (!currentUser || !selectedPart) return;

    let detailText = "";
    let quantityChange = 0;

    switch (transactionType) {
      case HistoryType.IN:
        quantityChange = qtyInput;
        detailText = `[현장 키오스크 입고 등록] ${selectedLocation}으로 ${qtyInput} EA 정격 입고 처리 완료.`;
        break;
      case HistoryType.OUT:
        quantityChange = -qtyInput;
        detailText = `[현장 키오스크 출고 등록] 생산 조립 라인 지원을 위한 ${qtyInput} EA 불출 처리.`;
        break;
      case HistoryType.DEFECT_REPORTED:
        quantityChange = -qtyInput;
        detailText = `[현장 불량 신고] 성능 테스트 불합격품 ${qtyInput} EA 검출. 이관 사유: ${defectDetails || "사유 미작성"}`;
        break;
      case HistoryType.LOCATION_CHANGED:
        quantityChange = 0;
        detailText = `[위치 조정] 보관 장소를 ${selectedPart.warehouseLocation}에서 ${selectedLocation}(으)로 재배치함.`;
        break;
      case HistoryType.INSPECT_START:
        quantityChange = 0;
        detailText = `[수입검사 시작] 품질 검수 의뢰 접수 및 초도 검사 착수.`;
        break;
      case HistoryType.INSPECT_COMPLETE:
        quantityChange = qtyInput;
        detailText = `[수입검사 완료] 최종 판정 합격. ${qtyInput} EA 정식 창고 입하 등록 처리.`;
        break;
      default:
        break;
    }

    onUpdatePartStock(
      selectedPart.id,
      transactionType,
      quantityChange,
      currentUser.name,
      transactionType === HistoryType.LOCATION_CHANGED ? selectedLocation : selectedPart.warehouseLocation,
      detailText,
      capturedImage || undefined
    );

    // Trigger local success animation
    setSuccessMessage(`성공: [${selectedPart.partName}] ${qtyInput} EA에 대한 기록이 통합 DB에 즉시 반영되었습니다.`);
    
    // Reset specific form states
    setQtyInput(1);
    setDefectDetails("");
    setCapturedImage(null);

    // Clear alert after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Kiosk Persona selection screen
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto bg-apple-canvas rounded-[18px] border border-apple-hairline/60 p-8 md:p-10 text-center space-y-8 shadow-sm" id="kiosk-auth-screen">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-apple-ink text-white flex items-center justify-center mx-auto rounded-full">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-apple-ink">현장 간편 키오스크 (On-site Kiosk)</h2>
          <p className="text-apple-muted text-xs max-w-md mx-auto leading-relaxed">
            한화에어로스페이스 창고 내 공용 PC 전용 터치 인터페이스입니다.<br />
            보안 장갑을 착용한 상태에서도 한 번의 터치로 데이터 정합성을 신속하게 갱신합니다.
          </p>
        </div>

        <div className="border-t border-apple-hairline/60 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted font-sans block">
              작업자 빠른 서명 인증
            </span>
            <button
              id="btn-toggle-add-operator"
              type="button"
              onClick={() => setShowAddOperatorForm(!showAddOperatorForm)}
              className="px-3.5 py-1.5 bg-apple-pearl hover:bg-apple-parchment text-apple-ink text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer border border-apple-hairline/80 transition-all active-scale"
            >
              <Plus className="w-3.5 h-3.5 text-apple-blue" />
              신규 작업자 등록
            </button>
          </div>

          {showAddOperatorForm && (
            <form onSubmit={handleRegisterOperator} className="bg-white p-5 border border-apple-hairline rounded-xl mb-6 space-y-4 text-left text-xs animate-fade-in">
              <h4 className="font-bold text-apple-ink uppercase tracking-wider flex items-center gap-1.5 font-sans">
                👤 신규 현장 작업자 보안 인가 등록
              </h4>
              {operatorError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 font-semibold rounded-lg" id="operator-form-error">
                  {operatorError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">작업자 성명 *</label>
                  <input
                    id="new-operator-name"
                    type="text"
                    required
                    placeholder="예: 홍길동"
                    className="w-full px-3.5 py-2.5 border border-apple-hairline rounded-lg bg-apple-pearl/50 focus:outline-none focus:ring-2 focus:ring-apple-blue/10 text-apple-ink"
                    value={opName}
                    onChange={(e) => setOpName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-apple-muted block">소속 부서/팀 *</label>
                  <input
                    id="new-operator-dept"
                    type="text"
                    required
                    placeholder="예: 제2생산라인 조립3조"
                    className="w-full px-3.5 py-2.5 border border-apple-hairline rounded-lg bg-apple-pearl/50 focus:outline-none focus:ring-2 focus:ring-apple-blue/10 text-apple-ink"
                    value={opDept}
                    onChange={(e) => setOpDept(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOperatorForm(false)}
                  className="px-4 py-2 border border-apple-hairline hover:bg-apple-parchment text-apple-ink rounded-lg font-semibold cursor-pointer active-scale"
                >
                  취소
                </button>
                <button
                  type="submit"
                  id="btn-submit-new-operator"
                  className="px-5 py-2 bg-apple-blue hover:bg-apple-focus text-white rounded-lg font-bold cursor-pointer active-scale shadow-sm transition-all"
                >
                  인가 작업자 추가
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="kiosk-users-list">
            {employees.map((emp) => (
              <button
                key={emp.id}
                id={`btn-login-as-${emp.id}`}
                onClick={() => handleLogin(emp)}
                className="flex flex-col items-center p-6 border border-apple-hairline/80 bg-apple-parchment/40 hover:bg-white hover:border-apple-blue transition-all text-center space-y-4 rounded-xl cursor-pointer active-scale hover:shadow-sm"
              >
                <div className="w-11 h-11 bg-apple-ink text-white flex items-center justify-center font-bold text-sm rounded-full">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-apple-ink text-sm">{emp.name}</h4>
                  <p className="text-[11px] text-apple-muted mt-0.5">{emp.department}</p>
                  <span className="inline-block mt-3 font-mono text-[9px] bg-white border border-apple-hairline/80 px-2.5 py-1 text-apple-muted rounded">
                    사번 {emp.id}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-apple-parchment/60 p-5 text-left border border-apple-hairline/60 space-y-2 text-xs text-apple-ink rounded-xl">
          <p className="font-semibold text-apple-ink flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-apple-blue" /> Kiosk 모드 이용 수칙
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-apple-muted leading-relaxed font-sans">
            <li>입/출고 실물이 발생한 경우 그 자리에서 즉시 등록해 주십시오 (데이터 지연 방지).</li>
            <li>실물 불량이 발견되면 즉시 불량신고 버튼을 클릭하고 카메라 증적 사진을 첨부하십시오.</li>
            <li>모든 조작은 사내 인트라넷을 통해 실시간 감사 추적(Audit Trail)에 정합 기록됩니다.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="kiosk-workspace">
      {/* Kiosk Left Column: Quick Search and Item selector */}
      <div className="lg:col-span-4 flex flex-col space-y-4" id="kiosk-part-selection">
        <div className="bg-apple-canvas rounded-[18px] border border-apple-hairline/60 p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-apple-hairline/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              <span className="text-xs font-semibold text-apple-ink">작업자: {currentUser.name}</span>
            </div>
            <button
              id="kiosk-logout-btn"
              onClick={handleLogout}
              className="text-xs text-apple-muted hover:text-apple-ink font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer active-scale"
            >
              <LogOut className="w-3.5 h-3.5" /> 작업 종료
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-apple-muted">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="kiosk-search-input"
              type="text"
              placeholder="품번/품명 빠른 터치 검색..."
              className="w-full pl-10 pr-4 py-2.5 border border-apple-hairline rounded-full text-xs bg-apple-parchment/50 focus:bg-apple-canvas focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition-all text-apple-ink"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List of parts to click */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-apple-hairline border border-apple-hairline/60 rounded-xl" id="kiosk-part-list">
            {filteredParts.map((part) => {
              const isSelected = part.id === selectedPartId;
              return (
                <button
                  key={part.id}
                  id={`kiosk-part-btn-${part.id}`}
                  onClick={() => {
                    setSelectedPartId(part.id);
                    setSelectedLocation(part.warehouseLocation);
                  }}
                  className={`w-full text-left p-4 flex justify-between items-center transition-all cursor-pointer ${
                    isSelected ? "bg-apple-ink text-white" : "bg-white hover:bg-apple-parchment/40 text-apple-ink"
                  }`}
                >
                  <div className="flex flex-col pr-2">
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${isSelected ? "text-slate-300" : "text-apple-muted"}`}>
                      {part.partNumber}
                    </span>
                    <span className="font-bold text-xs tracking-tight line-clamp-1 mt-0.5">{part.partName}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${
                      isSelected ? "bg-neutral-800 text-white border-neutral-700" : "bg-apple-pearl text-apple-ink border-apple-hairline"
                    }`}>
                      {part.physicalQty} EA
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kiosk Right Column: Big-touch panel action forms */}
      <div className="lg:col-span-8 flex flex-col space-y-4" id="kiosk-action-panel">
        
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 p-4.5 rounded-xl flex items-center gap-3 animate-fade-in" id="kiosk-success-banner">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-xs">{successMessage}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5 font-sans">설계팀 대시보드 및 생산종합모니터링단에 연동되어 실시간 업데이트되었습니다.</p>
            </div>
          </div>
        )}

        {/* Action Selection Box */}
        {selectedPart ? (
          <div className="bg-apple-canvas border border-apple-hairline/60 rounded-[18px] p-6 space-y-6 shadow-sm" id="kiosk-forms-container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-apple-hairline/60">
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest font-mono bg-[#1d1d1f] text-white px-2.5 py-1 rounded font-bold">
                  자재품번: {selectedPart.partNumber}
                </span>
                <h3 className="text-xl font-semibold text-apple-ink mt-2 tracking-tight">{selectedPart.partName}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-apple-muted mt-1 font-sans">
                  <span>보관 구역: <strong className="text-apple-ink font-medium">{selectedPart.warehouseLocation}</strong></span>
                  <span className="text-apple-hairline">•</span>
                  <span>ERP 장부 재고: <strong className="font-mono text-apple-ink font-medium">{selectedPart.erpQty} EA</strong></span>
                </div>
              </div>
              <div className="text-center bg-[#1d1d1f] text-white p-4 font-mono w-full md:w-32 rounded-xl">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-sans font-semibold">실물 수량</span>
                <span className="text-3xl font-bold tracking-tight">{selectedPart.physicalQty}</span>
                <span className="text-xs ml-1">EA</span>
              </div>
            </div>

            {/* Step 1: Tap transaction Type */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">
                1단계: 터치식 작업 동작 선택
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* IN BUTTON */}
                <button
                  id="kiosk-action-in"
                  onClick={() => setTransactionType(HistoryType.IN)}
                  className={`p-4.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer active-scale ${
                    transactionType === HistoryType.IN
                      ? "border-apple-blue bg-apple-blue text-white shadow-sm"
                      : "border-apple-hairline bg-apple-pearl text-apple-ink hover:bg-apple-parchment/60"
                  }`}
                >
                  <ArrowDownLeft className={`w-5 h-5 ${transactionType === HistoryType.IN ? "text-white" : "text-emerald-500"}`} />
                  <span className="text-xs font-semibold tracking-tight">실물 입고</span>
                </button>

                {/* OUT BUTTON */}
                <button
                  id="kiosk-action-out"
                  onClick={() => setTransactionType(HistoryType.OUT)}
                  className={`p-4.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer active-scale ${
                    transactionType === HistoryType.OUT
                      ? "border-apple-ink bg-apple-ink text-white shadow-sm"
                      : "border-apple-hairline bg-apple-pearl text-apple-ink hover:bg-apple-parchment/60"
                  }`}
                >
                  <ArrowUpRight className={`w-5 h-5 ${transactionType === HistoryType.OUT ? "text-white" : "text-amber-500"}`} />
                  <span className="text-xs font-semibold tracking-tight">현장 출고</span>
                </button>

                {/* DEFECT BUTTON */}
                <button
                  id="kiosk-action-defect"
                  onClick={() => setTransactionType(HistoryType.DEFECT_REPORTED)}
                  className={`p-4.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer active-scale ${
                    transactionType === HistoryType.DEFECT_REPORTED
                      ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                      : "border-apple-hairline bg-apple-pearl text-apple-ink hover:bg-apple-parchment/60"
                  }`}
                >
                  <ShieldAlert className={`w-5 h-5 ${transactionType === HistoryType.DEFECT_REPORTED ? "text-white" : "text-purple-500"}`} />
                  <span className="text-xs font-semibold tracking-tight">불량 신고</span>
                </button>

                {/* LOCATION BUTTON */}
                <button
                  id="kiosk-action-location"
                  onClick={() => setTransactionType(HistoryType.LOCATION_CHANGED)}
                  className={`p-4.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer active-scale ${
                    transactionType === HistoryType.LOCATION_CHANGED
                      ? "border-[#1d1d1f] bg-[#1d1d1f] text-white shadow-sm"
                      : "border-apple-hairline bg-apple-pearl text-apple-ink hover:bg-apple-parchment/60"
                  }`}
                >
                  <MapPin className={`w-5 h-5 ${transactionType === HistoryType.LOCATION_CHANGED ? "text-white" : "text-apple-blue"}`} />
                  <span className="text-xs font-semibold tracking-tight">창고 재배치</span>
                </button>
              </div>
            </div>

            {/* Step 2: Action Details & Quantities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-apple-hairline/60">
              {/* Left Form: Parameters */}
              <div className="space-y-5">
                {/* Quantity Numeric Selector */}
                {transactionType !== HistoryType.LOCATION_CHANGED && (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">
                      2단계: 수량 조정 (보안장갑 터치 지원)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        id="kiosk-qty-dec"
                        onClick={() => setQtyInput(prev => Math.max(1, prev - 1))}
                        className="w-12 h-12 bg-apple-pearl border border-apple-hairline flex items-center justify-center text-apple-ink hover:bg-white active:bg-slate-200 text-lg font-bold rounded-full cursor-pointer active-scale"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        id="kiosk-qty-input"
                        type="number"
                        min="1"
                        className="w-20 h-12 border border-apple-hairline text-center font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue rounded-full bg-apple-pearl text-apple-ink"
                        value={qtyInput}
                        onChange={(e) => setQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <button
                        id="kiosk-qty-inc"
                        onClick={() => setQtyInput(prev => prev + 1)}
                        className="w-12 h-12 bg-apple-pearl border border-apple-hairline flex items-center justify-center text-apple-ink hover:bg-white active:bg-slate-200 text-lg font-bold rounded-full cursor-pointer active-scale"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {/* Quick helpers */}
                      <button 
                        onClick={() => setQtyInput(10)} 
                        className="px-4 h-12 bg-apple-parchment/80 hover:bg-white border border-apple-hairline text-xs font-mono font-bold text-apple-ink rounded-full cursor-pointer active-scale"
                      >
                        +10
                      </button>
                      <button 
                        onClick={() => setQtyInput(100)} 
                        className="px-4 h-12 bg-apple-parchment/80 hover:bg-white border border-apple-hairline text-xs font-mono font-bold text-apple-ink rounded-full cursor-pointer active-scale"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                )}

                {/* Location Select */}
                {(transactionType === HistoryType.IN || transactionType === HistoryType.LOCATION_CHANGED) && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">
                      보관 입고 창고 구역 지정
                    </span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-apple-muted">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <select
                        id="kiosk-location-select"
                        className="w-full pl-10 pr-4 py-2.5 border border-apple-hairline text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue rounded-full bg-apple-pearl text-apple-ink cursor-pointer"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                        {warehouseLocations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Defect Input details */}
                {transactionType === HistoryType.DEFECT_REPORTED && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">
                      불량 세부 내용 상세 기술 (감사 대비)
                    </span>
                    <textarea
                      id="kiosk-defect-details"
                      rows={3}
                      placeholder="예: 조립 공차 초과, 가공 크랙 발견, 초도 수입검사 전선 단선 등 기술..."
                      className="w-full p-4.5 border border-apple-hairline text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue rounded-2xl bg-apple-pearl text-apple-ink font-sans"
                      value={defectDetails}
                      onChange={(e) => setDefectDetails(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Right Form: Simulated Camera / Photo attachment */}
              <div className="p-4 bg-apple-parchment/60 border border-apple-hairline/60 flex flex-col justify-between space-y-4 rounded-2xl">
                <span className="text-[10px] uppercase tracking-widest font-bold text-apple-ink flex items-center gap-1.5 font-sans">
                  <Camera className="w-3.5 h-3.5 text-apple-blue" /> 실사 증적 사진 기록 (CAMERA)
                </span>

                <div className="aspect-video bg-white border border-dashed border-apple-hairline rounded-xl overflow-hidden flex items-center justify-center relative">
                  {cameraSimulated ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 text-apple-ink animate-spin" />
                      <span className="text-[10px] text-apple-muted font-bold font-mono">AUTOFOCUSSING...</span>
                    </div>
                  ) : capturedImage ? (
                    <div className="w-full h-full relative group">
                      <img 
                        src={capturedImage} 
                        alt="Captured industrial part" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={clearCamera}
                          className="bg-apple-ink border border-white/20 text-white text-[10px] font-semibold uppercase tracking-wider px-4 py-2 hover:bg-neutral-800 rounded-full cursor-pointer active-scale"
                        >
                          지우기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <Camera className="w-8 h-8 text-apple-muted/60 mx-auto" />
                      <div>
                        <p className="text-xs font-semibold text-apple-ink">증적용 내장 웹캠 연동</p>
                        <p className="text-[10px] text-apple-muted leading-relaxed font-sans max-w-[200px] mx-auto">부품 식별 코드 또는 불량 부위 부착 라벨을 촬영하십시오.</p>
                      </div>
                    </div>
                  )}
                </div>

                {!capturedImage && (
                  <button
                    id="btn-kiosk-camera-shot"
                    onClick={triggerCameraSimulation}
                    disabled={cameraSimulated}
                    className="w-full py-2.5 bg-apple-ink hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all rounded-full cursor-pointer active-scale"
                  >
                    <Camera className="w-3.5 h-3.5" /> {cameraSimulated ? "LENS FOCUSING..." : "웹캠 이미지 캡처 및 OCR 스캔"}
                  </button>
                )}
              </div>
            </div>

            {/* Complete action block */}
            <div className="pt-5 border-t border-apple-hairline/60 flex justify-end">
              <button
                id="btn-kiosk-submit-transaction"
                onClick={handleSubmitAdjustment}
                className="px-6 py-3.5 bg-apple-blue hover:bg-apple-focus text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all rounded-full cursor-pointer active-scale shadow-sm"
              >
                <CornerDownLeft className="w-4 h-4" /> 현장 데이터 실시간 동기화 완료
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-apple-canvas border border-apple-hairline/60 rounded-[18px] p-12 text-center text-apple-muted space-y-3 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-apple-muted/60 mx-auto" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-apple-ink">수정 대상 자재 미선택</h4>
            <p className="text-xs max-w-sm mx-auto leading-relaxed text-apple-muted font-sans">
              왼쪽 터치 패널에서 실사를 입력하고 수량을 조정하고자 하는 한화에어로스페이스 부품 규격을 선택해 주십시오.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
