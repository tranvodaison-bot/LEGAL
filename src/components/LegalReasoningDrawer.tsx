import React, { useMemo, useState } from 'react';
import {
  X,
  Scale,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { LegalArticle, LegalDocument } from '../types/legal';
import type {
  CaseFactEvent,
  IRACPlusReasoningOutput,
  LegalReasoningMode,
} from '../core/entities/legalDomain';
import {
  buildDeterministicIRACBaseline,
  detectOutOfCorpusDomain,
} from '../modules/legal-reasoning/legalReasoning.service';
import { invokeLegalReasoningApi } from '../infrastructure/api/legalApiClient';
import { verifySingleCitation } from '../core/engines/citationVerifier';

interface LegalReasoningDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: LegalDocument | null;
  article: LegalArticle | null;
  allDocuments: LegalDocument[];
  initialAsOfDate?: string;
  onOpenEvidenceReport?: (reasoningOutput: IRACPlusReasoningOutput) => void;
}

export const LegalReasoningDrawer: React.FC<LegalReasoningDrawerProps> = ({
  isOpen,
  onClose,
  document: doc,
  article,
  allDocuments,
  initialAsOfDate = '2026-06-15',
  onOpenEvidenceReport,
}) => {
  const [mode, setMode] = useState<LegalReasoningMode>('LEGAL_AUDIT');
  const [asOfDate, setAsOfDate] = useState<string>(initialAsOfDate);
  const [milestoneDate, setMilestoneDate] = useState<string>('2025-11-15');
  const [caseQuestion, setCaseQuestion] = useState<string>('');
  const [factDescription, setFactDescription] = useState<string>(
    'Hồ sơ đề nghị nghiệm thu và thanh toán khối lượng hoàn thành đợt 03 của dự án đầu tư xây dựng.'
  );
  const [evidenceCode, setEvidenceCode] = useState<string>('HS-NT-2026-03');
  const [aiOutput, setAiOutput] = useState<IRACPlusReasoningOutput | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const effectiveCaseTitle =
    caseQuestion.trim() ||
    (doc && article
      ? `Thẩm định áp dụng ${article.article_no} (${article.article_title}) — Văn bản ${doc.doc_number}`
      : 'Thẩm định tình huống pháp lý theo kho SSoT');

  const syntheticFacts: CaseFactEvent[] = useMemo(
    () => [
      {
        id: 'fact-drawer-1',
        event_date: asOfDate,
        event_title: effectiveCaseTitle,
        description: factDescription,
        evidence_code: evidenceCode.trim() || undefined,
        related_doc_number: doc?.doc_number,
        related_article_no: article?.article_no,
      },
    ],
    [asOfDate, effectiveCaseTitle, factDescription, evidenceCode, doc, article]
  );

  const deterministicOutput = useMemo(() => {
    if (!doc || !article) return null;
    return buildDeterministicIRACBaseline({
      mode,
      referenceDate: asOfDate,
      milestoneInitiationDate: milestoneDate,
      caseTitle: effectiveCaseTitle,
      facts: syntheticFacts,
      targetProvisions: [
        {
          doc_id: doc.id,
          article_no: article.article_no,
        },
      ],
      corpus: allDocuments,
    });
  }, [
    doc,
    article,
    mode,
    asOfDate,
    milestoneDate,
    effectiveCaseTitle,
    syntheticFacts,
    allDocuments,
  ]);

  if (!isOpen || !doc || !article) return null;

  const activeOutput = aiOutput || deterministicOutput;

  const handleInvokeAiReasoning = async () => {
    if (!deterministicOutput) return;
    const outOfDomain = detectOutOfCorpusDomain(
      `${effectiveCaseTitle} ${factDescription}`
    );
    if (outOfDomain) {
      setAiOutput(null);
      setAiError(
        `[ABSTAINED_INSUFFICIENT_SSOT]: Câu hỏi thuộc lĩnh vực "${outOfDomain}" nằm ngoài kho SSoT hiện tại. Hệ thống khóa cuộc gọi AI tự do để ngăn ngừa ảo giác pháp lý.`
      );
      return;
    }

    setIsLoadingAi(true);
    setAiError(null);
    try {
      const parsed = await invokeLegalReasoningApi({
        mode,
        referenceDate: asOfDate,
        milestoneInitiationDate: milestoneDate,
        caseTitle: effectiveCaseTitle,
        facts: syntheticFacts,
        rulesContext: deterministicOutput.step2_rules,
      });

      const verifiedStep2Rules = deterministicOutput.step2_rules.map((r) => {
        const v = verifySingleCitation(
          r.doc_number || '',
          r.article_clause_ref || '',
          allDocuments
        );
        return {
          ...r,
          verification_badge: v.verification_status,
        };
      });

      setAiOutput({
        ...deterministicOutput,
        step1_issue: {
          ...deterministicOutput.step1_issue,
          core_legal_question:
            parsed.core_legal_question ||
            deterministicOutput.step1_issue.core_legal_question,
        },
        step2_rules: verifiedStep2Rules,
        step3_interpretation: {
          ...deterministicOutput.step3_interpretation,
          normative_elements:
            Array.isArray(parsed.normative_elements) &&
            parsed.normative_elements.length > 0
              ? parsed.normative_elements
              : deterministicOutput.step3_interpretation.normative_elements,
        },
        step5_counterargument: {
          ...deterministicOutput.step5_counterargument,
          rebuttal_or_mitigation_conditions:
            Array.isArray(parsed.rebuttal_or_mitigation_conditions) &&
            parsed.rebuttal_or_mitigation_conditions.length > 0
              ? parsed.rebuttal_or_mitigation_conditions
              : deterministicOutput.step5_counterargument
                  .rebuttal_or_mitigation_conditions,
        },
        step6_conclusion: {
          ...deterministicOutput.step6_conclusion,
          definitive_conclusion:
            parsed.definitive_conclusion ||
            deterministicOutput.step6_conclusion.definitive_conclusion,
          actionable_recommendations:
            Array.isArray(parsed.recommended_actions) &&
            parsed.recommended_actions.length > 0
              ? parsed.recommended_actions
              : deterministicOutput.step6_conclusion.actionable_recommendations,
        },
      });
    } catch (err: unknown) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Không thể kết nối máy chủ AI Reasoning. Đang hiển thị kết quả suy luận tất định 6 bước từ kho SSoT.'
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#FBF9F5] dark:bg-[#151412] border-l border-[#C6A342]/70 h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#152D42] text-white flex items-start justify-between gap-3 border-b border-[#C6A342]/50 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#C6A342] text-[#152D42] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                <span>6-Step IRAC+ Legal Reasoning Drawer</span>
              </span>
              <span className="font-mono-code text-xs text-[#E9C96D] font-bold">
                {doc.doc_number} · {article.article_no}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Suy Luận Pháp Lý Đa Chế Độ & Kiểm Chứng Point-in-Time — {article.article_no}.{' '}
              {article.article_title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode & Point-in-Time Toolbar */}
        <div className="p-4 bg-white dark:bg-[#1C1B18] border-b border-stone-200 dark:border-stone-800 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'JUDICIAL_ANALYSIS',
                  label: '1. Phân tích Tài phán (Judicial)',
                  desc: 'Khách quan, trung lập, trọng tâm hiệu lực & chứng cứ',
                },
                {
                  id: 'LEGAL_COUNSEL',
                  label: '2. Tư vấn Pháp chế (Counsel)',
                  desc: 'Bảo vệ quyền lợi CĐT, vận dụng điều khoản chuyển tiếp',
                },
                {
                  id: 'LEGAL_AUDIT',
                  label: '3. Kiểm toán Tuân thủ (Auditor)',
                  desc: 'Hậu kiểm 3 chân kiềng, phát hiện rủi ro xuất toán',
                },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  setAiOutput(null);
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  mode === m.id
                    ? 'bg-[#152D42] text-white border-[#C6A342] shadow-xs'
                    : 'bg-[#FBF9F5] dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                <div className="text-xs font-bold">{m.label}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    mode === m.id ? 'text-[#E9C96D]' : 'text-stone-500'
                  }`}
                >
                  {m.desc}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <label className="space-y-1">
              <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#C6A342]" />
                Thời điểm áp dụng (asOfDate):
              </span>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => {
                  setAsOfDate(e.target.value);
                  setAiOutput(null);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono-code text-xs"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-stone-600 dark:text-stone-300">
                Mốc phê duyệt dự án (Chuyển tiếp):
              </span>
              <input
                type="date"
                value={milestoneDate}
                onChange={(e) => {
                  setMilestoneDate(e.target.value);
                  setAiOutput(null);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono-code text-xs"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-stone-600 dark:text-stone-300">
                Mã hồ sơ / Chứng cứ:
              </span>
              <input
                type="text"
                value={evidenceCode}
                onChange={(e) => setEvidenceCode(e.target.value)}
                placeholder="VD: BB-NT-01"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono-code text-xs"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              value={caseQuestion}
              onChange={(e) => {
                setCaseQuestion(e.target.value);
                setAiOutput(null);
              }}
              placeholder="Nhập câu hỏi pháp lý hoặc tình huống cần thẩm định (nếu hỏi ngoài phạm vi SSoT hệ thống sẽ Honest Abstain)..."
              className="sm:col-span-9 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
            />
            <button
              type="button"
              onClick={handleInvokeAiReasoning}
              disabled={isLoadingAi}
              className="sm:col-span-3 px-3 py-1.5 rounded-lg bg-[#152D42] hover:bg-[#1E3F5A] text-[#E9C96D] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoadingAi ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Chạy AI IRAC+</span>
            </button>
          </div>
        </div>

        {/* Body: 6-Step IRAC+ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {aiError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-400 text-amber-950 dark:text-amber-200 font-medium">
              {aiError}
            </div>
          )}

          {activeOutput && (
            <>
              {/* Epistemic Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                  activeOutput.epistemic_status === 'ABSTAINED_INSUFFICIENT_SSOT'
                    ? 'bg-red-50 dark:bg-red-950/50 border-red-400 text-red-900 dark:text-red-200'
                    : activeOutput.epistemic_status === 'PARTIAL_EXCERPT_WARNING'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {activeOutput.epistemic_status === 'ABSTAINED_INSUFFICIENT_SSOT' ? (
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                  ) : activeOutput.epistemic_status === 'PARTIAL_EXCERPT_WARNING' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    Trạng thái Tri thức (Epistemic Status):{' '}
                    {activeOutput.epistemic_status || 'VERIFIED_IN_SSOT'}
                  </span>
                </div>
                <span className="font-mono-code text-[11px] font-bold">
                  Trust Score SSoT: {activeOutput.citation_verification_report.trust_score_percent}%
                </span>
              </div>

              {/* Step 1: ISSUE */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1B18] border border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="font-bold text-[#152D42] dark:text-amber-300 uppercase">
                  Bước 1 — Vấn đề Pháp lý Cốt lõi (Legal Issue)
                </div>
                <p className="text-stone-800 dark:text-stone-200 leading-relaxed">
                  {activeOutput.step1_issue.core_legal_question}
                </p>
              </div>

              {/* Step 2: RULE */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1B18] border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="font-bold text-[#152D42] dark:text-amber-300 uppercase">
                  Bước 2 — Quy phạm Pháp luật Áp dụng tại {asOfDate} (Point-in-Time Rules)
                </div>
                {activeOutput.step2_rules.length === 0 ? (
                  <p className="text-red-700 dark:text-red-300 font-semibold">
                    Không có quy phạm xác thực trong kho SSoT cho lĩnh vực này (Honest Abstention).
                  </p>
                ) : (
                  activeOutput.step2_rules.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono-code font-bold text-[#152D42] dark:text-amber-300">
                          {r.doc_number} · {r.article_clause_ref}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-mono-code text-[10px] font-bold">
                          {r.verification_badge || 'VERIFIED_SSOT'}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                        {r.effective_status_at_fact_date}
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed">
                        {r.normative_summary}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Step 3: INTERPRETATION */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1B18] border border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="font-bold text-[#152D42] dark:text-amber-300 uppercase">
                  Bước 3 — Giải thích Quy phạm & Điều khoản Chuyển tiếp (Interpretation)
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activeOutput.step3_interpretation.temporal_and_transitional_analysis}
                </p>
              </div>

              {/* Step 4: APPLICATION */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1B18] border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="font-bold text-[#152D42] dark:text-amber-300 uppercase">
                  Bước 4 — Áp dụng vào Tình tiết & Hồ sơ Thực tế (Fact Application)
                </div>
                {activeOutput.step4_application.fact_to_rule_mapping.map((m, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{m.fact_statement}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold text-[10px]">
                        {m.compliance_assessment}
                      </span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400">{m.analysis}</p>
                  </div>
                ))}
              </div>

              {/* Step 5: COUNTERARGUMENT */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1B18] border border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="font-bold text-[#152D42] dark:text-amber-300 uppercase">
                  Bước 5 — Phản biện Chéo & Ngoại lệ Pháp lý (Counter-Arguments)
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activeOutput.step5_counterargument.inspector_or_opposing_view}
                </p>
              </div>

              {/* Step 6: CONCLUSION */}
              <div className="p-3.5 rounded-xl bg-[#FBF5DF]/90 dark:bg-[#221E15] border border-[#C6A342] space-y-2">
                <div className="font-bold text-[#152D42] dark:text-amber-300 uppercase">
                  Bước 6 — Kết luận & Khuyến nghị Hành động (Actionable Conclusion)
                </div>
                <p className="text-stone-900 dark:text-stone-100 font-medium leading-relaxed">
                  {activeOutput.step6_conclusion.definitive_conclusion}
                </p>
                <ul className="list-disc pl-4 space-y-1 text-stone-700 dark:text-stone-300">
                  {activeOutput.step6_conclusion.actionable_recommendations.map(
                    (rec, i) => (
                      <li key={i}>{rec}</li>
                    )
                  )}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white dark:bg-[#1C1B18] border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 shrink-0">
          {onOpenEvidenceReport && activeOutput ? (
            <button
              type="button"
              onClick={() => onOpenEvidenceReport(activeOutput)}
              className="px-3.5 py-2 rounded-xl bg-[#152D42] hover:bg-[#1E3F5A] text-[#E9C96D] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Xuất Báo Cáo Pháp Lý Có Dẫn Chứng (A4 / JSON)</span>
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
