import React, { useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Scale,
} from 'lucide-react';
import type {
  CaseFactMilestone,
  EvidenceBasedReportSnapshot,
  LegalDocument,
  McpSessionAuditRecord,
} from '../types/legal';
import type { IRACPlusReasoningOutput } from '../core/entities/legalDomain';
import { buildLegalReasoningTrace } from '../modules/legal-reasoning/legalReasoning.service';
import { verifyCitationAgainstCorpus } from '../core/engines/citationVerifier';
import { computeStringSha256Sync } from '../infrastructure/crypto/sha256';
import { computeDocumentCompleteness } from '../core/engines/corpusIntegrityValidator';

interface EvidenceBasedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  asOfDate?: string;
  documents: LegalDocument[];
  auditRecords?: McpSessionAuditRecord[];
  caseFacts?: CaseFactMilestone[];
  reasoningOutputs?: IRACPlusReasoningOutput[];
}

export function buildEvidenceBasedReportSnapshot(params: {
  projectId: string;
  projectName: string;
  asOfLegalDate: string;
  documents: LegalDocument[];
  auditRecords?: McpSessionAuditRecord[];
  caseFacts?: CaseFactMilestone[];
  reasoningOutputs?: IRACPlusReasoningOutput[];
}): EvidenceBasedReportSnapshot {
  const {
    projectId,
    projectName,
    asOfLegalDate,
    documents,
    auditRecords = [],
    caseFacts = [],
    reasoningOutputs = [],
  } = params;

  const defaultFacts: CaseFactMilestone[] =
    caseFacts.length > 0
      ? caseFacts
      : [
          {
            id: 'cf-milestone-01',
            event_date: '2025-11-15',
            event_type: 'PROJECT_APPROVAL',
            description:
              'Quyết định phê duyệt Dự án Đầu tư Xây dựng và Kế hoạch lựa chọn nhà thầu tổng thể.',
            evidence_document_ref: 'QĐ-2025-1188/QĐ-HĐQT',
            evidence_sha256: computeStringSha256Sync('QĐ-2025-1188/QĐ-HĐQT|2025-11-15'),
          },
          {
            id: 'cf-milestone-02',
            event_date: asOfLegalDate,
            event_type: 'PAYMENT_SETTLEMENT',
            description:
              'Hồ sơ nghiệm thu khối lượng hoàn thành và Đề nghị thanh toán IPC đợt 03.',
            evidence_document_ref: 'IPC-03-2026/BB-NT',
            evidence_sha256: computeStringSha256Sync(`IPC-03-2026/BB-NT|${asOfLegalDate}`),
          },
        ];

  const citationTargets =
    auditRecords.length > 0
      ? auditRecords.map((r) => ({
          raw: `${r.articleNo} (${r.docNumber})`,
          docNumber: r.docNumber,
          articleNo: r.articleNo,
        }))
      : documents.slice(0, 4).map((d) => ({
          raw: `${d.articles[0]?.article_no || 'Điều 1'} (${d.doc_number})`,
          docNumber: d.doc_number,
          articleNo: d.articles[0]?.article_no || 'Điều 1',
        }));

  const verifiedCitations = citationTargets.map((t) =>
    verifyCitationAgainstCorpus(t.raw, t.docNumber, t.articleNo, documents)
  );

  const reasoningTraces = reasoningOutputs.map((out) =>
    buildLegalReasoningTrace(out, documents)
  );

  const unverifiedWarnings: string[] = [];
  for (const c of verifiedCitations) {
    const matchedDoc = c.matched_doc_id
      ? documents.find((d) => d.id === c.matched_doc_id)
      : undefined;
    if (matchedDoc) {
      const comp = computeDocumentCompleteness(matchedDoc);
      if (!comp.is_full_text) {
        unverifiedWarnings.push(
          `Văn bản ${matchedDoc.doc_number} hiện nạp trích lược (${comp.loaded_articles_count}/${comp.total_articles_count} Điều — ${comp.completeness_percent}%). Bắt buộc đối chiếu toàn văn trên Công báo nước CHXHCN Việt Nam khi ký phát hành văn bản hành chính.`
        );
      }
      if (
        matchedDoc.authenticity_tier === 'INTERNAL_SYNTHESIS' ||
        matchedDoc.authenticity_tier === 'INTERNAL_WORKING_SYNTHESIS'
      ) {
        unverifiedWarnings.push(
          `Bản ghi ${matchedDoc.doc_number} thuộc phân vùng Bản Tổng hợp Nội bộ (INTERNAL_SYNTHESIS), không phải Văn bản Hợp nhất chính thức (OFFICIAL_VBHN).`
        );
      }
    } else {
      unverifiedWarnings.push(
        `Trích dẫn "${c.raw_citation_text}" chưa được nạp trong kho SSoT địa phương (${c.status}).`
      );
    }
  }

  if (unverifiedWarnings.length === 0) {
    unverifiedWarnings.push(
      'Tất cả trích dẫn trong báo cáo đã được kiểm chứng khớp với kho SSoT. Khuyến nghị lưu kèm bản sao Công báo có chữ ký số khi lưu trữ hồ sơ quyết toán.'
    );
  }

  const generatedAt = new Date().toISOString();
  const payloadForHash = JSON.stringify({
    projectId,
    projectName,
    asOfLegalDate,
    case_facts: defaultFacts,
    verified_citations: verifiedCitations,
    reasoning_traces: reasoningTraces,
    unverified_or_missing_warnings: unverifiedWarnings,
  });

  const reportIntegritySha256 = computeStringSha256Sync(payloadForHash);

  return {
    report_id: `REP-SSOT-${Date.now()}`,
    project_id: projectId,
    project_name: projectName,
    generated_at: generatedAt,
    generated_by: 'Hệ thống Kiểm toán & Đối soát Pháp lý ĐẠI SƠN (Deterministic SSoT Engine)',
    as_of_legal_date: asOfLegalDate,
    case_facts: defaultFacts,
    verified_citations: verifiedCitations,
    reasoning_traces: reasoningTraces,
    unverified_or_missing_warnings: unverifiedWarnings,
    report_integrity_sha256: reportIntegritySha256,
  };
}

export const EvidenceBasedReportModal: React.FC<EvidenceBasedReportModalProps> = ({
  isOpen,
  onClose,
  projectId = 'proj-daison-2026-01',
  projectName = 'Dự án Đầu tư Xây dựng Tổ hợp ĐẠI SƠN (Hồ sơ Kiểm toán Pháp lý SSoT)',
  asOfDate = '2026-06-15',
  documents,
  auditRecords = [],
  caseFacts = [],
  reasoningOutputs = [],
}) => {
  const snapshot = useMemo(
    () =>
      buildEvidenceBasedReportSnapshot({
        projectId,
        projectName,
        asOfLegalDate: asOfDate,
        documents,
        auditRecords,
        caseFacts,
        reasoningOutputs,
      }),
    [projectId, projectName, asOfDate, documents, auditRecords, caseFacts, reasoningOutputs]
  );

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snapshot.report_id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#FFFDF9] dark:bg-[#171614] text-stone-900 dark:text-stone-100 rounded-2xl border-2 border-[#C6A342] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Header */}
        <div className="px-6 py-4 bg-[#152D42] text-white flex flex-wrap items-center justify-between gap-3 border-b border-[#C6A342]/60 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E9C96D]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#E9C96D]">
                BÁO CÁO PHÁP LÝ CÓ DẪN CHỨNG XÁC THỰC (EVIDENCE-BASED LEGAL REPORT)
              </span>
            </div>
            <div className="text-[11px] font-mono-code text-stone-300">
              Mã báo cáo: {snapshot.report_id} · SHA-256: {snapshot.report_integrity_sha256.slice(0, 24)}…
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-3 py-1.5 rounded-lg bg-[#C6A342] text-[#152D42] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Snapshot JSON</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Report Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-sm">
          {/* Header Metadata */}
          <div className="p-4 rounded-xl bg-[#FBF5DF]/60 dark:bg-stone-900 border border-[#C6A342]/60 space-y-1.5">
            <div className="font-bold text-base text-[#152D42] dark:text-amber-300">
              {snapshot.project_name}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-stone-700 dark:text-stone-300">
              <div>
                <b>Thời điểm pháp lý khóa hiệu lực (asOfDate):</b>{' '}
                <span className="font-mono-code font-bold">{snapshot.as_of_legal_date}</span>
              </div>
              <div>
                <b>Thời gian kết xuất:</b>{' '}
                <span className="font-mono-code">{snapshot.generated_at}</span>
              </div>
              <div className="sm:col-span-2">
                <b>Mã băm toàn vẹn báo cáo (FIPS 180-4 SHA-256):</b>{' '}
                <code className="font-mono-code text-[11px] bg-white dark:bg-black px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 break-all">
                  {snapshot.report_integrity_sha256}
                </code>
              </div>
            </div>
          </div>

          {/* Bảng 1: Danh mục Quy phạm Pháp luật đã xác thực trong SSoT */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#C6A342]" />
              <span>1. Danh mục Quy phạm Pháp luật & Độ phủ SSoT (Verified Legal Citations)</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300">
                  <tr>
                    <th className="p-2.5 border-b border-stone-200 dark:border-stone-800">Trích dẫn</th>
                    <th className="p-2.5 border-b border-stone-200 dark:border-stone-800">Trạng thái Kiểm chứng</th>
                    <th className="p-2.5 border-b border-stone-200 dark:border-stone-800">Độ phủ SSoT</th>
                    <th className="p-2.5 border-b border-stone-200 dark:border-stone-800">Ghi chú Xác thực</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {snapshot.verified_citations.map((cit, i) => {
                    const docObj = cit.matched_doc_id
                      ? documents.find((d) => d.id === cit.matched_doc_id)
                      : undefined;
                    const compLabel = docObj?.completeness?.completeness_ratio_label ||
                      (docObj?.completeness_meta
                        ? `${docObj.completeness_meta.loaded_articles_count}/${docObj.completeness_meta.total_articles_count} Điều (${docObj.completeness_meta.completeness_percent}%)`
                        : 'Ngoài kho SSoT');
                    return (
                      <tr key={i} className="bg-white dark:bg-[#1C1B18]">
                        <td className="p-2.5 font-mono-code font-bold text-[#152D42] dark:text-amber-300">
                          {cit.raw_citation_text}
                        </td>
                        <td className="p-2.5 font-mono-code font-semibold">
                          {cit.status}
                        </td>
                        <td className="p-2.5 font-mono-code">{compLabel}</td>
                        <td className="p-2.5 text-stone-600 dark:text-stone-400">
                          {cit.verification_note}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng 2: Mốc Sự kiện Thực tế & Mã băm Chứng cứ SHA-256 */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-[#C6A342]" />
              <span>2. Dòng thời gian Sự kiện Thực tế & Mã băm Hồ sơ Chứng cứ (Case Fact Milestones)</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300">
                  <tr>
                    <th className="p-2.5 border-b border-stone-200 dark:border-stone-800">Ngày sự kiện</th>
                    <th className="p-2.5 border-b border-stone-200 dark:border-stone-800">Loại mốc</th>
                    <th className="p-2.5 border-b border-stone-200 dark:border-stone-800">Diễn giải & Hồ sơ</th>
                    <th className="p-2.5 border-b border-stone-200 dark:border-stone-800">SHA-256 Chứng cứ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {snapshot.case_facts.map((fact) => (
                    <tr key={fact.id} className="bg-white dark:bg-[#1C1B18]">
                      <td className="p-2.5 font-mono-code font-bold">{fact.event_date}</td>
                      <td className="p-2.5 font-mono-code">{fact.event_type}</td>
                      <td className="p-2.5">
                        <div>{fact.description}</div>
                        {fact.evidence_document_ref && (
                          <div className="text-[11px] font-mono-code text-stone-500">
                            Số hiệu chứng cứ: {fact.evidence_document_ref}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 font-mono-code text-[11px] text-emerald-800 dark:text-emerald-300 break-all">
                        {fact.evidence_sha256 || 'Chưa đính kèm'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mục 3: Công khai Giới hạn Dữ liệu & Cảnh báo Trích lược (Epistemic Humility Section) */}
          <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200 text-xs sm:text-sm uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>3. Công khai Giới hạn Tri thức & Độ phủ Văn bản (Epistemic Humility Disclosure)</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
              {snapshot.unverified_or_missing_warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
