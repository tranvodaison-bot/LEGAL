import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Zap,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Scale,
  FileWarning,
  BookmarkCheck,
} from 'lucide-react';
import {
  CrossLawAuditResponse,
  CrossLawMatrixItem,
  LegalArticle,
  LegalCrossReference,
  LegalDocument,
} from '../types/legal';

interface CrossLawAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDoc: LegalDocument | null;
  sourceArticle: LegalArticle | null;
  allDocuments: LegalDocument[];
  crossReferences: LegalCrossReference[];
  onNavigateToDoc: (doc: LegalDocument, articleId?: string) => void;
  onSaveToGlobalAudit: (
    doc: LegalDocument,
    article: LegalArticle,
    summaryText: string,
    customPromptLabel?: string
  ) => void;
  onAskAquaWithContext: (question: string, clauseContext: string) => void;
}

/**
 * Build a deterministic, domain-accurate baseline Cross-Law Matrix from the SSoT corpus
 * so the user sees immediate multi-law linkages (Luật Xây dựng, Luật Đất đai, Luật Đấu thầu, Nghị định)
 * while Gemini Prompt Engine enriches or when working offline.
 */
function buildBaselineCrossLawMatrix(
  doc: LegalDocument,
  article: LegalArticle,
  allDocuments: LegalDocument[]
): CrossLawAuditResponse {
  const findDocByNumberPart = (part: string) =>
    allDocuments.find((d) =>
      d.doc_number.toLowerCase().includes(part.toLowerCase())
    );

  const lxdDoc = findDocByNumberPart('135/2025') || findDocByNumberPart('62/2020');
  const lddDoc = findDocByNumberPart('31/2024');
  const ldtDoc = findDocByNumberPart('22/2023') || findDocByNumberPart('57/2024');
  const ndDoc =
    findDocByNumberPart('175/2024') ||
    findDocByNumberPart('24/2024') ||
    findDocByNumberPart('99/2021');

  const isAmended = Boolean(article.is_amended);
  const amendingCode =
    article.amendment_info?.amending_doc_number || '56/2024/QH15';

  const matrixItems: CrossLawMatrixItem[] = [
    {
      target_law_domain: 'Luật Xây dựng & Quản lý chi phí ĐTXD',
      target_doc_id: lxdDoc?.id,
      target_doc_number: lxdDoc?.doc_number || '135/2025/QH15',
      target_clause_ref: 'Điều 14, Điều 112 & Điều 136 (Thanh quyết toán vốn ĐTXD)',
      relation_nature: 'ĐỒNG BỘ BẮT BUỘC',
      cross_analysis: `Quy định tại ${article.article_no} (${doc.doc_number}) là căn cứ trực tiếp để ghi nhận chứng từ, hạch toán chi phí đầu tư xây dựng, nghiệm thu khối lượng hoàn thành và lập Báo cáo quyết toán dự án hoàn thành theo Luật Xây dựng.`,
      audit_evidence_required:
        'Biên bản nghiệm thu khối lượng hoàn thành (Phụ lục 03a/04), Bảng xác định giá trị khối lượng công việc hoàn thành và chứng từ kế toán hợp lệ.',
    },
    {
      target_law_domain: 'Luật Đấu thầu & Lựa chọn nhà thầu',
      target_doc_id: ldtDoc?.id,
      target_doc_number: ldtDoc?.doc_number || '22/2023/QH15 · 57/2024/QH15',
      target_clause_ref: 'Điều 62, Điều 67 & Điều 70 (Loại hợp đồng, điều chỉnh giá và thanh toán)',
      relation_nature: 'ĐIỀU KIỆN TIÊN QUYẾT',
      cross_analysis: `Mọi nghiệp vụ kinh tế - tài chính phát sinh theo ${article.article_no} phải khớp nối 100% với loại hợp đồng (trọn gói, đơn giá cố định, đơn giá điều chỉnh) và Phụ lục hợp đồng đã ký kết hợp pháp theo Luật Đấu thầu.`,
      audit_evidence_required:
        'Quyết định phê duyệt KQLCNT, Hợp đồng kinh tế, Bảo lãnh thực hiện hợp đồng/tạm ứng và Hóa đơn điện tử có mã của cơ quan thuế.',
    },
    {
      target_law_domain: 'Luật Đất đai & Tài sản gắn liền với đất',
      target_doc_id: lddDoc?.id,
      target_doc_number: lddDoc?.doc_number || '31/2024/QH15',
      target_clause_ref: 'Điều 111, Điều 158 & Điều 160 (Chi phí GPMB, định giá đất & ghi nhận tài sản)',
      relation_nature: 'GIAO THOA THẨM QUYỀN',
      cross_analysis: `Khi xác định giá trị tài sản, chi phí bồi thường, hỗ trợ, tái định cư hoặc giá trị hợp lý theo ${article.article_no}, đơn vị kế toán và Ban QLDA phải đối chiếu Phương án bồi thường được phê duyệt và bảng giá đất/giá đất cụ thể theo Luật Đất đai 2024.`,
      audit_evidence_required:
        'Quyết định thu hồi đất, Quyết định phê duyệt phương án bồi thường GPMB và chứng từ chi trả qua Kho bạc Nhà nước.',
    },
    {
      target_law_domain: 'Nghị định hướng dẫn & Kiểm soát thanh toán Kho bạc',
      target_doc_id: ndDoc?.id,
      target_doc_number: ndDoc?.doc_number || '99/2021/NĐ-CP · 175/2024/NĐ-CP',
      target_clause_ref: 'Điều 6, Điều 8 & Điều 21 (Hồ sơ kiểm soát cam kết chi & giải ngân)',
      relation_nature: 'RỦI RO XUNG ĐỘT HỒ SƠ',
      cross_analysis: isAmended
        ? `${article.article_no} đã được sửa đổi, bổ sung bởi [${amendingCode}]. Nếu hồ sơ trình Kho bạc hoặc báo cáo kiểm toán vẫn viện dẫn nội dung cũ trước ngày có hiệu lực của văn bản sửa đổi sẽ bị trả hồ sơ hoặc xuất toán.`
        : `Trình tự lập, ký số và lưu trữ hồ sơ theo ${article.article_no} phải tuân thủ quy trình kiểm soát thanh toán vốn đầu tư công qua hệ thống dịch vụ công trực tuyến của Kho bạc Nhà nước.`,
      audit_evidence_required:
        'Giấy đề nghị thanh toán vốn đầu tư (Mẫu 04a), Giấy rút vốn đầu tư và chữ ký số chuyên dùng hợp lệ.',
    },
  ];

  return {
    executive_conclusion: `Ma trận đối soát chéo xác nhận ${article.article_no} (${article.article_title}) của ${doc.doc_number} có liên kết pháp lý trực tiếp với Luật Xây dựng, Luật Đấu thầu, Luật Đất đai và quy trình kiểm soát chi của Kho bạc Nhà nước.${
      isAmended
        ? ` Đặc biệt lưu ý: Điều khoản này đã qua sửa đổi bởi ${amendingCode}, bắt buộc áp dụng theo quy định mới.`
        : ''
    }`,
    deduction_risk_level: isAmended ? 'RẤT CAO' : 'CAO',
    deduction_risk_warning: isAmended
      ? `CẢNH BÁO RỦI RO XUẤT TOÁN RẤT CAO: ${article.article_no} đã bị sửa đổi bởi ${amendingCode}. Việc áp dụng biểu mẫu/quy định cũ trước thời điểm hiệu lực hoặc thiếu chữ ký số/chứng từ đồng bộ với hợp đồng xây dựng - đấu thầu sẽ dẫn đến nguy cơ bị Kiểm toán Nhà nước xuất toán chi phí hoặc Kho bạc Nhà nước từ chối giải ngân.`
      : `CẢNH BÁO RỦI RO XUẤT TOÁN CAO: Nếu thông tin, số liệu hoặc chứng từ thực hiện theo ${article.article_no} (${doc.doc_number}) không khớp nối đồng bộ với Biên bản nghiệm thu (Luật Xây dựng), Phụ lục hợp đồng (Luật Đấu thầu) và Phương án GPMB (Luật Đất đai), khoản chi có nguy cơ bị loại khỏi giá trị quyết toán vốn đầu tư.`,
    matrix_items: matrixItems,
    mandatory_checklist: [
      `Kiểm tra tính hiệu lực của ${article.article_no} (${doc.doc_number})${
        isAmended ? ` và áp dụng đúng nội dung sửa đổi tại ${amendingCode}` : ''
      } trước khi trình ký hồ sơ.`,
      'Đối chiếu khớp đúng 100% số liệu giữa Chứng từ kế toán — Biên bản nghiệm thu khối lượng — Phụ lục hợp đồng đấu thầu.',
      'Đảm bảo đầy đủ chữ ký số hợp lệ và lưu trữ hồ sơ điện tử phục vụ hậu kiểm của Kiểm toán Nhà nước & Thanh tra.',
    ],
  };
}

export const CrossLawAiDrawer: React.FC<CrossLawAiDrawerProps> = ({
  isOpen,
  onClose,
  sourceDoc,
  sourceArticle,
  allDocuments,
  crossReferences,
  onNavigateToDoc,
  onSaveToGlobalAudit,
  onAskAquaWithContext,
}) => {
  const [aiResult, setAiResult] = useState<CrossLawAuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const baselineMatrix = useMemo(() => {
    if (!sourceDoc || !sourceArticle) return null;
    return buildBaselineCrossLawMatrix(sourceDoc, sourceArticle, allDocuments);
  }, [sourceDoc, sourceArticle, allDocuments]);

  // Existing SSoT cross-references specifically touching this document or article
  const directCrossRefs = useMemo(() => {
    if (!sourceDoc || !sourceArticle) return [];
    return crossReferences.filter(
      (x) =>
        x.source_article_id === sourceArticle.id ||
        x.target_article_id === sourceArticle.id ||
        x.source_doc_id === sourceDoc.id ||
        x.target_doc_id === sourceDoc.id
    );
  }, [sourceDoc, sourceArticle, crossReferences]);

  const runCrossLawPromptEngine = async () => {
    if (!sourceDoc || !sourceArticle) return;
    setIsLoading(true);
    setAiError(null);
    setSavedSuccess(false);

    try {
      const amendedClausesSummary = (sourceArticle.clauses || [])
        .filter((c) => c.is_amended && c.diff_data)
        .map(
          (c) =>
            `${c.clause_no}: Sửa đổi bởi ${c.diff_data?.amending_doc_number} (Hiệu lực ${c.diff_data?.effective_date}) — Bản gốc: "${c.diff_data?.original_text}" -> Bản mới: "${c.diff_data?.replaced_text}"`
        )
        .join('\n');

      const relatedCorpusDocs = allDocuments.slice(0, 18).map((d) => ({
        id: d.id,
        doc_number: d.doc_number,
        title: d.short_title || d.title,
        field: d.field,
      }));

      const res = await fetch('/api/cross-law-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docNumber: sourceDoc.doc_number,
          docTitle: sourceDoc.title,
          field: sourceDoc.field,
          projectStage: sourceDoc.project_stage,
          articleNo: sourceArticle.article_no,
          articleTitle: sourceArticle.article_title,
          articleContent: sourceArticle.content,
          amendedClausesSummary,
          relatedCorpusDocs,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.result) {
        throw new Error(
          data?.error || 'Không thể kết nối Prompt Engine AI, đang hiển thị Ma trận SSoT chuẩn.'
        );
      }
      setAiResult(data.result as CrossLawAuditResponse);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Đang hiển thị Ma trận đối soát chéo từ cơ sở dữ liệu SSoT.';
      setAiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && sourceDoc && sourceArticle) {
      setAiResult(null);
      setSavedSuccess(false);
      runCrossLawPromptEngine();
    }
  }, [isOpen, sourceDoc?.id, sourceArticle?.id]);

  if (!isOpen || !sourceDoc || !sourceArticle) return null;

  const activeData = aiResult || baselineMatrix;

  const handleSaveAuditRecord = () => {
    if (!activeData) return;
    const formattedSummary = `[ĐỐI SOÁT CHÉO LIÊN LUẬT · RỦI RO XUẤT TOÁN: ${activeData.deduction_risk_level}]\n- Kết luận: ${activeData.executive_conclusion}\n- Cảnh báo xuất toán: ${activeData.deduction_risk_warning}\n${activeData.mandatory_checklist
      .map((item, idx) => `${idx + 1}. ${item}`)
      .join('\n')}`;

    onSaveToGlobalAudit(
      sourceDoc,
      sourceArticle,
      formattedSummary,
      `⚡ Đối soát chéo liên luật: ${sourceArticle.article_no} (${sourceDoc.doc_number})`
    );
    setSavedSuccess(true);
  };

  const riskBadgeStyle =
    activeData?.deduction_risk_level === 'RẤT CAO'
      ? 'bg-red-600 text-white border-red-400'
      : activeData?.deduction_risk_level === 'CAO'
      ? 'bg-amber-600 text-white border-amber-400'
      : 'bg-teal-700 text-white border-teal-500';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-[#FBF9F5] dark:bg-[#161513] border-l border-[#C6A342]/60 dark:border-stone-800 h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-[#152D42] text-white flex items-start justify-between gap-3 shrink-0 border-b border-[#C6A342]/40">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#C6A342] text-[#152D42] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Prompt Engine AI · Đối Soát Chéo Liên Luật</span>
              </span>
              <span className="font-mono-code text-xs text-[#E9C96D] font-bold">
                {sourceDoc.doc_number} · {sourceArticle.article_no}
              </span>
            </div>
            <h2 className="font-bold text-sm sm:text-base text-white truncate">
              {sourceArticle.article_no}. {sourceArticle.article_title}
            </h2>
            <p className="text-[11px] text-stone-300 truncate">
              Đối chiếu ma trận liên ngành: Luật Xây dựng · Luật Đất đai · Luật Đấu thầu · Nghị định hướng dẫn
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 cursor-pointer shrink-0"
            title="Đóng bảng đối soát chéo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Loading Banner when Gemini is actively synthesizing */}
          {isLoading && (
            <div className="p-3.5 rounded-xl bg-[#FBF5DF] dark:bg-amber-950/40 border border-[#C6A342] flex items-center justify-between gap-3 text-xs text-[#152D42] dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-[#9B7D27] dark:text-amber-400 shrink-0" />
                <span>
                  <b>Prompt Engine AI đang phân tích sâu...</b> Đang đối chiếu từng Khoản/Điểm của{' '}
                  <b>{sourceArticle.article_no}</b> với Luật Xây dựng, Luật Đất đai, Luật Đấu thầu.
                </span>
              </div>
              <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-[#152D42] text-[#E9C96D] shrink-0">
                Gemini AI
              </span>
            </div>
          )}

          {aiError && !isLoading && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
              <span>{aiError}</span>
              <button
                type="button"
                onClick={runCrossLawPromptEngine}
                className="px-2 py-0.5 rounded bg-[#152D42] text-[#E9C96D] font-semibold cursor-pointer shrink-0"
              >
                Thử lại AI
              </button>
            </div>
          )}

          {activeData && (
            <>
              {/* KHỐI CẢNH BÁO RỦI RO XUẤT TOÁN & CHẾ TÀI KIỂM TOÁN */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 via-amber-50/70 to-orange-50 dark:from-red-950/50 dark:via-amber-950/30 dark:to-stone-900 border-2 border-red-400/80 dark:border-red-800 space-y-2.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-red-900 dark:text-red-300 font-bold text-xs sm:text-sm">
                    <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span>CẢNH BÁO RỦI RO XUẤT TOÁN & HẬU KIỂM QUYẾT TOÁN</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono-code border ${riskBadgeStyle}`}
                  >
                    MỨC RỦI RO: {activeData.deduction_risk_level}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-red-950 dark:text-red-100 leading-relaxed font-medium">
                  {activeData.deduction_risk_warning}
                </p>

                <div className="pt-2 border-t border-red-200/80 dark:border-red-900/60 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  <strong className="text-[#152D42] dark:text-amber-300">
                    Nhận định tổng hợp liên luật:
                  </strong>{' '}
                  {activeData.executive_conclusion}
                </div>
              </div>

              {/* MA TRẬN ĐỐI SOÁT CHÉO LIÊN LUẬT (LUẬT XÂY DỰNG, ĐẤT ĐAI, ĐẤU THẦU, NGHỊ ĐỊNH) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-[#C6A342]" />
                      <span>
                        MA TRẬN ĐỐI SOÁT CHÉO LIÊN LUẬT ({activeData.matrix_items.length} Trục Pháp Lý)
                      </span>
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        aiResult
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border border-stone-300'
                      }`}
                    >
                      {aiResult
                        ? 'Nguồn: Phân tích AI trực tiếp'
                        : 'Nguồn: Ma trận Tất định từ SSoT (Deterministic Baseline)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={runCrossLawPromptEngine}
                    disabled={isLoading}
                    className="text-[11px] font-semibold text-[#286181] dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Làm mới phân tích AI</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {activeData.matrix_items.map((item, idx) => {
                    const matchedDoc =
                      (item.target_doc_id
                        ? allDocuments.find((d) => d.id === item.target_doc_id)
                        : undefined) ||
                      allDocuments.find(
                        (d) =>
                          item.target_doc_number &&
                          d.doc_number
                            .toLowerCase()
                            .includes(
                              item.target_doc_number.split(' ')[0].toLowerCase()
                            )
                      );

                    const badgeColor =
                      item.relation_nature === 'ĐỒNG BỘ BẮT BUỘC'
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-300'
                        : item.relation_nature === 'ĐIỀU KIỆN TIÊN QUYẾT'
                        ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-300'
                        : item.relation_nature === 'RỦI RO XUNG ĐỘT HỒ SƠ'
                        ? 'bg-red-100 dark:bg-red-950/70 text-red-900 dark:text-red-200 border-red-300'
                        : 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300';

                    return (
                      <div
                        key={`${item.target_doc_number}-${idx}`}
                        className="p-4 rounded-xl bg-white dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 space-y-2 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-[#152D42] text-[#E9C96D] text-[10px] font-bold uppercase">
                              {item.target_law_domain}
                            </span>
                            <span className="font-mono-code text-xs font-bold text-[#286181] dark:text-amber-400">
                              [{item.target_doc_number}]
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badgeColor}`}
                            >
                              {item.relation_nature}
                            </span>
                          </div>

                          {matchedDoc && (
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToDoc(matchedDoc);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#FBF5DF] hover:bg-[#F3E5B5] text-[#152D42] border border-[#C6A342] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Mở {matchedDoc.doc_number}</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          Điểm neo đối chiếu: <span className="font-mono-code text-[#152D42] dark:text-amber-300">{item.target_clause_ref}</span>
                        </div>

                        <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                          {item.cross_analysis}
                        </p>

                        <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 flex items-start gap-2">
                          <FileWarning className="w-3.5 h-3.5 text-[#9B7D27] dark:text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-stone-800 dark:text-stone-200">
                              Chứng từ / Hồ sơ bắt buộc khớp nối:
                            </strong>{' '}
                            {item.audit_evidence_required}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DANH MỤC CHECKLIST KIỂM TOÁN BẮT BUỘC */}
              {activeData.mandatory_checklist &&
                activeData.mandatory_checklist.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#FBF5DF]/80 dark:bg-[#221E15] border border-[#C6A342]/70 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Checklist Rà Soát Bắt Buộc Trước Khi Trình Ký / Giải Ngân</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-stone-800 dark:text-stone-200">
                      {activeData.mandatory_checklist.map((chk, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-mono-code font-bold text-[#9B7D27] dark:text-amber-400">
                            0{i + 1}.
                          </span>
                          <span>{chk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* LIÊN KẾT CHÉO ĐÃ LƯU TRONG KHO SSoT (NẾU CÓ) */}
              {directCrossRefs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Liên kết trực tiếp trong kho SSoT ({directCrossRefs.length})
                  </h4>
                  <div className="space-y-2">
                    {directCrossRefs.slice(0, 4).map((xref) => (
                      <div
                        key={xref.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                      >
                        <div className="font-bold text-[#152D42] dark:text-amber-300">
                          {xref.title}
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                          {xref.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="px-5 py-3.5 bg-white dark:bg-[#1E1D1B] border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveAuditRecord}
            className="px-3.5 py-2 rounded-xl bg-[#152D42] hover:bg-[#1F3F5B] text-[#E9C96D] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>
              {savedSuccess
                ? '✓ Đã lưu vào Hồ sơ Kiểm toán Phiên'
                : 'Lưu vào Bảng Tổng Hợp Kiểm Toán'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onAskAquaWithContext(
                  `Phân tích chuyên sâu ma trận đối soát chéo liên luật và cách phòng ngừa xuất toán tại ${sourceArticle.article_no} (${sourceDoc.doc_number}): ${sourceArticle.article_title}`,
                  sourceArticle.content
                );
              }}
              className="px-3 py-2 rounded-xl bg-[#C6A342]/20 hover:bg-[#C6A342]/30 text-[#7A5F14] dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chuyển sang Trợ lý AQUA</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
