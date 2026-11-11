import React, { useMemo, useState } from 'react';
import { ArrowUpRight, GitCompare, History, CheckCircle2, XCircle } from 'lucide-react';
import { ClauseItem, LegalArticle } from '../types/legal';

interface InPlaceClauseDiffViewerProps {
  article: LegalArticle;
  articleByNoMap: Map<string, LegalArticle>;
  onSelectArticle: (articleId: string, scroll?: boolean) => void;
  onOpenAmendingDoc?: (amendingDocId: string) => void;
}

/**
 * Derive structured ClauseItem[] from article.clauses if explicitly defined,
 * or automatically parse numbered clauses ("1. ...", "2. ...") from article.content
 * and enrich with article.amendment_info if the article is marked is_amended.
 */
function resolveArticleClauses(article: LegalArticle): {
  preamble: string | null;
  clauses: ClauseItem[];
} {
  const lines = article.content.split('\n');
  let preamble: string | null = null;
  if (lines.length > 0 && !/^\s*\d+\.\s+/.test(lines[0])) {
    preamble = lines[0].trim();
  }

  if (article.clauses && article.clauses.length > 0) {
    return { preamble, clauses: article.clauses };
  }

  // Parse numbered clauses from raw content
  const parsedClauses: ClauseItem[] = [];
  let currentClause: { num: string; lines: string[] } | null = null;

  for (const rawLine of lines) {
    const m = rawLine.match(/^\s*(\d+)\.\s+(.*)$/);
    if (m) {
      if (currentClause) {
        parsedClauses.push({
          id: `${article.id}-k${currentClause.num}`,
          clause_no: `Khoản ${currentClause.num}`,
          text: `${currentClause.num}. ${currentClause.lines.join('\n')}`,
          is_amended: false,
        });
      }
      currentClause = { num: m[1], lines: [m[2]] };
    } else if (currentClause) {
      currentClause.lines.push(rawLine);
    }
  }

  if (currentClause) {
    parsedClauses.push({
      id: `${article.id}-k${currentClause.num}`,
      clause_no: `Khoản ${currentClause.num}`,
      text: `${currentClause.num}. ${currentClause.lines.join('\n')}`,
      is_amended: false,
    });
  }

  // If article is amended and has amendment_info, attach in-place diff to matching scoped clause(s)
  if (article.is_amended && article.amendment_info && parsedClauses.length > 0) {
    const scopesText = (article.amendment_info.scopes || []).join(' ').toLowerCase();
    let matchedAny = false;

    parsedClauses.forEach((c) => {
      const clauseKey = c.clause_no.toLowerCase();
      if (scopesText.includes(clauseKey)) {
        matchedAny = true;
        c.is_amended = true;
        if (article.amendment_info?.previous_excerpt) {
          c.diff_data = {
            original_text: article.amendment_info.previous_excerpt,
            replaced_text: c.text,
            amending_doc_id: article.amendment_info?.amending_doc_id || '',
            amending_doc_number: article.amendment_info?.amending_doc_number,
            amending_doc_title: article.amendment_info?.amending_doc_title,
            effective_date: article.amendment_info?.effective_date || '2025-01-01',
            change_summary: article.amendment_info?.summary,
          };
        }
      }
    });

    if (!matchedAny && article.amendment_info.previous_excerpt) {
      parsedClauses[0].is_amended = true;
      parsedClauses[0].diff_data = {
        original_text: article.amendment_info.previous_excerpt,
        replaced_text: parsedClauses[0].text,
        amending_doc_id: article.amendment_info.amending_doc_id || '',
        amending_doc_number: article.amendment_info.amending_doc_number,
        amending_doc_title: article.amendment_info.amending_doc_title,
        effective_date: article.amendment_info.effective_date || '2025-01-01',
        change_summary: article.amendment_info.summary,
      };
    }
  }

  return { preamble, clauses: parsedClauses };
}

export const InPlaceClauseDiffViewer: React.FC<InPlaceClauseDiffViewerProps> = ({
  article,
  articleByNoMap,
  onSelectArticle,
  onOpenAmendingDoc,
}) => {
  const { preamble, clauses } = useMemo(
    () => resolveArticleClauses(article),
    [article]
  );

  // Track which amended clauses have their In-place Diff expanded
  const [expandedDiffIds, setExpandedDiffIds] = useState<Record<string, boolean>>({});

  const toggleClauseDiff = (clauseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDiffIds((prev) => ({
      ...prev,
      [clauseId]: !prev[clauseId],
    }));
  };

  // Helper to render clickable "Điều X" links inside clause text
  const renderLinkedText = (text: string) => {
    const parts = text.split(/(Điều\s+\d+)/gi);
    return parts.map((part, idx) => {
      const m = part.match(/^Điều\s+(\d+)$/i);
      if (m) {
        const targetArt = articleByNoMap.get(`điều ${m[1]}`.toLowerCase());
        if (targetArt) {
          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectArticle(targetArt.id, true);
              }}
              className="text-[#286181] dark:text-amber-400 font-semibold underline underline-offset-2 hover:text-[#152D42] cursor-pointer"
            >
              {part}
            </button>
          );
        }
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  if (clauses.length === 0) {
    return (
      <div className="text-stone-800 dark:text-stone-200 whitespace-pre-line leading-relaxed">
        {renderLinkedText(article.content)}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {preamble && (
        <div className="text-stone-700 dark:text-stone-300 italic text-sm">
          {renderLinkedText(preamble)}
        </div>
      )}

      {clauses.map((clause) => {
        const isAmendedClause = Boolean(clause.is_amended && clause.diff_data);
        const isExpanded = Boolean(expandedDiffIds[clause.id]);
        const diff = clause.diff_data;

        if (!isAmendedClause || !diff) {
          return (
            <div
              key={clause.id}
              className="p-2.5 rounded-xl bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/70 dark:border-stone-800/80 text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line"
            >
              {renderLinkedText(clause.text)}
            </div>
          );
        }

        const amendingCode =
          diff.amending_doc_number ||
          article.amendment_info?.amending_doc_number ||
          'Văn bản sửa đổi';

        return (
          <div
            key={clause.id}
            className="p-3.5 rounded-xl border-2 border-amber-400 dark:border-amber-700/90 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]/40 dark:from-[#241E12] dark:to-[#1B170E] space-y-2.5 shadow-2xs"
          >
            {/* Header cảnh báo Khoản bị sửa đổi kèm số hiệu luật sửa đổi và nút "So sánh với bản gốc" */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-300/70 dark:border-amber-800/70">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-amber-200/90 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 text-[11px] font-bold font-mono-code inline-flex items-center gap-1">
                  <span>⚠ {clause.clause_no} · Đã sửa đổi bởi [{amendingCode}]</span>
                </span>
                <span className="text-[11px] font-mono-code text-amber-800 dark:text-amber-300">
                  Hiệu lực: <b>{diff.effective_date}</b>
                </span>
                {diff.amending_doc_id && onOpenAmendingDoc && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAmendingDoc(diff.amending_doc_id);
                    }}
                    className="text-[11px] font-semibold text-[#152D42] dark:text-amber-300 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Mở {amendingCode}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => toggleClauseDiff(clause.id, e)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                  isExpanded
                    ? 'bg-[#152D42] text-[#E9C96D]'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-200 border border-amber-500/50'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>
                  {isExpanded ? 'Ẩn so sánh bản gốc' : 'So sánh với bản gốc'}
                </span>
              </button>
            </div>

            {/* Nội dung hiện hành của Khoản */}
            <div className="text-stone-900 dark:text-stone-100 leading-relaxed whitespace-pre-line">
              {renderLinkedText(clause.text)}
            </div>

            {/* Khối In-place Diff mở rộng khi bấm "So sánh với bản gốc" */}
            {isExpanded && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-2 pt-2.5 border-t border-amber-300/80 dark:border-amber-800 space-y-2.5 font-sans"
              >
                {diff.change_summary && (
                  <div className="text-xs text-amber-950 dark:text-amber-200 bg-white/70 dark:bg-black/20 px-3 py-2 rounded-lg border border-amber-300/60 dark:border-amber-800/60 flex items-start gap-2">
                    <History className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Tóm tắt thay đổi pháp lý:</strong> {diff.change_summary}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Khối văn bản cũ bị gạch ngang màu đỏ */}
                  <div className="p-3 rounded-xl bg-red-50/90 dark:bg-red-950/40 border border-red-300 dark:border-red-800/80 space-y-1.5">
                    <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-red-800 dark:text-red-300">
                      <span className="inline-flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        <span>Văn bản gốc (Đã bị thay thế)</span>
                      </span>
                      <span className="font-mono-code text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60">
                        Hết hiệu lực từ {diff.effective_date}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-red-900/90 dark:text-red-200/90 line-through decoration-red-600/80 leading-relaxed whitespace-pre-line">
                      {diff.original_text}
                    </p>
                  </div>

                  {/* Khối văn bản mới màu xanh lá đang có hiệu lực */}
                  <div className="p-3 rounded-xl bg-emerald-50/95 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-700/80 space-y-1.5">
                    <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Nội dung mới đang có hiệu lực</span>
                      </span>
                      <span className="font-mono-code text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-200 font-bold">
                        Theo {amendingCode}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 font-medium leading-relaxed whitespace-pre-line">
                      {diff.replaced_text}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
