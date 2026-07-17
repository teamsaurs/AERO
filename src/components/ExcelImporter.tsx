/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, DragEvent } from "react";
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  Database,
  RefreshCw,
  FileText
} from "lucide-react";

interface ExcelImporterProps {
  onImportMockData: (type: "CATIA" | "ERP") => void;
}

export default function ExcelImporter({ onImportMockData }: ExcelImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [importedFile, setImportedFile] = useState<{ name: string; size: string; type: "CATIA" | "ERP" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sample data to preview on drag or select
  const sampleData = {
    CATIA: [
      { num: "HW-K9-TUR-101", name: "포신 조립체 (155mm)", qty: 1, type: "Turret" },
      { num: "HW-K9-TUR-105", name: "포탑 선회 기어 구동기", qty: 1, type: "Turret" },
      { num: "HW-K9-CHA-201", name: "유압현수장치 실린더", qty: 12, type: "Chassis" },
      { num: "HW-K9-CHA-212", name: "현수 제어 비례제어밸브", qty: 1, type: "Chassis" },
    ],
    ERP: [
      { num: "HW-K9-TUR-101", name: "포신 조립체 (155mm CN98)", qty: 1, loc: "A동 1층 대형고" },
      { num: "HW-K9-TUR-105", name: "포탑 선회 기어 구동기 (TDA)", qty: 1, loc: "A동 1층 대형고" },
      { num: "HW-K9-CHA-201", name: "유압현수장치 실린더 (HSU-1)", qty: 12, loc: "B동 2층 중량물고" },
      { num: "HW-K9-CHA-212", name: "현수 제어 비례제어밸브 (PCV)", qty: 0, loc: "미등록" }, // discrepancy!
    ]
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // Simulating dragging a CATIA report
    triggerMockImport("CATIA", "HW_CATIA_3D_BOM_DUMP.xlsx");
  };

  const triggerMockImport = (dataType: "CATIA" | "ERP", customName?: string) => {
    setIsLoading(true);
    setSuccess(false);

    setTimeout(() => {
      setIsLoading(false);
      setImportedFile({
        name: customName || (dataType === "CATIA" ? "HW_CATIA_3D_BOM_DUMP.xlsx" : "ERP_INVENTORY_PLM_REPORT.csv"),
        size: dataType === "CATIA" ? "142 KB" : "320 KB",
        type: dataType
      });
    }, 1000);
  };

  const handleApplyImport = () => {
    if (!importedFile) return;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onImportMockData(importedFile.type);
      setSuccess(true);
      setImportedFile(null);

      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    }, 1500);
  };

  return (
    <div className="bg-apple-canvas border border-apple-hairline/60 p-6 md:p-8 space-y-6 rounded-[18px] shadow-sm" id="excel-importer-view">
      <div className="border-b border-apple-hairline/60 pb-5 space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-apple-ink flex items-center gap-1.5 font-sans">
          <FileSpreadsheet className="w-5 h-5 text-apple-blue" />
          ERP/PLM & CATIA 외부 자재 데이터 병합 시스템 (Step 1)
        </h3>
        <p className="text-xs text-apple-muted leading-relaxed font-sans">
          서로 다른 시스템인 CATIA 3D 도면 추출 원시자재 명세와 ERP 전산 재고 마스터 엑셀을 업로드하여 <br />
          Sync-BOM 실시간 정합 테이블과 통합 병합(Merge)합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Drag/Drop simulation card */}
        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">
            전산 보고서 드래그 앤 드롭 업로드
          </span>

          <div
            id="drag-and-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border border-dashed p-8 text-center flex flex-col items-center justify-center space-y-4 transition-all cursor-pointer rounded-2xl ${
              dragActive 
                ? "border-apple-blue bg-apple-blue/5" 
                : "border-apple-hairline bg-apple-parchment/40 hover:bg-apple-parchment/80 hover:border-apple-muted"
            }`}
          >
            <div className="w-12 h-12 bg-white rounded-full border border-apple-hairline/80 flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5 text-apple-blue" />
            </div>
            <div>
              <p className="text-xs font-bold text-apple-ink uppercase tracking-wider font-sans">엑셀(.xlsx) 또는 CSV 파일을 여기로 끌어놓으세요</p>
              <p className="text-[10px] text-apple-muted mt-1 font-mono uppercase">MAX SIZE: 20MB / SECURE TUNNELLING ENABLED</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 justify-center">
              <button
                id="btn-import-catia-sample"
                onClick={() => triggerMockImport("CATIA")}
                className="px-4 py-2 bg-white hover:bg-apple-parchment/60 border border-apple-hairline text-xs font-semibold rounded-full cursor-pointer active-scale flex items-center gap-1.5 transition-all"
              >
                <FileText className="w-4 h-4 text-apple-muted" /> 3D CATIA 덤프
              </button>
              <button
                id="btn-import-erp-sample"
                onClick={() => triggerMockImport("ERP")}
                className="px-4 py-2 bg-white hover:bg-apple-parchment/60 border border-apple-hairline text-xs font-semibold rounded-full cursor-pointer active-scale flex items-center gap-1.5 transition-all"
              >
                <Database className="w-4 h-4 text-apple-muted" /> ERP 자재 보고서
              </button>
            </div>
          </div>

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-950 text-xs flex items-center gap-3 animate-fade-in rounded-xl" id="import-success-toast">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">데이터 병합 및 매핑 완료!</p>
                <p className="text-emerald-800 mt-0.5">외부 보고서 구조체에서 HW로 시작되는 품번을 매핑 완료하고 불일치 항목을 식별했습니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Preview column */}
        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-apple-muted block font-sans">
            업로드 파일 정합성 분석 대기열
          </span>

          {isLoading ? (
            <div className="h-[210px] border border-dashed border-apple-hairline flex flex-col items-center justify-center space-y-2 bg-apple-parchment/40 rounded-2xl" id="import-loading-state">
              <RefreshCw className="w-6 h-6 text-apple-ink animate-spin" />
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-apple-muted">사내 망 암호 해독 및 파싱 데이터 검사 중...</span>
            </div>
          ) : importedFile ? (
            <div className="border border-apple-hairline/60 overflow-hidden bg-white rounded-2xl shadow-sm" id="import-preview-box">
              {/* File Info */}
              <div className="bg-[#1d1d1f] text-white p-4 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-apple-blue" />
                  <span className="font-bold">{importedFile.name}</span>
                  <span className="text-slate-400 font-mono">({importedFile.size})</span>
                </div>
                <span className={`px-2.5 py-1 font-bold uppercase text-[9px] tracking-wider rounded border border-white/10 ${
                  importedFile.type === "CATIA" ? "bg-blue-950" : "bg-indigo-950"
                }`}>
                  {importedFile.type === "CATIA" ? "3D_CATIA" : "ERP_전산"}
                </span>
              </div>

              {/* Data Preview Sheet Grid */}
              <div className="max-h-[160px] overflow-y-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-apple-parchment border-b border-apple-hairline/80 text-apple-muted text-[9px] uppercase tracking-wider font-bold">
                      <th className="py-2 px-3">품목코드 (Part No.)</th>
                      <th className="py-2 px-3">식별품명</th>
                      <th className="py-2 px-3 text-center">수량</th>
                      <th className="py-2 px-3">{importedFile.type === "CATIA" ? "서브모듈" : "전산창고"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apple-hairline text-xs">
                    {importedFile.type === "CATIA" ? (
                      sampleData.CATIA.map((row, idx) => (
                        <tr key={idx} className="hover:bg-apple-parchment/30">
                          <td className="py-2 px-3 font-mono text-[10px] text-apple-muted">{row.num}</td>
                          <td className="py-2 px-3 font-bold text-apple-ink">{row.name}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-apple-ink">{row.qty} EA</td>
                          <td className="py-2 px-3 text-[10px] text-apple-muted uppercase">{row.type}</td>
                        </tr>
                      ))
                    ) : (
                      sampleData.ERP.map((row, idx) => (
                        <tr key={idx} className="hover:bg-apple-parchment/30">
                          <td className="py-2 px-3 font-mono text-[10px] text-apple-muted">{row.num}</td>
                          <td className="py-2 px-3 font-bold text-apple-ink">{row.name}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-apple-ink">{row.qty} EA</td>
                          <td className={`py-2 px-3 text-[11px] font-sans ${row.qty === 0 ? "text-rose-600 font-semibold italic" : "text-apple-muted"}`}>{row.loc}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Confirm Import Button */}
              <div className="p-4 bg-apple-parchment border-t border-apple-hairline/60 flex justify-end gap-2.5">
                <button
                  id="btn-cancel-import"
                  onClick={() => setImportedFile(null)}
                  className="px-4 py-2 border border-apple-hairline bg-white hover:bg-apple-parchment/60 text-xs font-semibold rounded-full cursor-pointer active-scale transition-colors"
                >
                  지우기
                </button>
                <button
                  id="btn-apply-import"
                  onClick={handleApplyImport}
                  className="px-5 py-2 bg-apple-blue hover:bg-apple-focus text-white text-xs font-bold rounded-full cursor-pointer active-scale flex items-center gap-1.5 shadow-sm transition-all"
                >
                  정합 마스터에 병합 적용 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[210px] border border-dashed border-apple-hairline flex flex-col items-center justify-center text-center p-6 text-apple-muted bg-apple-parchment/40 rounded-2xl" id="import-empty-state">
              <FileSpreadsheet className="w-8 h-8 text-apple-muted/60 mb-2" />
              <p className="text-xs font-bold text-apple-ink uppercase tracking-wider">업로드 완료된 자재 명세가 없습니다.</p>
              <p className="text-[10px] text-apple-muted mt-1 max-w-[250px] mx-auto leading-relaxed font-sans">
                좌측 수동 시뮬레이션 버튼을 누르면 실무 데이터 파싱 가상 엑셀이 로드되어 병합을 진단할 수 있습니다.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
