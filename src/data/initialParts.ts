/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Part, PartStatus, HistoryType, Employee } from "../types";

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: "260101", name: "김민재 선임", department: "LS사업부 체계설계팀" },
  { id: "260102", name: "박동현 기사", department: "LS사업부 창고관리실" },
  { id: "260103", name: "최진우 책임", department: "LS사업부 생산기술팀" },
];

export const INITIAL_PARTS: Part[] = [
  {
    id: "p1",
    partNumber: "HW-K9-TUR-101",
    partName: "포신 조립체 (155mm CN98)",
    subsystem: "포탑 (Turret)",
    catiaQty: 1,
    erpQty: 1,
    physicalQty: 1,
    status: PartStatus.AVAILABLE,
    warehouseLocation: "A동 1층 대형고",
    leadTimeDays: 90,
    isCriticalLocalPart: true,
    alertOnStock: false,
    scheduledDate: "2026-08-10",
    lastUpdated: "2026-07-15T10:30:00Z",
    lastUpdatedBy: "박동현 기사",
    comments: "초기 조립 대기 중. 상태 양호.",
    history: [
      {
        id: "h1_1",
        partId: "p1",
        type: HistoryType.IN,
        quantityChange: 1,
        timestamp: "2026-07-15T10:30:00Z",
        operator: "박동현 기사",
        details: "A동 대형고 입고 완료 (포장 해제 및 크랙 수입검사 통과)",
      }
    ]
  },
  {
    id: "p2",
    partNumber: "HW-K9-TUR-105",
    partName: "포탑 선회 기어 구동기 (TDA)",
    subsystem: "포탑 (Turret)",
    catiaQty: 1,
    erpQty: 1,
    physicalQty: 0,
    status: PartStatus.DISCREPANCY,
    warehouseLocation: "불량 반납 대기실",
    leadTimeDays: 45,
    isCriticalLocalPart: true,
    alertOnStock: true,
    scheduledDate: "2026-08-01",
    lastUpdated: "2026-07-16T09:15:00Z",
    lastUpdatedBy: "박동현 기사",
    comments: "ERP상 재고 유효하나, 실제로는 작동 불량(토크 부족)으로 전량 반납 처리됨. 실물 재고 없음!",
    history: [
      {
        id: "h2_1",
        partId: "p2",
        type: HistoryType.IN,
        quantityChange: 1,
        timestamp: "2026-07-10T14:00:00Z",
        operator: "박동현 기사",
        details: "ERP 수량 동기화 및 입고",
      },
      {
        id: "h2_2",
        partId: "p2",
        type: HistoryType.DEFECT_REPORTED,
        quantityChange: -1,
        timestamp: "2026-07-16T09:15:00Z",
        operator: "박동현 기사",
        details: "체계 장착 후 무부하 토크 테스트 불합격 -> 불량품 실물 격리실로 이동 및 원인 분석 요구서 발행",
      }
    ]
  },
  {
    id: "p3",
    partNumber: "HW-K9-TUR-110",
    partName: "자동 송탄장치 유압 실린더",
    subsystem: "포탑 (Turret)",
    catiaQty: 2,
    erpQty: 2,
    physicalQty: 0,
    status: PartStatus.SHORTAGE,
    warehouseLocation: "발주 완료 (수입 대기)",
    leadTimeDays: 40,
    isCriticalLocalPart: false,
    alertOnStock: true,
    scheduledDate: "2026-07-28", // Assembly scheduled soon, but Lead time or shortage issue?
    lastUpdated: "2026-07-14T11:00:00Z",
    lastUpdatedBy: "최진우 책임",
    comments: "조립 투입 일정이 12일 남았으나 해외 외주 부품 통관 지연으로 현장 미입고 상태.",
    history: [
      {
        id: "h3_1",
        partId: "p3",
        type: HistoryType.DISCREPANCY_FOUND,
        timestamp: "2026-07-14T11:00:00Z",
        operator: "최진우 책임",
        details: "조립 스케줄링 검토 중 결품 위험 감지. 발주 상태 추적 개시.",
      }
    ]
  },
  {
    id: "p4",
    partNumber: "HW-K9-CHA-201",
    partName: "유압현수장치 실린더 (HSU-1)",
    subsystem: "차체 (Chassis)",
    catiaQty: 12,
    erpQty: 12,
    physicalQty: 12,
    status: PartStatus.AVAILABLE,
    warehouseLocation: "B동 2층 중량물고",
    leadTimeDays: 60,
    isCriticalLocalPart: true,
    alertOnStock: false,
    scheduledDate: "2026-08-05",
    lastUpdated: "2026-07-12T16:45:00Z",
    lastUpdatedBy: "박동현 기사",
    comments: "차체 완충 장치 1차분 12개 검토 통과 및 적재 완.",
    history: [
      {
        id: "h4_1",
        partId: "p4",
        type: HistoryType.IN,
        quantityChange: 12,
        timestamp: "2026-07-12T16:45:00Z",
        operator: "박동현 기사",
        details: "현수 장치 정격 가압 테스트 합격 후 입고 처리",
      }
    ]
  },
  {
    id: "p5",
    partNumber: "HW-K9-CHA-208",
    partName: "무한궤도 연결 핀 (Track Pin Assembly)",
    subsystem: "차체 (Chassis)",
    catiaQty: 160,
    erpQty: 160,
    physicalQty: 140,
    status: PartStatus.DISCREPANCY,
    warehouseLocation: "B동 1층 부품함 B-4",
    leadTimeDays: 15,
    isCriticalLocalPart: false,
    alertOnStock: false,
    scheduledDate: "2026-08-05",
    lastUpdated: "2026-07-16T15:00:00Z",
    lastUpdatedBy: "박동현 기사",
    comments: "ERP 전산상 160개 등록되어 있으나, 실질 현장 창고 실사 결과 140개 확인 (20개 유실 혹은 시험 소모 추정).",
    history: [
      {
        id: "h5_1",
        partId: "p5",
        type: HistoryType.IN,
        quantityChange: 160,
        timestamp: "2026-07-01T09:00:00Z",
        operator: "박동현 기사",
        details: "양산 자재 벌크 입고",
      },
      {
        id: "h5_2",
        partId: "p5",
        type: HistoryType.DISCREPANCY_FOUND,
        quantityChange: -20,
        timestamp: "2026-07-16T15:00:00Z",
        operator: "박동현 기사",
        details: "창고 상시 재고 실사 중 20개 불일치 확인. (야외 주행 시험용 소모 미반영으로 추측)",
      }
    ]
  },
  {
    id: "p6",
    partNumber: "HW-K9-CHA-212",
    partName: "현수 제어 비례제어밸브 (PCV)",
    subsystem: "차체 (Chassis)",
    catiaQty: 1,
    erpQty: 0,
    physicalQty: 1,
    status: PartStatus.DISCREPANCY,
    warehouseLocation: "B동 1층 정밀고",
    leadTimeDays: 30,
    isCriticalLocalPart: true,
    alertOnStock: false,
    scheduledDate: "2026-08-05",
    lastUpdated: "2026-07-16T11:20:00Z",
    lastUpdatedBy: "김민재 선임",
    comments: "CATIA 설계 변경 및 현장 시제품은 입고 완료되었으나, 아직 전산 ERP에 품목 승인(BOM Release)이 지연되어 누락된 상태.",
    history: [
      {
        id: "h6_1",
        partId: "p6",
        type: HistoryType.DISCREPANCY_FOUND,
        timestamp: "2026-07-16T11:20:00Z",
        operator: "김민재 선임",
        details: "CATIA 부품 비교 프로세스 중 전산 미등록 불일치 자동 감지 및 이슈 업로드",
      }
    ]
  },
  {
    id: "p7",
    partNumber: "HW-K9-FCS-301",
    partName: "사격통제 컴퓨터 모듈 (BCU)",
    subsystem: "사격통제 (Fire Control)",
    catiaQty: 1,
    erpQty: 1,
    physicalQty: 1,
    status: PartStatus.AVAILABLE,
    warehouseLocation: "C동 2층 온습도제어실",
    leadTimeDays: 50,
    isCriticalLocalPart: true,
    alertOnStock: false,
    scheduledDate: "2026-08-12",
    lastUpdated: "2026-07-14T09:00:00Z",
    lastUpdatedBy: "박동현 기사",
    comments: "국산화 신형 컴퓨터 개발 완료 자재. 항온항습실 보관 중.",
    history: [
      {
        id: "h7_1",
        partId: "p7",
        type: HistoryType.IN,
        quantityChange: 1,
        timestamp: "2026-07-14T09:00:00Z",
        operator: "박동현 기사",
        details: "국산화 개발품 성적서 통과 및 랙 이관 수납 완료",
      }
    ]
  },
  {
    id: "p8",
    partNumber: "HW-K9-FCS-305",
    partName: "포수 열상조준경 패키지",
    subsystem: "사격통제 (Fire Control)",
    catiaQty: 1,
    erpQty: 1,
    physicalQty: 0,
    status: PartStatus.INSPECTING,
    warehouseLocation: "C동 1층 수입검사실",
    leadTimeDays: 60,
    isCriticalLocalPart: false,
    alertOnStock: true,
    scheduledDate: "2026-07-22",
    lastUpdated: "2026-07-16T14:30:00Z",
    lastUpdatedBy: "박동현 기사",
    comments: "금일 물류 입고됨. 현장 수입 검사(치수 및 전기 특성) 절차 진행 중으로, 실무 대기 수량은 아직 0으로 관리.",
    history: [
      {
        id: "h8_1",
        partId: "p8",
        type: HistoryType.INSPECT_START,
        timestamp: "2026-07-16T14:30:00Z",
        operator: "박동현 기사",
        details: "창고 정문 하적 및 품질팀 수입검사 접수 의뢰 진행 중",
      }
    ]
  },
  {
    id: "p9",
    partNumber: "HW-K9-ENG-401",
    partName: "1,000마력 디젤 엔진 패키지",
    subsystem: "엔진/변속기 (Engine)",
    catiaQty: 1,
    erpQty: 1,
    physicalQty: 1,
    status: PartStatus.AVAILABLE,
    warehouseLocation: "A동 1층 대형고",
    leadTimeDays: 120,
    isCriticalLocalPart: false,
    alertOnStock: false,
    scheduledDate: "2026-08-01",
    lastUpdated: "2026-07-08T10:00:00Z",
    lastUpdatedBy: "박동현 기사",
    comments: "엔진 마운팅용 프레임 결합 확인.",
    history: [
      {
        id: "h9_1",
        partId: "p9",
        type: HistoryType.IN,
        quantityChange: 1,
        timestamp: "2026-07-08T10:00:00Z",
        operator: "박동현 기사",
        details: "체계 통합용 대형 디젤 엔진 크레인 양하 및 안착",
      }
    ]
  },
  {
    id: "p10",
    partNumber: "HW-K9-ENG-405",
    partName: "자동화 무단변속기 (HMPT-500)",
    subsystem: "엔진/변속기 (Engine)",
    catiaQty: 1,
    erpQty: 1,
    physicalQty: 0,
    status: PartStatus.ORDERED,
    warehouseLocation: "해외 제작사 대기",
    leadTimeDays: 75,
    isCriticalLocalPart: false,
    alertOnStock: true,
    scheduledDate: "2026-09-15", // Scheduled far away, but tracked carefully
    lastUpdated: "2026-07-05T09:00:00Z",
    lastUpdatedBy: "최진우 책임",
    comments: "발주 완료 및 선적 대기 중. L/T 준수 예상.",
    history: [
      {
        id: "h10_1",
        partId: "p10",
        type: HistoryType.INSPECT_START,
        timestamp: "2026-07-05T09:00:00Z",
        operator: "최진우 책임",
        details: "상반기 제작사 승인 문서 통과 및 PO 발행 완료",
      }
    ]
  }
];
