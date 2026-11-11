import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  Columns2,
  FileDiff,
  Filter,
  GitCompare,
  History,
  Sparkles,
  XCircle,
  Search,
  Layers,
} from 'lucide-react';
import {
  LegalDocument,
  LegalCrossReference,
  LegalArticle,
} from '../types/legal';
import { RELATION_META } from '../data/legalCorpus';

interface SideBySideComparisonViewProps {
  documents: LegalDocument[];
  crossReferences: LegalCrossReference[];
  initialLeftDocId?: string;
  initialRightDocId?: string;
  onOpenReader: (docId: string, articleId?: string) => void;
  onAskAquaWithContext?: (question: string, clauseContext: string) => void;
}

type DiffToken = {
  type: 'same' | 'removed' | 'added';
  text: string;
};

import { computeDeterministicDiff } from '../core/engines/deterministicDiffEngine';

/**
 * Compute deterministic word/sentence-level Longest Common Subsequence (LCS) diff between two Vietnamese legal texts
 * without ever hardcoding similarityPercent = 45.
 */
function computeWordDiff(oldText: string, newText: string): {
  leftTokens: DiffToken[];
  rightTokens: DiffToken[];
  addedWordsCount: number;
  removedWordsCount: number;
  unchangedWordsCount: number;
  similarityPercent: number;
} {
  const diff = computeDeterministicDiff(oldText, newText);
  return {
    leftTokens: diff.tokens.filter((t) => t.type !== 'added'),
    rightTokens: diff.tokens.filter((t) => t.type !== 'removed'),
    addedWordsCount: diff.addedCount,
    removedWordsCount: diff.removedCount,
    unchangedWordsCount: diff.sameCount,
    similarityPercent: diff.similarityPercent,
  };
}

interface AlignedComparisonRow {
  id: string;
  sectionLabel: string;
  leftTitle: string;
  rightTitle: string;
  leftText: string;
  rightText: string;
  isChanged: boolean;
  amendingBadge?: string;
  effectiveDate?: string;
  changeNote?: string;
  leftArticle?: LegalArticle;
  rightArticle?: LegalArticle;
}

const PRESET_COMPARISON_PAIRS: Array<{
  id: string;
  label: string;
  mode: 'version_evolution' | 'two_documents';
  leftDocId: string;
  rightDocId: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'preset-lkt-88-versions',
    label: 'Luật Kế toán 88/2015/QH13: Bản gốc (2015) ↔ Bản sửa đổi (Luật 56/2024/QH15 & đồng bộ Luật QLT 108/2025/QH15)',
    mode: 'version_evolution',
    leftDocId: 'doc-lkt-88-2015',
    rightDocId: 'doc-lsd9luat-56-2024',
    badge: 'So sánh 2 Phiên bản',
    description:
      'Đối chiếu song song từng Điều/Khoản của Luật Kế toán 88/2015/QH13 trước và sau khi được sửa đổi, bổ sung bởi Luật 56/2024/QH15 và đồng bộ hóa đơn điện tử với Luật Quản lý thuế 38/2019/QH14, 108/2025/QH15.',
  },
  {
    id: 'preset-lxd-versions',
    label: 'Nghị định 15/2021/NĐ-CP ↔ Luật Xây dựng mới 135/2025/QH15',
    mode: 'two_documents',
    leftDocId: 'doc-nd-15-2023',
    rightDocId: 'doc-lxd-135-2025',
    badge: 'Đối chiếu Thi hành',
    description:
      'So sánh sự thay đổi căn bản về điều kiện khởi công, cấp phép xây dựng và thẩm định Báo cáo nghiên cứu khả thi giữa Nghị định 15/2021/NĐ-CP và Luật Xây dựng 135/2025/QH15.',
  },
  {
    id: 'preset-bvdlcn-versions',
    label: 'Nghị định 13/2023/NĐ-CP ↔ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15',
    mode: 'two_documents',
    leftDocId: 'doc-exp-nd13-2023',
    rightDocId: 'doc-bvdlcn-91-2025',
    badge: 'Nâng cấp lên Luật',
    description:
      'Đối chiếu các quy định về sự đồng ý của chủ thể dữ liệu, đánh giá tác động xử lý dữ liệu cá nhân (DPIA) từ Nghị định 13/2023 lên Luật 91/2025/QH15.',
  },
  {
    id: 'preset-lkt-vs-lsd56',
    label: 'Luật Kế toán 88/2015/QH13 ↔ Luật số 56/2024/QH15 (Sửa đổi 09 Luật Tài chính)',
    mode: 'two_documents',
    leftDocId: 'doc-lkt-88-2015',
    rightDocId: 'doc-lsd9luat-56-2024',
    badge: 'Văn bản Liên quan',
    description:
      'So sánh trực tiếp các Điều khoản tương ứng giữa Luật Kế toán và Luật số 56/2024/QH15 sửa đổi, bổ sung 09 Luật lĩnh vực Tài chính - Ngân sách.',
  },
];

export const SideBySideComparisonView: React.FC<SideBySideComparisonViewProps> = ({
  documents,
  crossReferences,
  initialLeftDocId,
  initialRightDocId,
  onOpenReader,
  onAskAquaWithContext,
}) => {
  const docMap = useMemo(() => {
    const m = new Map<string, LegalDocument>();
    documents.forEach((d) => m.set(d.id, d));
    return m;
  }, [documents]);

  // Mode: 'version_evolution' (Bản gốc vs Bản hợp nhất sửa đổi của cùng 1 văn bản) | 'two_documents' (So sánh 2 văn bản bất kỳ)
  const [comparisonMode, setComparisonMode] = useState<
    'version_evolution' | 'two_documents'
  >('version_evolution');

  const [leftDocId, setLeftDocId] = useState<string>(
    initialLeftDocId && docMap.has(initialLeftDocId)
      ? initialLeftDocId
      : 'doc-lkt-88-2015'
  );
  const [rightDocId, setRightDocId] = useState<string>(
    initialRightDocId && docMap.has(initialRightDocId)
      ? initialRightDocId
      : 'doc-lsd9luat-56-2024'
  );

  const [selectedLeftArticleId, setSelectedLeftArticleId] =
    useState<string>('ALL');
  const [selectedRightArticleId, setSelectedRightArticleId] =
    useState<string>('ALL');

  const [showWordDiff, setShowWordDiff] = useState<boolean>(true);
  const [onlyShowDifferences, setOnlyShowDifferences] =
    useState<boolean>(false);
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [filterKeyword, setFilterKeyword] = useState<string>('');

  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  const leftDoc =
    docMap.get(leftDocId) ||
    docMap.get('doc-lkt-88-2015') ||
    documents[0];
  const rightDoc =
    docMap.get(rightDocId) ||
    docMap.get('doc-lsd9luat-56-2024') ||
    documents[1] ||
    documents[0];

  // Handle synchronized scrolling when in Dual-Pane Scroll View
  const handleLeftScroll = () => {
    if (!syncScroll || !leftScrollRef.current || !rightScrollRef.current) return;
    if (isSyncingLeft.current) {
      isSyncingLeft.current = false;
      return;
    }
    isSyncingRight.current = true;
    const ratio =
      leftScrollRef.current.scrollTop /
      Math.max(
        1,
        leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight
      );
    rightScrollRef.current.scrollTop =
      ratio *
      (rightScrollRef.current.scrollHeight -
        rightScrollRef.current.clientHeight);
  };

  const handleRightScroll = () => {
    if (!syncScroll || !leftScrollRef.current || !rightScrollRef.current) return;
    if (isSyncingRight.current) {
      isSyncingRight.current = false;
      return;
    }
    isSyncingLeft.current = true;
    const ratio =
      rightScrollRef.current.scrollTop /
      Math.max(
        1,
        rightScrollRef.current.scrollHeight -
          rightScrollRef.current.clientHeight
      );
    leftScrollRef.current.scrollTop =
      ratio *
      (leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight);
  };

  // Build aligned comparison rows depending on comparisonMode
  const alignedRows = useMemo<AlignedComparisonRow[]>(() => {
    if (!leftDoc) return [];

    if (comparisonMode === 'version_evolution') {
      // Compare Original Version vs Consolidated/Amended Version of leftDoc
      const rows: AlignedComparisonRow[] = [];
      const targetArticles =
        selectedLeftArticleId === 'ALL'
          ? leftDoc.articles
          : leftDoc.articles.filter((a) => a.id === selectedLeftArticleId);

      targetArticles.forEach((art) => {
        if (art.clauses && art.clauses.length > 0) {
          art.clauses.forEach((clause) => {
            const hasDiff = Boolean(clause.is_amended && clause.diff_data);
            const originalText = hasDiff
              ? clause.diff_data!.original_text
              : clause.text;
            const currentText = hasDiff
              ? clause.diff_data!.replaced_text
              : clause.text;

            rows.push({
              id: `${art.id}-${clause.id}`,
              sectionLabel: `${art.article_no} · ${clause.clause_no}`,
              leftTitle: `${art.article_no} (${clause.clause_no}) — Bản gốc khi ban hành (${leftDoc.issue_date.slice(0, 4)})`,
              rightTitle: `${art.article_no} (${clause.clause_no}) — Bản hiện hành hợp nhất`,
              leftText: originalText,
              rightText: currentText,
              isChanged: hasDiff && originalText.trim() !== currentText.trim(),
              amendingBadge: clause.diff_data?.amending_doc_number,
              effectiveDate: clause.diff_data?.effective_date,
              changeNote: clause.diff_data?.change_summary,
              leftArticle: art,
              rightArticle: art,
            });
          });
        } else {
          const hasArtDiff = Boolean(art.is_amended && art.amendment_info);
          const originalText =
            art.amendment_info?.previous_excerpt || art.content;
          const currentText = art.content;

          rows.push({
            id: art.id,
            sectionLabel: `${art.article_no}. ${art.article_title}`,
            leftTitle: `${art.article_no} — Bản gốc (${leftDoc.issue_date.slice(0, 4)})`,
            rightTitle: `${art.article_no} — Bản sửa đổi / Hợp nhất hiện hành`,
            leftText: originalText,
            rightText: currentText,
            isChanged: hasArtDiff,
            amendingBadge: art.amendment_info?.amending_doc_number,
            effectiveDate: art.amendment_info?.effective_date,
            changeNote: art.amendment_info?.summary || art.amendment_note,
            leftArticle: art,
            rightArticle: art,
          });
        }
      });

      return rows;
    }

    // Mode 2: Compare Two Different / Related Documents (leftDoc vs rightDoc)
    if (!rightDoc) return [];

    const leftArts =
      selectedLeftArticleId === 'ALL'
        ? leftDoc.articles
        : leftDoc.articles.filter((a) => a.id === selectedLeftArticleId);
    const rightArts =
      selectedRightArticleId === 'ALL'
        ? rightDoc.articles
        : rightDoc.articles.filter((a) => a.id === selectedRightArticleId);

    // If user selected 1 specific article on each side, compare them directly 1-to-1
    if (leftArts.length === 1 && rightArts.length === 1) {
      const lArt = leftArts[0];
      const rArt = rightArts[0];
      return [
        {
          id: `${lArt.id}-vs-${rArt.id}`,
          sectionLabel: `${lArt.article_no} (${leftDoc.doc_number}) ↔ ${rArt.article_no} (${rightDoc.doc_number})`,
          leftTitle: `${lArt.article_no}. ${lArt.article_title}`,
          rightTitle: `${rArt.article_no}. ${rArt.article_title}`,
          leftText: lArt.content,
          rightText: rArt.content,
          isChanged: lArt.content.trim() !== rArt.content.trim(),
          amendingBadge: rArt.amendment_info?.amending_doc_number,
          effectiveDate: rightDoc.effective_date,
          changeNote:
            lArt.amendment_info?.summary || rArt.amendment_info?.summary,
          leftArticle: lArt,
          rightArticle: rArt,
        },
      ];
    }

    const maxLen = Math.max(leftArts.length, rightArts.length);
    const rows: AlignedComparisonRow[] = [];

    for (let idx = 0; idx < maxLen; idx++) {
      const lArt = leftArts[idx];
      const rArt = rightArts[idx];
      const leftText = lArt
        ? lArt.content
        : '(Không có điều khoản tương ứng ở Văn bản A)';
      const rightText = rArt
        ? rArt.content
        : '(Không có điều khoản tương ứng ở Văn bản B)';

      rows.push({
        id: `pair-${idx}-${lArt?.id || 'none'}-${rArt?.id || 'none'}`,
        sectionLabel: `${lArt?.article_no || '—'} (${leftDoc.doc_number}) ↔ ${
          rArt?.article_no || '—'
        } (${rightDoc.doc_number})`,
        leftTitle: lArt
          ? `${lArt.article_no}. ${lArt.article_title}`
          : 'Chưa có điều khoản tương ứng',
        rightTitle: rArt
          ? `${rArt.article_no}. ${rArt.article_title}`
          : 'Chưa có điều khoản tương ứng',
        leftText,
        rightText,
        isChanged: leftText.trim() !== rightText.trim(),
        amendingBadge:
          rArt?.amendment_info?.amending_doc_number ||
          lArt?.amendment_info?.amending_doc_number,
        effectiveDate: rightDoc.effective_date,
        changeNote:
          rArt?.amendment_info?.summary || lArt?.amendment_info?.summary,
        leftArticle: lArt,
        rightArticle: rArt,
      });
    }

    return rows;
  }, [
    comparisonMode,
    leftDoc,
    rightDoc,
    selectedLeftArticleId,
    selectedRightArticleId,
  ]);

  const filteredAlignedRows = useMemo(() => {
    const kw = filterKeyword.trim().toLowerCase();
    return alignedRows.filter((row) => {
      if (onlyShowDifferences && !row.isChanged) return false;
      if (!kw) return true;
      return (
        row.sectionLabel.toLowerCase().includes(kw) ||
        row.leftTitle.toLowerCase().includes(kw) ||
        row.rightTitle.toLowerCase().includes(kw) ||
        row.leftText.toLowerCase().includes(kw) ||
        row.rightText.toLowerCase().includes(kw)
      );
    });
  }, [alignedRows, onlyShowDifferences, filterKeyword]);

  // Precompute word diffs for displayed rows
  const rowsWithComputedDiff = useMemo(() => {
    return filteredAlignedRows.map((row) => ({
      ...row,
      diff: computeWordDiff(row.leftText, row.rightText),
    }));
  }, [filteredAlignedRows]);

  // Overall summary telemetry
  const diffStats = useMemo(() => {
    const totalRows = alignedRows.length;
    const changedRows = alignedRows.filter((r) => r.isChanged).length;
    const unchangedRows = totalRows - changedRows;
    let totalAddedWords = 0;
    let totalRemovedWords = 0;

    rowsWithComputedDiff.forEach((r) => {
      if (r.isChanged) {
        totalAddedWords += r.diff.addedWordsCount;
        totalRemovedWords += r.diff.removedWordsCount;
      }
    });

    return {
      totalRows,
      changedRows,
      unchangedRows,
      totalAddedWords,
      totalRemovedWords,
    };
  }, [alignedRows, rowsWithComputedDiff]);

  // Cross-reference relation between leftDoc and rightDoc if any
  const matchedCrossRef = useMemo(() => {
    if (!leftDoc || !rightDoc) return null;
    return crossReferences.find(
      (x) =>
        (x.source_doc_id === leftDoc.id && x.target_doc_id === rightDoc.id) ||
        (x.source_doc_id === rightDoc.id && x.target_doc_id === leftDoc.id)
    );
  }, [crossReferences, leftDoc, rightDoc]);

  const handleSwapDocuments = () => {
    const tempDoc = leftDocId;
    const tempArt = selectedLeftArticleId;
    setLeftDocId(rightDocId);
    setSelectedLeftArticleId(selectedRightArticleId);
    setRightDocId(tempDoc);
    setSelectedRightArticleId(tempArt);
  };

  return (
    <div className="space-y-5">
      {/* Header & Mode Selector Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#152D42] to-[#1D3B56] text-white border border-[#C6A342]/50 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#C6A342] text-[#152D42] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                <Columns2 className="w-3.5 h-3.5" />
                <span>Side-by-Side Legal Diff Engine</span>
              </span>
              <span className="text-xs text-[#E9C96D] font-mono-code">
                Đối soát song song từng Điều · Khoản · Từ khóa pháp lý
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              So Sánh Song Song 2 Phiên Bản Hoặc 2 Văn Bản Liên Quan
            </h2>
            <p className="text-xs text-stone-300 max-w-3xl">
              Tự động phân tích và tô sáng phần nội dung cũ bị bãi bỏ/sửa đổi (nền đỏ gạch ngang ở Cột A) và nội dung mới được bổ sung/thay thế (nền xanh lá ở Cột B).
            </p>
          </div>

          {/* 2 Comparison Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-black/25 p-1.5 rounded-xl border border-white/15 self-start">
            <button
              type="button"
              onClick={() => {
                setComparisonMode('version_evolution');
                setSelectedLeftArticleId('ALL');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                comparisonMode === 'version_evolution'
                  ? 'bg-[#C6A342] text-[#152D42] shadow-2xs'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>So sánh 2 Phiên bản (Bản gốc ↔ Bản sửa đổi)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setComparisonMode('two_documents');
                setSelectedLeftArticleId('ALL');
                setSelectedRightArticleId('ALL');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                comparisonMode === 'two_documents'
                  ? 'bg-[#C6A342] text-[#152D42] shadow-2xs'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>So sánh 2 Văn bản liên quan (Văn bản A ↔ B)</span>
            </button>
          </div>
        </div>

        {/* Quick Preset Comparison Pairs */}
        <div className="pt-3 border-t border-white/15 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E9C96D]">
            ⚡ Cặp văn bản / phiên bản mẫu đối soát nhanh:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {PRESET_COMPARISON_PAIRS.map((preset) => {
              const isCurrentPreset =
                comparisonMode === preset.mode &&
                leftDocId === preset.leftDocId &&
                (preset.mode === 'version_evolution' ||
                  rightDocId === preset.rightDocId);

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setComparisonMode(preset.mode);
                    setLeftDocId(preset.leftDocId);
                    setRightDocId(preset.rightDocId);
                    setSelectedLeftArticleId('ALL');
                    setSelectedRightArticleId('ALL');
                  }}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isCurrentPreset
                      ? 'bg-[#FBF5DF] text-[#152D42] border-[#C6A342] shadow-xs'
                      : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isCurrentPreset
                          ? 'bg-[#152D42] text-[#E9C96D]'
                          : 'bg-[#C6A342]/25 text-[#E9C96D]'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <div className="text-xs font-bold leading-snug line-clamp-2">
                    {preset.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Document & Article Selector Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1D1B] border border-stone-200 dark:border-[#2E2C28] shadow-2xs space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-center">
          {/* Left Selector (Column A) */}
          <div className="lg:col-span-5 p-3.5 rounded-xl bg-red-50/40 dark:bg-red-950/15 border border-red-200/80 dark:border-red-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-red-700 text-white font-mono-code text-[10px]">
                  CỘT A
                </span>
                <span>
                  {comparisonMode === 'version_evolution'
                    ? 'Văn bản gốc (Trước sửa đổi / Khi ban hành)'
                    : 'Văn bản A (Văn bản gốc / Văn bản đối chiếu)'}
                </span>
              </span>
              {leftDoc && (
                <span className="font-mono-code text-[11px] text-stone-500">
                  Ban hành: {leftDoc.issue_date}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={leftDoc?.id || ''}
                onChange={(e) => {
                  setLeftDocId(e.target.value);
                  setSelectedLeftArticleId('ALL');
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-stone-900 dark:text-stone-100"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.doc_number} — {d.short_title}
                    {(d.amended_count ?? 0) > 0
                      ? ` (🧬 ${d.amended_count} lần SĐ)`
                      : ''}
                  </option>
                ))}
              </select>

              <select
                value={selectedLeftArticleId}
                onChange={(e) => setSelectedLeftArticleId(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-stone-800 dark:text-stone-200"
              >
                <option value="ALL">
                  Tất cả Điều khoản ({leftDoc?.articles.length || 0} Điều)
                </option>
                {leftDoc?.articles.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.article_no}. {art.article_title}
                    {art.is_amended ? ' (⚠ Đã SĐ)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Center Swap / Mode Indicator */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center gap-1">
            {comparisonMode === 'two_documents' ? (
              <button
                type="button"
                onClick={handleSwapDocuments}
                className="p-2.5 rounded-xl bg-[#152D42] hover:bg-[#1F3F5B] text-[#E9C96D] shadow-xs cursor-pointer transition"
                title="Đảo chiều Cột A ↔ Cột B"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/70 border border-amber-400 text-amber-950 dark:text-amber-200 text-[11px] font-bold font-mono-code text-center">
                🧬 Phả hệ
              </div>
            )}
          </div>

          {/* Right Selector (Column B) */}
          <div className="lg:col-span-5 p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-300/80 dark:border-emerald-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-mono-code text-[10px]">
                  CỘT B
                </span>
                <span>
                  {comparisonMode === 'version_evolution'
                    ? 'Bản hợp nhất / Sau sửa đổi đang có hiệu lực'
                    : 'Văn bản B (Văn bản sửa đổi / Thay thế / Liên quan)'}
                </span>
              </span>
              {comparisonMode === 'version_evolution' ? (
                <span className="font-mono-code text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                  {leftDoc?.consolidated_doc_number
                    ? `VBHN: ${leftDoc.consolidated_doc_number}`
                    : `Qua ${leftDoc?.amended_count || 0} lần sửa đổi`}
                </span>
              ) : (
                rightDoc && (
                  <span className="font-mono-code text-[11px] text-stone-500">
                    Hiệu lực: {rightDoc.effective_date}
                  </span>
                )
              )}
            </div>

            {comparisonMode === 'version_evolution' ? (
              <div className="p-2 rounded-lg bg-white/90 dark:bg-[#141413] border border-emerald-200 dark:border-emerald-900/60 text-xs text-stone-700 dark:text-stone-300 flex flex-wrap items-center justify-between gap-2">
                <span className="truncate font-semibold">
                  {leftDoc?.doc_number} (Bản hợp nhất các sửa đổi:{' '}
                  {leftDoc?.amendment_history
                    ?.map((h) => h.amending_doc_number)
                    .filter(Boolean)
                    .join(', ') || 'Hiện hành'}
                  )
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  Đang áp dụng
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={rightDoc?.id || ''}
                  onChange={(e) => {
                    setRightDocId(e.target.value);
                    setSelectedRightArticleId('ALL');
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-stone-900 dark:text-stone-100"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.doc_number} — {d.short_title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRightArticleId}
                  onChange={(e) => setSelectedRightArticleId(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-stone-800 dark:text-stone-200"
                >
                  <option value="ALL">
                    Tất cả Điều khoản ({rightDoc?.articles.length || 0} Điều)
                  </option>
                  {rightDoc?.articles.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.article_no}. {art.article_title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Filter & Visual Diff Options Bar */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          {/* Diff Telemetry Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 font-semibold text-stone-700 dark:text-stone-300">
              Tổng số mục đối chiếu: <b className="font-mono-code">{diffStats.totalRows}</b>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-bold">
              ⚡ Có thay đổi: <span className="font-mono-code">{diffStats.changedRows}</span> mục
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 font-mono-code text-[11px] font-semibold">
              −{diffStats.totalRemovedWords} từ bị lược bỏ/thay thế
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono-code text-[11px] font-semibold">
              +{diffStats.totalAddedWords} từ bổ sung mới
            </span>
          </div>

          {/* Interactive Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="Lọc Điều/Khoản hoặc từ khóa..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] text-xs focus:outline-none focus:border-[#C6A342]"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyShowDifferences((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
                onlyShowDifferences
                  ? 'bg-[#152D42] text-[#E9C96D] border-[#C6A342]'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Chỉ hiện mục có khác biệt ({diffStats.changedRows})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWordDiff((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
                showWordDiff
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 border-amber-400'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
              }`}
            >
              <FileDiff className="w-3.5 h-3.5" />
              <span>{showWordDiff ? 'Đang bật Tô sáng khác biệt (Word Diff)' : 'Bật Tô sáng khác biệt'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSyncScroll((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
                syncScroll
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border-teal-400'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cuộn đồng bộ: {syncScroll ? 'BẬT' : 'TẮT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cross-reference banner if comparing two related documents */}
      {comparisonMode === 'two_documents' && matchedCrossRef && (
        <div className="p-4 rounded-2xl bg-[#FBF5DF]/90 dark:bg-[#231F15] border border-[#C6A342] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#152D42] dark:text-amber-300">
              <span>
                🔗 Quan hệ pháp lý SSoT ({RELATION_META[matchedCrossRef.relation_type].label}):
              </span>
              <span>{matchedCrossRef.title}</span>
            </div>
            <p className="text-stone-700 dark:text-stone-300">
              {matchedCrossRef.description}
            </p>
          </div>
          {onAskAquaWithContext && (
            <button
              type="button"
              onClick={() =>
                onAskAquaWithContext(
                  `So sánh chi tiết sự khác biệt và tác động pháp lý giữa ${leftDoc?.doc_number} và ${rightDoc?.doc_number}`,
                  matchedCrossRef.description
                )
              }
              className="px-3 py-2 rounded-xl bg-[#152D42] text-[#E9C96D] font-bold shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phân tích khác biệt bằng AI</span>
            </button>
          )}
        </div>
      )}

      {/* SIDE-BY-SIDE ALIGNED COMPARISON CARDS */}
      {rowsWithComputedDiff.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#1E1D1B] border border-stone-200 dark:border-[#2E2C28] text-center space-y-2">
          <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
            Không có điều khoản nào khớp bộ lọc hiện tại.
          </p>
          <p className="text-xs text-stone-500">
            Hãy tắt bộ lọc &ldquo;Chỉ hiện mục có khác biệt&rdquo; hoặc xóa từ khóa tìm kiếm để xem toàn bộ các Điều/Khoản.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rowsWithComputedDiff.map((row) => (
            <div
              key={row.id}
              className={`rounded-2xl border overflow-hidden transition shadow-2xs ${
                row.isChanged
                  ? 'border-amber-400 dark:border-amber-700 bg-white dark:bg-[#1A1917]'
                  : 'border-stone-200 dark:border-[#2E2C28] bg-white/90 dark:bg-[#181715]'
              }`}
            >
              {/* Row Top Bar */}
              <div
                className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
                  row.isChanged
                    ? 'bg-gradient-to-r from-amber-50 via-[#FBF5DF] to-emerald-50/70 dark:from-[#262013] dark:to-[#17241C] border-amber-300 dark:border-amber-800'
                    : 'bg-stone-50 dark:bg-[#1E1D1B] border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-code font-bold text-[#152D42] dark:text-amber-300">
                    {row.sectionLabel}
                  </span>

                  {row.isChanged ? (
                    <span className="px-2 py-0.5 rounded bg-amber-200/90 dark:bg-amber-900 text-amber-950 dark:text-amber-100 text-[10px] font-bold uppercase">
                      ⚠ Có sửa đổi / Khác biệt nội dung
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-semibold">
                      ✓ Giữ nguyên (100% trùng khớp)
                    </span>
                  )}

                  {row.amendingBadge && (
                    <span className="px-2 py-0.5 rounded bg-[#152D42] text-[#E9C96D] text-[10px] font-mono-code font-bold">
                      Sửa đổi bởi [{row.amendingBadge}]
                    </span>
                  )}

                  {row.effectiveDate && row.isChanged && (
                    <span className="text-[11px] font-mono-code text-stone-600 dark:text-stone-400">
                      Hiệu lực: <b>{row.effectiveDate}</b>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  {row.isChanged && (
                    <>
                      <span className="font-mono-code text-red-700 dark:text-red-400 font-semibold">
                        −{row.diff.removedWordsCount} từ
                      </span>
                      <span className="font-mono-code text-emerald-700 dark:text-emerald-400 font-semibold">
                        +{row.diff.addedWordsCount} từ
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-black/30 border border-stone-300 dark:border-stone-700 font-mono-code">
                        Tương đồng: {row.diff.similarityPercent}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Change Explanation Note if available */}
              {row.isChanged && row.changeNote && (
                <div className="px-4 py-2 bg-amber-50/60 dark:bg-amber-950/25 border-b border-amber-200/70 dark:border-amber-900/50 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2">
                  <span>
                    <strong>Tóm tắt điểm khác biệt pháp lý:</strong> {row.changeNote}
                  </span>
                </div>
              )}

              {/* Two Side-by-Side Columns */}
              <div
                onScroll={handleLeftScroll}
                ref={leftScrollRef}
                className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-stone-800"
              >
                {/* LEFT COLUMN (Bản gốc / Văn bản A) */}
                <div className="p-4 sm:p-5 space-y-2.5 bg-red-50/15 dark:bg-red-950/5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-red-900 dark:text-red-300 inline-flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                      <span>{row.leftTitle}</span>
                    </span>
                    {leftDoc && row.leftArticle && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenReader(leftDoc.id, row.leftArticle?.id)
                        }
                        className="text-[11px] font-semibold text-[#286181] dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Mở văn bản</span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm leading-relaxed font-serif-prose whitespace-pre-line text-stone-800 dark:text-stone-200">
                    {showWordDiff && row.isChanged
                      ? row.diff.leftTokens.map((tok, i) =>
                          tok.type === 'removed' ? (
                            <span
                              key={i}
                              className="bg-red-200/85 dark:bg-red-900/70 text-red-950 dark:text-red-100 line-through decoration-red-600 px-0.5 rounded-xs"
                            >
                              {tok.text}
                            </span>
                          ) : (
                            <React.Fragment key={i}>{tok.text}</React.Fragment>
                          )
                        )
                      : row.leftText}
                  </div>
                </div>

                {/* RIGHT COLUMN (Bản sửa đổi hợp nhất / Văn bản B) */}
                <div
                  onScroll={handleRightScroll}
                  ref={rightScrollRef}
                  className="p-4 sm:p-5 space-y-2.5 bg-emerald-50/20 dark:bg-emerald-950/10"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{row.rightTitle}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {onAskAquaWithContext && row.isChanged && (
                        <button
                          type="button"
                          onClick={() =>
                            onAskAquaWithContext(
                              `Phân tích ý nghĩa pháp lý của sự thay đổi tại ${row.sectionLabel}`,
                              `Bản cũ: "${row.leftText}"\nBản mới: "${row.rightText}"`
                            )
                          }
                          className="text-[11px] font-semibold text-[#7A5F14] dark:text-amber-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Hỏi AQUA</span>
                        </button>
                      )}
                      {rightDoc && row.rightArticle && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenReader(
                              comparisonMode === 'version_evolution'
                                ? leftDoc.id
                                : rightDoc.id,
                              row.rightArticle?.id
                            )
                          }
                          className="text-[11px] font-semibold text-[#286181] dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Mở văn bản</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm leading-relaxed font-serif-prose whitespace-pre-line text-stone-900 dark:text-stone-100">
                    {showWordDiff && row.isChanged
                      ? row.diff.rightTokens.map((tok, i) =>
                          tok.type === 'added' ? (
                            <span
                              key={i}
                              className="bg-emerald-200/90 dark:bg-emerald-900/75 text-emerald-950 dark:text-emerald-100 font-semibold underline decoration-emerald-600/80 underline-offset-2 px-0.5 rounded-xs"
                            >
                              {tok.text}
                            </span>
                          ) : (
                            <React.Fragment key={i}>{tok.text}</React.Fragment>
                          )
                        )
                      : row.rightText}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
