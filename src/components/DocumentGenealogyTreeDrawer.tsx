import React, { useMemo, useState } from 'react';
import { hierarchy, tree as d3Tree, HierarchyPointNode } from 'd3-hierarchy';
import {
  X,
  GitBranch,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowUpRight,
  BookOpen,
  GitCompare,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react';
import {
  AmendmentHistoryItem,
  LegalArticle,
  LegalCrossReference,
  LegalDocument,
} from '../types/legal';

export type GenealogyNodeKind =
  | 'root_doc'
  | 'amending_event'
  | 'consolidated_version'
  | 'replacement_doc'
  | 'related_xref'
  | 'affected_scope';

export interface GenealogyTreeDatum {
  id: string;
  label: string;
  sublabel: string;
  dateLabel?: string;
  badgeText: string;
  kind: GenealogyNodeKind;
  colorHex: string;
  bgHex: string;
  borderHex: string;
  docId?: string;
  articleId?: string;
  scopeText?: string;
  amendmentItem?: AmendmentHistoryItem;
  matchedArticle?: LegalArticle;
  summaryText?: string;
  children?: GenealogyTreeDatum[];
}

interface DocumentGenealogyTreeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: LegalDocument | null;
  allDocuments: LegalDocument[];
  crossReferences: LegalCrossReference[];
  onSelectDocument: (doc: LegalDocument, articleId?: string) => void;
  onNavigateToArticleInReader: (articleId: string) => void;
  onOpenSideBySideComparison: (leftDocId: string, rightDocId?: string) => void;
  onAskAquaWithContext?: (question: string, clauseContext: string) => void;
}

/**
 * Construct a hierarchical Genealogy Tree for a selected LegalDocument
 * combining amendment_history, consolidated versions, replacement docs, and impacted Article/Clause scopes.
 */
function buildDocumentGenealogyHierarchy(
  doc: LegalDocument,
  allDocuments: LegalDocument[],
  crossReferences: LegalCrossReference[],
  collapsedIds: Record<string, boolean>
): GenealogyTreeDatum {
  const docMap = new Map<string, LegalDocument>(
    allDocuments.map((d) => [d.id, d])
  );
  const articleByNoMap = new Map<string, LegalArticle>();
  doc.articles.forEach((a) => {
    articleByNoMap.set(a.article_no.trim().toLowerCase(), a);
  });

  const children: GenealogyTreeDatum[] = [];

  // 1. Chronological Amendment History Branches (Lần 1, Lần 2, Lần 3...)
  if (doc.amendment_history && doc.amendment_history.length > 0) {
    const sortedHistory = [...doc.amendment_history].sort((a, b) =>
      a.promulgation_date.localeCompare(b.promulgation_date)
    );

    sortedHistory.forEach((item, idx) => {
      const branchId = `amend-branch-${item.amending_doc_id}-${idx}`;
      const isBranchCollapsed = Boolean(collapsedIds[branchId]);

      const scopeChildren: GenealogyTreeDatum[] = isBranchCollapsed
        ? []
        : (item.scopes || []).map((scope, sIdx) => {
            const normalizedScope = scope.trim().toLowerCase();
            // Match e.g. "Điều 3" inside scope string
            const matchedArt =
              articleByNoMap.get(normalizedScope) ||
              doc.articles.find((a) =>
                normalizedScope.includes(a.article_no.trim().toLowerCase())
              );

            const hasClauseDiff = Boolean(
              matchedArt?.clauses?.some((c) => c.is_amended && c.diff_data)
            );

            return {
              id: `${branchId}-scope-${sIdx}`,
              label: matchedArt
                ? `${matchedArt.article_no}: ${matchedArt.article_title}`
                : scope,
              sublabel: hasClauseDiff
                ? '⚠ Có In-place Diff (Bản gốc ↔ Bản sửa đổi)'
                : matchedArt?.amendment_info?.summary ||
                  `Được sửa đổi, bổ sung bởi ${
                    item.amending_doc_number || item.amending_doc_title
                  }`,
              dateLabel: item.effective_date
                ? `HL: ${item.effective_date}`
                : item.promulgation_date,
              badgeText: hasClauseDiff ? '⚠ IN-PLACE DIFF' : 'ĐIỀU KHOẢN SĐ',
              kind: 'affected_scope',
              colorHex: '#92400E',
              bgHex: '#FEF3C7',
              borderHex: '#F59E0B',
              docId: doc.id,
              articleId: matchedArt?.id,
              scopeText: scope,
              amendmentItem: item,
              matchedArticle: matchedArt,
              summaryText:
                matchedArt?.amendment_info?.summary || item.summary,
            };
          });

      const actionBadge =
        item.action_type === 'SUA_DOI_BO_SUNG'
          ? `LẦN ${idx + 1} · SỬA ĐỔI, BỔ SUNG`
          : item.action_type === 'BAI_BO_MOT_PHAN'
          ? `LẦN ${idx + 1} · BÃI BỎ 1 PHẦN`
          : `LẦN ${idx + 1} · THAY THẾ`;

      children.push({
        id: branchId,
        label: item.amending_doc_number
          ? `${item.amending_doc_number}`
          : item.amending_doc_title,
        sublabel: item.amending_doc_title,
        dateLabel: `Ban hành: ${item.promulgation_date}${
          item.effective_date ? ` · HL: ${item.effective_date}` : ''
        }`,
        badgeText: actionBadge,
        kind: 'amending_event',
        colorHex: '#B45309',
        bgHex: '#FFFBEB',
        borderHex: '#D97706',
        docId: item.amending_doc_id,
        amendmentItem: item,
        summaryText: item.summary,
        children: scopeChildren,
      });
    });
  }

  // 2. If this document itself is an Amending Document (amends_doc_ids), show target root laws
  if (doc.amends_doc_ids && doc.amends_doc_ids.length > 0) {
    doc.amends_doc_ids.forEach((origId, idx) => {
      const origDoc = docMap.get(origId);
      if (!origDoc) return;
      const nodeId = `amends-orig-${origId}-${idx}`;
      const isCollapsed = Boolean(collapsedIds[nodeId]);

      const amendedArtNodes: GenealogyTreeDatum[] = isCollapsed
        ? []
        : origDoc.articles
            .filter((a) => a.is_amended)
            .slice(0, 6)
            .map((a) => ({
              id: `${nodeId}-art-${a.id}`,
              label: `${a.article_no}: ${a.article_title}`,
              sublabel: a.amendment_info?.summary || a.content.slice(0, 90),
              dateLabel: `Văn bản gốc: ${origDoc.doc_number}`,
              badgeText: 'ĐIỀU ĐƯỢC SỬA ĐỔI',
              kind: 'affected_scope',
              colorHex: '#6B21A8',
              bgHex: '#FAF5FF',
              borderHex: '#A855F7',
              docId: origDoc.id,
              articleId: a.id,
              matchedArticle: a,
              summaryText: a.amendment_info?.summary,
            }));

      children.push({
        id: nodeId,
        label: `Sửa đổi: ${origDoc.doc_number}`,
        sublabel: origDoc.short_title || origDoc.title,
        dateLabel: `Ban hành gốc: ${origDoc.issue_date}`,
        badgeText: 'VĂN BẢN ĐƯỢC SỬA ĐỔI',
        kind: 'amending_event',
        colorHex: '#6B21A8',
        bgHex: '#F3E8FF',
        borderHex: '#9333EA',
        docId: origDoc.id,
        summaryText: origDoc.summary,
        children: amendedArtNodes,
      });
    });
  }

  // 3. Consolidated Document Branch (Văn bản hợp nhất) if present
  if (doc.is_consolidated || doc.consolidated_doc_number) {
    const vbhId = `consolidated-${doc.id}`;
    const isCollapsed = Boolean(collapsedIds[vbhId]);
    const amendedArticles = doc.articles.filter((a) => a.is_amended);

    children.push({
      id: vbhId,
      label: doc.consolidated_doc_number
        ? `VBHN: ${doc.consolidated_doc_number}`
        : `Văn bản Hợp nhất ${doc.doc_number}`,
      sublabel: `Hợp nhất toàn bộ ${
        doc.amended_count ?? doc.amendment_history?.length ?? 1
      } lần sửa đổi, bổ sung vào văn bản gốc`,
      dateLabel: `Cập nhật hợp nhất SSoT`,
      badgeText: '📑 VĂN BẢN HỢP NHẤT',
      kind: 'consolidated_version',
      colorHex: '#0F766E',
      bgHex: '#F0FDFA',
      borderHex: '#14B8A6',
      docId: doc.id,
      summaryText: `Bản hợp nhất chính thức tích hợp ${amendedArticles.length} Điều khoản đã sửa đổi để tra cứu và áp dụng đồng bộ.`,
      children: isCollapsed
        ? []
        : amendedArticles.slice(0, 5).map((art) => ({
            id: `${vbhId}-art-${art.id}`,
            label: `${art.article_no} (Hợp nhất)`,
            sublabel: art.article_title,
            dateLabel: art.amendment_info?.amending_doc_number
              ? `Theo ${art.amendment_info.amending_doc_number}`
              : 'Đã hợp nhất',
            badgeText: 'ĐIỀU HỢP NHẤT',
            kind: 'affected_scope',
            colorHex: '#0F766E',
            bgHex: '#CCFBF1',
            borderHex: '#14B8A6',
            docId: doc.id,
            articleId: art.id,
            matchedArticle: art,
            summaryText: art.amendment_info?.summary,
          })),
    });
  }

  // 4. Replacement Document Branch (Văn bản thay thế nếu đã hết hiệu lực)
  if (doc.replaced_by_label || doc.replaced_by_doc_id) {
    const repDoc = doc.replaced_by_doc_id
      ? docMap.get(doc.replaced_by_doc_id)
      : undefined;
    children.push({
      id: `replacement-${doc.id}`,
      label: repDoc?.doc_number || doc.replaced_by_label || 'Văn bản thay thế',
      sublabel: repDoc?.title || `Thay thế hoàn toàn ${doc.doc_number}`,
      dateLabel: repDoc ? `Hiệu lực: ${repDoc.effective_date}` : undefined,
      badgeText: 'THAY THẾ TOÀN BỘ',
      kind: 'replacement_doc',
      colorHex: '#B91C1C',
      bgHex: '#FEF2F2',
      borderHex: '#EF4444',
      docId: repDoc?.id,
      summaryText: repDoc?.summary,
      children: [],
    });
  }

  // 5. Fallback / Supplemental Cross-References if document has few genealogy branches
  const docXrefs = crossReferences.filter(
    (x) => x.source_doc_id === doc.id || x.target_doc_id === doc.id
  );
  if (children.length < 2 && docXrefs.length > 0) {
    docXrefs.slice(0, 4).forEach((xref, idx) => {
      const isSource = xref.source_doc_id === doc.id;
      const otherDocId = isSource ? xref.target_doc_id : xref.source_doc_id;
      const otherDoc = docMap.get(otherDocId);
      const otherArticleId = isSource
        ? xref.target_article_id
        : xref.source_article_id;

      children.push({
        id: `xref-branch-${xref.id}-${idx}`,
        label: otherDoc?.doc_number || xref.title,
        sublabel: xref.title,
        dateLabel: otherDoc ? `HL: ${otherDoc.effective_date}` : xref.relation_type,
        badgeText: xref.relation_type,
        kind: 'related_xref',
        colorHex: '#1D4ED8',
        bgHex: '#EFF6FF',
        borderHex: '#3B82F6',
        docId: otherDoc?.id,
        articleId: otherArticleId,
        summaryText: xref.description,
        children: [],
      });
    });
  }

  return {
    id: `root-${doc.id}`,
    label: `${doc.doc_type} ${doc.doc_number}`,
    sublabel: doc.short_title || doc.title,
    dateLabel: `Ban hành: ${doc.issue_date} · HL: ${doc.effective_date}`,
    badgeText:
      (doc.amended_count ?? 0) > 0
        ? `VĂN BẢN GỐC (🧬 ${doc.amended_count} LẦN SĐ)`
        : 'VĂN BẢN TRUNG TÂM',
    kind: 'root_doc',
    colorHex: '#152D42',
    bgHex: '#FBF5DF',
    borderHex: '#C6A342',
    docId: doc.id,
    summaryText: doc.summary,
    children,
  };
}

export const DocumentGenealogyTreeDrawer: React.FC<
  DocumentGenealogyTreeDrawerProps
> = ({
  isOpen,
  onClose,
  document,
  allDocuments,
  crossReferences,
  onSelectDocument,
  onNavigateToArticleInReader,
  onOpenSideBySideComparison,
  onAskAquaWithContext,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>(
    'horizontal'
  );
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const docMap = useMemo(
    () => new Map<string, LegalDocument>(allDocuments.map((d) => [d.id, d])),
    [allDocuments]
  );

  // Quick list of documents with notable genealogy for rapid switching inside the drawer
  const genealogyFeaturedDocs = useMemo(() => {
    return allDocuments.filter(
      (d) =>
        (d.amended_count ?? 0) > 0 ||
        (d.amendment_history && d.amendment_history.length > 0) ||
        d.is_amending_document ||
        Boolean(d.replaced_by_label) ||
        d.is_consolidated
    );
  }, [allDocuments]);

  const treeData = useMemo(() => {
    if (!document) return null;
    return buildDocumentGenealogyHierarchy(
      document,
      allDocuments,
      crossReferences,
      collapsedIds
    );
  }, [document, allDocuments, crossReferences, collapsedIds]);

  // Compute D3 Tree Layout using d3-hierarchy
  const d3Layout = useMemo(() => {
    if (!treeData) return null;

    const root = hierarchy<GenealogyTreeDatum>(treeData);
    const dx = orientation === 'horizontal' ? 92 : 240;
    const dy = orientation === 'horizontal' ? 285 : 135;

    const layoutGenerator = d3Tree<GenealogyTreeDatum>().nodeSize([dx, dy]);
    const pointRoot = layoutGenerator(root);

    const nodes = pointRoot.descendants();
    const links = pointRoot.links();

    // Compute bounding box so SVG viewBox fits all nodes cleanly
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      const px = orientation === 'horizontal' ? n.y : n.x;
      const py = orientation === 'horizontal' ? n.x : n.y;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    });

    const padX = 160;
    const padY = 85;
    const width = Math.max(820, maxX - minX + padX * 2);
    const height = Math.max(420, maxY - minY + padY * 2);
    const offsetX = -minX + padX;
    const offsetY = -minY + padY;

    const nodeMap = new Map<string, HierarchyPointNode<GenealogyTreeDatum>>();
    nodes.forEach((n) => nodeMap.set(n.data.id, n));

    return {
      nodes,
      links,
      width,
      height,
      offsetX,
      offsetY,
      nodeMap,
    };
  }, [treeData, orientation]);

  // Highlighted ancestor/descendant chain on hover or click
  const activeFocusId = hoveredNodeId || selectedNodeId || treeData?.id || null;

  const highlightedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!d3Layout || !activeFocusId) return set;
    const target = d3Layout.nodeMap.get(activeFocusId);
    if (!target) return set;
    target.ancestors().forEach((a) => set.add(a.data.id));
    target.descendants().forEach((d) => set.add(d.data.id));
    return set;
  }, [d3Layout, activeFocusId]);

  const inspectedDatum = useMemo(() => {
    if (!d3Layout) return null;
    if (selectedNodeId && d3Layout.nodeMap.has(selectedNodeId)) {
      return d3Layout.nodeMap.get(selectedNodeId)!.data;
    }
    // Default to first amendment branch if available, otherwise root
    const firstBranch = d3Layout.nodes.find(
      (n) => n.data.kind === 'amending_event'
    );
    return firstBranch ? firstBranch.data : treeData;
  }, [d3Layout, selectedNodeId, treeData]);

  if (!isOpen || !document || !d3Layout || !treeData) return null;

  const toggleCollapseBranch = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#FBF9F5] dark:bg-[#151412] border-l border-[#C6A342]/60 dark:border-stone-800 h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#152D42] to-[#1E3D58] text-white flex items-start justify-between gap-3 shrink-0 border-b border-[#C6A342]/50">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#C6A342] text-[#152D42] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5" />
                <span>D3.js Genealogy Tree · Phả Hệ Văn Bản</span>
              </span>
              <span className="font-mono-code text-xs text-[#E9C96D] font-bold">
                {document.doc_number}
              </span>
              {(document.amended_count ?? 0) > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-300/50 text-amber-200 text-[10px] font-mono-code font-bold">
                  🧬 Đã qua {document.amended_count} lần sửa đổi
                </span>
              )}
              {document.consolidated_doc_number && (
                <span className="px-2 py-0.5 rounded bg-teal-400/20 border border-teal-300/50 text-teal-200 text-[10px] font-mono-code font-bold">
                  📑 Hợp nhất: {document.consolidated_doc_number}
                </span>
              )}
            </div>

            <h2 className="font-display font-bold text-base sm:text-lg text-white truncate">
              Biểu Đồ Phả Hệ Sửa Đổi, Bổ Sung & Hợp Nhất — {document.short_title}
            </h2>
            <p className="text-[11px] text-stone-300 truncate">
              Trực quan hóa bằng thuật toán phân nhánh <code>d3-hierarchy</code>: Nhấp vào từng nút văn bản sửa đổi hoặc Điều khoản để xem chi tiết In-place Diff.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 cursor-pointer shrink-0"
            title="Đóng Biểu đồ Phả hệ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Document Switcher & D3 Viewport Controls */}
        <div className="px-5 py-2.5 bg-white dark:bg-[#1E1D1B] border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-500 mr-1">
              Chọn văn bản phả hệ:
            </span>
            {genealogyFeaturedDocs.slice(0, 5).map((fDoc) => {
              const isCurrent = fDoc.id === document.id;
              return (
                <button
                  key={fDoc.id}
                  type="button"
                  onClick={() => {
                    setSelectedNodeId(null);
                    onSelectDocument(fDoc);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-bold border transition cursor-pointer ${
                    isCurrent
                      ? 'bg-[#152D42] text-[#E9C96D] border-[#C6A342]'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#C6A342]'
                  }`}
                >
                  {fDoc.doc_number}
                  {(fDoc.amended_count ?? 0) > 0 ? ` (🧬${fDoc.amended_count})` : ''}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setOrientation((o) =>
                  o === 'horizontal' ? 'vertical' : 'horizontal'
                )
              }
              className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1 cursor-pointer"
              title="Đổi hướng bố cục cây D3"
            >
              <Layers className="w-3.5 h-3.5 text-[#C6A342]" />
              <span>
                 Hướng cây: {orientation === 'horizontal' ? 'Ngang (Trái → Phải)' : 'Dọc (Trên → Dưới)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.65, +(z - 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] hover:bg-stone-100 cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono-code px-1.5">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.45, +(z + 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] hover:bg-stone-100 cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setCollapsedIds({});
              }}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] hover:bg-stone-100 cursor-pointer"
              title="Đặt lại tỷ lệ & mở rộng toàn bộ nhánh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content: D3 SVG Tree Canvas + Selected Node Inspector */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Interactive D3 SVG Tree Viewport */}
          <div className="rounded-2xl border border-[#E5DEC9] dark:border-stone-800 bg-gradient-to-br from-[#FFFDF9] to-[#F5EFE0]/60 dark:from-[#1A1917] dark:to-[#141311] shadow-inner overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#E5DEC9] dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-600 dark:text-stone-400 bg-white/70 dark:bg-black/20">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#152D42] dark:text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#152D42] border border-[#C6A342]" />
                  Văn bản gốc
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Lần sửa đổi, bổ sung ({document.amendment_history?.length || 0})
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-teal-800 dark:text-teal-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  Văn bản hợp nhất
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-orange-800 dark:text-orange-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  Điều / Khoản bị tác động
                </span>
              </div>
              <span>
                Nhấp vào nút trên cây để xem chi tiết · Nhấp vào dấu [+/−] để đóng/mở nhánh Điều khoản
              </span>
            </div>

            <div className="w-full overflow-auto max-h-[430px] p-2">
              <svg
                viewBox={`0 0 ${d3Layout.width} ${d3Layout.height}`}
                style={{
                  width: `${Math.round(d3Layout.width * zoom)}px`,
                  height: `${Math.round(d3Layout.height * zoom)}px`,
                  minWidth: '100%',
                }}
                className="select-none"
              >
                <defs>
                  <marker
                    id="genealogy-arrow"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#C6A342" />
                  </marker>
                </defs>

                <g
                  transform={`translate(${d3Layout.offsetX}, ${d3Layout.offsetY})`}
                >
                  {/* Cubic Bézier Links computed from d3.tree().links() */}
                  {d3Layout.links.map((link, idx) => {
                    const sx =
                      orientation === 'horizontal'
                        ? link.source.y
                        : link.source.x;
                    const sy =
                      orientation === 'horizontal'
                        ? link.source.x
                        : link.source.y;
                    const tx =
                      orientation === 'horizontal'
                        ? link.target.y
                        : link.target.x;
                    const ty =
                      orientation === 'horizontal'
                        ? link.target.x
                        : link.target.y;

                    const dPath =
                      orientation === 'horizontal'
                        ? `M ${sx + 95} ${sy} C ${(sx + tx) / 2} ${sy}, ${
                            (sx + tx) / 2
                          } ${ty}, ${tx - 95} ${ty}`
                        : `M ${sx} ${sy + 34} C ${sx} ${(sy + ty) / 2}, ${tx} ${
                            (sy + ty) / 2
                          }, ${tx} ${ty - 34}`;

                    const isLinkActive =
                      highlightedNodeIds.has(link.source.data.id) &&
                      highlightedNodeIds.has(link.target.data.id);

                    return (
                      <path
                        key={`link-${idx}`}
                        d={dPath}
                        fill="none"
                        stroke={
                          isLinkActive
                            ? link.target.data.borderHex
                            : '#CBD5E1'
                        }
                        strokeWidth={isLinkActive ? 2.6 : 1.5}
                        strokeDasharray={
                          link.target.data.kind === 'affected_scope'
                            ? '4 3'
                            : undefined
                        }
                        markerEnd="url(#genealogy-arrow)"
                        opacity={isLinkActive ? 0.98 : 0.45}
                      />
                    );
                  })}

                  {/* Nodes computed from d3.tree().descendants() */}
                  {d3Layout.nodes.map((node) => {
                    const nx =
                      orientation === 'horizontal' ? node.y : node.x;
                    const ny =
                      orientation === 'horizontal' ? node.x : node.y;
                    const datum = node.data;
                    const isSelected = inspectedDatum?.id === datum.id;
                    const isHighlighted = highlightedNodeIds.has(datum.id);
                    const canCollapse =
                      datum.kind === 'amending_event' ||
                      datum.kind === 'consolidated_version';
                    const isCollapsed = Boolean(collapsedIds[datum.id]);

                    const boxW = datum.kind === 'root_doc' ? 210 : 196;
                    const boxH = 68;

                    return (
                      <g
                        key={datum.id}
                        transform={`translate(${nx}, ${ny})`}
                        onMouseEnter={() => setHoveredNodeId(datum.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => setSelectedNodeId(datum.id)}
                        className="cursor-pointer transition-opacity"
                        opacity={isHighlighted ? 1 : 0.55}
                      >
                        {/* Card Shadow & Background */}
                        <rect
                          x={-boxW / 2}
                          y={-boxH / 2}
                          width={boxW}
                          height={boxH}
                          rx={12}
                          fill={
                            datum.kind === 'root_doc'
                              ? '#152D42'
                              : datum.bgHex
                          }
                          stroke={
                            isSelected ? '#152D42' : datum.borderHex
                          }
                          strokeWidth={isSelected ? 3 : 1.8}
                        />

                        {/* Top Badge Pill */}
                        <rect
                          x={-boxW / 2 + 10}
                          y={-boxH / 2 + 7}
                          width={Math.min(boxW - 44, datum.badgeText.length * 6.2 + 16)}
                          height={15}
                          rx={4}
                          fill={
                            datum.kind === 'root_doc'
                              ? '#C6A342'
                              : datum.borderHex
                          }
                        />
                        <text
                          x={-boxW / 2 + 16}
                          y={-boxH / 2 + 17.5}
                          className="text-[8.5px] font-mono-code font-bold"
                          fill={
                            datum.kind === 'root_doc' ? '#152D42' : '#FFFFFF'
                          }
                        >
                          {datum.badgeText.slice(0, 26)}
                        </text>

                        {/* Primary Node Label */}
                        <text
                          x={-boxW / 2 + 10}
                          y={2}
                          className="text-[11px] font-mono-code font-bold"
                          fill={
                            datum.kind === 'root_doc'
                              ? '#FFFFFF'
                              : '#1C1917'
                          }
                        >
                          {datum.label.length > 26
                            ? `${datum.label.slice(0, 24)}…`
                            : datum.label}
                        </text>

                        {/* Sublabel / Date */}
                        <text
                          x={-boxW / 2 + 10}
                          y={18}
                          className="text-[9.5px] font-sans"
                          fill={
                            datum.kind === 'root_doc'
                              ? '#E9C96D'
                              : '#57534E'
                          }
                        >
                          {(datum.dateLabel || datum.sublabel).length > 30
                            ? `${(datum.dateLabel || datum.sublabel).slice(
                                0,
                                28
                              )}…`
                            : datum.dateLabel || datum.sublabel}
                        </text>

                        {/* Expand / Collapse toggle badge on branch nodes */}
                        {canCollapse && (
                          <g
                            transform={`translate(${boxW / 2 - 14}, ${
                              -boxH / 2 + 14
                            })`}
                            onClick={(e) => toggleCollapseBranch(datum.id, e)}
                          >
                            <circle
                              r={8}
                              fill="#152D42"
                              stroke="#C6A342"
                              strokeWidth={1.2}
                            />
                            <text
                              x={0}
                              y={3}
                              textAnchor="middle"
                              className="text-[10px] font-mono-code font-bold"
                              fill="#E9C96D"
                            >
                              {isCollapsed ? '+' : '−'}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>

          {/* Selected Node Detail Inspector */}
          {inspectedDatum && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1D1B] border-2 border-[#C6A342]/80 dark:border-amber-700/80 shadow-xs space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase"
                      style={{
                        backgroundColor: inspectedDatum.bgHex,
                        color: inspectedDatum.colorHex,
                        border: `1px solid ${inspectedDatum.borderHex}`,
                      }}
                    >
                      {inspectedDatum.badgeText}
                    </span>
                    {inspectedDatum.dateLabel && (
                      <span className="text-xs font-mono-code text-stone-500 inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#C6A342]" />
                        <span>{inspectedDatum.dateLabel}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                    {inspectedDatum.label} — {inspectedDatum.sublabel}
                  </h3>
                </div>

                {/* Action Buttons for Selected Node */}
                <div className="flex flex-wrap items-center gap-2">
                  {inspectedDatum.articleId && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToArticleInReader(inspectedDatum.articleId!);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#152D42] hover:bg-[#1F3F5B] text-[#E9C96D] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Cuộn tới Điều khoản tại Cột 3</span>
                    </button>
                  )}

                  {inspectedDatum.docId &&
                    inspectedDatum.docId !== document.id &&
                    docMap.has(inspectedDatum.docId) && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = docMap.get(inspectedDatum.docId!);
                          if (target) {
                            onSelectDocument(target, inspectedDatum.articleId);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-400 text-[#152D42] dark:text-amber-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>
                          Mở văn bản{' '}
                          {docMap.get(inspectedDatum.docId)?.doc_number}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={() => {
                      onOpenSideBySideComparison(
                        document.id,
                        inspectedDatum.docId &&
                          inspectedDatum.docId !== document.id
                          ? inspectedDatum.docId
                          : undefined
                      );
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FBF5DF] hover:bg-[#F3E5B5] border border-[#C6A342] text-[#152D42] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>⇄ So sánh song song 2 phiên bản</span>
                  </button>
                </div>
              </div>

              {inspectedDatum.summaryText && (
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  <strong className="text-[#152D42] dark:text-amber-300">
                    Nội dung tác động phả hệ:
                  </strong>{' '}
                  {inspectedDatum.summaryText}
                </p>
              )}

              {/* If the selected node is an Amendment Branch, show its clickable Scopes */}
              {inspectedDatum.amendmentItem &&
                inspectedDatum.amendmentItem.scopes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-stone-600 dark:text-stone-400">
                      Phạm vi các Điều khoản bị sửa đổi, bổ sung trong lần này:
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {inspectedDatum.amendmentItem.scopes.map((sc) => {
                        const matchedArt = document.articles.find(
                          (a) =>
                            a.article_no.trim().toLowerCase() ===
                            sc.trim().toLowerCase()
                        );
                        return (
                          <button
                            key={sc}
                            type="button"
                            onClick={() => {
                              if (matchedArt) {
                                onNavigateToArticleInReader(matchedArt.id);
                                onClose();
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono-code font-bold border ${
                              matchedArt
                                ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 text-amber-950 dark:text-amber-200 hover:bg-amber-200 cursor-pointer'
                                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            {sc}
                            {matchedArt ? ` · ${matchedArt.article_title}` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* If the selected node has an Article with In-place Diff clauses, preview the diff right inside the Drawer */}
              {inspectedDatum.matchedArticle?.clauses &&
                inspectedDatum.matchedArticle.clauses.some(
                  (c) => c.is_amended && c.diff_data
                ) && (
                  <div className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                       Đối chiếu nhanh thay đổi tại{' '}
                      {inspectedDatum.matchedArticle.article_no}:
                    </div>
                    {inspectedDatum.matchedArticle.clauses
                      .filter((c) => c.is_amended && c.diff_data)
                      .map((clause) => (
                        <div
                          key={clause.id}
                          className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs"
                        >
                          <div className="p-3 rounded-xl bg-red-50/90 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-1">
                            <div className="font-bold text-red-800 dark:text-red-300 inline-flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>
                                {clause.clause_no} — Bản gốc (Đã bị thay thế)
                              </span>
                            </div>
                            <p className="text-red-900 dark:text-red-200 line-through decoration-red-600 leading-relaxed">
                              {clause.diff_data?.original_text}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-700 space-y-1">
                            <div className="font-bold text-emerald-900 dark:text-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {clause.clause_no} — Bản sửa đổi hiện hành (
                                {clause.diff_data?.amending_doc_number})
                              </span>
                            </div>
                            <p className="text-emerald-950 dark:text-emerald-100 font-medium leading-relaxed">
                              {clause.diff_data?.replaced_text}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3.5 bg-white dark:bg-[#1E1D1B] border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-stone-500">
            Tổng số nút trên cây phả hệ:{' '}
            <b className="font-mono-code text-stone-800 dark:text-stone-200">
              {d3Layout.nodes.length} nút
            </b>{' '}
            ·{' '}
            <b className="font-mono-code text-stone-800 dark:text-stone-200">
              {d3Layout.links.length} liên kết phả hệ
            </b>
          </div>

          <div className="flex items-center gap-2">
            {onAskAquaWithContext && (
              <button
                type="button"
                onClick={() => {
                  onAskAquaWithContext(
                    `Tóm tắt lịch sử phả hệ sửa đổi, bổ sung của ${document.doc_number} (${document.short_title}) và các điểm cần lưu ý về hiệu lực thời gian.`,
                    JSON.stringify(document.amendment_history || [])
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-[#C6A342]/20 hover:bg-[#C6A342]/30 text-[#7A5F14] dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hỏi AQUA về Phả hệ văn bản</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-[#152D42] text-white text-xs font-semibold hover:bg-[#1E3D58] cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
