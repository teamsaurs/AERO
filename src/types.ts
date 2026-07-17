/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PartStatus {
  AVAILABLE = "AVAILABLE",       // 즉시 사용 가능 (초록)
  ORDERED = "ORDERED",           // 발주 중 (노랑)
  SHORTAGE = "SHORTAGE",         // 결품 (빨강)
  DISCREPANCY = "DISCREPANCY",   // 데이터 불일치 (주황)
  DEFECTIVE = "DEFECTIVE",       // 불량 반납 (적자색)
  INSPECTING = "INSPECTING",     // 수입 검사 중 (하늘색)
  OUTBOUND = "OUTBOUND",         // 출고중
}

export enum HistoryType {
  IN = "IN",
  OUT = "OUT",
  DISCREPANCY_FOUND = "DISCREPANCY_FOUND",
  DEFECT_REPORTED = "DEFECT_REPORTED",
  INSPECT_START = "INSPECT_START",
  INSPECT_COMPLETE = "INSPECT_COMPLETE",
  LOCATION_CHANGED = "LOCATION_CHANGED",
}

export interface HistoryItem {
  id: string;
  partId: string;
  type: HistoryType;
  quantityChange?: number;
  timestamp: string;
  operator: string;
  details: string;
  imageUrl?: string;
}

export interface Part {
  id: string;
  partNumber: string;         // 품번 (예: HW-K9-TUR-105)
  partName: string;           // 품명 (예: 포탑 구동 구동기)
  subsystem: string;          // 하위 체계 (예: 포탑, 차체, 사격통제, 엔진)
  catiaQty: number;           // 3D 모델링 수량
  erpQty: number;             // 전산(ERP/PLM) 수량
  physicalQty: number;        // 실제 현장 창고 수량
  status: PartStatus;
  warehouseLocation: string;  // 창고 위치 (예: A동 2층, B동 1층, 검사실)
  leadTimeDays: number;       // 발주 리드타임
  isCriticalLocalPart: boolean; // 국산화 개발 핵심 부품 여부
  alertOnStock: boolean;      // 입고 알림 신청 여부
  scheduledDate?: string;     // 생산 투입 예정일 (L/T 예측용)
  lastUpdated: string;
  lastUpdatedBy: string;
  photoUrl?: string;
  comments?: string;
  history: HistoryItem[];
}

export interface Employee {
  id: string;
  name: string;
  department: string;
}

export type UserRole = "DESIGNER" | "FIELD_WORKER" | "MANAGER";
