import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Scale,
  Upload,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  BookOpen,
  ArrowUpRight,
  History,
  Loader2,
  Bot,
  FileScan,
  FileText,
} from 'lucide-react';
import {
  AttachedStepFile,
  ComplianceAuditTrailEntry,
  MasterComplianceStep,
  MicroAgentVerdict,
  ProjectStepRecord,
  ProjectStepStatus,
  RiskFlagMetadata,
  StandardizedRiskFlagCode,
} from '../types/compliance';
import { LegalDocument } from '../types/legal';
import { extractDocumentViaGeminiMultimodal } from '../utils/ocrClient';
import { computeStringSha256Sync } from '../infrastructure/crypto/sha256';

interface DualDrawerInspectorProps {
  step: MasterComplianceStep;
  record: ProjectStepRecord;
  verdict: MicroAgentVerdict;
  riskFlagsMeta: Record<StandardizedRiskFlagCode, RiskFlagMetadata>;
  documents: LegalDocument[];
  auditTrails: ComplianceAuditTrailEntry[];
  isAiAuditing: boolean;
  onToggleChecklistDeliverable: (stepCode: string, itemText: string) => void;
  onAttachFileWithOcr: (stepCode: string, fileInfo: AttachedStepFile) => void;
  onUpdateStepStatus: (stepCode: string, nextStatus: ProjectStepStatus) => void;
  onRunAiMultiAgentAudit: (step: MasterComplianceStep) => void;
  onOpenInThreeColumnLibrary: (docId: string, articleId?: string) => void;
  onOpenReaderModal: (docId: string, articleId?: string) => void;
  onAskAquaWithContext: (question: string, clauseContext: string) => void;
}

export const DualDrawerInspector: React.FC<DualDrawerInspectorProps> = React.memo(({
  step,
  record,
  verdict,
  riskFlagsMeta,
  documents,
  auditTrails,
  isAiAuditing,
  onToggleChecklistDeliverable,
  onAttachFileWithOcr,
  onUpdateStepStatus,
  onRunAiMultiAgentAudit,
  onOpenInThreeColumnLibrary,
  onOpenReaderModal,
  onAskAquaWithContext,
}) => {
  // Real Multimodal OCR & Variation Simulation state for LegalCrossCheckAgent & AuditDeductionAgent
  const [ocrAuthorityInput, setOcrAuthorityInput] = useState<string>(
    step.inspection_body
  );
  const [ocrDocNoInput, setOcrDocNoInput] = useState<string>('168/QĐ-UBND');
  const [simulateOverrun, setSimulateOverrun] = useState<boolean>(false);
  const [simulateAddendum, setSimulateAddendum] = useState<boolean>(true);
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [ocrStatusBanner, setOcrStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 15 * 1024 * 1024) {
      setOcrStatusBanner({
        type: 'error',
        text: 'Tệp vượt quá giới hạn 15 MB. Vui lòng chọn tệp PDF, DOCX hoặc ảnh scan nhỏ hơn 15 MB.',
      });
      return;
    }

    setIsOcrProcessing(true);
    setOcrStatusBanner({
      type: 'info',
      text: `Đang chạy Gemini Multimodal OCR & bóc tách cấu trúc hành chính cho tệp "${file.name}"...`,
    });

    try {
      const { sha256Hash, ocrResult } = await extractDocumentViaGeminiMultimodal({
        file,
        stepCode: step.step_code,
        stepName: step.step_name,
        expectedAuthority: step.inspection_body,
        mode: 'stage_gate_dossier',
      });

      const resolvedAuthority =
        ocrResult.extracted_authority?.trim() ||
        ocrAuthorityInput.trim() ||
        step.inspection_body;
      const resolvedDocNo =
        ocrResult.extracted_doc_no?.trim() ||
        ocrDocNoInput.trim() ||
        'Văn bản đính kèm';

      setOcrAuthorityInput(resolvedAuthority);
      setOcrDocNoInput(resolvedDocNo);
      setSimulateOverrun(Boolean(ocrResult.has_variation_overrun));
      setSimulateAddendum(Boolean(ocrResult.has_approved_addendum));

      const newFile: AttachedStepFile = {
        filename: file.name,
        url: `#ocr-${Date.now()}`,
        hash: sha256Hash,
        uploaded_at: new Date().toLocaleString('vi-VN'),
        mime_type: file.type || 'application/octet-stream',
        extracted_authority: resolvedAuthority,
        extracted_doc_no: resolvedDocNo,
        extracted_doc_title: ocrResult.extracted_doc_title,
        extracted_issue_date: ocrResult.extracted_issue_date,
        extracted_signer: ocrResult.extracted_signer,
        total_investment_amount: ocrResult.total_investment_amount,
        capital_source: ocrResult.capital_source,
        cited_legal_bases: Array.isArray(ocrResult.cited_legal_bases)
          ? ocrResult.cited_legal_bases
          : [],
        ocr_full_text_excerpt: ocrResult.ocr_full_text
          ? ocrResult.ocr_full_text.slice(0, 600)
          : '',
        ocr_confidence_note: ocrResult.ocr_confidence_note,
        has_variation_overrun: Boolean(ocrResult.has_variation_overrun),
        has_approved_addendum: Boolean(ocrResult.has_approved_addendum),
      };

      onAttachFileWithOcr(step.step_code, newFile);
      setOcrStatusBanner({
        type: 'success',
        text: `Đã bóc tách OCR thành công "${file.name}" — Số hiệu: ${resolvedDocNo} · Cơ quan ký: ${resolvedAuthority}`,
      });
    } catch (err: unknown) {
      const fallbackMsg =
        err instanceof Error ? err.message : 'Lỗi kết nối dịch vụ OCR.';
      const fallbackFile: AttachedStepFile = {
        filename: file.name,
        url: `#uploaded-${Date.now()}`,
        hash: `sha256:${computeStringSha256Sync(`${file.name}|${file.size}|${file.lastModified}`).slice(0, 16)}`,
        uploaded_at: new Date().toLocaleString('vi-VN'),
        mime_type: file.type || 'application/octet-stream',
        extracted_authority: ocrAuthorityInput.trim() || step.inspection_body,
        extracted_doc_no: ocrDocNoInput.trim() || 'Văn bản đính kèm',
        has_variation_overrun: simulateOverrun,
        has_approved_addendum: simulateAddendum,
      };
      onAttachFileWithOcr(step.step_code, fallbackFile);
      setOcrStatusBanner({
        type: 'error',
        text: `${fallbackMsg} Đã áp dụng thông số OCR dự phòng cho "${file.name}".`,
      });
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleSimulateQuickOcrScenario = (
    scenario: 'valid_authority' | 'wrong_authority' | 'unapproved_overrun'
  ) => {
    setOcrStatusBanner(null);
    if (scenario === 'valid_authority') {
      const fname = `Ho_so_Phe_duyet_${step.step_code.replace(/\./g, '_')}_Hop_le.pdf`;
      onAttachFileWithOcr(step.step_code, {
        filename: fname,
        url: '#valid-ocr',
        hash: `sha256:${computeStringSha256Sync(`${fname}|289/QĐ-BXD-2026|${step.inspection_body}`).slice(0, 16)}`,
        uploaded_at: new Date().toLocaleString('vi-VN'),
        mime_type: 'application/pdf',
        extracted_authority: step.inspection_body,
        extracted_doc_no: '289/QĐ-BXD-2026',
        extracted_doc_title: `Quyết định phê duyệt hồ sơ bước ${step.step_code} (${step.step_name})`,
        extracted_issue_date: '2026-11-08',
        extracted_signer: `Thủ trưởng ${step.inspection_body}`,
        total_investment_amount: '1.450.000.000.000 VNĐ',
        capital_source: 'Vốn đầu tư công ngân sách Trung ương giai đoạn 2026–2030',
        cited_legal_bases: ['135/2025/QH15', '15/2021/NĐ-CP', '217/2026/NĐ-CP'],
        ocr_confidence_note:
          'Thể thức văn bản hợp lệ theo Nghị định 30/2020/NĐ-CP; đúng thẩm quyền phê duyệt.',
        has_variation_overrun: false,
        has_approved_addendum: true,
      });
    } else if (scenario === 'wrong_authority') {
      const fname = `To_trinh_Sai_Tham_Quyen_${step.step_code.replace(/\./g, '_')}.pdf`;
      onAttachFileWithOcr(step.step_code, {
        filename: fname,
        url: '#wrong-authority',
        hash: `sha256:${computeStringSha256Sync(`${fname}|14/QĐ-KTHT|wrong_authority`).slice(0, 16)}`,
        uploaded_at: new Date().toLocaleString('vi-VN'),
        mime_type: 'application/pdf',
        extracted_authority:
          'Phòng Kinh tế - Hạ tầng cấp huyện (Sai thẩm quyền phê duyệt dự án Nhóm A/B)',
        extracted_doc_no: '14/QĐ-KTHT',
        extracted_doc_title: `Quyết định phê duyệt vượt cấp bước ${step.step_code}`,
        extracted_issue_date: '2026-11-05',
        extracted_signer: 'Trưởng phòng Kinh tế - Hạ tầng',
        total_investment_amount: '820.000.000.000 VNĐ',
        capital_source: 'Vốn ngân sách tỉnh (Chưa có Nghị quyết HĐND phân bổ)',
        cited_legal_bases: ['13/2023/NĐ-CP', '135/2025/QH15'],
        ocr_confidence_note:
          'Cảnh báo: Cơ quan ký duyệt trên dấu đỏ không khớp thẩm quyền luật định và có viện dẫn văn bản hết hiệu lực (13/2023/NĐ-CP).',
        has_variation_overrun: false,
        has_approved_addendum: true,
      });
    } else {
      const fname = `Bien_ban_Phat_sinh_Vuot_HD_Khong_Phu_Luc_${step.step_code.replace(
        /\./g,
        '_'
      )}.docx`;
      onAttachFileWithOcr(step.step_code, {
        filename: fname,
        url: '#overrun-no-addendum',
        hash: `sha256:${computeStringSha256Sync(`${fname}|77/BB-PSKL|overrun`).slice(0, 16)}`,
        uploaded_at: new Date().toLocaleString('vi-VN'),
        mime_type:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extracted_authority: step.inspection_body,
        extracted_doc_no: '77/BB-PSKL',
        extracted_doc_title: `Biên bản nghiệm thu khối lượng phát sinh ngoài hợp đồng bước ${step.step_code}`,
        extracted_issue_date: '2026-11-07',
        extracted_signer: 'Giám đốc Ban QLDA Đầu tư Xây dựng',
        total_investment_amount: 'Phát sinh tăng +18,5 tỷ VNĐ ngoài hợp đồng gốc',
        capital_source: 'Chi vượt dự toán gói thầu khi chưa ký Phụ lục hợp đồng',
        cited_legal_bases: ['22/2023/QH15', '217/2026/NĐ-CP'],
        ocr_confidence_note:
          'Cảnh báo xuất toán: Phát sinh khối lượng ngoài hợp đồng nhưng chưa có Phụ lục hợp đồng và chấp thuận của Người quyết định đầu tư.',
        has_variation_overrun: true,
        has_approved_addendum: false,
      });
    }
  };

  // Pre-compute O(1) Document & Article Lookup Maps (eliminates nested documents.find & articles.find inside render)
  const { docByIdOrNumberMap, articleByDocAndKeyMap } = useMemo(() => {
    const dMap = new Map<string, LegalDocument>();
    const aMap = new Map<string, LegalDocument['articles'][number]>();
    documents.forEach((d) => {
      dMap.set(d.id, d);
      dMap.set(d.doc_number.trim().toUpperCase(), d);
      d.articles.forEach((a) => {
        aMap.set(`${d.id}:${a.id}`, a);
        aMap.set(`${d.id}:${a.article_no.trim().toLowerCase()}`, a);
      });
    });
    return { docByIdOrNumberMap: dMap, articleByDocAndKeyMap: aMap };
  }, [documents]);

  // Pre-compute O(1) Completed Deliverables Set
  const completedDeliverablesSet = useMemo(
    () => new Set(record.completed_deliverables),
    [record.completed_deliverables]
  );

  // Memoize filtered audit trails for the active step
  const stepTrails = useMemo(
    () => auditTrails.filter((t) => t.step_code === step.step_code),
    [auditTrails, step.step_code]
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* =====================================================================
          PANE TRÁI (6 COLS): DANH MỤC HỒ SƠ ĐẦU RA, CHECKLIST SỐ, TẢI FILE OCR & 03 MICRO-AGENTS
      ===================================================================== */}
      <div className="xl:col-span-6 bg-white dark:bg-[#1A1917] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 dark:border-[#2E2C28] pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#152D42] text-[#E9C96D] font-mono-code text-xs font-bold">
                {step.step_code} · {step.gate_code}
              </span>
              <span className="text-xs font-semibold text-[#286181] dark:text-amber-400">
                {step.dossier_group}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mt-1">
              Trái · Hồ Sơ Đầu Ra, Checklist Biểu Mẫu Số & 03 Micro-Agents
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onRunAiMultiAgentAudit(step)}
            disabled={isAiAuditing}
            className="px-3 py-1.5 rounded-xl bg-[#152D42] hover:bg-[#1E3A54] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isAiAuditing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E9C96D]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#E9C96D]" />
            )}
            <span>Chạy 3 Micro-Agents (MCP)</span>
          </button>
        </div>

        {/* Status Transition Control with Gatekeeper Lock Enforcement */}
        <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-[#2E2C28] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#152D42] dark:text-stone-200">
              Chuyển trạng thái tuân thủ bước {step.step_code}:
            </span>
            {!verdict.gatekeeper.passed && (
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Gatekeeper khóa PASSED (Chờ {verdict.gatekeeper.blockedByGates.join(', ')})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              ['PENDING', 'IN_REVIEW', 'PASSED', 'FLAGGED', 'BLOCKED', 'WAIVED'] as ProjectStepStatus[]
            ).map((st) => {
              const isCurrent = record.status === st;
              const isLockedPassed = st === 'PASSED' && !verdict.gatekeeper.passed;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => onUpdateStepStatus(step.step_code, st)}
                  disabled={isLockedPassed}
                  title={
                    isLockedPassed
                      ? verdict.gatekeeper.message
                      : `Chuyển trạng thái bước ${step.step_code} sang ${st}`
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    isLockedPassed
                      ? 'opacity-45 cursor-not-allowed bg-stone-100 dark:bg-stone-900 border-stone-300 text-stone-400'
                      : isCurrent
                      ? 'bg-[#152D42] text-[#E9C96D] border-[#C6A342] shadow-2xs cursor-pointer'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#C6A342] cursor-pointer'
                  }`}
                >
                  {isLockedPassed && <Lock className="w-2.5 h-2.5 inline mr-1" />}
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. Danh mục Hồ sơ đầu ra & Checklist Biểu mẫu số */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-[#C6A342]" />
              <span>
                1. Checklist Biểu Mẫu Số & Hồ Sơ Đầu Ra ({record.completed_deliverables.length}/
                {step.digital_checklist_template.length})
              </span>
            </h4>
            <div className="flex gap-1">
              {step.deliverables.map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FBF5DF] dark:bg-stone-800 text-[#152D42] dark:text-amber-300 border border-[#E5D5A7] dark:border-stone-700"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            {step.digital_checklist_template.map((itemText, idx) => {
              const isChecked = completedDeliverablesSet.has(itemText);
              return (
                <label
                  key={idx}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    isChecked
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-white dark:bg-[#141413] border-stone-200 dark:border-stone-800 hover:border-[#C6A342]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() =>
                      onToggleChecklistDeliverable(step.step_code, itemText)
                    }
                    className="mt-0.5 rounded border-stone-300 text-[#152D42] focus:ring-[#C6A342]"
                  />
                  <span
                    className={
                      isChecked
                        ? 'text-emerald-900 dark:text-emerald-200 font-medium'
                        : 'text-stone-800 dark:text-stone-200'
                    }
                  >
                    {itemText}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 2. Tải tệp đính kèm PDF/DOCX/Scan & Trích xuất Metadata OCR Đa phương thức */}
        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
              <FileScan className="w-3.5 h-3.5 text-[#C6A342]" />
              <span>
                2. Đính Kèm Hồ Sơ PDF / DOCX / Scan & Bóc Tách OCR (Gemini Vision)
              </span>
            </h4>
            <label
              className={`px-3 py-1.5 rounded-lg bg-[#C6A342] hover:bg-[#b59336] text-[#152D42] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                isOcrProcessing ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {isOcrProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>
                {isOcrProcessing
                  ? 'Đang OCR PDF/DOCX...'
                  : 'Tải PDF / DOCX / Ảnh Scan'}
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={handleFileInputChange}
                disabled={isOcrProcessing}
                className="hidden"
              />
            </label>
          </div>

          {ocrStatusBanner && (
            <div
              className={`p-2.5 rounded-lg border text-[11px] font-medium flex items-center gap-2 ${
                ocrStatusBanner.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : ocrStatusBanner.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                  : 'bg-[#FFFDF7] dark:bg-stone-900 border-[#C6A342] text-[#152D42] dark:text-amber-200'
              }`}
            >
              {ocrStatusBanner.type === 'info' && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C6A342] shrink-0" />
              )}
              <span>{ocrStatusBanner.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                Cơ quan ký duyệt trích xuất (OCR):
              </label>
              <input
                type="text"
                value={ocrAuthorityInput}
                onChange={(e) => setOcrAuthorityInput(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1917] text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                Số hiệu văn bản OCR:
              </label>
              <input
                type="text"
                value={ocrDocNoInput}
                onChange={(e) => setOcrDocNoInput(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1917] text-xs font-mono-code"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateOverrun}
                onChange={(e) => setSimulateOverrun(e.target.checked)}
              />
              <span>Có phát sinh vượt hợp đồng</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateAddendum}
                onChange={(e) => setSimulateAddendum(e.target.checked)}
              />
              <span>Đã có Phụ lục HĐ & chấp thuận Người QĐĐT</span>
            </label>
          </div>

          {/* 3 One-click Test Scenarios for the 3 Agents */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-200 dark:border-stone-800">
            <span className="text-[10px] font-bold text-stone-500 mr-1">
              Kịch bản kiểm thử nhanh:
            </span>
            <button
              type="button"
              onClick={() => handleSimulateQuickOcrScenario('valid_authority')}
              className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold cursor-pointer"
            >
              ✓ Hồ sơ đúng thẩm quyền
            </button>
            <button
              type="button"
              onClick={() => handleSimulateQuickOcrScenario('wrong_authority')}
              className="px-2 py-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold cursor-pointer"
            >
              ⚠ Ký sai thẩm quyền (Bật RISK_AUTHORITY_CAPITAL)
            </button>
            <button
              type="button"
              onClick={() => handleSimulateQuickOcrScenario('unapproved_overrun')}
              className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-bold cursor-pointer"
            >
              ⚠ Vượt HĐ không phụ lục (Bật RISK_CONTRACT_OVERRUN)
            </button>
          </div>

          {/* Attached Files List with Multimodal OCR Metadata & O(1) SSoT Legal Basis Verification */}
          {record.attached_files.length > 0 && (
            <div className="space-y-2 pt-1">
              {record.attached_files.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white dark:bg-[#1A1917] border border-stone-200 dark:border-stone-800 text-[11px] space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <strong className="text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#C6A342] shrink-0" />
                        <span>{f.filename}</span>
                      </strong>
                      {f.extracted_doc_title && (
                        <div className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 mt-0.5">
                          {f.extracted_doc_title}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono-code text-stone-400">
                      {f.uploaded_at}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-stone-600 dark:text-stone-400 bg-[#FBF9F5] dark:bg-[#141413] p-2 rounded-lg border border-stone-200/70 dark:border-stone-800">
                    <div>
                      Cơ quan ký duyệt OCR: <b className="text-stone-900 dark:text-stone-100">{f.extracted_authority}</b>
                    </div>
                    <div>
                      Số hiệu OCR:{' '}
                      <code className="font-mono-code font-bold text-[#152D42] dark:text-amber-300">
                        {f.extracted_doc_no}
                      </code>
                    </div>
                    {f.extracted_signer && (
                      <div>
                        Người ký: <b>{f.extracted_signer}</b>
                      </div>
                    )}
                    {f.extracted_issue_date && (
                      <div>
                        Ngày ban hành: <code className="font-mono-code">{f.extracted_issue_date}</code>
                      </div>
                    )}
                    {f.total_investment_amount &&
                      f.total_investment_amount !== 'Không đề cập' && (
                        <div>
                          Giá trị / TMĐT: <b className="text-emerald-700 dark:text-emerald-400">{f.total_investment_amount}</b>
                        </div>
                      )}
                    {f.capital_source && f.capital_source !== 'Không đề cập' && (
                      <div>
                        Nguồn vốn: <b>{f.capital_source}</b>
                      </div>
                    )}
                    <div className="sm:col-span-2 text-[9px] text-stone-400 font-mono-code">
                      Toàn vẹn SHA-256: {f.hash}
                    </div>
                  </div>

                  {/* SSoT Cross-Check of Cited Legal Bases in Uploaded Dossier */}
                  {Array.isArray(f.cited_legal_bases) &&
                    f.cited_legal_bases.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          Đối soát Căn cứ Pháp lý Viện dẫn trong Hồ sơ với Kho SSoT:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {f.cited_legal_bases.map((citedNo) => {
                            const normalizedNo = citedNo.trim().toUpperCase();
                            const ssotDoc = docByIdOrNumberMap.get(normalizedNo);
                            const isExpired = ssotDoc?.status === 'HET_HIEU_LUC';
                            const replacementDoc =
                              ssotDoc?.replaced_by_doc_id
                                ? docByIdOrNumberMap.get(ssotDoc.replaced_by_doc_id)
                                : undefined;

                            if (ssotDoc && isExpired) {
                              return (
                                <button
                                  key={citedNo}
                                  type="button"
                                  onClick={() =>
                                    onOpenInThreeColumnLibrary(
                                      replacementDoc ? replacementDoc.id : ssotDoc.id
                                    )
                                  }
                                  className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  title={`Văn bản ${citedNo} đã hết hiệu lực! Nhấp để mở văn bản thay thế trong Thư viện 3 Cột`}
                                >
                                  <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                                  <span>
                                    {citedNo} (HẾT HIỆU LỰC
                                    {ssotDoc.replaced_by_label
                                      ? ` → Thay bởi ${ssotDoc.replaced_by_label}`
                                      : ''}
                                    )
                                  </span>
                                </button>
                              );
                            }

                            if (ssotDoc) {
                              return (
                                <button
                                  key={citedNo}
                                  type="button"
                                  onClick={() => onOpenInThreeColumnLibrary(ssotDoc.id)}
                                  className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                  title="Mở văn bản căn cứ này trong Thư viện 3 Cột"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{citedNo} (SSoT Hợp lệ)</span>
                                </button>
                              );
                            }

                            return (
                              <span
                                key={citedNo}
                                className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-mono-code"
                              >
                                {citedNo}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {f.ocr_confidence_note && (
                    <div className="text-[10px] italic text-stone-600 dark:text-stone-400 border-l-2 border-[#C6A342] pl-2">
                      {f.ocr_confidence_note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Kết quả Thẩm định Tự động từ 03 Micro-Agents (Gatekeeper, LegalCrossCheck, AuditDeduction) */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-[#C6A342]" />
            <span>3. Phán Quyết 03 Micro-Agents (Multi-Agent MCP Verdict)</span>
          </h4>

          {/* Agent 1: GatekeeperAgent */}
          <div
            className={`p-3 rounded-xl border text-xs ${
              verdict.gatekeeper.passed
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-800'
            }`}
          >
            <div className="font-bold flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                {verdict.gatekeeper.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                )}
                <span>Agent 01 · GatekeeperAgent (Kiểm soát Gate tiên quyết)</span>
              </span>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-white/80 dark:bg-stone-900">
                {verdict.gatekeeper.passed ? 'OPEN' : 'LOCKED'}
              </span>
            </div>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              {verdict.gatekeeper.message}
            </p>
          </div>

          {/* Agent 2: LegalCrossCheckAgent */}
          <div
            className={`p-3 rounded-xl border text-xs ${
              verdict.legalCrossCheck.passed
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
            }`}
          >
            <div className="font-bold flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                {verdict.legalCrossCheck.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                )}
                <span>Agent 02 · LegalCrossCheckAgent (Đối soát thẩm quyền ban hành)</span>
              </span>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-white/80 dark:bg-stone-900">
                {verdict.legalCrossCheck.passed ? 'VERIFIED' : 'RISK_AUTHORITY_CAPITAL'}
              </span>
            </div>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              {verdict.legalCrossCheck.message}
            </p>
          </div>

          {/* Agent 3: AuditDeductionAgent */}
          <div
            className={`p-3 rounded-xl border text-xs ${
              verdict.auditDeduction.passed
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
            }`}
          >
            <div className="font-bold flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                {verdict.auditDeduction.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                )}
                <span>Agent 03 · AuditDeductionAgent (Kiểm soát phát sinh & Phụ lục HĐ)</span>
              </span>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-white/80 dark:bg-stone-900">
                {verdict.auditDeduction.passed ? 'SAFE' : 'OVERRUN_FLAGGED'}
              </span>
            </div>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              {verdict.auditDeduction.message}
            </p>
          </div>

          {/* Gemini Executive Summary if triggered */}
          {record.ai_audit_verdict?.geminiExecutiveSummary && (
            <div className="p-3.5 rounded-xl bg-[#152D42] text-white text-xs space-y-1.5">
              <div className="text-[#E9C96D] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kết luận Tổng hợp từ Gemini MCP Engine:</span>
              </div>
              <p className="whitespace-pre-line text-stone-200 leading-relaxed">
                {record.ai_audit_verdict.geminiExecutiveSummary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          PANE PHẢI (6 COLS): ĐỐI CHIẾU ĐIỀU KHOẢN PHÁP LÝ TRỰC TIẾP TỪ CSDL LEXVIET & AUDIT TRAIL
      ===================================================================== */}
      <div className="xl:col-span-6 bg-white dark:bg-[#1A1917] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-5 shadow-xs space-y-4">
        <div className="border-b border-stone-200 dark:border-[#2E2C28] pb-3.5">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#C6A342]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#B59745]">
              ĐỐI CHIẾU TRỰC TIẾP CSDL PHÁP LUẬT LEXVIET · ĐẠI SƠN SSoT
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mt-1">
            Phải · Điều Khoản Pháp Lý Nền Tảng & Nhật Ký Audit Trail Bất Biến
          </h3>
        </div>

        {/* Active Risk Flags Detailed Cards */}
        {record.active_risk_flags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Cờ Đỏ Rủi Ro Đang Kích Hoạt Trên Bước {step.step_code}</span>
            </h4>
            {record.active_risk_flags.map((flagCode) => {
              const rf = riskFlagsMeta[flagCode];
              return (
                <div
                  key={flagCode}
                  className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs space-y-1"
                >
                  <div className="font-bold text-red-800 dark:text-red-200 flex items-center justify-between">
                    <span>
                      #{rf.index} · {rf.code}: {rf.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white">
                      {rf.severity}
                    </span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300">{rf.description}</p>
                  <p className="text-red-700 dark:text-red-300 font-semibold">
                    Hệ quả kiểm toán: {rf.auditConsequence}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Extracted Legal Clauses from LexViet SSoT Corpus */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
            Căn Cứ Điều Khoản Trích Xuất Trực Tiếp Từ Kho Văn Bản LexViet ({step.legal_references.length})
          </h4>

          {step.legal_references.map((ref, idx) => {
            const matchedDoc =
              (ref.docId ? docByIdOrNumberMap.get(ref.docId) : undefined) ||
              docByIdOrNumberMap.get(ref.docNumber.trim().toUpperCase());
            const matchedArticle = matchedDoc
              ? (ref.articleId
                  ? articleByDocAndKeyMap.get(`${matchedDoc.id}:${ref.articleId}`)
                  : undefined) ||
                articleByDocAndKeyMap.get(
                  `${matchedDoc.id}:${ref.article.trim().toLowerCase()}`
                )
              : undefined;

            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#C6A342]/60 bg-[#FFFDF7] dark:bg-[#1E1D19] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-[#152D42] text-[#E9C96D] font-mono-code text-xs font-bold mr-2">
                      {ref.docNumber}
                    </span>
                    <strong className="text-xs sm:text-sm text-[#152D42] dark:text-stone-100">
                      {ref.law} — {ref.article}
                    </strong>
                  </div>

                  {matchedDoc && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenInThreeColumnLibrary(
                            matchedDoc.id,
                            matchedArticle?.id
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#152D42] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Mở điều khoản này trực tiếp trong Giao diện Tra cứu 3 Cột"
                      >
                        <span>Mở ở 3 Cột</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenReaderModal(matchedDoc.id, matchedArticle?.id)
                        }
                        className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Toàn văn</span>
                      </button>
                    </div>
                  )}
                </div>

                {matchedArticle ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#286181] dark:text-amber-400">
                      {matchedArticle.article_no}. {matchedArticle.article_title}
                    </div>
                    <div className="text-xs text-stone-800 dark:text-stone-200 whitespace-pre-line bg-white dark:bg-[#141413] p-3 rounded-lg border border-stone-200 dark:border-stone-800 leading-relaxed">
                      {matchedArticle.content}
                    </div>
                    {matchedArticle.amendment_note && (
                      <div className="p-2.5 rounded-lg bg-[#FBF5DF] dark:bg-amber-950/30 border-l-4 border-[#C6A342] text-[11px] text-stone-800 dark:text-amber-200">
                        {matchedArticle.amendment_note}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed bg-white dark:bg-[#141413] p-3 rounded-lg border border-stone-200 dark:border-stone-800">
                    {ref.excerpt}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onAskAquaWithContext(
                        `Phân tích điều kiện tuân thủ cho bước ${step.step_code} (${step.step_name}) theo ${ref.article} ${ref.law} (${ref.docNumber})`,
                        matchedArticle ? matchedArticle.content : ref.excerpt
                      )
                    }
                    className="text-[11px] font-semibold text-[#7A5F14] dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Hỏi Trợ lý AQUA về điều khoản này</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Immutable Audit Trail (`compliance_audit_trails`) */}
        <div className="pt-3 border-t border-stone-200 dark:border-[#2E2C28] space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#C6A342]" />
              <span>
                Nhật Ký Kiểm Toán Bất Biến (Immutable Audit Trail · {stepTrails.length} bản ghi)
              </span>
            </h4>
            <span className="text-[10px] font-mono-code text-emerald-700 dark:text-emerald-400">
              RLS + Trigger Append-Only
            </span>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {stepTrails.length === 0 ? (
              <div className="text-[11px] text-stone-500 italic p-2">
                Chưa có biến động trạng thái mới trên bước {step.step_code} trong phiên này.
              </div>
            ) : (
              stepTrails.map((trail) => (
                <div
                  key={trail.id}
                  className="p-2 rounded-lg bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-stone-800 text-[11px] flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-mono-code font-bold text-[#152D42] dark:text-amber-300 mr-1.5">
                      [{trail.action}]
                    </span>
                    <span className="text-stone-700 dark:text-stone-300">
                      Bởi: <b>{trail.actor_id}</b>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-code text-stone-400 shrink-0">
                    {trail.created_at}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

