/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
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
}

export default function FieldKiosk({
  parts,
  employees,
  onUpdatePartStock,
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
      <div className="max-w-2xl mx-auto bg-white rounded-none border border-[#D1D1CD] p-8 text-center space-y-6" id="kiosk-auth-screen">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-[#1A1A1A] text-[#F4F4F2] flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif italic font-bold text-[#1A1A1A]">현장 간편 키오스크 (On-site Kiosk)</h2>
          <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
            한화에어로스페이스 창고 내 공용 PC 전용 모드입니다. <br />
            보안 장갑을 착용한 상태에서도 원터치로 데이터 정합성을 간편히 갱신합니다.
          </p>
        </div>

        <div className="border-t border-[#D1D1CD] pt-6">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-4">
            작업자 빠른 서명 인증
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="kiosk-users-list">
            {employees.map((emp) => (
              <button
                key={emp.id}
                id={`btn-login-as-${emp.id}`}
                onClick={() => handleLogin(emp)}
                className="flex flex-col items-center p-5 border border-[#D1D1CD] bg-[#F4F4F2]/30 hover:bg-white hover:border-[#1A1A1A] transition-all text-center space-y-3 rounded-none cursor-pointer"
              >
                <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-[#1A1A1A] text-sm">{emp.name}</h4>
                  <p className="text-[11px] text-slate-500">{emp.department}</p>
                  <span className="inline-block mt-2 font-mono text-[9px] bg-white border border-[#D1D1CD] px-2 py-0.5 text-slate-600">
                    사번 {emp.id}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#F4F4F2]/50 p-4 rounded-none text-left border border-[#D1D1CD] space-y-1.5 text-xs text-slate-600">
          <p className="font-bold text-[#1A1A1A] flex items-center gap-1">
            <HelpCircle className="w-4 h-4 text-[#1a1a1a]" /> Kiosk 모드 이용 수칙
          </p>
          <ul className="list-disc pl-4 space-y-1 font-serif italic">
            <li>입/출고 실물이 발생한 경우 그 자리에서 즉시 등록해 주십시오 (지연 방지).</li>
            <li>실물 불량이 발견되면 즉시 불량신고 버튼을 클릭하고 우측 카메라로 사진을 첨부하십시오.</li>
            <li>모든 조작은 사내 인트라넷을 통해 즉시 감사 추적(Audit Trail)에 기록됩니다.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="kiosk-workspace">
      {/* Kiosk Left Column: Quick Search and Item selector */}
      <div className="lg:col-span-4 flex flex-col space-y-4" id="kiosk-part-selection">
        <div className="bg-white rounded-none border border-[#D1D1CD] p-5 space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#D1D1CD]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-600"></span>
              <span className="text-xs font-bold text-[#1A1A1A]">작업자: {currentUser.name}</span>
            </div>
            <button
              id="kiosk-logout-btn"
              onClick={handleLogout}
              className="text-xs text-[#666666] hover:text-[#1A1A1A] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> 작업 종료
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="kiosk-search-input"
              type="text"
              placeholder="품번/품명 빠른 터치 검색..."
              className="w-full pl-9 pr-4 py-2.5 border border-[#D1D1CD] rounded-none text-xs bg-[#F4F4F2]/30 focus:bg-white focus:outline-none focus:border-[#1A1A1A] transition-all text-[#1A1A1A]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List of parts to click */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-[#D1D1CD] border border-[#D1D1CD]" id="kiosk-part-list">
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
                  className={`w-full text-left p-3.5 flex justify-between items-center transition-all cursor-pointer ${
                    isSelected ? "bg-[#1A1A1A] text-white" : "bg-white hover:bg-[#F4F4F2]/50 text-[#1A1A1A]"
                  }`}
                >
                  <div className="flex flex-col pr-2">
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {part.partNumber}
                    </span>
                    <span className="font-bold text-xs tracking-tight line-clamp-1 mt-0.5">{part.partName}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-mono text-xs font-bold px-2 py-1 border ${
                      isSelected ? "bg-neutral-800 text-white border-neutral-700" : "bg-[#F4F4F2]/80 text-[#1A1A1A] border-[#D1D1CD]"
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
          <div className="bg-green-50 border border-green-300 text-green-900 p-4 rounded-none flex items-center gap-3 animate-fade-in" id="kiosk-success-banner">
            <Check className="w-5 h-5 text-green-700 shrink-0" />
            <div>
              <p className="font-bold text-xs">{successMessage}</p>
              <p className="text-[10px] text-green-700 mt-0.5">설계팀 대시보드 및 생산종합모니터링단에 연동되어 실시간 업데이트되었습니다.</p>
            </div>
          </div>
        )}

        {/* Action Selection Box */}
        {selectedPart ? (
          <div className="bg-white border border-[#D1D1CD] rounded-none p-6 space-y-6" id="kiosk-forms-container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#D1D1CD]">
              <div>
                <span className="text-[9px] uppercase tracking-widest font-mono bg-[#E9E9E5] text-[#1A1A1A] px-2 py-0.5 border border-[#D1D1CD] font-bold">
                  자재품번: {selectedPart.partNumber}
                </span>
                <h3 className="text-lg font-bold text-[#1A1A1A] mt-2 font-serif italic">{selectedPart.partName}</h3>
                <div className="flex items-center gap-2 text-[11px] text-[#555555] mt-1">
                  <span>보관 구역: <strong className="text-[#1A1A1A]">{selectedPart.warehouseLocation}</strong></span>
                  <span>|</span>
                  <span>ERP 장부 재고: <strong className="font-mono text-[#1A1A1A]">{selectedPart.erpQty} EA</strong></span>
                </div>
              </div>
              <div className="text-right bg-[#1A1A1A] text-white p-4 font-mono w-full md:w-32">
                <span className="text-[9px] uppercase tracking-widest text-slate-300 block font-sans">실물 수량</span>
                <span className="text-3xl font-bold">{selectedPart.physicalQty}</span>
                <span className="text-xs ml-1">EA</span>
              </div>
            </div>

            {/* Step 1: Tap transaction Type */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">
                1단계: 터치식 작업 동작 선택
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* IN BUTTON */}
                <button
                  id="kiosk-action-in"
                  onClick={() => setTransactionType(HistoryType.IN)}
                  className={`p-4 rounded-none border-2 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer ${
                    transactionType === HistoryType.IN
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                      : "border-[#D1D1CD] bg-white text-[#1A1A1A] hover:bg-[#F4F4F2]"
                  }`}
                >
                  <ArrowDownLeft className={`w-5 h-5 ${transactionType === HistoryType.IN ? "text-white" : "text-green-600"}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">실물 입고</span>
                </button>

                {/* OUT BUTTON */}
                <button
                  id="kiosk-action-out"
                  onClick={() => setTransactionType(HistoryType.OUT)}
                  className={`p-4 rounded-none border-2 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer ${
                    transactionType === HistoryType.OUT
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                      : "border-[#D1D1CD] bg-white text-[#1A1A1A] hover:bg-[#F4F4F2]"
                  }`}
                >
                  <ArrowUpRight className={`w-5 h-5 ${transactionType === HistoryType.OUT ? "text-white" : "text-amber-600"}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">현장 출고</span>
                </button>

                {/* DEFECT BUTTON */}
                <button
                  id="kiosk-action-defect"
                  onClick={() => setTransactionType(HistoryType.DEFECT_REPORTED)}
                  className={`p-4 rounded-none border-2 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer ${
                    transactionType === HistoryType.DEFECT_REPORTED
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                      : "border-[#D1D1CD] bg-white text-[#1A1A1A] hover:bg-[#F4F4F2]"
                  }`}
                >
                  <ShieldAlert className={`w-5 h-5 ${transactionType === HistoryType.DEFECT_REPORTED ? "text-white" : "text-purple-600"}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">불량 신고</span>
                </button>

                {/* LOCATION BUTTON */}
                <button
                  id="kiosk-action-location"
                  onClick={() => setTransactionType(HistoryType.LOCATION_CHANGED)}
                  className={`p-4 rounded-none border-2 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer ${
                    transactionType === HistoryType.LOCATION_CHANGED
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                      : "border-[#D1D1CD] bg-white text-[#1A1A1A] hover:bg-[#F4F4F2]"
                  }`}
                >
                  <MapPin className={`w-5 h-5 ${transactionType === HistoryType.LOCATION_CHANGED ? "text-white" : "text-blue-600"}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">창고 재배치</span>
                </button>
              </div>
            </div>

            {/* Step 2: Action Details & Quantities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#D1D1CD]">
              {/* Left Form: Parameters */}
              <div className="space-y-4">
                {/* Quantity Numeric Selector */}
                {transactionType !== HistoryType.LOCATION_CHANGED && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">
                      2단계: 수량 조정 (보안장갑 터치 지원)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        id="kiosk-qty-dec"
                        onClick={() => setQtyInput(prev => Math.max(1, prev - 1))}
                        className="w-12 h-12 bg-[#F4F4F2] border border-[#D1D1CD] flex items-center justify-center text-[#1A1A1A] hover:bg-white active:bg-slate-200 text-lg font-bold rounded-none cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        id="kiosk-qty-input"
                        type="number"
                        min="1"
                        className="w-20 h-12 border border-[#D1D1CD] text-center font-mono font-bold text-lg focus:outline-none focus:border-[#1A1A1A] rounded-none bg-white text-[#1A1A1A]"
                        value={qtyInput}
                        onChange={(e) => setQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <button
                        id="kiosk-qty-inc"
                        onClick={() => setQtyInput(prev => prev + 1)}
                        className="w-12 h-12 bg-[#F4F4F2] border border-[#D1D1CD] flex items-center justify-center text-[#1A1A1A] hover:bg-white active:bg-slate-200 text-lg font-bold rounded-none cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {/* Quick helpers */}
                      <button 
                        onClick={() => setQtyInput(10)} 
                        className="px-3 h-12 bg-[#E9E9E5] hover:bg-white border border-[#D1D1CD] text-xs font-mono font-bold text-[#1A1A1A] rounded-none cursor-pointer"
                      >
                        +10
                      </button>
                      <button 
                        onClick={() => setQtyInput(100)} 
                        className="px-3 h-12 bg-[#E9E9E5] hover:bg-white border border-[#D1D1CD] text-xs font-mono font-bold text-[#1A1A1A] rounded-none cursor-pointer"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                )}

                {/* Location Select */}
                {(transactionType === HistoryType.IN || transactionType === HistoryType.LOCATION_CHANGED) && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">
                      보관 입고 창고 구역 지정
                    </span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <select
                        id="kiosk-location-select"
                        className="w-full pl-9 pr-4 py-2.5 border border-[#D1D1CD] text-xs font-bold focus:outline-none focus:border-[#1A1A1A] rounded-none bg-white text-[#1A1A1A]"
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
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">
                      불량 세부 내용 상세 기술 (감사 대비)
                    </span>
                    <textarea
                      id="kiosk-defect-details"
                      rows={3}
                      placeholder="예: 조립 공차 초과, 가공 크랙 발견, 초도 수입검사 전선 단선 등 기술..."
                      className="w-full p-3 border border-[#D1D1CD] text-xs focus:outline-none focus:border-[#1A1A1A] rounded-none bg-white text-[#1A1A1A]"
                      value={defectDetails}
                      onChange={(e) => setDefectDetails(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Right Form: Simulated Camera / Photo attachment */}
              <div className="p-4 bg-[#F4F4F2]/50 border border-[#D1D1CD] flex flex-col justify-between space-y-3 rounded-none">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A] flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> 실사 증적 사진 기록 (CAMERA)
                </span>

                <div className="aspect-video bg-white border border-dashed border-[#D1D1CD] overflow-hidden flex items-center justify-center relative">
                  {cameraSimulated ? (
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <RefreshCw className="w-5 h-5 text-[#1A1A1A] animate-spin" />
                      <span className="text-[10px] text-slate-500 font-bold font-mono">AUTOFOCUSSING...</span>
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
                          className="bg-[#1A1A1A] border border-white text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-neutral-800 rounded-none cursor-pointer"
                        >
                          지우기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 space-y-1.5">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-slate-600">증적용 내장 웹캠 연동</p>
                        <p className="text-[10px] text-slate-400 leading-tight">부품 식별 코드 또는 불량 부위 부착 라벨을 촬영하십시오.</p>
                      </div>
                    </div>
                  )}
                </div>

                {!capturedImage && (
                  <button
                    id="btn-kiosk-camera-shot"
                    onClick={triggerCameraSimulation}
                    disabled={cameraSimulated}
                    className="w-full py-2.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-all rounded-none cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> {cameraSimulated ? "LENS FOCUSING..." : "웹캠 이미지 캡처 및 OCR 스캔"}
                  </button>
                )}
              </div>
            </div>

            {/* Complete action block */}
            <div className="pt-4 border-t border-[#D1D1CD] flex justify-end">
              <button
                id="btn-kiosk-submit-transaction"
                onClick={handleSubmitAdjustment}
                className="px-6 py-3.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all rounded-none cursor-pointer"
              >
                <CornerDownLeft className="w-4 h-4" /> 현장 데이터 실시간 동기화 완료
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#D1D1CD] rounded-none p-12 text-center text-slate-400 space-y-2">
            <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">수정 대상 자재 미선택</h4>
            <p className="text-xs max-w-sm mx-auto leading-relaxed text-[#666666] font-serif italic">
              왼쪽 터치 패널에서 실사를 입력하고 수량을 조정하고자 하는 한화에어로스페이스 부품 규격을 선택해 주십시오.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
