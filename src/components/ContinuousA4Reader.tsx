import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Zap,
  ListTree,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { LegalArticle, LegalDocument } from '../types/legal';
import { InPlaceClauseDiffViewer } from './InPlaceClauseDiffViewer';

interface ContinuousA4ReaderProps {
  document: LegalDocument;
  activeArticleId: string | null;
  fontSizePx?: number;
  asOfDate?: string;
  articleByNoMap: Map<string, LegalArticle>;
  onSelectArticle: (articleId: string, shouldScroll?: boolean) => void;
  onOpenCrossLawDrawer: (article: LegalArticle) => void;
  onOpenAmendingDoc: (amendingDocId: string) => void;
  onAskAqua?: (question: string, clauseContext: string) => void;
}

export const ContinuousA4Reader: React.FC<ContinuousA4ReaderProps> = ({
  document: doc,
  activeArticleId,
  fontSizePx = 16,
  asOfDate,
  articleByNoMap,
  onSelectArticle,
  onOpenCrossLawDrawer,
  onOpenAmendingDoc,
  onAskAqua,
}) => {
  const [currentViewedArticleId, setCurrentViewedArticleId] = useState<string>(
    activeArticleId || doc.articles[0]?.id || ''
  );
  const [tocSearchQuery, setTocSearchQuery] = useState<string>('');
  const [onlyAmendedTocFilter, setOnlyAmendedTocFilter] = useState<boolean>(false);

  const a4ContainerRef = useRef<HTMLDivElement | null>(null);
  const articleElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const tocItemElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isProgrammaticScrollingRef = useRef<boolean>(false);
  const programmaticScrollTimerRef = useRef<number | null>(null);

  // Sync when parent changes activeArticleId externally (e.g., from search or genealogy tree)
  useEffect(() => {
    if (activeArticleId && activeArticleId !== currentViewedArticleId) {
      setCurrentViewedArticleId(activeArticleId);
    }
  }, [activeArticleId]);

  // Reset to first article when switching documents if currentViewedArticleId does not belong to doc
  useEffect(() => {
    if (!doc.articles.some((a) => a.id === currentViewedArticleId)) {
      const fallbackId = doc.articles[0]?.id || '';
      setCurrentViewedArticleId(fallbackId);
    }
  }, [doc.id, doc.articles, currentViewedArticleId]);

  const currentViewedArticle = useMemo(() => {
    return (
      doc.articles.find((a) => a.id === currentViewedArticleId) ||
      doc.articles[0] ||
      null
    );
  }, [doc.articles, currentViewedArticleId]);

  const currentViewedIndex = useMemo(() => {
    if (!currentViewedArticle) return 0;
    const idx = doc.articles.findIndex((a) => a.id === currentViewedArticle.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [doc.articles, currentViewedArticle]);

  // Keep the active item visible inside the Sticky Floating TOC
  useEffect(() => {
    if (!currentViewedArticleId) return;
    const tocBtn = tocItemElementsRef.current.get(currentViewedArticleId);
    if (tocBtn) {
      tocBtn.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [currentViewedArticleId]);

  // IntersectionObserver to automatically highlight the article currently in the viewport
  useEffect(() => {
    const containerEl = a4ContainerRef.current;
    if (!containerEl || doc.articles.length === 0) return;

    // Find the scrollable parent (Column 3 scroll container) if present
    const scrollRoot = containerEl.closest('.overflow-y-auto') as Element | null;

    const visibleRatios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollingRef.current) return;

        for (const entry of entries) {
          const artId = entry.target.getAttribute('data-article-id');
          if (!artId) continue;

          if (entry.isIntersecting) {
            visibleRatios.set(artId, entry.intersectionRatio);
          } else {
            visibleRatios.delete(artId);
          }
        }

        if (visibleRatios.size > 0) {
          // Pick the topmost visible article in document order, or the one with highest intersection ratio near the top
          let bestArticleId: string | null = null;
          let bestScore = -Infinity;

          for (const art of doc.articles) {
            if (!visibleRatios.has(art.id)) continue;
            const el = articleElementsRef.current.get(art.id);
            if (!el) continue;

            const rect = el.getBoundingClientRect();
            const rootTop = scrollRoot
              ? scrollRoot.getBoundingClientRect().top
              : 0;
            const relativeTop = rect.top - rootTop;

            // Favor articles whose header is near the top reading zone (between -80px and +260px)
            const distancePenalty = Math.abs(relativeTop - 90);
            const score = 1000 - distancePenalty;

            if (score > bestScore) {
              bestScore = score;
              bestArticleId = art.id;
            }
          }

          if (bestArticleId && bestArticleId !== currentViewedArticleId) {
            setCurrentViewedArticleId(bestArticleId);
            onSelectArticle(bestArticleId, false);
          }
        }
      },
      {
        root: scrollRoot || null,
        rootMargin: '-10% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    articleElementsRef.current.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [doc.id, doc.articles, currentViewedArticleId, onSelectArticle]);

  // Cleanup programmatic scroll timer
  useEffect(() => {
    return () => {
      if (programmaticScrollTimerRef.current) {
        window.clearTimeout(programmaticScrollTimerRef.current);
      }
    };
  }, []);

  const handleTocClick = useCallback(
    (articleId: string) => {
      isProgrammaticScrollingRef.current = true;
      if (programmaticScrollTimerRef.current) {
        window.clearTimeout(programmaticScrollTimerRef.current);
      }

      setCurrentViewedArticleId(articleId);
      onSelectArticle(articleId, false);

      const targetEl =
        articleElementsRef.current.get(articleId) ||
        window.document.getElementById(`sec-art-${articleId}`);

      if (targetEl) {
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }

      programmaticScrollTimerRef.current = window.setTimeout(() => {
        isProgrammaticScrollingRef.current = false;
      }, 700);
    },
    [onSelectArticle]
  );

  const filteredTocArticles = useMemo(() => {
    const q = tocSearchQuery.trim().toLowerCase();
    return doc.articles.filter((art) => {
      if (onlyAmendedTocFilter && !art.is_amended) return false;
      if (!q) return true;
      return (
        art.article_no.toLowerCase().includes(q) ||
        art.article_title.toLowerCase().includes(q) ||
        art.chapter_no.toLowerCase().includes(q) ||
        art.chapter_title.toLowerCase().includes(q)
      );
    });
  }, [doc.articles, tocSearchQuery, onlyAmendedTocFilter]);

  const amendedArticlesCount = useMemo(
    () => doc.articles.filter((a) => a.is_amended).length,
    [doc.articles]
  );

  // Format issue date for Vietnamese official header: "Hà Nội, ngày DD tháng MM năm YYYY"
  const formattedVietnamesePlaceAndDate = useMemo(() => {
    const raw = doc.issue_date || '';
    const parts = raw.split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return `Hà Nội, ngày ${dd} tháng ${mm} năm ${yyyy}`;
    }
    return `Hà Nội, ngày ${raw}`;
  }, [doc.issue_date]);

  return (
    <div
      ref={a4ContainerRef}
      className="flex flex-col xl:flex-row items-start gap-6 w-full pt-1"
    >
      {/* PHẦN 1 (BÊN TRÁI): THANH MỤC LỤC DÍNH (STICKY FLOATING TOC - 280PX) */}
      <aside className="w-full xl:w-[280px] shrink-0 xl:sticky xl:top-3 self-start bg-[#FBF9F5] dark:bg-[#1B1A18] border border-[#DED8C8] dark:border-[#2E2C28] rounded-2xl shadow-xs overflow-hidden">
        {/* Header Trạng thái Đang xem: Điều X */}
        <div className="p-3.5 bg-[#152D42] text-[#FBF9F5] space-y-2 border-b border-[#C6A342]/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#E9C96D] flex items-center gap-1.5">
              <ListTree className="w-3.5 h-3.5 text-[#E9C96D]" />
              <span>MỤC LỤC TỰ ĐỘNG A4</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#E9C96D] font-mono-code text-[10px] font-bold">
              {currentViewedIndex}/{doc.articles.length} Điều
            </span>
          </div>

          {/* Trạng thái đồng bộ IntersectionObserver: "Đang xem: Điều X" */}
          <div className="p-2.5 rounded-xl bg-black/25 border border-[#C6A342]/50 space-y-0.5">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-amber-300/90 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Đang xem: {currentViewedArticle?.article_no || 'Điều 1'}
                </span>
              </span>
              {currentViewedArticle?.is_amended && (
                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/60 text-amber-200 text-[9px] font-bold">
                  ⚠ Đã sửa đổi
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-white truncate">
              {currentViewedArticle
                ? `${currentViewedArticle.article_no}. ${currentViewedArticle.article_title}`
                : doc.title}
            </div>
          </div>

          {/* Thanh tiến độ đọc toàn văn */}
          <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-[#E9C96D] transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (currentViewedIndex / Math.max(1, doc.articles.length)) *
                      100
                  )
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Bộ lọc nhanh Điều khoản trong Sticky TOC */}
        <div className="p-2.5 border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-[#161514] space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tocSearchQuery}
              onChange={(e) => setTocSearchQuery(e.target.value)}
              placeholder="Tìm nhanh Điều, Chương..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1E1D1B] text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#C6A342]"
            />
          </div>

          {amendedArticlesCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyAmendedTocFilter((v) => !v)}
              className={`w-full px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center justify-between transition cursor-pointer ${
                onlyAmendedTocFilter
                  ? 'bg-amber-100 dark:bg-amber-950/90 border-amber-400 text-amber-950 dark:text-amber-200'
                  : 'bg-stone-100/80 dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-amber-400'
              }`}
            >
              <span>⚠ Chỉ hiện Điều đã sửa đổi</span>
              <span className="font-mono-code font-bold px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-950 dark:text-amber-200">
                {amendedArticlesCount}
              </span>
            </button>
          )}
        </div>

        {/* Danh sách các Điều khoản tự động highlight */}
        <div className="max-h-[58vh] overflow-y-auto p-2 space-y-1 divide-y divide-stone-100 dark:divide-stone-800/60">
          {filteredTocArticles.map((art, idx) => {
            const isActive = currentViewedArticleId === art.id;
            const prevChapter =
              idx > 0 ? filteredTocArticles[idx - 1].chapter_no : null;
            const showChapterDivider = art.chapter_no !== prevChapter;
            const clauseCount =
              art.clause_count ??
              art.clauses?.length ??
              Math.max(
                1,
                (art.content.match(/(?:^|\n)\s*\d+\.\s+/g) || []).length
              );

            return (
              <React.Fragment key={art.id}>
                {showChapterDivider && (
                  <div className="pt-2 pb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center justify-between">
                    <span className="truncate">
                      {art.chapter_no} · {art.chapter_title}
                    </span>
                  </div>
                )}

                <button
                  ref={(el) => {
                    if (el) {
                      tocItemElementsRef.current.set(art.id, el);
                    } else {
                      tocItemElementsRef.current.delete(art.id);
                    }
                  }}
                  type="button"
                  onClick={() => handleTocClick(art.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#152D42] text-[#E9C96D] font-bold shadow-xs border-l-4 border-l-[#C6A342]'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-[#FBF5DF]/80 dark:hover:bg-stone-800/70'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-mono-code text-[11px] font-bold ${
                          isActive
                            ? 'text-[#E9C96D]'
                            : 'text-[#152D42] dark:text-amber-300'
                        }`}
                      >
                        {art.article_no}.
                      </span>
                      <span className="truncate">{art.article_title}</span>
                    </div>

                    {art.is_amended && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/90 border border-amber-400/80 text-amber-900 dark:text-amber-200 text-[10px] font-semibold">
                        <span>⚠ Đã sửa đổi</span>
                        {art.amendment_info?.amending_doc_number && (
                          <span className="font-mono-code">
                            ({art.amendment_info.amending_doc_number})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded font-mono-code text-[10px] shrink-0 ${
                      isActive
                        ? 'bg-white/15 text-[#E9C96D] font-bold'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {clauseCount}k
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </aside>

      {/* PHẦN 2 (BÊN PHẢI): KHUNG ĐỌC TÀI LIỆU CHUẨN A4 CĂN GIỮA (NGHỊ ĐỊNH 30/2020/NĐ-CP) */}
      <div className="flex-1 min-w-0 w-full flex justify-center">
        <div
          style={{ fontSize: `${fontSizePx}px` }}
          className="w-full max-w-[210mm] min-h-[297mm] bg-[#FFFDF9] dark:bg-[#181715] text-stone-900 dark:text-stone-100 border border-[#DFD7C4] dark:border-[#2E2C28] rounded-sm shadow-[0_10px_35px_rgba(21,45,66,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.45)] px-6 py-8 sm:px-14 sm:py-12 md:px-16 md:py-14 font-serif-prose space-y-8 relative"
        >
          {/* Thanh trạng thái viền trên tờ giấy A4 */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-dashed border-stone-300 dark:border-stone-800 font-sans text-[11px] text-stone-500 dark:text-stone-400">
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#C6A342]" />
              <span className="font-bold text-[#152D42] dark:text-amber-300">
                BẢN TRÌNH BÀY CHUẨN A4 (NĐ 30/2020/NĐ-CP)
              </span>
              {doc.completeness_meta?.is_full_text ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold text-[10px]">
                  ✓ TOÀN VĂN ĐẦY ĐỦ 100% ({doc.articles.length}/{doc.completeness_meta.total_articles_count} Điều)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 border border-amber-400 text-amber-900 dark:text-amber-200 font-bold text-[10px]">
                  📑 BẢN TRÍCH LƯỢC {doc.articles.length}/{doc.completeness_meta?.total_articles_count || doc.total_articles_count || doc.articles.length} ĐIỀU TRỌNG TÂM — Phục vụ đối soát chuyên ngành
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#FBF5DF] dark:bg-amber-950/60 border border-[#C6A342]/60 text-[#152D42] dark:text-amber-200 font-semibold">
                Đang xem: {currentViewedArticle?.article_no || 'Điều 1'}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 hover:border-[#C6A342] text-stone-700 dark:text-stone-300 inline-flex items-center gap-1 cursor-pointer"
                title="In văn bản theo khổ trang A4"
              >
                <Printer className="w-3 h-3" />
                <span>In A4</span>
              </button>
            </div>
          </div>

          {/* 1. QUỐC HIỆU - TIÊU NGỮ & CƠ QUAN BAN HÀNH CHUẨN THỂ THỨC HÀNH CHÍNH */}
          <header className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-center pt-1 pb-6 border-b border-stone-300/80 dark:border-stone-800">
            {/* Ô 1: Tên cơ quan ban hành & Số ký hiệu */}
            <div className="sm:col-span-5 space-y-1 flex flex-col items-center justify-start">
              <div className="text-xs sm:text-[13px] font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100 leading-snug">
                {doc.issuing_body.toUpperCase()}
              </div>
              <div className="w-24 border-b border-stone-800 dark:border-stone-300 my-1" />
              <div className="text-xs font-mono-code text-stone-700 dark:text-stone-300 pt-0.5">
                Số: <b>{doc.doc_number}</b>
              </div>
            </div>

            {/* Ô 2: Quốc hiệu - Tiêu ngữ & Địa danh, ngày tháng ban hành */}
            <div className="sm:col-span-7 space-y-1 flex flex-col items-center justify-start">
              <div className="text-xs sm:text-[13px] font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-stone-900 dark:text-stone-100">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="w-40 border-b border-stone-800 dark:border-stone-300 my-1" />
              <div className="text-xs italic text-stone-600 dark:text-stone-400 pt-1">
                {formattedVietnamesePlaceAndDate}
              </div>
            </div>
          </header>

          {/* 2. TÊN LOẠI VĂN BẢN, TRÍCH YẾU & CĂN CỨ BAN HÀNH */}
          <section className="text-center space-y-2.5 py-2">
            <div className="text-lg sm:text-xl font-bold uppercase tracking-widest text-[#152D42] dark:text-amber-300">
              {doc.doc_type.toUpperCase()}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 max-w-2xl mx-auto leading-snug">
              {doc.title}
            </h2>
            <div className="w-28 border-b border-stone-400 dark:border-stone-600 mx-auto my-2" />
            <p className="text-xs sm:text-sm italic text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed text-justify sm:text-center">
              Căn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam; {doc.summary}
            </p>
          </section>

          {/* 3. LUỒNG TOÀN VĂN CÁC CHƯƠNG & ĐIỀU (TÍCH HỢP INTERSECTION OBSERVER) */}
          <div className="space-y-8">
            {doc.articles.map((art, idx) => {
              const prevChapter =
                idx > 0 ? doc.articles[idx - 1].chapter_no : null;
              const showChapterHeading = art.chapter_no !== prevChapter;
              const isCurrentlyActive = currentViewedArticleId === art.id;

              return (
                <div key={art.id} className="space-y-4">
                  {/* Tiêu đề Chương căn giữa chuẩn văn bản QPPL */}
                  {showChapterHeading && (
                    <div className="text-center pt-6 pb-2 border-t border-stone-200 dark:border-stone-800 space-y-1">
                      <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#152D42] dark:text-amber-300">
                        {art.chapter_no}
                      </div>
                      <div className="text-sm sm:text-base font-bold uppercase text-stone-900 dark:text-stone-100">
                        {art.chapter_title}
                      </div>
                    </div>
                  )}

                  {/* Khối Điều khoản A4 có gắn ref cho IntersectionObserver */}
                  <section
                    id={`sec-art-${art.id}`}
                    data-article-id={art.id}
                    ref={(el) => {
                      if (el) {
                        articleElementsRef.current.set(art.id, el);
                      } else {
                        articleElementsRef.current.delete(art.id);
                      }
                    }}
                    onClick={() => {
                      setCurrentViewedArticleId(art.id);
                      onSelectArticle(art.id, false);
                    }}
                    className={`scroll-mt-24 rounded-xl p-4 sm:p-5 transition-all duration-200 border ${
                      isCurrentlyActive
                        ? 'bg-[#FBF5DF]/45 dark:bg-[#231F17]/90 border-[#C6A342] shadow-2xs'
                        : 'bg-transparent border-transparent hover:border-stone-200 dark:hover:border-stone-800'
                    }`}
                  >
                    {/* Header của từng Điều: Tên Điều + Nhãn cảnh báo "⚠ Đã sửa đổi" + Nút "⚡ Đối soát chéo" */}
                    <div className="flex flex-wrap items-start justify-between gap-2.5 pb-2.5 mb-3 border-b border-stone-200/80 dark:border-stone-800/80">
                      <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                        <h3 className="font-bold text-[#152D42] dark:text-amber-300 text-base sm:text-[17px] leading-snug">
                          {art.article_no}. {art.article_title}
                        </h3>

                        {/* Nhãn cảnh báo "⚠ Đã sửa đổi" nếu is_amended = true */}
                        {art.is_amended && (
                          <span
                            className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/90 border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-sans font-bold inline-flex items-center gap-1 shadow-2xs"
                            title={
                              art.amendment_info?.summary ||
                              'Điều khoản đã được sửa đổi, bổ sung'
                            }
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                            <span>
                              ⚠ Đã sửa đổi
                              {art.amendment_info?.amending_doc_number
                                ? ` bởi ${art.amendment_info.amending_doc_number}`
                                : ''}
                            </span>
                          </span>
                        )}

                        {art.is_annulled && (
                          <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/90 border border-red-400 text-red-800 dark:text-red-200 text-xs font-sans font-bold">
                            ⛔ Đã bãi bỏ
                          </span>
                        )}
                      </div>

                      {/* Cụm nút hành động bên phải mỗi Điều: "⚡ Đối soát chéo" + Hỏi AQUA */}
                      <div className="flex items-center gap-1.5 shrink-0 font-sans">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCrossLawDrawer(art);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#152D42] hover:bg-[#1E3F5A] text-[#E9C96D] border border-[#C6A342]/60 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                          title="Kích hoạt Prompt Engine AI đối soát chéo liên luật & cảnh báo rủi ro xuất toán cho Điều này"
                        >
                          <Zap className="w-3.5 h-3.5 text-[#E9C96D]" />
                          <span>⚡ Đối soát chéo</span>
                        </button>

                        {onAskAqua && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAskAqua(
                                `Giải thích và lưu ý kiểm toán đối với ${art.article_no} (${art.article_title}) của văn bản ${doc.doc_number}`,
                                `${doc.doc_number} - ${art.article_no}. ${art.article_title}:\n${art.content}`
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FBF5DF] dark:bg-stone-800 hover:bg-amber-200/70 border border-[#C6A342]/60 text-[#152D42] dark:text-amber-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                            title="Hỏi Trợ lý pháp lý AQUA về Điều này"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">AQUA</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Nội dung các Khoản/Điểm (Hỗ trợ In-place Diff Viewer cho Khoản bị sửa đổi) */}
                    <div className="leading-relaxed text-justify">
                      <InPlaceClauseDiffViewer
                        article={art}
                        articleByNoMap={articleByNoMap}
                        onSelectArticle={onSelectArticle}
                        onOpenAmendingDoc={onOpenAmendingDoc}
                        asOfDate={asOfDate}
                      />
                    </div>

                    {/* Hộp thông tin tóm tắt sửa đổi nếu có */}
                    {art.amendment_info?.summary && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-xs font-sans flex flex-wrap items-center justify-between gap-2">
                        <div className="text-amber-950 dark:text-amber-200">
                          <strong>
                            🧬 Ghi chú phả hệ ({art.amendment_info.amending_doc_number} · có hiệu lực từ{' '}
                            {art.amendment_info.effective_date}):
                          </strong>{' '}
                          {art.amendment_info.summary}
                        </div>
                        {art.amendment_info.amending_doc_id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetDocId = art.amendment_info?.amending_doc_id;
                              if (targetDocId) {
                                onOpenAmendingDoc(targetDocId);
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-[#152D42] text-[#E9C96D] font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <span>Mở văn bản sửa đổi</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                </div>
              );
            })}
          </div>

          {/* 4. NƠI NHẬN & CHỮ KÝ CUỐI TRANG A4 CHUẨN THỂ THỨC NGHỊ ĐỊNH 30/2020/NĐ-CP */}
          <footer className="pt-8 mt-10 border-t-2 border-stone-300 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-12 gap-6 text-xs">
            {/* Cột trái: Nơi nhận chuẩn thể thức */}
            <div className="sm:col-span-6 space-y-1 text-stone-600 dark:text-stone-400">
              <div className="font-bold italic underline underline-offset-2 text-stone-900 dark:text-stone-100 text-xs">
                Nơi nhận:
              </div>
              <ul className="space-y-0.5 text-[11px] leading-relaxed pl-1">
                <li>- Ủy ban Thường vụ Quốc hội, Chính phủ;</li>
                <li>- Các Bộ, cơ quan ngang Bộ, cơ quan thuộc Chính phủ;</li>
                <li>- HĐND, UBND các tỉnh, thành phố trực thuộc Trung ương;</li>
                <li>- Công báo; Cổng Thông tin điện tử Chính phủ;</li>
                <li>- Lưu: VT, Hồ sơ Pháp chế, Kho SSoT ĐẠI SƠN.</li>
              </ul>
            </div>

            {/* Cột phải: Quyền hạn, Chức vụ, Con dấu và Chữ ký */}
            <div className="sm:col-span-6 text-center space-y-5 flex flex-col items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100 text-xs sm:text-[13px]">
                  TM. {doc.issuing_body.toUpperCase()}
                </div>
                <div className="text-[11px] italic text-stone-500">
                  (Ký, ghi rõ họ tên và đóng dấu)
                </div>
              </div>

              {doc.authenticity_tier === 'OFFICIAL_VBHN' ||
              doc.authenticity_tier === 'VERIFIED_SSOT' ||
              doc.authenticity_tier === 'VERIFIED_FULL_SSOT' ? (
                <div className="px-4 py-2 rounded border-2 border-red-600/75 bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-sans font-bold text-[11px] uppercase tracking-wider shadow-2xs">
                  [Đã ký & Xác thực Toàn văn SSoT]
                </div>
              ) : (
                <div className="px-4 py-2 rounded border-2 border-amber-500/80 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-sans font-bold text-[11px] uppercase tracking-wider shadow-2xs">
                  [Bản Trích lược / Tổng hợp Tra cứu SSoT — Đối chiếu Công báo khi trích dẫn]
                </div>
              )}

              <div className="font-bold text-sm text-stone-900 dark:text-stone-100 pt-1">
                {doc.signer}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
