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
import { Part, PartStatus, HistoryType, HistoryItem } from "./types";
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
        if (newQty >= p.catiaQty) {
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
    <div className="min-h-screen bg-[#F4F4F2] text-[#1A1A1A] flex flex-col antialiased selection:bg-[#1A1A1A] selection:text-white" id="sync-bom-app-root">
      
      {/* Top Banner Branding Header */}
      <header className="bg-[#F4F4F2] border-b border-[#D1D1CD] text-[#1A1A1A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex justify-between items-center">
          
          {/* Logo Brand Title */}
          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-[#1A1A1A]">Sync-BOM</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#666666] hidden lg:inline">
              Hanwha Aerospace LS Division / Field Integration Unit
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="hidden md:flex items-center gap-6 text-xs text-[#1A1A1A]">
            <div className="text-right">
              <span className="text-[#888888] font-bold block text-[9px] uppercase tracking-widest">Vehicle ID</span>
              <span className="font-mono font-bold text-[#1A1A1A]">K9-A2_BATCH_04</span>
            </div>
            <div className="w-px h-8 bg-[#D1D1CD]" />
            <div className="text-right">
              <span className="text-[#888888] font-bold block text-[9px] uppercase tracking-widest">시스템 정합</span>
              <span className="font-mono font-bold text-[#1A1A1A]">92.4%</span>
            </div>
            <div className="w-px h-8 bg-[#D1D1CD]" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-[#888888] font-bold uppercase tracking-widest">On-Site Kiosk 02</span>
              <p className="text-[10px] text-green-700 font-mono tracking-tighter uppercase font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse inline-block"></span>
                Live Sync Active
              </p>
            </div>
          </div>

          {/* Notification Alert Bell icon */}
          <div className="relative">
            <button
              id="btn-open-notification-center"
              onClick={() => {
                setShowNotificationPanel(!showNotificationPanel);
                if (!showNotificationPanel) markAllAsRead();
              }}
              className="p-2 text-[#1A1A1A] hover:bg-white border border-[#D1D1CD] transition-all relative flex items-center justify-center cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1A1A1A] text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification drop panel */}
            {showNotificationPanel && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-[#D1D1CD] shadow-lg z-50 text-[#1A1A1A]" id="notification-center-dropdown">
                <div className="bg-[#1A1A1A] text-white px-4 py-3 flex justify-between items-center">
                  <span className="text-xs font-bold flex items-center gap-1.5 tracking-widest uppercase">
                    <Bell className="w-3.5 h-3.5 text-white" /> 실시간 통합 알림 로그
                  </span>
                  <button 
                    onClick={() => setShowNotificationPanel(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-[#D1D1CD] max-h-80 overflow-y-auto bg-[#F4F4F2]/20">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      신규 알림 로그가 없습니다.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-3.5 hover:bg-[#F4F4F2]/50 text-xs text-[#1A1A1A]">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`px-1.5 py-0.5 font-bold rounded text-[9px] ${
                            notif.type === "success" 
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                              : notif.type === "warning"
                              ? "bg-amber-50 text-amber-800 border border-amber-100"
                              : "bg-blue-50 text-blue-800 border border-blue-100"
                          }`}>
                            {notif.type}
                          </span>
                          <span className="font-mono text-[9px] text-[#888888]">{notif.timestamp}</span>
                        </div>
                        <h5 className="font-bold text-[#1A1A1A] leading-tight mb-1">{notif.title}</h5>
                        <p className="text-slate-500 text-[11px] leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Role Navigation Switcher (Tabs) */}
      <section className="bg-[#E9E9E5]/60 border-b border-[#D1D1CD] py-4" id="role-selector-tabs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Tabs switch */}
          <div className="flex flex-wrap gap-1">
            {/* DESIGNER */}
            <button
              id="tab-btn-designer"
              onClick={() => setActiveTab("DESIGNER")}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                activeTab === "DESIGNER"
                  ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                  : "bg-transparent border-transparent text-[#1A1A1A] hover:bg-white/50"
              }`}
            >
              체계기 설계자 모드
            </button>

            {/* KIOSK */}
            <button
              id="tab-btn-kiosk"
              onClick={() => setActiveTab("KIOSK")}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                activeTab === "KIOSK"
                  ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                  : "bg-transparent border-transparent text-[#1A1A1A] hover:bg-white/50"
              }`}
            >
              현장 간편 키오스크
            </button>

            {/* MANAGER */}
            <button
              id="tab-btn-manager"
              onClick={() => setActiveTab("MANAGER")}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                activeTab === "MANAGER"
                  ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                  : "bg-transparent border-transparent text-[#1A1A1A] hover:bg-white/50"
              }`}
            >
              생산 종합 모니터단
            </button>

            {/* IMPORT */}
            <button
              id="tab-btn-import"
              onClick={() => setActiveTab("IMPORT")}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                activeTab === "IMPORT"
                  ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                  : "bg-transparent border-transparent text-[#1A1A1A] hover:bg-white/50"
              }`}
            >
              BOM 외부 병합 (Step 1)
            </button>
          </div>

          {/* Quick Notice */}
          <div className="text-[11px] text-[#555] font-serif italic flex items-center gap-1.5 bg-white/40 border border-[#D1D1CD] px-3.5 py-2">
            <Info className="w-3.5 h-3.5 text-[#1a1a1a] shrink-0" />
            <span>
              {activeTab === "DESIGNER" && "설계 모델과 전산/창고 실물 정밀 대조 및 메신저 알림을 관리합니다."}
              {activeTab === "KIOSK" && "작업자들이 장갑을 낀 상태에서 터치식으로 입출고를 기록하는 키오스크입니다."}
              {activeTab === "MANAGER" && "LS사업부 조립공정 지연 예방을 위한 생산 부족(Shortage) 종합 현황판입니다."}
              {activeTab === "IMPORT" && "ERP 보고서 엑셀 덤프를 가상 업로드하여 일괄 정합성 분석을 시뮬레이션합니다."}
            </span>
          </div>

        </div>
      </section>

      {/* Main Body Stage Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Core View Switch Render */}
        <div className="animate-fade-in">
          {activeTab === "DESIGNER" && (
            <DesignerDashboard
              parts={parts}
              selectedPartId={selectedPartId}
              onSelectPart={setSelectedPartId}
              onToggleAlert={handleToggleAlert}
              onAddComment={handleAddComment}
            />
          )}

          {activeTab === "KIOSK" && (
            <FieldKiosk
              parts={parts}
              employees={INITIAL_EMPLOYEES}
              onUpdatePartStock={handleUpdatePartStock}
            />
          )}

          {activeTab === "MANAGER" && (
            <ManagerSummary
              parts={parts}
              onSelectPart={(id) => {
                setSelectedPartId(id);
                setActiveTab("DESIGNER"); // Jump back to detailed view
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

      {/* Footer Branding */}
      <footer className="px-8 py-5 bg-[#E9E9E5] border-t border-[#D1D1CD] flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-[9px] uppercase tracking-[0.2em] font-bold text-[#666666]">
          <span>01 : DB INTEGRATION OK</span>
          <span>02 : ERP SYNC (L-3 MINS)</span>
          <span>03 : PLM CATIA V6 CONNECTED</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-[#666666] font-medium">
          <span className="font-mono">SYSTEM_LOG_REF: 2026-07-16_SEOUL_HV_CORE</span>
          <span className="w-px h-3 bg-[#D1D1CD]"></span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span>방산 기술 보호 규정 준수 (On-Premise Closed Server Prototype Mode)</span>
          </span>
        </div>
      </footer>

    </div>
  );
}
