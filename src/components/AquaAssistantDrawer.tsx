import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  Paperclip,
  BookOpen,
  Globe,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { LegalArticle, LegalDocument } from '../types/legal';
import { computeDocumentCompleteness } from '../core/engines/corpusIntegrityValidator';
import { detectOutOfCorpusDomain } from '../modules/legal-reasoning/legalReasoning.service';

interface AquaAssistantDrawerProps {
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  initialQuestion?: string;
  initialClauseContext?: string;
  documents: LegalDocument[];
  onOpenReader: (docId: string, articleId?: string) => void;
}

const PRESET_QUESTIONS = [
  {
    label: 'Quy định xin sự đồng ý dữ liệu cá nhân trên website?',
    q: 'Quy định về xin sự đồng ý của chủ thể dữ liệu cá nhân trên trang thông tin điện tử, ứng dụng theo Luật 91/2025/QH15 và NĐ 356/2025/NĐ-CP?',
    citedDocId: 'doc-bvdlcn-91-2025',
    citedArticleId: 'art-bvdlcn-d9',
  },
  {
    label: 'Điều kiện mặt bằng sạch trước khi khởi công xây dựng?',
    q: 'Chủ đầu tư và Ban QLDA cần đáp ứng điều kiện mặt bằng sạch và hồ sơ gì trước khi phát lệnh khởi công theo Điều 14 Luật Xây dựng 135/2025/QH15?',
    citedDocId: 'doc-lxd-135-2025',
    citedArticleId: 'art-lxd-d14',
  },
  {
    label: 'Ngưỡng ±5% điều chỉnh đơn giá hợp đồng xây lắp?',
    q: 'Khi nào được điều chỉnh đơn giá hợp đồng xây dựng theo Điều 38 Nghị định 217/2026/NĐ-CP và Điều 64 Luật Đấu thầu?',
    citedDocId: 'doc-nd-217-2026',
    citedArticleId: 'art-nd217-d38',
  },
];

interface MatchedSsotArticle {
  doc: LegalDocument;
  article: LegalArticle;
  score: number;
}

/**
 * Động cơ Đối soát Tất định Nội bộ SSoT cho Trợ lý AQUA (Tuân thủ TC-P0-05:
 * Tuyệt đối không dùng câu trả lời mẫu cố định, chỉ trích xuất đúng chủ đề câu hỏi từ kho SSoT
 * hoặc từ chối trung thực nếu câu hỏi nằm ngoài kho SSoT).
 */
export function buildDeterministicAquaResponse(
  queryText: string,
  attachedClause: string,
  documents: LegalDocument[]
): {
  answerText: string;
  matchedCitations: Array<{ docId: string; articleId: string; label: string }>;
  isAbstained: boolean;
} {
  const combinedInput = `${queryText} ${attachedClause}`.trim();
  const outOfDomain = detectOutOfCorpusDomain(combinedInput);

  if (outOfDomain) {
    return {
      isAbstained: true,
      matchedCitations: [],
      answerText: `[TỪ CHỐI TRUNG THỰC — ABSTAINED_INSUFFICIENT_SSOT]
Câu hỏi của bạn thuộc lĩnh vực "${outOfDomain}", hiện chưa được nạp văn bản quy phạm pháp luật chính thống trong kho SSoT (43 văn bản hiện hành tập trung vào Xây dựng, Đấu thầu, Đầu tư công, Đất đai, PCCC, Kế toán - Thuế, Dữ liệu cá nhân & An ninh mạng, Thương mại điện tử).

• Nguyên tắc Zero Hallucination (P0-05 & P1-03): Hệ thống tuyệt đối không tự suy diễn điều khoản ngoài kho SSoT.
• Khuyến nghị: Sử dụng nút "+ Nạp văn bản" trên thanh công cụ để bổ sung văn bản chuyên ngành "${outOfDomain}" vào hệ thống trước khi đối soát.`,
    };
  }

  const normalizedQuery = combinedInput.toLowerCase();
  const rawTokens = normalizedQuery
    .replace(/[?,.:;()[\]"'“”]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  // Nhận diện trực tiếp số hiệu văn bản (VD: 91/2025/QH15, 135/2025/QH15, 217/2026/NĐ-CP, 88/2015/QH13)
  const docCodeMatches = normalizedQuery.match(/\d+\/\d{4}\/[a-zđ0-9-]+/gi) || [];
  // Nhận diện trực tiếp số Điều (VD: điều 9, điều 14, điều 38)
  const articleNoMatches = Array.from(
    normalizedQuery.matchAll(/điều\s+(\d+)/gi),
    (m) => `điều ${m[1]}`
  );

  const scored: MatchedSsotArticle[] = [];

  for (const doc of documents) {
    if (doc.id === 'huong-dan' || doc.doc_type === 'Tài liệu') continue;
    const docNumLower = doc.doc_number.toLowerCase();
    const docTitleLower = doc.title.toLowerCase();
    const docFieldLower = doc.field.toLowerCase();

    let docBonus = 0;
    for (const code of docCodeMatches) {
      if (docNumLower.includes(code.toLowerCase())) {
        docBonus += 45;
      }
    }
    if (normalizedQuery.includes(docFieldLower)) {
      docBonus += 10;
    }

    for (const art of doc.articles) {
      let score = docBonus;
      const artNoLower = art.article_no.toLowerCase().trim();
      const artTitleLower = art.article_title.toLowerCase();
      const artContentLower = art.content.toLowerCase();
      const artKeywords = (art.keywords || []).map((k) => k.toLowerCase());

      if (articleNoMatches.includes(artNoLower)) {
        score += 35;
      }

      for (const kw of artKeywords) {
        if (kw.length >= 3 && normalizedQuery.includes(kw)) {
          score += 18;
        }
      }

      for (const token of rawTokens) {
        if (artTitleLower.includes(token)) score += 4;
        if (artContentLower.includes(token)) score += 2;
        if (docTitleLower.includes(token)) score += 1;
      }

      if (score >= 14) {
        scored.push({ doc, article: art, score });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored.slice(0, 3);

  if (topMatches.length === 0) {
    return {
      isAbstained: true,
      matchedCitations: [],
      answerText: `[CHẾ ĐỘ ĐỐI SOÁT TẤT ĐỊNH SSoT — KHÔNG TÌM THẤY ĐIỀU KHOẢN KHỚP TRỰC TIẾP]
Hệ thống đã quét toàn bộ kho văn bản SSoT nhưng không tìm thấy điều khoản khớp trực tiếp với truy vấn: "${queryText || attachedClause}".

• Để tra cứu chính xác, vui lòng nêu rõ từ khóa chuyên ngành (VD: "điều kiện khởi công", "mặt bằng sạch", "sự đồng ý dữ liệu cá nhân", "điều chỉnh đơn giá hợp đồng", "chứng từ điện tử") hoặc số hiệu văn bản (VD: 135/2025/QH15, 91/2025/QH15, 88/2015/QH13).`,
    };
  }

  const primary = topMatches[0];
  const comp = computeDocumentCompleteness(primary.doc);

  const methodLines = topMatches.map((m, idx) => {
    const excerpt =
      m.article.content.length > 340
        ? `${m.article.content.slice(0, 340).trim()}...`
        : m.article.content.trim();
    return `${idx + 1}. [${m.article.article_no} — ${m.doc.doc_number}: ${m.article.article_title}]\n"${excerpt}"`;
  });

  const auditNotes = topMatches
    .map((m) => m.article.amendment_note || m.article.amendment_info?.summary)
    .filter((n): n is string => Boolean(n));

  const sourceList = topMatches
    .map(
      (m) =>
        `${m.article.article_no} ${m.doc.doc_type} số ${m.doc.doc_number} (Hiệu lực: ${m.doc.effective_date})`
    )
    .join('; ');

  const answerText = `Kết quả đối soát trực tiếp từ kho dữ liệu chuẩn SSoT ĐẠI SƠN cho truy vấn của bạn (Khớp ${topMatches.length} quy phạm xác thực):

* **Phương thức thực hiện & Nội dung quy định nguyên văn:**
${methodLines.join('\n\n')}

* **Yêu cầu pháp lý bắt buộc & Lưu ý kiểm toán:**
${
  auditNotes.length > 0
    ? auditNotes.map((n) => `- ${n}`).join('\n')
    : `- Bắt buộc lập và lưu trữ đầy đủ hồ sơ, chứng từ chứng minh sự tuân thủ theo đúng ${primary.article.article_no} (${primary.doc.doc_number}) trước khi phê duyệt hoặc giải ngân.`
}
- Tình trạng toàn văn bản gốc ${primary.doc.doc_number}: Đã nạp ${comp.loaded_articles_count}/${comp.total_articles_count} Điều (${comp.completeness_percent}%) · Cấp độ xác thực: ${primary.doc.authenticity_tier || 'VERIFIED_EXCERPT'}.

* **Nguồn dẫn chiếu SSoT:** ${sourceList}.`;

  return {
    isAbstained: false,
    answerText,
    matchedCitations: topMatches.map((m) => ({
      docId: m.doc.id,
      articleId: m.article.id,
      label: `${m.article.article_no} · ${m.doc.doc_number}`,
    })),
  };
}

export const AquaAssistantDrawer: React.FC<AquaAssistantDrawerProps> = ({
  isOpen,
  onToggleOpen,
  initialQuestion,
  initialClauseContext,
  documents,
  onOpenReader,
}) => {
  const [question, setQuestion] = useState('');
  const [attachedClause, setAttachedClause] = useState('');
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [engineModeLabel, setEngineModeLabel] = useState<string | null>(null);
  const [matchedCitations, setMatchedCitations] = useState<
    Array<{ docId: string; articleId: string; label: string }>
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
    if (initialClauseContext) {
      setAttachedClause(initialClauseContext);
      setShowAttachInput(true);
    }
  }, [initialQuestion, initialClauseContext]);

  const handleAskAqua = async (customQuery?: string) => {
    const q = (customQuery ?? question).trim();
    if (!q && !attachedClause.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    // Luôn chạy Đối soát Tất định SSoT trước để lấy trích dẫn nguyên văn khớp câu hỏi
    const deterministicResult = buildDeterministicAquaResponse(
      q,
      attachedClause.trim(),
      documents
    );
    setMatchedCitations(deterministicResult.matchedCitations);

    try {
      const corpusSummary = documents
        .slice(0, 12)
        .map(
          (d) =>
            `- ${d.doc_number} (${d.title}): ${d.articles
              .map((a) => `${a.article_no} ${a.article_title}`)
              .join('; ')}`
        )
        .join('\n');

      const res = await fetch('/api/aqua-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          attachedClause: attachedClause.trim(),
          useWebSearch,
          corpusContext: corpusSummary,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.answer) {
        setAnswer(data.answer);
        setEngineModeLabel('Phân tích AI Gemini 2.5 Flash + Đối soát SSoT');
      } else {
        // Khi máy chủ chưa có khóa AIzaSy... hợp lệ hoặc ngoại tuyến:
        // Hiển thị kết quả tìm kiếm Deterministic SSoT đúng chủ đề câu hỏi (Chuẩn TC-P0-05)
        setAnswer(deterministicResult.answerText);
        setEngineModeLabel(
          'Chế độ Đối soát Tất định SSoT (Deterministic Legal Engine — Không dùng AI tự sinh)'
        );
      }
    } catch {
      setAnswer(deterministicResult.answerText);
      setEngineModeLabel(
        'Chế độ Đối soát Tất định SSoT (Offline / Nội bộ — Không dùng AI tự sinh)'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button at Bottom Right */}
      {!isOpen && (
        <button
          onClick={() => onToggleOpen(true)}
          className="fixed right-5 bottom-12 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#152D42] to-[#286181] text-white shadow-xl border-2 border-[#C6A342] hover:scale-105 transition cursor-pointer"
        >
          <span className="w-7 h-7 rounded-full bg-[#C6A342] text-[#152D42] flex items-center justify-center font-bold">
            <Scale className="w-4 h-4" />
          </span>
          <div className="text-left">
            <span className="block text-xs font-bold tracking-wide">
              Hỏi nhanh cùng AQUA
            </span>
            <span className="block text-[10px] text-[#E9C96D]">
              Trợ lý Pháp lý ĐẠI SƠN
            </span>
          </div>
        </button>
      )}

      {/* Expandable Floating Panel */}
      {isOpen && (
        <div className="fixed right-4 bottom-8 z-50 w-[calc(100vw-32px)] sm:w-[460px] max-h-[84vh] rounded-2xl bg-[#FBF9F5] dark:bg-[#1A1917] border-2 border-[#C6A342] shadow-2xl flex flex-col overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#F6EFE0] via-[#F2E6CE] to-[#E9D7B2] dark:from-[#2A251B] dark:to-[#1F1C16] px-5 py-3.5 border-b border-[#DEC99A] dark:border-[#3A3324] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#152D42] border-2 border-[#C6A342] flex items-center justify-center text-[#E9C96D] shadow-xs shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-[#152D42] dark:text-amber-300">
                    Trợ lý AQUA · ĐẠI SƠN
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300">
                  Tra cứu nhanh điều khoản & đối soát văn bản pháp lý SSoT
                </p>
              </div>
            </div>
            <button
              onClick={() => onToggleOpen(false)}
              className="w-7 h-7 rounded-full bg-white/80 dark:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:bg-white cursor-pointer"
              aria-label="Đóng Trợ lý AQUA"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Quick Preset Questions */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUESTIONS.map((pq, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuestion(pq.q);
                    handleAskAqua(pq.q);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#141413] border border-stone-200 dark:border-stone-700 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:border-[#C6A342] text-left cursor-pointer"
                >
                  {pq.label}
                </button>
              ))}
            </div>

            {/* Structured Answer Card */}
            <div className="bg-white dark:bg-[#141413] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-4 shadow-xs space-y-2.5">
              {isLoading ? (
                <div className="py-6 text-center space-y-2">
                  <Sparkles className="w-5 h-5 text-[#C6A342] animate-spin mx-auto" />
                  <p className="text-xs text-stone-500">
                    Trợ lý AQUA đang đối soát điều khoản trong kho SSoT ĐẠI SƠN...
                  </p>
                </div>
              ) : errorMsg ? (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-2">
                  <p className="text-xs text-red-700 dark:text-red-200 leading-relaxed">
                    {errorMsg}
                  </p>
                </div>
              ) : answer ? (
                <div className="space-y-2.5">
                  {engineModeLabel && (
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{engineModeLabel}</span>
                    </div>
                  )}
                  <div className="text-xs sm:text-[13px] leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line">
                    {answer}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-1.5">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Sẵn sàng đối soát điều khoản pháp lý
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Chọn một câu hỏi gợi ý bên trên hoặc nhập câu hỏi / điều khoản cần đối soát để nhận phân tích trực tiếp từ kho SSoT.
                  </p>
                </div>
              )}
            </div>

            {/* TRÍCH DẪN NGUYÊN VĂN Quick Jump */}
            <div className="bg-white dark:bg-[#141413] rounded-xl border border-stone-200 dark:border-[#2E2C28] p-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                TRÍCH DẪN NGUYÊN VĂN TRONG KHO SSoT
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(matchedCitations.length > 0
                  ? matchedCitations
                  : [
                      {
                        docId: 'doc-bvdlcn-91-2025',
                        articleId: 'art-bvdlcn-d9',
                        label: 'Điều 9 Luật BVDLCN 91/2025/QH15',
                      },
                      {
                        docId: 'doc-nd-356-2025',
                        articleId: 'art-nd356-d6',
                        label: 'Khoản 1 Điều 6 NĐ 356/2025/NĐ-CP',
                      },
                      {
                        docId: 'doc-lxd-135-2025',
                        articleId: 'art-lxd-d14',
                        label: 'Điều 14 Luật Xây dựng 135/2025/QH15',
                      },
                    ]
                ).map((cit, idx) => (
                  <button
                    key={`${cit.docId}-${cit.articleId}-${idx}`}
                    onClick={() => onOpenReader(cit.docId, cit.articleId)}
                    className="px-2.5 py-1 rounded-lg bg-[#FBF5DF] dark:bg-stone-800 text-[#152D42] dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-amber-200/70 transition"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>{cit.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Attached Clause Input */}
            {showAttachInput && (
              <div className="bg-white dark:bg-[#141413] rounded-xl border border-[#C6A342]/60 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                  <span>📎 Điều khoản / Tình huống đính kèm:</span>
                  <button
                    onClick={() => {
                      setAttachedClause('');
                      setShowAttachInput(false);
                    }}
                    className="text-red-500 hover:underline text-[10px] cursor-pointer"
                  >
                    Xóa đính kèm
                  </button>
                </div>
                <textarea
                  value={attachedClause}
                  onChange={(e) => setAttachedClause(e.target.value)}
                  rows={2}
                  placeholder="Dán nội dung điều khoản hợp đồng hoặc quy định cần AQUA rà soát..."
                  className="w-full text-xs p-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-white dark:bg-[#141413] border-t border-stone-200 dark:border-[#2E2C28] space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskAqua();
                }}
                placeholder="Nhập câu hỏi pháp lý cho AQUA..."
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-[#C6A342]"
              />
              <button
                onClick={() => handleAskAqua()}
                disabled={isLoading}
                className="w-9 h-9 rounded-xl bg-[#C6A342] hover:bg-[#b59235] text-[#152D42] flex items-center justify-center shadow-xs cursor-pointer disabled:opacity-50"
                aria-label="Gửi câu hỏi"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px]">
              <button
                onClick={() => setShowAttachInput(!showAttachInput)}
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer ${
                  showAttachInput
                    ? 'bg-[#152D42] text-white border-[#152D42]'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                <Paperclip className="w-3 h-3" />
                <span>Đính kèm điều khoản</span>
              </button>

              <button
                onClick={() => setUseWebSearch(!useWebSearch)}
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer ${
                  useWebSearch
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Tra cứu Web: {useWebSearch ? 'Bật' : 'Tắt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
