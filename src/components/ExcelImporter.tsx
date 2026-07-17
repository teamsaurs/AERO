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
    <div className="bg-white border border-[#D1D1CD] p-6 space-y-6 rounded-none" id="excel-importer-view">
      <div className="border-b border-[#D1D1CD] pb-4 space-y-1.5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1.5">
          <FileSpreadsheet className="w-5 h-5 text-[#1A1A1A]" />
          ERP/PLM & CATIA 외부 자재 데이터 병합 시스템 (Step 1)
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-serif italic">
          서로 다른 시스템인 CATIA 3D 도면 추출 원시자재 명세와 ERP 전산 재고 마스터 엑셀을 업로드하여 <br />
          Sync-BOM 실시간 정합 테이블과 통합 병합(Merge)합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Drag/Drop simulation card */}
        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">
            전산 보고서 드래그 앤 드롭 업로드
          </span>

          <div
            id="drag-and-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border border-dashed p-8 text-center flex flex-col items-center justify-center space-y-3 transition-all cursor-pointer rounded-none ${
              dragActive 
                ? "border-[#1A1A1A] bg-[#E9E9E5]/40" 
                : "border-[#D1D1CD] hover:border-[#1A1A1A] bg-[#F4F4F2]/30 hover:bg-[#F4F4F2]/50"
            }`}
          >
            <Upload className="w-8 h-8 text-[#1A1A1A]" />
            <div>
              <p className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">엑셀(.xlsx) 또는 CSV 파일을 여기로 끌어놓으세요</p>
              <p className="text-[10px] text-[#666666] mt-1 font-mono uppercase">MAX SIZE: 20MB / SECURE TUNNELLING ENABLED</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                id="btn-import-catia-sample"
                onClick={() => triggerMockImport("CATIA")}
                className="px-3.5 py-2 bg-white border border-[#D1D1CD] text-[#1A1A1A] hover:border-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer rounded-none"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" /> 3D CATIA 덤프
              </button>
              <button
                id="btn-import-erp-sample"
                onClick={() => triggerMockImport("ERP")}
                className="px-3.5 py-2 bg-white border border-[#D1D1CD] text-[#1A1A1A] hover:border-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer rounded-none"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" /> ERP 자재 보고서
              </button>
            </div>
          </div>

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-950 text-xs flex items-center gap-2 animate-fade-in rounded-none" id="import-success-toast">
              <CheckCircle className="w-5 h-5 text-green-700" />
              <div>
                <p className="font-bold">데이터 병합 및 매핑 완료!</p>
                <p className="text-green-800 mt-0.5">외부 보고서 구조체에서 HW로 시작되는 품번을 매핑 완료하고 불일치 항목을 식별했습니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Preview column */}
        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">
            업로드 파일 정합성 분석 대기열
          </span>

          {isLoading ? (
            <div className="h-[210px] border border-[#D1D1CD] flex flex-col items-center justify-center space-y-2 bg-[#F4F4F2]/30 rounded-none" id="import-loading-state">
              <RefreshCw className="w-6 h-6 text-[#1A1A1A] animate-spin" />
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-600">사내 망 암호 해독 및 파싱 데이터 검사 중...</span>
            </div>
          ) : importedFile ? (
            <div className="border border-[#D1D1CD] overflow-hidden bg-white rounded-none" id="import-preview-box">
              {/* File Info */}
              <div className="bg-[#1A1A1A] text-white p-3.5 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-white" />
                  <span className="font-bold">{importedFile.name}</span>
                  <span className="text-[#888888] font-mono">({importedFile.size})</span>
                </div>
                <span className={`px-2 py-0.5 font-bold uppercase text-[9px] tracking-wider border border-white/20 ${
                  importedFile.type === "CATIA" ? "bg-blue-900" : "bg-purple-900"
                }`}>
                  {importedFile.type === "CATIA" ? "3D_CATIA" : "ERP_전산"}
                </span>
              </div>

              {/* Data Preview Sheet Grid */}
              <div className="max-h-[160px] overflow-y-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#E9E9E5] border-b border-[#D1D1CD] text-[#555555] text-[9px] uppercase tracking-wider font-bold">
                      <th className="py-2 px-3">품목코드 (Part No.)</th>
                      <th className="py-2 px-3">식별품명</th>
                      <th className="py-2 px-3 text-center">수량</th>
                      <th className="py-2 px-3">{importedFile.type === "CATIA" ? "서브모듈" : "전산창고"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1D1CD] text-xs">
                    {importedFile.type === "CATIA" ? (
                      sampleData.CATIA.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F4F4F2]/30">
                          <td className="py-2 px-3 font-mono text-[10px] text-[#555555]">{row.num}</td>
                          <td className="py-2 px-3 font-bold text-[#1A1A1A]">{row.name}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-[#1A1A1A]">{row.qty} EA</td>
                          <td className="py-2 px-3 text-[10px] text-[#666666] uppercase">{row.type}</td>
                        </tr>
                      ))
                    ) : (
                      sampleData.ERP.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F4F4F2]/30">
                          <td className="py-2 px-3 font-mono text-[10px] text-[#555555]">{row.num}</td>
                          <td className="py-2 px-3 font-bold text-[#1A1A1A]">{row.name}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-[#1A1A1A]">{row.qty} EA</td>
                          <td className={`py-2 px-3 text-[11px] font-serif ${row.qty === 0 ? "text-red-700 font-bold italic" : "text-[#555555]"}`}>{row.loc}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Confirm Import Button */}
              <div className="p-3 bg-[#E9E9E5] border-t border-[#D1D1CD] flex justify-end gap-2">
                <button
                  id="btn-cancel-import"
                  onClick={() => setImportedFile(null)}
                  className="px-3.5 py-1.5 border border-[#D1D1CD] bg-white hover:bg-[#F4F4F2] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] transition-colors rounded-none cursor-pointer"
                >
                  지우기
                </button>
                <button
                  id="btn-apply-import"
                  onClick={handleApplyImport}
                  className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all rounded-none cursor-pointer"
                >
                  정합 마스터에 병합 적용 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[210px] border border-dashed border-[#D1D1CD] flex flex-col items-center justify-center text-center p-6 text-[#666666] bg-[#F4F4F2]/30 rounded-none" id="import-empty-state">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">업로드 완료된 자재 명세가 없습니다.</p>
              <p className="text-[10px] text-[#666666] mt-1 max-w-[250px] mx-auto leading-relaxed font-serif italic">
                좌측 수동 시뮬레이션 버튼을 누르면 실무 데이터 파싱 가상 엑셀이 로드되어 병합을 진단할 수 있습니다.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
