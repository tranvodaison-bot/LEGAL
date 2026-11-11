import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  Paperclip,
  BookOpen,
  Globe,
  Scale,
} from 'lucide-react';
import { LegalDocument } from '../types/legal';

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

      const data = await res.json();
      if (res.ok && data.answer) {
        setAnswer(data.answer);
      } else {
        setErrorMsg(
          data?.error ||
            'Không thể kết nối dịch vụ AI. Hệ thống từ chối sinh câu trả lời mẫu để bảo đảm tính trung thực pháp lý (Nguyên tắc P0-05). Vui lòng thử lại hoặc tra cứu trực tiếp điều khoản bên dưới.'
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? `Lỗi kết nối máy chủ AI: ${err.message}. Hệ thống không tự động hiển thị câu trả lời mẫu để tránh nhầm lẫn căn cứ pháp lý.`
          : 'Không thể kết nối máy chủ AI. Vui lòng kiểm tra kết nối và thử lại.'
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
                  Tra cứu nhanh điều khoản & đối soát văn bản pháp lý
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

            {/* Structured Answer Card (4-State UI: Loading / Error / Empty / Success) */}
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
                  <div className="text-xs font-bold text-red-800 dark:text-red-300">
                    Cảnh báo gián đoạn kết nối AI (Đã chặn Fallback giả định P0-05)
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-200 leading-relaxed">
                    {errorMsg}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAskAqua()}
                    className="px-3 py-1 rounded-lg bg-red-700 text-white text-[11px] font-semibold hover:bg-red-800 cursor-pointer"
                  >
                    Thử kết nối lại
                  </button>
                </div>
              ) : answer ? (
                <div className="text-xs sm:text-[13px] leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line">
                  {answer}
                </div>
              ) : (
                <div className="py-4 text-center space-y-1.5">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Chưa có truy vấn nào được gửi
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
                <button
                  onClick={() => onOpenReader('doc-bvdlcn-91-2025', 'art-bvdlcn-d9')}
                  className="px-2.5 py-1 rounded-lg bg-[#FBF5DF] dark:bg-stone-800 text-[#152D42] dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Điều 9 Luật BVDLCN 91/2025/QH15</span>
                </button>
                <button
                  onClick={() => onOpenReader('doc-nd-356-2025', 'art-nd356-d6')}
                  className="px-2.5 py-1 rounded-lg bg-[#FBF5DF] dark:bg-stone-800 text-[#152D42] dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Khoản 1 Điều 6 NĐ 356/2025/NĐ-CP</span>
                </button>
                <button
                  onClick={() => onOpenReader('doc-lxd-135-2025', 'art-lxd-d14')}
                  className="px-2.5 py-1 rounded-lg bg-[#FBF5DF] dark:bg-stone-800 text-[#152D42] dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Điều 14 Luật Xây dựng 135/2025/QH15</span>
                </button>
              </div>
            </div>
          </div>

          {/* Input Footer matching Screenshot 5 */}
          <div className="p-3.5 bg-white dark:bg-[#141413] border-t border-stone-200 dark:border-[#2E2C28] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="accent-[#152D42]"
                />
                <Globe className="w-3.5 h-3.5 text-[#286181]" />
                <span>Tra cứu web cho câu hỏi này</span>
              </label>

              <button
                onClick={() => setShowAttachInput((v) => !v)}
                className="text-[11px] text-[#286181] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Paperclip className="w-3 h-3" />
                <span>{showAttachInput ? 'Ẩn trích đoạn' : 'Đính kèm điều khoản'}</span>
              </button>
            </div>

            {showAttachInput && (
              <textarea
                value={attachedClause}
                onChange={(e) => setAttachedClause(e.target.value)}
                rows={2}
                placeholder="Dán điều khoản hợp đồng hoặc nội dung cần rà soát vào đây..."
                className="w-full p-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#1A1917]"
              />
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAqua();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Hỏi, hoặc dán điều khoản cần rà soát..."
                className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#1A1917] focus:outline-none focus:border-[#C6A342]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl bg-[#D0AF54] text-[#152D42] font-bold hover:bg-[#c29f42] transition cursor-pointer disabled:opacity-50"
                title="Gửi câu hỏi"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[10px] text-stone-400 leading-snug">
              Nếu kho SSoT ĐẠI SƠN chưa có kết quả, bạn có thể bật tra cứu web. Không gửi dữ liệu mật hoặc bí mật nhà nước lên mạng công cộng.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
