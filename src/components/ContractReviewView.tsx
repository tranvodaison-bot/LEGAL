import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Check,
  Copy,
  BookOpen,
  Wand2,
  Upload,
  Loader2,
  FileScan,
} from 'lucide-react';
import {
  ContractTemplate,
  ContractRedlineIssue,
} from '../types/legal';
import { CONTRACT_REVIEW_TEMPLATES } from '../data/legalCorpus';
import {
  extractDocumentViaGeminiMultimodal,
  MultimodalOcrExtractResponse,
} from '../utils/ocrClient';

interface ContractReviewViewProps {
  onOpenReader: (docId: string, articleId?: string) => void;
  onAskAquaWithContext: (question: string, clauseContext: string) => void;
  onLogAction: (action: string, detail?: string) => void;
}

export const ContractReviewView: React.FC<ContractReviewViewProps> = ({
  onOpenReader,
  onAskAquaWithContext,
  onLogAction,
}) => {
  const [templates] = useState<ContractTemplate[]>(CONTRACT_REVIEW_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    CONTRACT_REVIEW_TEMPLATES[0].id
  );
  const [draftText, setDraftText] = useState<string>(
    CONTRACT_REVIEW_TEMPLATES[0].fullText
  );
  const [draftTitle, setDraftTitle] = useState<string>(
    CONTRACT_REVIEW_TEMPLATES[0].title
  );
  const [issues, setIssues] = useState<ContractRedlineIssue[]>(
    CONTRACT_REVIEW_TEMPLATES[0].issues
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOcrUploading, setIsOcrUploading] = useState(false);
  const [ocrMetadata, setOcrMetadata] =
    useState<MultimodalOcrExtractResponse | null>(null);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const handleSelectTemplate = (tpl: ContractTemplate) => {
    setSelectedTemplateId(tpl.id);
    setDraftTitle(tpl.title);
    setDraftText(tpl.fullText);
    setIssues(tpl.issues);
    setAppliedIds([]);
    setOcrMetadata(null);
    setOcrNotice(null);
    onLogAction('CHỌN_MẪU_HỢP_ĐỒNG', tpl.title);
  };

  const runAiRedlineForText = async (titleToReview: string, textToReview: string) => {
    if (!textToReview.trim()) return;
    setIsAnalyzing(true);
    onLogAction('AI_RÀ_SOÁT_HỢP_ĐỒNG', titleToReview);
    try {
      const res = await fetch('/api/contract-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractTitle: titleToReview,
          contractText: textToReview,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.issues) && data.issues.length > 0) {
        setIssues(data.issues);
      }
    } catch {
      // Keep pre-loaded deterministic issues if offline
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadContractFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsOcrUploading(true);
    setOcrNotice(
      `Đang bóc tách OCR Đa phương thức (Gemini Vision / DOCX) cho tệp "${file.name}"...`
    );

    try {
      const { ocrResult } = await extractDocumentViaGeminiMultimodal({
        file,
        mode: 'contract_redline',
      });

      const resolvedTitle =
        ocrResult.extracted_doc_title?.trim() ||
        file.name.replace(/\.[^.]+$/, '');
      const resolvedText =
        ocrResult.ocr_full_text?.trim() ||
        `[Tệp: ${file.name}]\nSố hiệu: ${ocrResult.extracted_doc_no}\nCơ quan/Bên ký: ${ocrResult.extracted_authority}`;

      setDraftTitle(resolvedTitle);
      setDraftText(resolvedText);
      setOcrMetadata(ocrResult);
      setOcrNotice(
        `Đã bóc tách OCR thành công "${file.name}" (${ocrResult.extracted_doc_no}) — Đang tự động rà soát rủi ro điều khoản...`
      );
      onLogAction(
        'OCR_HỢP_ĐỒNG_MULTIMODAL',
        `${file.name} (${ocrResult.extracted_doc_no})`
      );

      await runAiRedlineForText(resolvedTitle, resolvedText);
      setOcrNotice(
        `Hoàn tất bóc tách OCR & rà soát Redline tự động cho "${file.name}".`
      );
    } catch {
      try {
        const text = await file.text();
        const fallbackTitle = file.name.replace(/\.[^.]+$/, '');
        setDraftTitle(fallbackTitle);
        setDraftText(text);
        setOcrNotice(`Đã nạp văn bản thuần từ tệp "${file.name}".`);
        onLogAction('TẢI_TỆP_RÀ_SOÁT_HỢP_ĐỒNG', file.name);
      } catch {
        setOcrNotice('Không thể đọc tệp đính kèm. Vui lòng thử lại với PDF, DOCX hoặc TXT.');
      }
    } finally {
      setIsOcrUploading(false);
    }
  };

  const handleRunAiRedline = async () => {
    await runAiRedlineForText(draftTitle, draftText);
  };

  const handleApplyReplacement = (issue: ContractRedlineIssue) => {
    if (draftText.includes(issue.originalExcerpt)) {
      setDraftText((prev) =>
        prev.replace(issue.originalExcerpt, issue.suggestedReplacement)
      );
    } else {
      setDraftText(
        (prev) =>
          `${prev}\n\n[ĐÃ BỔ SUNG ĐIỀU KHOẢN THAY THẾ - ${issue.clauseLocation}]:\n${issue.suggestedReplacement}`
      );
    }
    setAppliedIds((prev) => [...new Set([...prev, issue.id])]);
    onLogAction('ÁP_DỤNG_CÂU_THAY_THẾ', issue.clauseLocation);
  };

  const handleCopySuggested = async (issue: ContractRedlineIssue) => {
    try {
      await navigator.clipboard.writeText(issue.suggestedReplacement);
      setCopiedId(issue.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FBF9F5] dark:bg-[#141413] text-[#1C1917] dark:text-[#F5F2EB] p-4 sm:p-6">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200 dark:border-[#2E2C28] pb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B59745] mb-1">
              SOẠN THẢO & RÀ SOÁT VĂN BẢN · HỆ SINH THÁI ĐẠI SƠN
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#152D42] dark:text-[#F5F2EB]">
              Soạn thảo & Rà soát Hợp đồng Tự động
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
              Phát hiện điều khoản bất lợi, chỉ rõ <strong>Trích đoạn gốc</strong>, <strong>Vấn đề pháp lý</strong>, <strong>Căn cứ pháp lý</strong>, <strong>Đề xuất chỉnh sửa</strong> và <strong>Câu thay thế gợi ý</strong>.
            </p>
          </div>

          {/* Template Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  selectedTemplateId === tpl.id
                    ? 'bg-[#FFFDF7] dark:bg-[#23211D] border-[#C6A342] text-[#152D42] dark:text-amber-300 shadow-xs ring-1 ring-[#C6A342]/40'
                    : 'bg-white dark:bg-[#1A1917] border-stone-200 dark:border-[#2E2C28] text-stone-600 dark:text-stone-300'
                }`}
              >
                {tpl.category}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Workspace: Left = Contract Editor, Right = Redline Cards (Screenshot 3) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT 5 COLS: Contract Draft Editor */}
          <div className="xl:col-span-5 bg-white dark:bg-[#1A1917] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C6A342]" />
                <h2 className="text-sm sm:text-base font-bold text-[#152D42] dark:text-stone-100">
                  Dự thảo Hợp đồng / Văn bản
                </h2>
              </div>
              <label
                className={`px-3 py-1.5 rounded-lg bg-[#C6A342] hover:bg-[#b59336] text-[#152D42] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  isOcrUploading ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {isOcrUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>
                  {isOcrUploading
                    ? 'Đang OCR PDF/DOCX...'
                    : 'Tải PDF / DOCX / Scan / TXT'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,text/plain"
                  onChange={handleUploadContractFile}
                  disabled={isOcrUploading}
                  className="hidden"
                />
              </label>
            </div>

            {ocrNotice && (
              <div className="p-2.5 rounded-xl bg-[#FFFDF7] dark:bg-stone-900 border border-[#C6A342]/60 text-xs text-[#152D42] dark:text-amber-200 flex items-center gap-2">
                {isOcrUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C6A342] shrink-0" />
                ) : (
                  <FileScan className="w-3.5 h-3.5 text-[#C6A342] shrink-0" />
                )}
                <span>{ocrNotice}</span>
              </div>
            )}

            {ocrMetadata && (
              <div className="p-3 rounded-xl bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-stone-800 text-[11px] space-y-1">
                <div className="font-bold text-[#152D42] dark:text-amber-300">
                  Siêu dữ liệu Hợp đồng bóc tách từ Gemini Multimodal OCR:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-stone-600 dark:text-stone-300">
                  <div>
                    Số hiệu: <code className="font-mono-code font-bold">{ocrMetadata.extracted_doc_no}</code>
                  </div>
                  <div>
                    Bên ký / Thẩm quyền: <b>{ocrMetadata.extracted_authority}</b>
                  </div>
                  {ocrMetadata.total_investment_amount &&
                    ocrMetadata.total_investment_amount !== 'Không đề cập' && (
                      <div>
                        Giá trị HĐ: <b className="text-emerald-700 dark:text-emerald-400">{ocrMetadata.total_investment_amount}</b>
                      </div>
                    )}
                  {Array.isArray(ocrMetadata.cited_legal_bases) &&
                    ocrMetadata.cited_legal_bases.length > 0 && (
                      <div>
                        Căn cứ viện dẫn: <code>{ocrMetadata.cited_legal_bases.join(', ')}</code>
                      </div>
                    )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">
                Tên hợp đồng / văn bản
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-stone-300 dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">
                Nội dung điều khoản (có thể chỉnh sửa hoặc nhấn "Áp dụng thay thế" từ cột bên phải)
              </label>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={16}
                className="w-full p-3.5 text-xs sm:text-sm leading-relaxed rounded-xl border border-stone-300 dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-serif-editorial focus:outline-none focus:border-[#C6A342]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-xs text-stone-500">
                Đã phát hiện <strong>{issues.length}</strong> điều khoản cần chỉnh sửa
              </span>
              <button
                onClick={handleRunAiRedline}
                disabled={isAnalyzing}
                className="px-4 py-2 rounded-xl bg-[#152D42] text-white text-xs font-semibold hover:bg-[#213E57] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#E9C96D]" />
                <span>
                  {isAnalyzing
                    ? 'Đang rà soát bằng AI Pháp chế...'
                    : 'Rà soát lại dự thảo bằng AI'}
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT 7 COLS: Clause-by-Clause Review Cards (Exact layout of LegalFlow Screenshot 3) */}
          <div className="xl:col-span-7 space-y-5">
            {issues.map((issue) => {
              const isApplied = appliedIds.includes(issue.id);
              const isCopied = copiedId === issue.id;

              return (
                <div
                  key={issue.id}
                  className="bg-white dark:bg-[#1A1917] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-6 shadow-xs space-y-4"
                >
                  {/* Card Header: Risk Badge + Clause Location */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          issue.riskLevel === 'Rất cao'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-[#FDE8E4] text-[#C0392B] dark:bg-amber-950/50 dark:text-amber-300'
                        }`}
                      >
                        {issue.riskLevel}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                        {issue.clauseLocation}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {issue.legalBasisDocId && (
                        <button
                          onClick={() =>
                            onOpenReader(
                              issue.legalBasisDocId!,
                              issue.legalBasisArticleId
                            )
                          }
                          className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-medium text-[#286181] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Mở văn bản căn cứ</span>
                        </button>
                      )}
                      <button
                        onClick={() =>
                          onAskAquaWithContext(
                            `Rà soát chi tiết rủi ro tại ${issue.clauseLocation} và giải thích vì sao cần sửa đổi.`,
                            `Trích đoạn gốc: "${issue.originalExcerpt}"\nCăn cứ: ${issue.legalBasis}`
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#C6A342]/20 text-[#7A5F14] dark:text-amber-300 text-xs font-semibold hover:bg-[#C6A342]/30 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Hỏi AQUA</span>
                      </button>
                    </div>
                  </div>

                  {/* TRÍCH ĐOẠN GỐC */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      TRÍCH ĐOẠN GỐC
                    </div>
                    <div className="p-3.5 rounded-xl bg-stone-100/90 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 text-xs sm:text-sm italic">
                      {issue.originalExcerpt}
                    </div>
                  </div>

                  {/* VẤN ĐỀ */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      VẤN ĐỀ
                    </div>
                    <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                      {issue.problemAnalysis}
                    </p>
                  </div>

                  {/* CĂN CỨ PHÁP LÝ */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      CĂN CỨ PHÁP LÝ
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-[#152D42] dark:text-amber-300">
                      {issue.legalBasis}
                    </p>
                  </div>

                  {/* ĐỀ XUẤT CHỈNH SỬA (Warm Gold Callout with Left Border matching Screenshot 3) */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      ĐỀ XUẤT CHỈNH SỬA
                    </div>
                    <div className="p-3.5 rounded-r-xl border-l-4 border-[#C6A342] bg-[#FBF5DF]/80 dark:bg-[#2E291B] text-stone-900 dark:text-stone-100 text-xs sm:text-sm leading-relaxed">
                      {issue.editRecommendation}
                    </div>
                  </div>

                  {/* CÂU THAY THẾ GỢI Ý */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        CÂU THAY THẾ GỢI Ý
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopySuggested(issue)}
                          className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1 cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép câu gợi ý</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleApplyReplacement(issue)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                            isApplied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#C6A342] text-[#152D42] hover:bg-[#b59233]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {isApplied
                              ? 'Đã thay thế vào dự thảo'
                              : 'Áp dụng thay thế vào dự thảo'}
                          </span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-900 dark:text-stone-100 leading-relaxed bg-[#FBF9F5] dark:bg-[#141413] p-3.5 rounded-xl border border-stone-200 dark:border-[#2E2C28]">
                      {issue.suggestedReplacement}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
