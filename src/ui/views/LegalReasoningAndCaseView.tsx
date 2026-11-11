import React, { useState, useMemo, useRef } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Sparkles,
  Printer,
  CheckCircle2,
  BookOpen,
  Briefcase,
  Gavel,
  FileSearch,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import type { LegalDocument } from '../../types/legal';
import type {
  CaseFactEvent,
  IRACPlusReasoningOutput,
  LegalCaseWorkspace,
  LegalReasoningMode,
} from '../../core/entities/legalDomain';
import { resolveProvisionAtDate } from '../../core/engines/pointInTimeResolver';
import type { PointInTimeResolutionResult } from '../../core/entities/legalDomain';
import { verifyCitationsBatch, verifySingleCitation } from '../../core/engines/citationVerifier';
import { buildDeterministicIRACBaseline } from '../../modules/legal-reasoning/legalReasoning.service';
import { invokeLegalReasoningApi } from '../../infrastructure/api/legalApiClient';
import {
  addFactToCase,
  createNewCaseWorkspace,
  loadCaseWorkspaces,
  saveCaseWorkspaces,
} from '../../modules/case-workspace/caseWorkspace.service';

export function escapeHtml(raw: unknown): string {
  const str = String(raw ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface LegalReasoningAndCaseViewProps {
  documents: LegalDocument[];
  onOpenDocumentInReader: (docId: string, articleNo?: string) => void;
}

const REASONING_MODE_META: Record<
  LegalReasoningMode,
  {
    label: string;
    subtitle: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  JUDICIAL_ANALYSIS: {
    label: '1. Phân tích Xét xử (Judicial Analysis)',
    subtitle: 'Đánh giá trung lập 2 chiều, đối trọng chứng cứ & hiệu lực thời điểm',
    badgeClass: 'bg-blue-900 text-amber-200 border-blue-700',
    icon: Gavel,
  },
  LEGAL_COUNSEL: {
    label: '2. Tư vấn Pháp chế (Legal Counsel)',
    subtitle: 'Bảo vệ quyền lợi Chủ đầu tư / Doanh nghiệp & phòng ngừa rủi ro hợp đồng',
    badgeClass: 'bg-emerald-900 text-emerald-100 border-emerald-700',
    icon: Briefcase,
  },
  LEGAL_AUDIT: {
    label: '3. Kiểm toán Tuân thủ (Legal Audit)',
    subtitle: 'Kiểm soát thanh quyết toán Kho bạc / KTNN & cảnh báo rủi ro xuất toán',
    badgeClass: 'bg-red-900 text-amber-100 border-red-700',
    icon: FileSearch,
  },
};

export const LegalReasoningAndCaseView: React.FC<LegalReasoningAndCaseViewProps> = ({
  documents,
  onOpenDocumentInReader,
}) => {
  const [cases, setCases] = useState<LegalCaseWorkspace[]>(() => loadCaseWorkspaces());
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    () => loadCaseWorkspaces()[0]?.id || ''
  );
  const [activeMode, setActiveMode] = useState<LegalReasoningMode>('LEGAL_AUDIT');

  const activeCase = useMemo(
    () => cases.find((c) => c.id === selectedCaseId) || cases[0] || null,
    [cases, selectedCaseId]
  );

  const [referenceDate, setReferenceDate] = useState<string>(
    activeCase?.primary_reference_date || '2026-08-15'
  );
  const [milestoneDate, setMilestoneDate] = useState<string>(
    activeCase?.milestone_initiation_date || '2026-03-01'
  );

  // Target provisions for Point-in-Time & IRAC+ analysis
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-lkt-88-2015');
  const [selectedArticleNo, setSelectedArticleNo] = useState<string>('Điều 3');
  const [selectedClauseNo, setSelectedClauseNo] = useState<string>('Khoản 2');

  // Citation Verifier quick test input
  const [testCiteDocNo, setTestCiteDocNo] = useState<string>('88/2015/QH13');
  const [testCiteArticle, setTestCiteArticle] = useState<string>('Khoản 2 Điều 3');

  // New Case inline form state
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [newCaseCode, setNewCaseCode] = useState('HS-2026-03');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseUnit, setNewCaseUnit] = useState('Ban Pháp chế & Kiểm toán Nội bộ ĐẠI SƠN');

  // New Fact inline state
  const [newFactDate, setNewFactDate] = useState('2026-08-20');
  const [newFactTitle, setNewFactTitle] = useState('');
  const [newFactDesc, setNewFactDesc] = useState('');

  // AI enrichment 4-state UI
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiEnrichedOutput, setAiEnrichedOutput] = useState<IRACPlusReasoningOutput | null>(null);

  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  const targetProvisions = useMemo(() => {
    const baseList = [
      {
        doc_id: selectedDocId,
        article_no: selectedArticleNo,
        clause_no: selectedClauseNo || undefined,
      },
    ];
    if (selectedDocId !== 'doc-lxd-135-2025') {
      baseList.push({
        doc_id: 'doc-lxd-135-2025',
        article_no: 'Điều 14',
        clause_no: 'Khoản 1',
      });
    }
    if (selectedDocId !== 'doc-ldd-31-2024') {
      baseList.push({
        doc_id: 'doc-ldd-31-2024',
        article_no: 'Điều 45',
        clause_no: undefined,
      });
    }
    return baseList;
  }, [selectedDocId, selectedArticleNo, selectedClauseNo]);

  // Deterministic IRAC+ Baseline (Always available, 100% verified against SSoT)
  const deterministicReasoning = useMemo(() => {
    if (!activeCase) return null;
    return buildDeterministicIRACBaseline({
      mode: activeMode,
      referenceDate,
      milestoneInitiationDate: milestoneDate || undefined,
      caseTitle: activeCase.title,
      facts: activeCase.facts,
      targetProvisions,
      corpus: documents,
    });
  }, [activeCase, activeMode, referenceDate, milestoneDate, targetProvisions, documents]);

  const displayedReasoning = aiEnrichedOutput || deterministicReasoning;

  // Live Point-in-Time Resolution for the primary selected provision (guarded by try/catch — REM-P1-06)
  const primaryPitResolution = useMemo<PointInTimeResolutionResult>(() => {
    const queryObj = {
      doc_id: selectedDocId,
      article_no: selectedArticleNo,
      clause_no: selectedClauseNo || undefined,
      reference_date: referenceDate,
      milestone_initiation_date: milestoneDate || undefined,
    };
    try {
      return resolveProvisionAtDate(queryObj, documents);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không tìm thấy điều khoản trong kho dữ liệu SSoT.';
      return {
        query: queryObj,
        doc_number: selectedDocId,
        doc_title: 'Không tìm thấy văn bản hoặc điều khoản tương ứng trong kho SSoT',
        article_no: selectedArticleNo,
        article_title: 'Chưa xác định',
        clause_no: selectedClauseNo || undefined,
        temporal_state: 'NOT_YET_EFFECTIVE',
        applicable_text: msg,
        authenticity_tier: 'VERIFIED_EXCERPT',
        completeness_meta: {
          loaded_articles_count: 0,
          total_articles_count: 0,
          completeness_percent: 0,
          is_full_text: false,
        },
        legal_audit_explanation: msg,
      };
    }
  }, [selectedDocId, selectedArticleNo, selectedClauseNo, referenceDate, milestoneDate, documents]);

  // Live Citation Verification result
  const liveCitationCheck = useMemo(() => {
    return verifySingleCitation(testCiteDocNo, testCiteArticle, documents);
  }, [testCiteDocNo, testCiteArticle, documents]);

  const selectedDocObj = useMemo(
    () => documents.find((d) => d.id === selectedDocId) || documents[0],
    [documents, selectedDocId]
  );

  const handleSelectCase = (c: LegalCaseWorkspace) => {
    setSelectedCaseId(c.id);
    setReferenceDate(c.primary_reference_date);
    setMilestoneDate(c.milestone_initiation_date || '');
    setAiEnrichedOutput(null);
    setAiError(null);
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim()) return;
    const created = createNewCaseWorkspace({
      caseCode: newCaseCode.trim() || `HS-${Date.now().toString().slice(-4)}`,
      title: newCaseTitle.trim(),
      clientOrProjectUnit: newCaseUnit.trim() || 'Đơn vị Nội bộ ĐẠI SƠN',
      primaryReferenceDate: referenceDate,
      milestoneInitiationDate: milestoneDate || undefined,
      defaultMode: activeMode,
    });
    const nextCases = [created, ...cases];
    setCases(nextCases);
    saveCaseWorkspaces(nextCases);
    setSelectedCaseId(created.id);
    setNewCaseTitle('');
    setShowNewCaseForm(false);
  };

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !newFactTitle.trim() || !newFactDesc.trim()) return;
    const fact: CaseFactEvent = {
      id: `fact-${Date.now()}`,
      event_date: newFactDate || referenceDate,
      event_title: newFactTitle.trim(),
      description: newFactDesc.trim(),
      related_doc_number: selectedDocObj?.doc_number || '88/2015/QH13',
      related_article_no: selectedArticleNo,
    };
    const updated = addFactToCase(activeCase, fact);
    const nextCases = cases.map((c) => (c.id === updated.id ? updated : c));
    setCases(nextCases);
    setNewFactTitle('');
    setNewFactDesc('');
  };

  const handleRunLiveAiReasoning = async () => {
    if (!activeCase || !deterministicReasoning) return;
    setIsAiRunning(true);
    setAiError(null);
    try {
      const aiRes = await invokeLegalReasoningApi({
        mode: activeMode,
        referenceDate,
        milestoneInitiationDate: milestoneDate || undefined,
        caseTitle: activeCase.title,
        facts: activeCase.facts,
        rulesContext: deterministicReasoning.step2_rules,
      });

      // Combine baseline rules with any additional rules proposed by AI, then run mandatory post-AI CitationVerifier (REM-P0-05)
      const combinedRulesRaw = [
        ...deterministicReasoning.step2_rules,
        ...(Array.isArray(aiRes.additional_rules)
          ? aiRes.additional_rules.map((r) => ({
              doc_number: r.doc_number,
              article_clause_ref: r.article_clause_ref,
              normative_summary: r.normative_summary,
              effective_status_at_fact_date:
                r.effective_status_at_fact_date || 'Đang hậu kiểm hiệu lực SSoT',
              verification_badge: 'UNVERIFIED_EXTERNAL' as const,
            }))
          : []),
      ];

      const postAiVerificationReport = verifyCitationsBatch(
        combinedRulesRaw.map((r) => ({
          doc_number: r.doc_number,
          article_clause_ref: r.article_clause_ref,
        })),
        documents
      );

      const verifiedStep2Rules = combinedRulesRaw.map((rule, idx) => {
        const verifiedItem = postAiVerificationReport.citations[idx];
        return {
          ...rule,
          verification_badge: verifiedItem?.verification_status || 'UNVERIFIED_EXTERNAL',
        };
      });

      const merged: IRACPlusReasoningOutput = {
        ...deterministicReasoning,
        created_at: new Date().toISOString(),
        step1_issue: {
          ...deterministicReasoning.step1_issue,
          core_legal_question:
            aiRes.core_legal_question || deterministicReasoning.step1_issue.core_legal_question,
          material_facts:
            Array.isArray(aiRes.sub_issues) && aiRes.sub_issues.length > 0
              ? aiRes.sub_issues
              : deterministicReasoning.step1_issue.material_facts,
        },
        step2_rules: verifiedStep2Rules,
        step3_interpretation: {
          ...deterministicReasoning.step3_interpretation,
          normative_elements:
            Array.isArray(aiRes.normative_elements) && aiRes.normative_elements.length > 0
              ? aiRes.normative_elements
              : deterministicReasoning.step3_interpretation.normative_elements,
        },
        step5_counterargument: {
          ...deterministicReasoning.step5_counterargument,
          inspector_or_opposing_view:
            Array.isArray(aiRes.counterarguments) && aiRes.counterarguments[0]
              ? aiRes.counterarguments.join(' | ')
              : deterministicReasoning.step5_counterargument.inspector_or_opposing_view,
          rebuttal_or_mitigation_conditions:
            Array.isArray(aiRes.rebuttal_or_mitigation_conditions) &&
            aiRes.rebuttal_or_mitigation_conditions.length > 0
              ? aiRes.rebuttal_or_mitigation_conditions
              : deterministicReasoning.step5_counterargument.rebuttal_or_mitigation_conditions,
        },
        step6_conclusion: {
          ...deterministicReasoning.step6_conclusion,
          definitive_conclusion:
            aiRes.definitive_conclusion ||
            deterministicReasoning.step6_conclusion.definitive_conclusion,
          actionable_recommendations:
            Array.isArray(aiRes.recommended_actions) && aiRes.recommended_actions.length > 0
              ? aiRes.recommended_actions
              : deterministicReasoning.step6_conclusion.actionable_recommendations,
        },
        citation_verification_report: postAiVerificationReport,
      };
      setAiEnrichedOutput(merged);
    } catch (err: unknown) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Không thể kết nối máy chủ AI. Đang hiển thị Kết quả Suy luận Tất định (Deterministic IRAC+ Baseline) từ kho SSoT.'
      );
    } finally {
      setIsAiRunning(false);
    }
  };

  const handlePrintEvidenceReport = () => {
    if (!displayedReasoning || !activeCase) return;
    const iframe = printIframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Báo cáo Pháp lý Đối chứng IRAC+ — ${escapeHtml(activeCase.case_code)}</title>
  <style>
    @page { size: A4 portrait; margin: 20mm 15mm 20mm 25mm; }
    body { font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.5; color: #111; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .header-table td { vertical-align: top; text-align: center; }
    h1 { font-size: 15pt; text-transform: uppercase; text-align: center; margin: 12px 0 4px; }
    h2 { font-size: 13pt; text-transform: uppercase; margin: 14px 0 6px; border-bottom: 1px solid #333; padding-bottom: 3px; }
    .meta-box { border: 1px solid #444; padding: 10px 12px; margin-bottom: 14px; font-size: 12pt; }
    .rule-item { margin-bottom: 10px; padding-left: 10px; border-left: 3px solid #222; }
    ul { margin: 4px 0 10px 20px; padding: 0; }
    li { margin-bottom: 4px; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width:45%;">
        <strong>HỆ SINH THÁI PHÁP LÝ ĐẠI SƠN</strong><br/>
        <strong>HỘI ĐỒNG KIỂM TOÁN &amp; SUY LUẬN PHÁP LÝ</strong><br/>
        <span>Số: ${escapeHtml(activeCase.case_code)}/BC-IRAC</span>
      </td>
      <td style="width:55%;">
        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
        <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
        <span>----------------------------</span>
      </td>
    </tr>
  </table>

  <h1>BÁO CÁO PHÂN TÍCH &amp; ĐỐI CHỨNG PHÁP LÝ 6 BƯỚC (IRAC+)</h1>
  <div class="meta-box">
    <div><strong>Hồ sơ vụ việc:</strong> ${escapeHtml(activeCase.case_code)} — ${escapeHtml(activeCase.title)}</div>
    <div><strong>Đơn vị / Dự án:</strong> ${escapeHtml(activeCase.client_or_unit)}</div>
    <div><strong>Chế độ suy luận:</strong> ${escapeHtml(REASONING_MODE_META[displayedReasoning.mode].label)}</div>
    <div><strong>Mốc thời gian áp dụng quy phạm (Point-in-Time):</strong> ${escapeHtml(displayedReasoning.reference_date)}</div>
    <div><strong>Chỉ số xác thực dẫn chiếu SSoT:</strong> ${escapeHtml(displayedReasoning.citation_verification_report.trust_score_percent)}% (${escapeHtml(displayedReasoning.citation_verification_report.verified_ssot_count)}/${escapeHtml(displayedReasoning.citation_verification_report.total_citations_detected)} quy phạm xác thực)</div>
  </div>

  <h2>BƯỚC 1. VẤN ĐỀ PHÁP LÝ TRỌNG TÂM (ISSUE)</h2>
  <p><strong>Câu hỏi pháp lý:</strong> ${escapeHtml(displayedReasoning.step1_issue.core_legal_question)}</p>
  <p><strong>Thẩm quyền &amp; Phạm vi:</strong> ${escapeHtml(displayedReasoning.step1_issue.jurisdiction_and_scope)}</p>
  <ul>
    ${displayedReasoning.step1_issue.material_facts.map((s: string) => `<li>${escapeHtml(s)}</li>`).join('')}
  </ul>

  <h2>BƯỚC 2. QUY PHẠM PHÁP LUẬT ÁP DỤNG TẠI THỜI ĐIỂM SỰ KIỆN (RULE — POINT-IN-TIME)</h2>
  ${displayedReasoning.step2_rules
    .map(
      (r) => `<div class="rule-item">
        <div><strong>${escapeHtml(r.doc_number)} — ${escapeHtml(r.article_clause_ref)}</strong> (Xác thực: <strong>${escapeHtml(r.verification_badge || 'VERIFIED_SSOT')}</strong>)</div>
        <div><em>Nội dung quy phạm áp dụng:</em> "${escapeHtml(r.normative_summary)}"</div>
        <div><em>Hiệu lực tại thời điểm sự kiện:</em> ${escapeHtml(r.effective_status_at_fact_date)}</div>
      </div>`
    )
    .join('')}

  <h2>BƯỚC 3. GIẢI THÍCH QUY PHẠM &amp; HIỆU LỰC CHUYỂN TIẾP (INTERPRETATION)</h2>
  <p>${escapeHtml(displayedReasoning.step3_interpretation.temporal_and_transitional_analysis)}</p>
  <ul>
    ${displayedReasoning.step3_interpretation.normative_elements.map((e: string) => `<li>${escapeHtml(e)}</li>`).join('')}
  </ul>

  <h2>BƯỚC 4. ÁP DỤNG VÀO SỰ KIỆN &amp; CHỨNG CỨ HỒ SƠ (APPLICATION)</h2>
  <ul>
    ${displayedReasoning.step4_application.fact_to_rule_mapping
      .map(
        (m) =>
          `<li><strong>[${escapeHtml(m.compliance_assessment)}] ${escapeHtml(m.fact_statement)}</strong> — Áp dụng ${escapeHtml(m.applied_rule_ref)}: ${escapeHtml(m.analysis)}</li>`
      )
      .join('')}
  </ul>

  <h2>BƯỚC 5. PHẢN BIỆN PHÁP LÝ &amp; ĐIỀU KIỆN MIỄN TRỪ (COUNTERARGUMENT)</h2>
  <p><strong>Quan điểm thanh tra / phản biện:</strong> ${escapeHtml(displayedReasoning.step5_counterargument.inspector_or_opposing_view)}</p>
  <ul>
    ${displayedReasoning.step5_counterargument.rebuttal_or_mitigation_conditions.map((r: string) => `<li><strong>Điều kiện bảo vệ / khắc phục:</strong> ${escapeHtml(r)}</li>`).join('')}
  </ul>

  <h2>BƯỚC 6. KẾT LUẬN &amp; KHUYẾN NGHỊ HÀNH ĐỘNG (CONCLUSION)</h2>
  <p><strong>Kết luận:</strong> ${escapeHtml(displayedReasoning.step6_conclusion.definitive_conclusion)}</p>
  <p><strong>Mức độ rủi ro còn lại:</strong> ${escapeHtml(displayedReasoning.step5_counterargument.residual_risk_level)}</p>
  <ul>
    ${displayedReasoning.step6_conclusion.actionable_recommendations.map((a: string) => `<li>${escapeHtml(a)}</li>`).join('')}
  </ul>
</body>
</html>`;

    doc.open();
    doc.write(html);
    doc.close();
    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 150);
  };

  return (
    <div className="space-y-5">
      <iframe
        ref={printIframeRef}
        title="Báo cáo Pháp lý Đối chứng IRAC+ A4"
        className="hidden"
      />

      {/* TOP ARCHITECTURE BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-[#152D42] via-[#1C3B57] to-[#152D42] text-white p-5 border border-[#C6A342]/60 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#C6A342] text-[#152D42] text-[11px] font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Legal Knowledge &amp; Reasoning Platform · Chuẩn 6 Bước IRAC+</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Trung tâm Suy luận Pháp lý 6 Bước (IRAC+), Hiệu lực Thời điểm (Point-in-Time) &amp; Hồ sơ Vụ việc
            </h2>
            <p className="text-xs text-stone-300 max-w-4xl">
              Chuỗi vận hành khép kín: <strong>Trusted Legal Data → Point-in-Time Resolver → Citation Verifier → 3-Mode IRAC+ Reasoning → Evidence-based Report</strong>. Mọi lập luận đều đối chứng 1–1 với kho SSoT, tuyệt đối không tự xác nhận dẫn chiếu ngoài kho.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRunLiveAiReasoning}
              disabled={isAiRunning}
              className="px-3.5 py-2 rounded-xl bg-[#C6A342] text-[#152D42] font-bold text-xs flex items-center gap-1.5 hover:bg-[#d8b553] transition cursor-pointer disabled:opacity-50"
            >
              {isAiRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isAiRunning ? 'Đang chạy AI IRAC+...' : 'Chạy Suy luận AI + Hậu kiểm SSoT'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintEvidenceReport}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#E9C96D]" />
              <span>In Báo cáo A4 (NĐ 30/2020)</span>
            </button>
          </div>
        </div>

        {/* 3 REASONING MODES SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/15">
          {(Object.keys(REASONING_MODE_META) as LegalReasoningMode[]).map((modeKey) => {
            const meta = REASONING_MODE_META[modeKey];
            const Icon = meta.icon;
            const isSelected = activeMode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => {
                  setActiveMode(modeKey);
                  setAiEnrichedOutput(null);
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-[#FBF5DF] text-[#152D42] border-[#C6A342] shadow-md'
                    : 'bg-white/5 text-stone-200 border-white/15 hover:bg-white/10'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isSelected ? 'bg-[#152D42] text-[#E9C96D]' : 'bg-white/10 text-amber-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{meta.label}</div>
                  <div
                    className={`text-[11px] leading-snug mt-0.5 ${
                      isSelected ? 'text-stone-700' : 'text-stone-300'
                    }`}
                  >
                    {meta.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN 12-COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (4 COLS): CASE WORKSPACE + POINT-IN-TIME RESOLVER + CITATION VERIFIER */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. HỒ SƠ VỤ VIỆC (CASE WORKSPACE) */}
          <div className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#152D42] dark:text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                  Hồ sơ Vụ việc (Case Workspace)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCaseForm((v) => !v)}
                className="px-2.5 py-1 rounded-lg bg-[#152D42] text-[#E9C96D] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Tạo Hồ sơ mới</span>
              </button>
            </div>

            {showNewCaseForm && (
              <form
                onSubmit={handleCreateCase}
                className="p-3 rounded-xl bg-[#FBF9F5] dark:bg-stone-900 border border-[#C6A342] space-y-2"
              >
                <div className="text-[11px] font-bold text-[#152D42] dark:text-amber-300">
                  Khởi tạo Hồ sơ Vụ việc / Dự án mới
                </div>
                <input
                  type="text"
                  value={newCaseCode}
                  onChange={(e) => setNewCaseCode(e.target.value)}
                  placeholder="Mã hồ sơ (VD: HS-2026-03)"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950"
                />
                <input
                  type="text"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="Tên vụ việc / Gói thầu cần thẩm định..."
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950"
                />
                <input
                  type="text"
                  value={newCaseUnit}
                  onChange={(e) => setNewCaseUnit(e.target.value)}
                  placeholder="Chủ đầu tư / Ban QLDA..."
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCaseForm(false)}
                    className="px-2.5 py-1 text-xs text-stone-600 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-[#152D42] text-[#E9C96D] text-xs font-bold cursor-pointer"
                  >
                    Lưu Hồ sơ
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {cases.map((c) => {
                const isSelected = activeCase?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCase(c)}
                    className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#FBF5DF] dark:bg-amber-950/30 border-[#C6A342] shadow-xs'
                        : 'bg-stone-50/70 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-code text-[11px] font-bold text-[#152D42] dark:text-amber-300">
                        {c.case_code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono-code">
                        Mốc sự kiện: {c.primary_reference_date}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-1">
                      {c.title}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {c.client_or_unit} · {c.facts.length} sự kiện · {c.evidences.length} chứng cứ SHA-256
                    </div>
                  </button>
                );
              })}
            </div>

            {/* TIMELINE FACTS & EVIDENCES IN ACTIVE CASE */}
            {activeCase && (
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Dòng thời gian Sự kiện &amp; Chứng cứ ({activeCase.facts.length})
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {activeCase.facts.map((f) => (
                    <div
                      key={f.id}
                      className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#152D42] dark:text-amber-300">
                          {f.event_title}
                        </span>
                        <span className="font-mono-code text-stone-500">{f.event_date}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add new Fact event */}
                <form onSubmit={handleAddFact} className="space-y-1.5 pt-2 border-t border-stone-200/60">
                  <div className="text-[10px] font-bold uppercase text-stone-400">
                    + Bổ sung Tình tiết / Sự kiện thực tế vào Hồ sơ
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="date"
                      value={newFactDate}
                      onChange={(e) => setNewFactDate(e.target.value)}
                      className="col-span-1 px-2 py-1 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950"
                    />
                    <input
                      type="text"
                      value={newFactTitle}
                      onChange={(e) => setNewFactTitle(e.target.value)}
                      placeholder="Tiêu đề sự kiện..."
                      className="col-span-2 px-2 py-1 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newFactDesc}
                      onChange={(e) => setNewFactDesc(e.target.value)}
                      placeholder="Mô tả chi tiết tình tiết / chứng cứ phát sinh..."
                      className="flex-1 px-2 py-1 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-[#152D42] text-[#E9C96D] text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      Thêm
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* 2. BỘ GIẢI HIỆU LỰC THEO THỜI ĐIỂM (POINT-IN-TIME RESOLVER P1-02) */}
          <div className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#152D42] dark:text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                Bộ giải Hiệu lực Thời điểm (Point-in-Time Resolver)
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Ngày phát sinh sự kiện
                </label>
                <input
                  type="date"
                  value={referenceDate}
                  onChange={(e) => {
                    setReferenceDate(e.target.value);
                    setAiEnrichedOutput(null);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-mono-code rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Ngày phê duyệt dự án (Chuyển tiếp)
                </label>
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => {
                    setMilestoneDate(e.target.value);
                    setAiEnrichedOutput(null);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-mono-code rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-900"
                />
              </div>
            </div>

            {/* Quick preset dates to demonstrate Point-in-Time switching */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedDocId('doc-lkt-88-2015');
                  setSelectedArticleNo('Điều 3');
                  setSelectedClauseNo('Khoản 2');
                  setReferenceDate('2024-06-15');
                  setAiEnrichedOutput(null);
                }}
                className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-semibold text-stone-700 dark:text-stone-300 hover:border-[#C6A342] border border-transparent cursor-pointer"
              >
                Mốc 15/06/2024 (Trước sửa đổi Luật Kế toán)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDocId('doc-lkt-88-2015');
                  setSelectedArticleNo('Điều 3');
                  setSelectedClauseNo('Khoản 2');
                  setReferenceDate('2025-06-15');
                  setAiEnrichedOutput(null);
                }}
                className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-semibold text-stone-700 dark:text-stone-300 hover:border-[#C6A342] border border-transparent cursor-pointer"
              >
                Mốc 15/06/2025 (Sau Luật 56/2024/QH15)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDocId('doc-lxd-135-2025');
                  setSelectedArticleNo('Điều 14');
                  setSelectedClauseNo('Khoản 1');
                  setReferenceDate('2026-08-15');
                  setMilestoneDate('2026-03-01');
                  setAiEnrichedOutput(null);
                }}
                className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-semibold text-stone-700 dark:text-stone-300 hover:border-[#C6A342] border border-transparent cursor-pointer"
              >
                Mốc Chuyển tiếp Luật Xây dựng 135/2025
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={selectedDocId}
                onChange={(e) => {
                  const newDoc = documents.find((d) => d.id === e.target.value);
                  setSelectedDocId(e.target.value);
                  if (newDoc?.articles[0]) {
                    setSelectedArticleNo(newDoc.articles[0].article_no);
                  }
                }}
                className="sm:col-span-2 px-2 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.doc_number} — {d.short_title || d.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedArticleNo}
                onChange={(e) => setSelectedArticleNo(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
              >
                {(selectedDocObj?.articles || []).map((a) => (
                  <option key={a.id} value={a.article_no}>
                    {a.article_no}
                  </option>
                ))}
              </select>
            </div>

            {/* Resolution result card */}
            <div className="p-3 rounded-xl bg-[#FBF9F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="font-mono-code text-xs font-bold text-[#152D42] dark:text-amber-300">
                  {primaryPitResolution.doc_number} · {primaryPitResolution.article_no}{' '}
                  {primaryPitResolution.clause_no || ''}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    primaryPitResolution.temporal_state === 'EFFECTIVE_ORIGINAL'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : primaryPitResolution.temporal_state === 'EFFECTIVE_AMENDED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : primaryPitResolution.temporal_state === 'TRANSITIONAL_APPLIED'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {primaryPitResolution.temporal_state}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>Giải thích phả hệ hiệu lực:</strong> {primaryPitResolution.legal_audit_explanation}
              </p>
              <div className="p-2.5 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-800 dark:text-stone-200 font-serif-legal leading-relaxed max-h-40 overflow-y-auto">
                {primaryPitResolution.applicable_text}
              </div>
              {primaryPitResolution.transitional_rule_applied && (
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200">
                  <strong>
                    Quy tắc chuyển tiếp ({primaryPitResolution.transitional_rule_applied.transition_article_ref}):
                  </strong>{' '}
                  {primaryPitResolution.transitional_rule_applied.resolution_rule}
                </div>
              )}
            </div>
          </div>

          {/* 3. BỘ KIỂM CHỨNG DẪN CHIẾU TẤT ĐỊNH (CITATION VERIFIER P1-03) */}
          <div className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                Kiểm chứng Dẫn chiếu SSoT (Citation Verifier)
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={testCiteDocNo}
                onChange={(e) => setTestCiteDocNo(e.target.value)}
                placeholder="Số hiệu (VD: 88/2015/QH13)"
                className="px-2.5 py-1.5 text-xs font-mono-code rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-900"
              />
              <input
                type="text"
                value={testCiteArticle}
                onChange={(e) => setTestCiteArticle(e.target.value)}
                placeholder="Điều khoản (VD: Điều 3)"
                className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-900"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTestCiteDocNo('88/2015/QH13');
                  setTestCiteArticle('Khoản 2 Điều 3');
                }}
                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold cursor-pointer"
              >
                Test Hợp lệ: 88/2015/QH13 · Điều 3
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestCiteDocNo('135/2025/QH15');
                  setTestCiteArticle('Điều 99');
                }}
                className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold cursor-pointer"
              >
                Test Chưa nạp: 135/2025/QH15 · Điều 99
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestCiteDocNo('999/2099/QH99');
                  setTestCiteArticle('Điều 1');
                }}
                className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 text-[10px] font-semibold cursor-pointer"
              >
                Test Ảo giác: 999/2099/QH99
              </button>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  {liveCitationCheck.raw_citation}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    liveCitationCheck.verification_status === 'VERIFIED_FULL_SSOT' ||
                    liveCitationCheck.verification_status === 'VERIFIED_EXCERPT_SSOT'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : liveCitationCheck.verification_status === 'DOC_FOUND_ARTICLE_UNLOADED'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {liveCitationCheck.verification_status}
                </span>
              </div>
              {liveCitationCheck.source_excerpt && (
                <p className="text-[11px] text-stone-600 dark:text-stone-300 italic line-clamp-2">
                  "{liveCitationCheck.source_excerpt}"
                </p>
              )}
              {liveCitationCheck.warning_note && (
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  ⚠ {liveCitationCheck.warning_note}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 COLS): 6-STEP IRAC+ LEGAL REASONING REPORT & EVIDENCE MATRIX */}
        <div className="lg:col-span-8 space-y-4">
          {aiError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{aiError}</span>
              </div>
              <button
                type="button"
                onClick={handleRunLiveAiReasoning}
                className="px-2.5 py-1 rounded bg-[#152D42] text-[#E9C96D] font-bold text-[11px] shrink-0 cursor-pointer"
              >
                Thử lại AI
              </button>
            </div>
          )}

          {displayedReasoning ? (
            <div className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-5">
              {/* Report Top Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#152D42] text-[#E9C96D] text-[10px] font-bold uppercase tracking-wider">
                      {REASONING_MODE_META[displayedReasoning.mode].label}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      Trust Score SSoT: {displayedReasoning.citation_verification_report.trust_score_percent}% (
                      {displayedReasoning.citation_verification_report.verified_ssot_count}/
                      {displayedReasoning.citation_verification_report.total_citations_detected} dẫn chiếu xác thực)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-mono-code">
                      {aiEnrichedOutput
                        ? 'Nguồn: AI Gemini + Hậu kiểm CitationVerifier'
                        : 'Nguồn: Bộ Suy luận Tất định IRAC+ (Deterministic SSoT)'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-1.5">
                    Hồ sơ: {activeCase?.case_code} — {activeCase?.title}
                  </h3>
                </div>

                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      displayedReasoning.step5_counterargument.residual_risk_level === 'RẤT CAO'
                        ? 'bg-red-600 text-white border-red-500'
                        : displayedReasoning.step5_counterargument.residual_risk_level === 'CAO'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-teal-700 text-white border-teal-500'
                    }`}
                  >
                    RỦI RO PHÁP LÝ / XUẤT TOÁN:{' '}
                    {displayedReasoning.step5_counterargument.residual_risk_level}
                  </span>
                </div>
              </div>

              {/* STEP 1: ISSUE */}
              <div className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                    BƯỚC 1 · XÁC ĐỊNH VẤN ĐỀ PHÁP LÝ (ISSUE)
                  </span>
                  <span className="text-[11px] font-mono-code text-stone-500">
                    Mốc sự kiện: {displayedReasoning.reference_date}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 leading-relaxed">
                  {displayedReasoning.step1_issue.core_legal_question}
                </p>
                <div className="text-[11px] text-stone-600 dark:text-stone-400">
                  <strong>Thẩm quyền &amp; Phạm vi:</strong>{' '}
                  {displayedReasoning.step1_issue.jurisdiction_and_scope}
                </div>
                <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside">
                  {displayedReasoning.step1_issue.material_facts.map((factText: string, i: number) => (
                    <li key={i}>{factText}</li>
                  ))}
                </ul>
              </div>

              {/* STEP 2: RULE (POINT-IN-TIME VERIFIED) */}
              <div className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                  BƯỚC 2 · QUY PHẠM PHÁP LUẬT ÁP DỤNG THEO THỜI ĐIỂM (RULE · POINT-IN-TIME RESOLVED)
                </div>
                <div className="space-y-2.5">
                  {displayedReasoning.step2_rules.map((r, idx) => {
                    const matchedDoc = documents.find(
                      (d) => d.doc_number.toLowerCase() === r.doc_number.toLowerCase()
                    );
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-code text-xs font-bold text-[#152D42] dark:text-amber-300">
                              {r.doc_number} · {r.article_clause_ref}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              {r.verification_badge || 'VERIFIED_SSOT'}
                            </span>
                          </div>
                          {matchedDoc && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenDocumentInReader(matchedDoc.id, r.article_clause_ref)
                              }
                              className="text-[11px] font-semibold text-[#286181] dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Mở trong Kho SSoT</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-stone-800 dark:text-stone-200 font-serif-legal leading-relaxed">
                          "{r.normative_summary}"
                        </p>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                          <strong>Trạng thái hiệu lực tại ngày sự kiện:</strong>{' '}
                          {r.effective_status_at_fact_date}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: INTERPRETATION */}
              <div className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                  BƯỚC 3 · GIẢI THÍCH QUY PHẠM &amp; PHÂN TÍCH CHUYỂN TIẾP (INTERPRETATION)
                </div>
                <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                  {displayedReasoning.step3_interpretation.temporal_and_transitional_analysis}
                </p>
                <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800 space-y-1">
                  {displayedReasoning.step3_interpretation.normative_elements.map(
                    (sc: string, i: number) => (
                      <div
                        key={i}
                        className="text-xs text-stone-800 dark:text-stone-200 flex items-start gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#152D42] dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{sc}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* STEP 4: APPLICATION (FACT-TO-RULE MAPPING) */}
              <div className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                  BƯỚC 4 · ÁP DỤNG QUY PHẠM VÀO SỰ KIỆN &amp; CHỨNG CỨ HỒ SƠ (APPLICATION)
                </div>
                <div className="space-y-2">
                  {displayedReasoning.step4_application.fact_to_rule_mapping.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          {m.fact_statement}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            m.compliance_assessment === 'VI PHẠM / RỦI RO XUẤT TOÁN'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : m.compliance_assessment === 'PHÙ HỢP'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {m.compliance_assessment}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono-code text-[#286181] dark:text-amber-400">
                        Quy phạm đối chiếu: {m.applied_rule_ref}
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                        {m.analysis}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 5: COUNTERARGUMENT & REBUTTAL */}
              <div className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                  BƯỚC 5 · PHẢN BIỆN PHÁP LÝ &amp; ĐIỀU KIỆN BẢO VỆ / KHẮC PHỤC (COUNTERARGUMENT)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
                    <div className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                      Quan điểm Thanh tra / Kiểm toán / Phản biện đối lập:
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {displayedReasoning.step5_counterargument.inspector_or_opposing_view}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
                    <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      Điều kiện bác bỏ / Hồ sơ khắc phục hợp lệ:
                    </div>
                    <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside">
                      {displayedReasoning.step5_counterargument.rebuttal_or_mitigation_conditions.map(
                        (r: string, i: number) => (
                          <li key={i}>{r}</li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* STEP 6: CONCLUSION & ACTIONABLE RECOMMENDATIONS */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#FBF5DF] to-[#F5E9C4] dark:from-amber-950/40 dark:to-stone-900 border-2 border-[#C6A342] space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                  BƯỚC 6 · KẾT LUẬN PHÁP LÝ &amp; KHUYẾN NGHỊ HÀNH ĐỘNG (CONCLUSION)
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#152D42] dark:text-stone-100 leading-relaxed">
                  {displayedReasoning.step6_conclusion.definitive_conclusion}
                </p>
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-stone-800 dark:text-stone-200">
                    Danh mục hồ sơ &amp; hành động bắt buộc:
                  </div>
                  {displayedReasoning.step6_conclusion.actionable_recommendations.map(
                    (act: string, i: number) => (
                      <div
                        key={i}
                        className="text-xs text-stone-800 dark:text-stone-200 flex items-start gap-2"
                      >
                        <span className="font-mono-code font-bold text-[#152D42] dark:text-amber-300">
                          0{i + 1}.
                        </span>
                        <span>{act}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
