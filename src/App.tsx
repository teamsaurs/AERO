/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Layers, 
  User, 
  TrendingUp, 
  FileSpreadsheet, 
  Bell, 
  ShieldCheck, 
  Flame, 
  RefreshCw,
  Info,
  X
} from "lucide-react";
import { Part, PartStatus, HistoryType, HistoryItem, Employee } from "./types";
import { INITIAL_PARTS, INITIAL_EMPLOYEES } from "./data/initialParts";
import DesignerDashboard from "./components/DesignerDashboard";
import FieldKiosk from "./components/FieldKiosk";
import ManagerSummary from "./components/ManagerSummary";
import ExcelImporter from "./components/ExcelImporter";

interface AlertNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  isRead: boolean;
  type: "success" | "warning" | "info";
}

export default function App() {
  const [parts, setParts] = useState<Part[]>(() => {
    const cached = localStorage.getItem("sync_bom_parts");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return INITIAL_PARTS;
      }
    }
    return INITIAL_PARTS;
  });
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const cached = localStorage.getItem("sync_bom_employees");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return INITIAL_EMPLOYEES;
      }
    }
    return INITIAL_EMPLOYEES;
  });
  const [selectedPartId, setSelectedPartId] = useState<string>("p2"); // Default to discrepancy part
  const [activeTab, setActiveTab] = useState<"DESIGNER" | "KIOSK" | "MANAGER" | "IMPORT">("DESIGNER");
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Initialize data from localStorage or default
  useEffect(() => {
    // Load initial system notification
    setNotifications([
      {
        id: "n_init",
        timestamp: new Date().toLocaleTimeString(),
        title: "실시간 정합성 감지 가동",
        message: "CATIA 설계데이터 10건 및 ERP/PLM 연동 데이터 10건에 대한 비교 분석이 완료되었습니다. 불일치(Discrepancy) 항목 3건이 검출되었습니다.",
        isRead: false,
        type: "warning"
      }
    ]);
  }, []);

  // Sync parts with LocalStorage on update
  const saveParts = (updatedParts: Part[]) => {
    setParts(updatedParts);
    localStorage.setItem("sync_bom_parts", JSON.stringify(updatedParts));
  };

  const saveEmployees = (updatedEmployees: Employee[]) => {
    setEmployees(updatedEmployees);
    localStorage.setItem("sync_bom_employees", JSON.stringify(updatedEmployees));
  };

  const handleAddEmployee = (newEmployee: Employee) => {
    const updated = [...employees, newEmployee];
    saveEmployees(updated);
    
    // Add notification
    const newNotification: AlertNotification = {
      id: `notif_emp_add_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: "👤 신규 현장 작업자 등록 완료",
      message: `신규 작업자 [${newEmployee.name}] (${newEmployee.department})님이 시스템에 정식 서명 인원으로 인가되었습니다.`,
      isRead: false,
      type: "info"
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleToggleLocalization = (partId: string) => {
    const updated = parts.map((p) => {
      if (p.id === partId) {
        const newVal = !p.isCriticalLocalPart;
        
        // Add notification
        const newNotification: AlertNotification = {
          id: `notif_local_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: newVal ? "★ 국산화 부품 지정" : "☆ 국산화 지정 해제",
          message: `부품 [${p.partName}]이 국산화 핵심 개발 부품으로 ${newVal ? "지정" : "해제"}되었습니다.`,
          isRead: false,
          type: "info"
        };
        setNotifications(prev => [newNotification, ...prev]);
        
        return { ...p, isCriticalLocalPart: newVal };
      }
      return p;
    });
    saveParts(updated);
  };

  const handleAddPart = (newPart: Part) => {
    const updated = [newPart, ...parts];
    saveParts(updated);
    setSelectedPartId(newPart.id);
    
    const newNotification: AlertNotification = {
      id: `notif_add_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: "📦 신규 자재 품목 등록 완료",
      message: `신규 자재 [${newPart.partName}] (${newPart.partNumber})가 체계 정합성 관리 마스터에 정식 등록되었습니다.`,
      isRead: false,
      type: "success"
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Toggle subscriber alert for a specific part
  const handleToggleAlert = (partId: string) => {
    const updated = parts.map((p) => {
      if (p.id === partId) {
        const toggledState = !p.alertOnStock;
        
        // Add notification confirmation
        const newNotification: AlertNotification = {
          id: `notif_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: toggledState ? "알림 구독 설정" : "알림 구독 해제",
          message: `[${p.partName}] 실물이 현장 창고에 입고되면 설계실 알림 및 사내 메신저로 즉시 알림이 전송됩니다.`,
          isRead: false,
          type: "info"
        };
        setNotifications(prev => [newNotification, ...prev]);

        return { ...p, alertOnStock: toggledState };
      }
      return p;
    });
    saveParts(updated);
  };

  // Add Comment & log in history
  const handleAddComment = (partId: string, commentText: string) => {
    const updated = parts.map((p) => {
      if (p.id === partId) {
        const newHistoryItem: HistoryItem = {
          id: `hist_${Date.now()}`,
          partId: p.id,
          type: HistoryType.LOCATION_CHANGED, // general note type
          timestamp: new Date().toISOString(),
          operator: "김민재 선임 (설계)",
          details: `[설계인원 이슈 메모] ${commentText}`
        };
        return {
          ...p,
          comments: commentText,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: "김민재 선임",
          history: [newHistoryItem, ...p.history]
        };
      }
      return p;
    });
    saveParts(updated);
  };

  // Handle stock updating (Kiosk transactions)
  const handleUpdatePartStock = (
    partId: string, 
    type: HistoryType, 
    qtyChange: number, 
    operator: string, 
    location: string, 
    details: string,
    imageUrl?: string
  ) => {
    const updated = parts.map((p) => {
      if (p.id === partId) {
        const oldQty = p.physicalQty;
        const newQty = Math.max(0, p.physicalQty + qtyChange);
        
        // Calculate new status based on transaction
        let newStatus = p.status;
        if (type === HistoryType.OUT) {
          newStatus = PartStatus.OUTBOUND;
        } else if (newQty >= p.catiaQty) {
          newStatus = PartStatus.AVAILABLE;
        } else if (newQty === 0 && p.leadTimeDays > 0) {
          newStatus = PartStatus.SHORTAGE;
        }

        // If defect was reported, status changes to DEFECTIVE
        if (type === HistoryType.DEFECT_REPORTED) {
          newStatus = PartStatus.DISCREPANCY; // has discrepancy now
        }

        const newHistoryItem: HistoryItem = {
          id: `hist_${Date.now()}`,
          partId: p.id,
          type,
          quantityChange: qtyChange !== 0 ? qtyChange : undefined,
          timestamp: new Date().toISOString(),
          operator,
          details,
          imageUrl
        };

        // Trigger Value-added Alert if subscribed & stocked in (transition from 0 to >0)
        if (p.alertOnStock && oldQty === 0 && newQty > 0) {
          const pushAlert: AlertNotification = {
            id: `notif_subscribed_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            title: `🔔 [구독 알림] 부품 입고 완료`,
            message: `체계기 설계실 김민재 선임님이 대기 중이던 국산화 핵심 부품 [${p.partName}] (${newQty} EA)이 금일 ${operator}에 의해 입고되었습니다. 즉시 조립 수입검사 이관 가능!`,
            isRead: false,
            type: "success"
          };
          setNotifications(prev => [pushAlert, ...prev]);
        }

        return {
          ...p,
          physicalQty: newQty,
          status: newStatus,
          warehouseLocation: location,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: operator,
          history: [newHistoryItem, ...p.history]
        };
      }
      return p;
    });
    saveParts(updated);
  };

  // Reset demo data
  const handleResetData = () => {
    localStorage.removeItem("sync_bom_parts");
    setParts(INITIAL_PARTS);
    setSelectedPartId("p2");
    
    const resetNotification: AlertNotification = {
      id: `notif_reset_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: "시나리오 데이터 초기화 완료",
      message: "Sync-BOM의 원시 시험 데이터셋이 한화에어로스페이스 LS사업부 기본값으로 복원되었습니다.",
      isRead: false,
      type: "info"
    };
    setNotifications([resetNotification]);
  };

  // Simulated Excel upload and comparison algorithm (Step 3.1 of PRD)
  const handleImportMockData = (type: "CATIA" | "ERP") => {
    if (type === "CATIA") {
      // Simulating loading a revised CATIA model list. 
      // It adds a new localized development piece "HW-K9-FCS-309" (방위각 검출 자이로센서) 
      // which initially doesn't exist in ERP, showcasing real-time discrepancy detection!
      const gyroSensorExists = parts.some(p => p.partNumber === "HW-K9-FCS-309");
      if (gyroSensorExists) return;

      const newGyroPart: Part = {
        id: `p_imported_${Date.now()}`,
        partNumber: "HW-K9-FCS-309",
        partName: "포탑방위각 정밀 센서 (자이로조립체)",
        subsystem: "사격통제 (Fire Control)",
        catiaQty: 1,
        erpQty: 0, // Not registered in ERP yet
        physicalQty: 1, // Physical prototype arrived
        status: PartStatus.DISCREPANCY,
        warehouseLocation: "C동 2층 정밀실",
        leadTimeDays: 45,
        isCriticalLocalPart: true,
        alertOnStock: true,
        scheduledDate: "2026-08-15",
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: "시스템 (CATIA 3D 도면 연동)",
        comments: "CATIA 3D 도면에는 추가되었으나 PLM 전산 등록이 생략되어 불일치 유발 상태.",
        history: [
          {
            id: `hist_imp_${Date.now()}`,
            partId: "HW-K9-FCS-309",
            type: HistoryType.DISCREPANCY_FOUND,
            timestamp: new Date().toISOString(),
            operator: "자동 정합성 분석 엔진",
            details: "CATIA 도면 파싱 결과 품목 감출: ERP 전산 상 누락 확인 (BOM 미결합 오류 경고)"
          }
        ]
      };

      const updated = [newGyroPart, ...parts];
      saveParts(updated);
      setSelectedPartId(newGyroPart.id);

      // Notification
      const catiaNotification: AlertNotification = {
        id: `notif_catia_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: "⚡ CATIA 3D 도면 대조 분석 완료",
        message: "새로운 부품 [포탑방위각 정밀 센서]가 검출되었으나 ERP 전산 상에 누락되었습니다. 신규 불일치(Discrepancy)가 자동으로 식별되었습니다.",
        isRead: false,
        type: "warning"
      };
      setNotifications(prev => [catiaNotification, ...prev]);

    } else {
      // Simulating ERP database sync. It resolves the discrepancy in "HW-K9-CHA-212"
      // (현수 제어 비례제어밸브 - PCV) by matching ERP qty with CATIA qty (updating from 0 to 1).
      const updated = parts.map(p => {
        if (p.partNumber === "HW-K9-CHA-212") {
          const newHistoryItem: HistoryItem = {
            id: `hist_erp_sync_${Date.now()}`,
            partId: p.id,
            type: HistoryType.INSPECT_COMPLETE,
            timestamp: new Date().toISOString(),
            operator: "ERP 시스템 연동단",
            details: "PLM/ERP 자재 마스터 수량 1개 정식 승인 동기화 완료 (데이터 정합성 매핑 해제)"
          };
          return {
            ...p,
            erpQty: 1,
            status: PartStatus.AVAILABLE,
            lastUpdated: new Date().toISOString(),
            lastUpdatedBy: "ERP 동기화 배치",
            comments: "ERP 자재 마스터에 승인이 지연되었던 밸브 품목의 결합 상태가 100% 동기화되었습니다.",
            history: [newHistoryItem, ...p.history]
          };
        }
        return p;
      });
      saveParts(updated);

      // Notification
      const erpNotification: AlertNotification = {
        id: `notif_erp_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: "⚙️ ERP 전산 정합성 동기화 성공",
        message: "현수 제어 비례제어밸브 (PCV) 품종의 ERP 전산 수량 누락이 해결되었습니다. 부품 상태가 '정상 가용'으로 자동 갱신되었습니다.",
        isRead: false,
        type: "success"
      };
      setNotifications(prev => [erpNotification, ...prev]);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-apple-parchment text-apple-ink flex flex-col antialiased selection:bg-apple-blue selection:text-white" id="sync-bom-app-root">
      
      {/* 1. Global Navigation Bar (Apple global-nav style) */}
      <nav className="bg-[#000000] text-[#f5f5f7] h-11 border-b border-neutral-900 sticky top-0 z-50 select-none">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex justify-between items-center text-[12px] font-normal tracking-tight">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-white tracking-widest text-xs font-mono">HANWHA AEROSPACE</span>
            <span className="text-[11px] text-[#86868b] hidden md:inline">LS Division / On-Premise Secure Intranet</span>
          </div>
          
          <div className="flex items-center gap-6 font-mono text-[11px] text-[#86868b]">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span className="text-[#f5f5f7]">KIOSK_02_LIVE</span>
            </div>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">AES-256 ENCRYPTED</span>
          </div>
        </div>
      </nav>

      {/* 2. Frosted Sub-Navigation Bar (Apple sub-nav-frosted style) */}
      <header className="bg-apple-canvas/80 backdrop-blur-md border-b border-[#e0e0e0]/70 sticky top-11 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto h-14 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          {/* Left Title Area */}
          <div className="flex items-baseline gap-3">
            <h1 className="text-[20px] font-semibold text-apple-ink tracking-tight">Sync-BOM</h1>
            <span className="text-[10px] uppercase tracking-widest font-mono text-apple-muted bg-apple-parchment border border-apple-hairline px-2 py-0.5 rounded-[4px]">
              K9-A2 BATCH_04
            </span>
          </div>

          {/* Right Action/Tab-Switcher Menu (Apple Navigation Links) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Status Pill */}
            <div className="hidden lg:flex items-center gap-1 bg-apple-parchment border border-apple-hairline rounded-full px-3 py-1 text-[11px] font-medium text-apple-ink">
              <span className="text-apple-muted">BOM 정합률:</span>
              <span className="font-mono font-bold text-apple-blue">92.4%</span>
            </div>

            {/* Notification Badge Bell */}
            <div className="relative">
              <button
                id="btn-open-notification-center"
                onClick={() => {
                  setShowNotificationPanel(!showNotificationPanel);
                  if (!showNotificationPanel) markAllAsRead();
                }}
                className="p-2 text-apple-ink hover:bg-apple-parchment rounded-full transition-all relative flex items-center justify-center cursor-pointer active-scale"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-apple-blue rounded-full"></span>
                )}
              </button>

              {/* Notification drop panel */}
              {showNotificationPanel && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-apple-canvas border border-apple-hairline shadow-2xl z-50 text-apple-ink rounded-2xl overflow-hidden" id="notification-center-dropdown">
                  <div className="bg-[#1d1d1f] text-white px-4 py-3.5 flex justify-between items-center">
                    <span className="text-xs font-bold flex items-center gap-1.5 tracking-widest uppercase">
                      <Bell className="w-3.5 h-3.5 text-apple-sky" /> 실시간 통합 알림 로그
                    </span>
                    <button 
                      onClick={() => setShowNotificationPanel(false)}
                      className="text-[#86868b] hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y divide-apple-hairline max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-apple-muted italic">
                        신규 알림 로그가 없습니다.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-4 hover:bg-apple-parchment/50 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full border ${
                              notif.type === "success" 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                : notif.type === "warning"
                                ? "bg-amber-50 text-amber-800 border-amber-100"
                                : "bg-blue-50 text-blue-800 border-blue-100"
                            }`}>
                              {notif.type.toUpperCase()}
                            </span>
                            <span className="font-mono text-[9px] text-apple-muted">{notif.timestamp}</span>
                          </div>
                          <h5 className="font-semibold text-apple-ink leading-tight mb-1">{notif.title}</h5>
                          <p className="text-apple-muted text-[11px] leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* 3. Segmented Role Control Unit (Apple custom switcher bar) */}
      <section className="bg-apple-canvas border-b border-apple-hairline py-3" id="role-selector-tabs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3">
          
          {/* Segmented Pill Switcher */}
          <div className="bg-[#f5f5f7] p-1 rounded-full flex gap-1 border border-apple-hairline/60">
            {/* DESIGNER */}
            <button
              id="tab-btn-designer"
              onClick={() => setActiveTab("DESIGNER")}
              className={`px-5 py-2 rounded-full text-xs font-medium tracking-tight transition-all active-scale cursor-pointer ${
                activeTab === "DESIGNER"
                  ? "bg-white text-apple-ink shadow-sm font-semibold"
                  : "text-apple-muted hover:text-apple-ink"
              }`}
            >
              설계자 대시보드
            </button>

            {/* KIOSK */}
            <button
              id="tab-btn-kiosk"
              onClick={() => setActiveTab("KIOSK")}
              className={`px-5 py-2 rounded-full text-xs font-medium tracking-tight transition-all active-scale cursor-pointer ${
                activeTab === "KIOSK"
                  ? "bg-white text-apple-ink shadow-sm font-semibold"
                  : "text-apple-muted hover:text-apple-ink"
              }`}
            >
              현장 키오스크
            </button>

            {/* MANAGER */}
            <button
              id="tab-btn-manager"
              onClick={() => setActiveTab("MANAGER")}
              className={`px-5 py-2 rounded-full text-xs font-medium tracking-tight transition-all active-scale cursor-pointer ${
                activeTab === "MANAGER"
                  ? "bg-white text-apple-ink shadow-sm font-semibold"
                  : "text-apple-muted hover:text-apple-ink"
              }`}
            >
              생산 종합 모니터링
            </button>

            {/* IMPORT */}
            <button
              id="tab-btn-import"
              onClick={() => setActiveTab("IMPORT")}
              className={`px-5 py-2 rounded-full text-xs font-medium tracking-tight transition-all active-scale cursor-pointer ${
                activeTab === "IMPORT"
                  ? "bg-white text-apple-ink shadow-sm font-semibold"
                  : "text-apple-muted hover:text-apple-ink"
              }`}
            >
              자재 보고서 병합
            </button>
          </div>

          {/* Quick Informational Guide Link */}
          <div className="text-[11px] text-apple-muted flex items-center gap-1.5 font-normal">
            <Info className="w-3.5 h-3.5 text-apple-blue shrink-0" />
            <span>
              {activeTab === "DESIGNER" && "CATIA 3D 도면, ERP 전산 원장, 현장 실물 가용 상태를 대조 진단합니다."}
              {activeTab === "KIOSK" && "작업자들이 부품 입출고 및 실물 불량 이관을 현장 원터치로 캡처하는 단말입니다."}
              {activeTab === "MANAGER" && "결품 공급망 일정 위험 및 전산 오차를 시각 진단하는 실시간 관제판입니다."}
              {activeTab === "IMPORT" && "원시 덤프 보고서(BOM/ERP)를 파싱하여 신규 품목과 정합 상태를 동기화합니다."}
            </span>
          </div>

        </div>
      </section>

      {/* 4. Main Body Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Core Component Render Stack */}
        <div className="animate-fade-in">
          {activeTab === "DESIGNER" && (
            <DesignerDashboard
              parts={parts}
              selectedPartId={selectedPartId}
              onSelectPart={setSelectedPartId}
              onToggleAlert={handleToggleAlert}
              onAddComment={handleAddComment}
              onAddPart={handleAddPart}
              onToggleLocalization={handleToggleLocalization}
            />
          )}

          {activeTab === "KIOSK" && (
            <FieldKiosk
              parts={parts}
              employees={employees}
              onUpdatePartStock={handleUpdatePartStock}
              onAddEmployee={handleAddEmployee}
            />
          )}

          {activeTab === "MANAGER" && (
            <ManagerSummary
              parts={parts}
              onSelectPart={(id) => {
                setSelectedPartId(id);
                setActiveTab("DESIGNER");
              }}
              onResetData={handleResetData}
            />
          )}

          {activeTab === "IMPORT" && (
            <ExcelImporter
              onImportMockData={handleImportMockData}
            />
          )}
        </div>

      </main>

      {/* 5. Editorial Footer (Apple style) */}
      <footer className="bg-apple-parchment border-t border-[#e0e0e0] py-12 px-4 sm:px-6 lg:px-8 select-none">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Fine print legal block */}
          <div className="text-[11px] text-apple-muted leading-relaxed space-y-2 border-b border-[#e0e0e0]/70 pb-6">
            <p>
              * 본 Sync-BOM 웹 단말 시스템은 한화에어로스페이스 LS사업부 전용 폐쇄망 시험용 프로토타입 인터페이스입니다.
              CATIA V6 3D 설계 모델의 원시 BOM 정보와 SAP ERP 자재정보를 실시간으로 비교 분석하여 현장 불일치를 방지하는 것을 목적으로 합니다.
            </p>
            <p>
              * 모든 자재 캡처 증적 데이터 및 작업 서명 로그는 군수물자 무단 반출입 방지 조항 및 방위산업 기술 보호법에 의거하여 암호화 세션에 영구 기록됩니다.
            </p>
          </div>

          {/* Quick Metrics & System Metadata */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[11px] text-apple-muted font-normal">
            <div className="flex flex-wrap gap-x-6 gap-y-1 uppercase tracking-wider font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span> DB INTEGRATION OK
              </span>
              <span>• ERP BATCH_DELAY: &lt; 3 MINS</span>
              <span>• CATIA PLM V6 COMPATIBLE</span>
            </div>
            
            <div className="flex flex-col md:items-end gap-1">
              <p className="font-mono text-[10px]">SEC_LOG_HASH: 2026-07-16_SEOUL_HV_CORE_PROT</p>
              <p className="flex items-center gap-1 text-apple-ink font-medium mt-0.5">
                <ShieldCheck className="w-4 h-4 text-apple-blue" />
                <span>국가핵심기술 기술보호 규정 준수 (On-Premise Closed Server Prototype Mode)</span>
              </p>
            </div>
          </div>
          
        </div>
      </footer>

    </div>
  );
}
