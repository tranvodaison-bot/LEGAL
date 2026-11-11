import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  GitCompare,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Scale,
  Database,
} from 'lucide-react';
import {
  LegalDocument,
  LegalCrossReference,
  CrossRefRelationType,
  LegalField,
  ProjectLifecycleStage,
} from '../types/legal';
import {
  LEGAL_FIELDS,
  PROJECT_LIFECYCLE_STAGES,
  RELATION_META,
  STATUS_META,
} from '../data/legalCorpus';

interface LegalMapAndCrossCheckProps {
  documents: LegalDocument[];
  crossReferences: LegalCrossReference[];
  selectedCenterDocId: string;
  selectedCrossRef: LegalCrossReference | null;
  onSelectCenterDoc: (docId: string) => void;
  onSelectCrossRef: (xref: LegalCrossReference) => void;
  onOpenReader: (docId: string, articleId?: string) => void;
}

export const LegalMapAndCrossCheck: React.FC<LegalMapAndCrossCheckProps> = ({
  documents,
  crossReferences,
  selectedCenterDocId,
  selectedCrossRef,
  onSelectCenterDoc,
  onSelectCrossRef,
  onOpenReader,
}) => {
  const [subMode, setSubMode] = useState<'map' | 'split'>('map');
  const [relationFilter, setRelationFilter] = useState<CrossRefRelationType | 'all'>('all');
  const [fieldFilter, setFieldFilter] = useState<LegalField | 'all'>('all');
  const [stageFilter, setStageFilter] = useState<ProjectLifecycleStage | 'all'>('all');
  const [zoom, setZoom] = useState(1);
  const [highlightDiffTerms, setHighlightDiffTerms] = useState(true);

  const activeXref = selectedCrossRef || crossReferences[0];
  const [leftDocId, setLeftDocId] = useState<string>(
    activeXref?.target_doc_id || documents[0]?.id || ''
  );
  const [leftArticleId, setLeftArticleId] = useState<string>(
    activeXref?.target_article_id || documents[0]?.articles[0]?.id || ''
  );
  const [rightDocId, setRightDocId] = useState<string>(
    activeXref?.source_doc_id || documents[1]?.id || ''
  );
  const [rightArticleId, setRightArticleId] = useState<string>(
    activeXref?.source_article_id || documents[1]?.articles[0]?.id || ''
  );

  React.useEffect(() => {
    if (selectedCrossRef) {
      setLeftDocId(selectedCrossRef.target_doc_id);
      setLeftArticleId(selectedCrossRef.target_article_id);
      setRightDocId(selectedCrossRef.source_doc_id);
      setRightArticleId(selectedCrossRef.source_article_id);
    }
  }, [selectedCrossRef]);

  const docMap = useMemo(() => {
    const m = new Map<string, LegalDocument>();
    documents.forEach((d) => m.set(d.id, d));
    return m;
  }, [documents]);

  const filteredXrefs = useMemo(() => {
    return crossReferences.filter((x) => {
      if (relationFilter !== 'all' && x.relation_type !== relationFilter) return false;
      const sDoc = docMap.get(x.source_doc_id);
      const tDoc = docMap.get(x.target_doc_id);
      if (fieldFilter !== 'all') {
        if (sDoc?.field !== fieldFilter && tDoc?.field !== fieldFilter) {
          return false;
        }
      }
      if (stageFilter !== 'all') {
        if (sDoc?.project_stage !== stageFilter && tDoc?.project_stage !== stageFilter) {
          return false;
        }
      }
      return true;
    });
  }, [crossReferences, relationFilter, fieldFilter, stageFilter, docMap]);

  const graphLayout = useMemo(() => {
    const visibleDocs = documents.filter((d) => {
      if (fieldFilter !== 'all' && d.field !== fieldFilter) return false;
      if (stageFilter !== 'all' && d.project_stage !== stageFilter) return false;
      return true;
    });

    const pool = visibleDocs.length > 0 ? visibleDocs : documents;
    const centerDoc =
      pool.find((d) => d.id === selectedCenterDocId) || pool[0] || documents[0];

    const nodes: Array<{
      doc: LegalDocument;
      x: number;
      y: number;
      isCenter: boolean;
      degree: number;
    }> = [];

    const cx = 460;
    const cy = 260;

    const connectedIds = new Set<string>();
    crossReferences.forEach((x) => {
      if (x.source_doc_id === centerDoc?.id) connectedIds.add(x.target_doc_id);
      if (x.target_doc_id === centerDoc?.id) connectedIds.add(x.source_doc_id);
    });

    const firstRingDocs = pool.filter(
      (d) => d.id !== centerDoc?.id && connectedIds.has(d.id)
    );
    const outerRingDocs = pool.filter(
      (d) => d.id !== centerDoc?.id && !connectedIds.has(d.id)
    );

    if (centerDoc) {
      const deg = crossReferences.filter(
        (x) => x.source_doc_id === centerDoc.id || x.target_doc_id === centerDoc.id
      ).length;
      nodes.push({ doc: centerDoc, x: cx, y: cy, isCenter: true, degree: deg });
    }

    firstRingDocs.forEach((d, idx) => {
      const angle = (2 * Math.PI * idx) / Math.max(firstRingDocs.length, 1) - Math.PI / 2;
      const radiusX = 225;
      const radiusY = 150;
      const deg = crossReferences.filter(
        (x) => x.source_doc_id === d.id || x.target_doc_id === d.id
      ).length;
      nodes.push({
        doc: d,
        x: cx + Math.cos(angle) * radiusX,
        y: cy + Math.sin(angle) * radiusY,
        isCenter: false,
        degree: deg,
      });
    });

    outerRingDocs.forEach((d, idx) => {
      const angle =
        (2 * Math.PI * idx) / Math.max(outerRingDocs.length, 1) + Math.PI / 6;
      const radiusX = 370;
      const radiusY = 215;
      const deg = crossReferences.filter(
        (x) => x.source_doc_id === d.id || x.target_doc_id === d.id
      ).length;
      nodes.push({
        doc: d,
        x: cx + Math.cos(angle) * radiusX,
        y: cy + Math.sin(angle) * radiusY,
        isCenter: false,
        degree: deg,
      });
    });

    return { nodes, centerDoc };
  }, [documents, crossReferences, selectedCenterDocId, fieldFilter, stageFilter]);

  const nodePosMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    graphLayout.nodes.forEach((n) => m.set(n.doc.id, { x: n.x, y: n.y }));
    return m;
  }, [graphLayout]);

  const leftDoc = docMap.get(leftDocId) || documents[0];
  const leftArticle =
    leftDoc?.articles.find((a) => a.id === leftArticleId) || leftDoc?.articles[0];

  const rightDoc = docMap.get(rightDocId) || documents[1] || documents[0];
  const rightArticle =
    rightDoc?.articles.find((a) => a.id === rightArticleId) || rightDoc?.articles[0];

  const matchedPairXref = useMemo(() => {
    return crossReferences.find(
      (x) =>
        (x.source_doc_id === rightDoc?.id &&
          x.source_article_id === rightArticle?.id &&
          x.target_doc_id === leftDoc?.id &&
          x.target_article_id === leftArticle?.id) ||
        (x.source_doc_id === leftDoc?.id &&
          x.source_article_id === leftArticle?.id &&
          x.target_doc_id === rightDoc?.id &&
          x.target_article_id === rightArticle?.id) ||
        (x.source_doc_id === rightDoc?.id && x.target_doc_id === leftDoc?.id) ||
        (x.source_doc_id === leftDoc?.id && x.target_doc_id === rightDoc?.id)
    );
  }, [crossReferences, leftDoc, leftArticle, rightDoc, rightArticle]);

  const renderHighlightedClauseContent = (
    content: string,
    keywordsToHighlight: string[]
  ) => {
    if (!highlightDiffTerms || keywordsToHighlight.length === 0) return content;
    const validTerms = keywordsToHighlight.filter((t) => t.trim().length > 2);
    if (validTerms.length === 0) return content;
    const escaped = validTerms
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = content.split(regex);
    return parts.map((part, idx) =>
      regex.test(part) ? (
        <mark
          key={idx}
          className="bg-amber-200/80 dark:bg-amber-500/30 text-[#1C1917] dark:text-[#F5F2EB] px-1 rounded-xs font-medium"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E5DEC9] dark:border-[#2E2C28]">
        <div>
          <div className="text-xs text-[#655E54] dark:text-[#A8A29E] mb-1">
            Đồ thị Tri thức Pháp lý (Legal Knowledge Graph) · Đối soát Chéo cấp độ Điều/Khoản
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB] balance-text">
            Bản Đồ Pháp Luật & Đối Soát Chéo Liên Ngành (Xây dựng · Đấu thầu · Đất đai · PCCC)
          </h1>
          <p className="mt-1 text-sm text-[#655E54] dark:text-[#A8A29E]">
            Truy xuất mạng lưới văn bản khung và các Nghị định hướng dẫn theo từng giai đoạn vòng đời dự án (WBS).
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F3EFE6] dark:bg-[#1E1D1B] border border-[#E5DEC9] dark:border-[#2E2C28] self-start">
          <button
            onClick={() => setSubMode('map')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              subMode === 'map'
                ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white shadow-2xs'
                : 'text-[#44403C] dark:text-[#D6D3CD] hover:text-[#1C1917]'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Bản đồ Pháp luật (Nodes & Edges)</span>
          </button>
          <button
            onClick={() => setSubMode('split')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              subMode === 'split'
                ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white shadow-2xs'
                : 'text-[#44403C] dark:text-[#D6D3CD] hover:text-[#1C1917]'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Đối soát chéo 2 màn hình (Split-Screen Diff)</span>
          </button>
        </div>
      </div>

      {subMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Interactive SVG Knowledge Graph */}
          <div className="lg:col-span-8 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/60 dark:bg-[#1A1917] overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-[#E5DEC9] dark:border-[#2E2C28] flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F5] dark:bg-[#1E1D1B]">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={fieldFilter}
                  onChange={(e) => setFieldFilter(e.target.value as LegalField | 'all')}
                  className="min-h-[38px] px-3 py-1.5 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-medium"
                >
                  <option value="all">Mọi lĩnh vực ({documents.length} văn bản)</option>
                  {LEGAL_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      Lĩnh vực: {f}
                    </option>
                  ))}
                </select>

                <select
                  value={stageFilter}
                  onChange={(e) =>
                    setStageFilter(e.target.value as ProjectLifecycleStage | 'all')
                  }
                  className="min-h-[38px] px-3 py-1.5 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-medium"
                >
                  <option value="all">Mọi giai đoạn WBS</option>
                  {PROJECT_LIFECYCLE_STAGES.map((st) => (
                    <option key={st} value={st}>
                      Giai đoạn: {st}
                    </option>
                  ))}
                </select>

                <select
                  value={relationFilter}
                  onChange={(e) =>
                    setRelationFilter(e.target.value as CrossRefRelationType | 'all')
                  }
                  className="min-h-[38px] px-3 py-1.5 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-medium"
                >
                  <option value="all">Mọi loại quan hệ ({crossReferences.length})</option>
                  <option value="HUONG_DAN_THI_HANH">HUONG_DAN_THI_HANH (Hướng dẫn)</option>
                  <option value="SUA_DOI_BO_SUNG">SUA_DOI_BO_SUNG (Sửa đổi, bổ sung)</option>
                  <option value="DAN_CHIEU">DAN_CHIEU (Dẫn chiếu liên ngành)</option>
                  <option value="THAY_THE">THAY_THE (Thay thế)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] hover:bg-[#EBE5D8] dark:hover:bg-[#282623] cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono-code px-2">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(1.45, +(z + 0.15).toFixed(2)))}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] hover:bg-[#EBE5D8] dark:hover:bg-[#282623] cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] hover:bg-[#EBE5D8] dark:hover:bg-[#282623] cursor-pointer"
                  title="Đặt lại tỷ lệ"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* SVG Graph Viewport */}
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox="0 0 920 520"
                className="w-full h-[430px] sm:h-[500px] select-none"
              >
                <defs>
                  <marker
                    id="arrow-SUA_DOI_BO_SUNG"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
                  </marker>
                  <marker
                    id="arrow-HUONG_DAN_THI_HANH"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#1E3A8A" />
                  </marker>
                  <marker
                    id="arrow-DAN_CHIEU"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
                  </marker>
                </defs>

                <g
                  transform={`translate(460, 260) scale(${zoom}) translate(-460, -260)`}
                >
                  <ellipse
                    cx="460"
                    cy="260"
                    rx="225"
                    ry="150"
                    fill="none"
                    stroke="currentColor"
                    className="text-[#E5DEC9] dark:text-[#2E2C28]"
                    strokeDasharray="4 6"
                    strokeWidth="1"
                  />
                  <ellipse
                    cx="460"
                    cy="260"
                    rx="370"
                    ry="215"
                    fill="none"
                    stroke="currentColor"
                    className="text-[#E5DEC9]/70 dark:text-[#2E2C28]/70"
                    strokeDasharray="3 6"
                    strokeWidth="1"
                  />

                  {/* Directed Cross-Reference Edges */}
                  {filteredXrefs.map((xref) => {
                    const p1 = nodePosMap.get(xref.source_doc_id);
                    const p2 = nodePosMap.get(xref.target_doc_id);
                    if (!p1 || !p2) return null;

                    const isSelectedEdge = activeXref?.id === xref.id;
                    const meta = RELATION_META[xref.relation_type];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2 - 8;

                    return (
                      <g
                        key={xref.id}
                        onClick={() => onSelectCrossRef(xref)}
                        className="cursor-pointer"
                      >
                        <line
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={meta.stroke}
                          strokeWidth={isSelectedEdge ? 3.2 : 1.8}
                          strokeDasharray={
                            xref.relation_type === 'DAN_CHIEU' ? '5 4' : undefined
                          }
                          markerEnd={`url(#arrow-${
                            xref.relation_type === 'THAY_THE'
                              ? 'SUA_DOI_BO_SUNG'
                              : xref.relation_type
                          })`}
                          opacity={isSelectedEdge ? 1 : 0.78}
                        />
                        <rect
                          x={midX - 54}
                          y={midY - 10}
                          width="108"
                          height="18"
                          rx="4"
                          className="fill-[#FBF9F5] dark:fill-[#1E1D1B] stroke-[#E5DEC9] dark:stroke-[#2E2C28]"
                        />
                        <text
                          x={midX}
                          y={midY + 2}
                          textAnchor="middle"
                          className="text-[9px] font-sans-ui font-medium fill-[#44403C] dark:fill-[#D6D3CD]"
                        >
                          {meta.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Document Nodes */}
                  {graphLayout.nodes.map((node) => {
                    const isCenter = node.isCenter;
                    return (
                      <g
                        key={node.doc.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => onSelectCenterDoc(node.doc.id)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={isCenter ? -98 : -84}
                          y={isCenter ? -36 : -30}
                          width={isCenter ? 196 : 168}
                          height={isCenter ? 72 : 60}
                          rx="12"
                          className={
                            isCenter
                              ? 'fill-[#1E3A8A] stroke-[#1E3A8A] dark:fill-[#2563EB] dark:stroke-[#60A5FA]'
                              : 'fill-[#FBF9F5] dark:fill-[#1E1D1B] stroke-[#D6CEBE] dark:stroke-[#3E3C38] hover:stroke-[#1E3A8A]'
                          }
                          strokeWidth={isCenter ? 2.5 : 1.5}
                        />
                        <text
                          x="0"
                          y={isCenter ? -12 : -9}
                          textAnchor="middle"
                          className={`text-[10px] font-mono-code font-semibold ${
                            isCenter
                              ? 'fill-amber-300'
                              : 'fill-[#1E3A8A] dark:fill-[#60A5FA]'
                          }`}
                        >
                          {node.doc.doc_number}
                        </text>
                        <text
                          x="0"
                          y={isCenter ? 6 : 7}
                          textAnchor="middle"
                          className={`text-[11px] font-sans-ui font-semibold ${
                            isCenter
                              ? 'fill-white'
                              : 'fill-[#1C1917] dark:fill-[#F5F2EB]'
                          }`}
                        >
                          {node.doc.short_title.length > 24
                            ? `${node.doc.short_title.slice(0, 22)}…`
                            : node.doc.short_title}
                        </text>
                        <text
                          x="0"
                          y={isCenter ? 22 : 21}
                          textAnchor="middle"
                          className={`text-[9px] font-sans-ui ${
                            isCenter
                              ? 'fill-blue-100'
                              : 'fill-[#655E54] dark:fill-[#A8A29E]'
                          }`}
                        >
                          {node.doc.field} · {node.doc.project_stage}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Legend Footer */}
            <div className="px-4 py-3 border-t border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] flex flex-wrap items-center justify-between gap-3 text-xs text-[#655E54] dark:text-[#A8A29E]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-[#1C1917] dark:text-[#F5F2EB]">
                  Quan hệ đồ thị (cross_references):
                </span>
                <span>Xanh Lapis: HUONG_DAN_THI_HANH</span>
                <span>·</span>
                <span>Đỏ: SUA_DOI_BO_SUNG</span>
                <span>·</span>
                <span>Hổ phách (nét đứt): DAN_CHIEU</span>
              </div>
              <span>Nhấp vào nút để đặt làm tâm hoặc nhấp vào cạnh nối để đối soát</span>
            </div>
          </div>

          {/* Right 4 Columns: Active Node & Cross-Reference Inspector */}
          <div className="lg:col-span-4 space-y-4">
            {graphLayout.centerDoc && (
              <div className="p-5 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/70 dark:bg-[#1E1D1B]">
                <div className="text-xs text-[#655E54] dark:text-[#A8A29E] flex flex-wrap items-center gap-2">
                  <span>Nút trung tâm</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-code font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                    {graphLayout.centerDoc.doc_number}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>WBS: {graphLayout.centerDoc.project_stage}</span>
                </div>
                <h3 className="mt-1.5 text-lg font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                  {graphLayout.centerDoc.title}
                </h3>
                <p className="mt-2 text-xs text-[#44403C] dark:text-[#D6D3CD] leading-relaxed">
                  {graphLayout.centerDoc.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => onOpenReader(graphLayout.centerDoc.id)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] dark:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Đọc toàn văn ({graphLayout.centerDoc.articles.length} điều)</span>
                  </button>
                  <button
                    onClick={() => setSubMode('split')}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Mở trình đối soát 2 cột</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of Cross-References */}
            <div className="p-5 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-display font-semibold">
                  Danh mục dẫn chiếu & đối soát ({filteredXrefs.length})
                </h4>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {filteredXrefs.map((xref) => {
                  const sDoc = docMap.get(xref.source_doc_id);
                  const tDoc = docMap.get(xref.target_doc_id);
                  const isCurrent = activeXref?.id === xref.id;
                  const relMeta = RELATION_META[xref.relation_type];
                  return (
                    <div
                      key={xref.id}
                      onClick={() => onSelectCrossRef(xref)}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                        isCurrent
                          ? 'border-[#1E3A8A] dark:border-[#60A5FA] bg-[#1E3A8A]/5 dark:bg-[#60A5FA]/10'
                          : 'border-[#E5DEC9] dark:border-[#2E2C28] hover:bg-[#F3EFE6]/60 dark:hover:bg-[#282623]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${relMeta.textClass}`}>
                          {relMeta.label}
                        </span>
                        <span className="font-mono-code text-[11px] text-[#655E54] dark:text-[#A8A29E]">
                          {sDoc?.doc_number} → {tDoc?.doc_number}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#1C1917] dark:text-[#F5F2EB]">
                        {xref.title}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCrossRef(xref);
                            setSubMode('split');
                          }}
                          className="text-xs font-semibold text-[#1E3A8A] dark:text-[#60A5FA] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>Đối soát song song 2 điều khoản</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: Side-by-Side Split-Screen Clause Diff & Cross-Check */
        <div className="space-y-6">
          {/* Preset Cross-Reference Selector Bar */}
          <div className="p-4 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/70 dark:bg-[#1E1D1B] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#44403C] dark:text-[#D6D3CD]">
              <Scale className="w-4 h-4 text-[#1E3A8A] dark:text-[#60A5FA] shrink-0" />
              <span>Cặp điều khoản đối soát liên ngành (cross_references):</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
              <select
                value={matchedPairXref?.id || ''}
                onChange={(e) => {
                  const found = crossReferences.find((x) => x.id === e.target.value);
                  if (found) {
                    onSelectCrossRef(found);
                  }
                }}
                className="min-h-[40px] px-3 py-2 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-medium flex-1 max-w-2xl"
              >
                {crossReferences.map((x) => {
                  const sDoc = docMap.get(x.source_doc_id);
                  const tDoc = docMap.get(x.target_doc_id);
                  return (
                    <option key={x.id} value={x.id}>
                      [{x.relation_type}] {tDoc?.doc_number} ↔ {sDoc?.doc_number}: {x.title}
                    </option>
                  );
                })}
              </select>

              <button
                onClick={() => setHighlightDiffTerms((v) => !v)}
                className={`min-h-[40px] px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap cursor-pointer ${
                  highlightDiffTerms
                    ? 'border-amber-600/40 bg-amber-500/15 text-amber-900 dark:text-amber-300'
                    : 'border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]'
                }`}
              >
                {highlightDiffTerms ? 'Đang tô sáng từ khóa đối soát' : 'Bật tô sáng từ khóa'}
              </button>
            </div>
          </div>

          {/* Legal Impact & SSoT Cross-Reference Analysis Banner */}
          {matchedPairXref && (
            <div className="p-5 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1E3A8A] dark:text-[#60A5FA]" />
                  <span className="font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                    Phân tích tác động chéo ({RELATION_META[matchedPairXref.relation_type].label} · {matchedPairXref.relation_type})
                  </span>
                </div>
                <span className="font-mono-code text-[#655E54] dark:text-[#A8A29E] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>
                    FK: {matchedPairXref.source_article_id} → {matchedPairXref.target_article_id}
                  </span>
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                {matchedPairXref.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#44403C] dark:text-[#D6D3CD] leading-relaxed">
                {matchedPairXref.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#F3EFE6] dark:bg-[#141413] border border-[#E5DEC9] dark:border-[#2E2C28]">
                  <div className="text-[11px] text-[#655E54] dark:text-[#A8A29E] mb-1">
                    Quy định gốc / Luật khung (target_article_id)
                  </div>
                  <p className="text-xs text-[#1C1917] dark:text-[#F5F2EB] leading-relaxed">
                    {matchedPairXref.comparison_highlight.target_excerpt}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F3EFE6] dark:bg-[#141413] border border-[#E5DEC9] dark:border-[#2E2C28]">
                  <div className="text-[11px] text-[#655E54] dark:text-[#A8A29E] mb-1">
                    Quy định hướng dẫn / sửa đổi / dẫn chiếu (source_article_id)
                  </div>
                  <p className="text-xs text-[#1C1917] dark:text-[#F5F2EB] leading-relaxed">
                    {matchedPairXref.comparison_highlight.source_excerpt}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-600/25">
                  <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 mb-1">
                    Hệ quả pháp lý đối với Chủ đầu tư / Ban QLDA / HĐQT
                  </div>
                  <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
                    {matchedPairXref.comparison_highlight.legal_impact}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Two-Column Split Comparison Panes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Pane: Target Document / Article */}
            <div className="rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] flex flex-col">
              <div className="p-4 border-b border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/60 dark:bg-[#141413] space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#655E54] dark:text-[#A8A29E]">
                  <span className="font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                    Cột A — Văn bản khung / Điều khoản được dẫn chiếu
                  </span>
                  <span className="font-mono-code">
                    {leftDoc?.doc_number} · WBS: {leftDoc?.project_stage}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={leftDoc?.id || ''}
                    onChange={(e) => {
                      const newDoc = docMap.get(e.target.value);
                      setLeftDocId(e.target.value);
                      if (newDoc?.articles[0]) {
                        setLeftArticleId(newDoc.articles[0].id);
                      }
                    }}
                    className="min-h-[38px] px-2.5 py-1.5 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B]"
                  >
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.doc_number} — {d.short_title}
                      </option>
                    ))}
                  </select>

                  <select
                    value={leftArticle?.id || ''}
                    onChange={(e) => setLeftArticleId(e.target.value)}
                    className="min-h-[38px] px-2.5 py-1.5 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B]"
                  >
                    {leftDoc?.articles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.article_no}: {a.article_title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {leftDoc && leftArticle && (
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#655E54] dark:text-[#A8A29E]">
                      <span className="font-mono-code">{leftArticle.chapter_no}</span>
                      <span>·</span>
                      <span>{leftArticle.chapter_title}</span>
                      <span>·</span>
                      <span className={STATUS_META[leftDoc.status].colorClass}>
                        {leftDoc.status}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-lg font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                      <span className="font-mono-code text-[#1E3A8A] dark:text-[#60A5FA] mr-2">
                        {leftArticle.article_no}.
                      </span>
                      {leftArticle.article_title}
                    </h4>
                    <div className="mt-4 text-sm font-serif-prose leading-[1.8] text-[#1C1917] dark:text-[#F5F2EB] whitespace-pre-line">
                      {renderHighlightedClauseContent(
                        leftArticle.content,
                        leftArticle.keywords
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5DEC9] dark:border-[#2E2C28] flex items-center justify-between text-xs text-[#655E54] dark:text-[#A8A29E]">
                    <span className="font-mono-code">
                      Hiệu lực: {leftDoc.effective_date} · PK: {leftArticle.id}
                    </span>
                    <button
                      onClick={() => onOpenReader(leftDoc.id, leftArticle.id)}
                      className="text-[#1E3A8A] dark:text-[#60A5FA] font-medium hover:underline cursor-pointer"
                    >
                      Đọc toàn văn →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Pane: Source Document / Article */}
            <div className="rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] flex flex-col">
              <div className="p-4 border-b border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/60 dark:bg-[#141413] space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#655E54] dark:text-[#A8A29E]">
                  <span className="font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                    Cột B — Văn bản hướng dẫn / Sửa đổi / Đối soát liên ngành
                  </span>
                  <span className="font-mono-code">
                    {rightDoc?.doc_number} · WBS: {rightDoc?.project_stage}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={rightDoc?.id || ''}
                    onChange={(e) => {
                      const newDoc = docMap.get(e.target.value);
                      setRightDocId(e.target.value);
                      if (newDoc?.articles[0]) {
                        setRightArticleId(newDoc.articles[0].id);
                      }
                    }}
                    className="min-h-[38px] px-2.5 py-1.5 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B]"
                  >
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.doc_number} — {d.short_title}
                      </option>
                    ))}
                  </select>

                  <select
                    value={rightArticle?.id || ''}
                    onChange={(e) => setRightArticleId(e.target.value)}
                    className="min-h-[38px] px-2.5 py-1.5 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B]"
                  >
                    {rightDoc?.articles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.article_no}: {a.article_title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {rightDoc && rightArticle && (
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#655E54] dark:text-[#A8A29E]">
                      <span className="font-mono-code">{rightArticle.chapter_no}</span>
                      <span>·</span>
                      <span>{rightArticle.chapter_title}</span>
                      <span>·</span>
                      <span className={STATUS_META[rightDoc.status].colorClass}>
                        {rightDoc.status}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-lg font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                      <span className="font-mono-code text-[#9A3412] dark:text-amber-400 mr-2">
                        {rightArticle.article_no}.
                      </span>
                      {rightArticle.article_title}
                    </h4>
                    <div className="mt-4 text-sm font-serif-prose leading-[1.8] text-[#1C1917] dark:text-[#F5F2EB] whitespace-pre-line">
                      {renderHighlightedClauseContent(
                        rightArticle.content,
                        rightArticle.keywords
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5DEC9] dark:border-[#2E2C28] flex items-center justify-between text-xs text-[#655E54] dark:text-[#A8A29E]">
                    <span className="font-mono-code">
                      Hiệu lực: {rightDoc.effective_date} · PK: {rightArticle.id}
                    </span>
                    <button
                      onClick={() => onOpenReader(rightDoc.id, rightArticle.id)}
                      className="text-[#1E3A8A] dark:text-[#60A5FA] font-medium hover:underline cursor-pointer"
                    >
                      Đọc toàn văn →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
