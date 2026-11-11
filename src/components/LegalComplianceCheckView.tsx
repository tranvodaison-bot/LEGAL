import React, { useState, useMemo, useRef, useDeferredValue, useCallback } from 'react';
import {
  Search,
  GitBranch,
  Network,
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Layers,
  Link2,
  FileDown,
  Image as ImageIcon,
  Settings2,
  FileCode2,
  Loader2,
  Crosshair,
  EyeOff,
} from 'lucide-react';
import {
  LegalDocument,
  LegalCrossReference,
  ComplianceRequirementNode,
} from '../types/legal';
import { COMPLIANCE_REQUIREMENT_NODES } from '../data/legalCorpus';
import { LegalMapAndCrossCheck } from './LegalMapAndCrossCheck';
import { SideBySideComparisonView } from './SideBySideComparisonView';
import {
  exportComplianceTreeToPDF,
  exportComplianceTreeToPNG,
  exportComplianceTreeToSVG,
  ProjectDossierExportMetadata,
} from '../utils/complianceTreeExporter';
import {
  useComplianceGraph,
  ComplianceTreeDatum,
  PriorityLevel,
  TreeNodeType,
  GRAPH_PRIORITY_META,
  inferDocumentDominantPriority,
} from '../hooks/useComplianceGraph';

export type { ComplianceTreeDatum, PriorityLevel, TreeNodeType };

export type CheckSubMode =
  | 'tree_mindmap'
  | 'situation_check'
  | 'ssot_graph_diff'
  | 'side_by_side';

interface LegalComplianceCheckViewProps {
  documents: LegalDocument[];
  crossReferences: LegalCrossReference[];
  centerDocId: string;
  initialSubMode?: CheckSubMode;
  onSelectCenterDoc: (docId: string) => void;
  selectedCrossRef: LegalCrossReference | null;
  onSelectCrossRef: (xref: LegalCrossReference) => void;
  onOpenReader: (docId: string, articleId?: string) => void;
  onAskAquaWithContext: (question: string, clauseContext: string) => void;
}

type TopicClusterId = 'all_ssot' | 'data_security' | 'construction_bidding' | 'ecommerce';

const TOPIC_CLUSTERS: Array<{
  id: TopicClusterId;
  title: string;
  subtitle: string;
  matchFields: string[];
}> = [
  {
    id: 'data_security',
    title: 'Dữ liệu cá nhân & An ninh mạng',
    subtitle: 'Bảo vệ dữ liệu cá nhân, an ninh mạng, dữ liệu số, lưu trữ và bí mật nhà nước',
    matchFields: ['Dữ liệu cá nhân & An ninh mạng', 'Chuyển đổi số'],
  },
  {
    id: 'construction_bidding',
    title: 'Đầu tư Xây dựng, Đấu thầu & Quyết toán',
    subtitle: 'Điều kiện khởi công, cấp phép xây dựng, BIM LOD 200, hợp đồng EPC, PCCC và quyết toán vốn',
    matchFields: [
      'Xây dựng',
      'Đấu thầu',
      'Hợp đồng xây dựng',
      'Đầu tư & QLDA',
      'Đất đai',
      'PCCC',
      'Tài chính',
    ],
  },
  {
    id: 'ecommerce',
    title: 'Thương mại điện tử & Giao dịch số',
    subtitle: 'Thiết lập website/ứng dụng TMĐT, điều khoản giao dịch chung và bảo vệ người tiêu dùng',
    matchFields: ['Thương mại điện tử'],
  },
  {
    id: 'all_ssot',
    title: 'Toàn bộ Kho SSoT ĐẠI SƠN',
    subtitle: 'Tự động tổng hợp mọi văn bản quy phạm pháp luật đang lưu trữ trong hệ thống',
    matchFields: [],
  },
];

const PRIORITY_META = GRAPH_PRIORITY_META;

const SITUATION_CHECKLISTS = [
  {
    id: 'sit-consent-web',
    topic: 'data_security' as TopicClusterId,
    title: 'Tình huống 01: Thu thập sự đồng ý của khách hàng trên Website / Ứng dụng di động',
    riskLevel: 'Rất cao',
    questions: [
      'Website/Ứng dụng có thiết lập ô đánh dấu (checkbox) riêng biệt cho từng mục đích xử lý dữ liệu thay vì mặc định đánh dấu sẵn không?',
      'Hệ thống có lưu nhật ký (log) kiểm chứng được chủ thể, thời điểm và nội dung điều khoản mà khách hàng đã bấm đồng ý không?',
      'Hợp đồng với đơn vị phát triển website (Bên B) đã nghiêm cấm Bên B tự ý chia sẻ dữ liệu khách hàng cho bên thứ ba chưa?',
    ],
    legalConclusion:
      'Căn cứ Khoản 2, 3, 4 Điều 9 Luật BVDLCN 91/2025/QH15 và Khoản 1 Điều 6 NĐ 356/2025/NĐ-CP: Im lặng hoặc không phản hồi không được coi là đồng ý. Vi phạm bị phạt từ 80–140 triệu đồng hoặc đến 5% doanh thu theo Điều 43 NĐ 330/2026/NĐ-CP.',
    docId: 'doc-bvdlcn-91-2025',
    articleId: 'art-bvdlcn-d9',
  },
  {
    id: 'sit-construction-start',
    topic: 'construction_bidding' as TopicClusterId,
    title: 'Tình huống 02: Kiểm tra điều kiện pháp lý trước khi phát lệnh Khởi công dự án xây dựng',
    riskLevel: 'Rất cao',
    questions: [
      'Chủ đầu tư đã có Biên bản bàn giao mặt bằng sạch (toàn bộ hoặc từng phân kỳ) khớp với Quyết định giao đất theo Điều 45 Luật Đất đai chưa?',
      'Đã có Giấy phép xây dựng kèm văn bản thẩm định thiết kế PCCC (Điều 89 Luật Xây dựng & Điều 18 Luật PCCC) chưa?',
      'Thiết kế bản vẽ thi công và dự toán gói thầu đã được thẩm định, phê duyệt trước khi ký hợp đồng thi công xây dựng chưa?',
    ],
    legalConclusion:
      'Căn cứ Khoản 1 Điều 14 Luật Xây dựng 135/2025/QH15, Điều 45 Luật Đất đai 31/2024/QH15 và Điều 12 Luật Đấu thầu 22/2023/QH15: Thiếu biên bản mặt bằng sạch hoặc khởi công trước khi duyệt thiết kế bản vẽ thi công sẽ dẫn tới rủi ro đình chỉ thi công và xuất toán khi quyết toán vốn.',
    docId: 'doc-lxd-135-2025',
    articleId: 'art-lxd-d14',
  },
];

// ============================================================================
// RECURSIVE REACT TREE NODE COMPONENT (<RecursiveComplianceTreeNode />)
// ============================================================================
interface RecursiveTreeNodeProps {
  node: ComplianceTreeDatum;
  depth: number;
  collapsedIds: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  activeHighlightSet: Set<string>;
  hasActiveHighlight: boolean;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onHoverNode: (id: string | null) => void;
  onSelectNode: (node: ComplianceTreeDatum) => void;
  onOpenReader: (docId: string, articleId?: string) => void;
  onAskAquaWithContext: (question: string, clauseContext: string) => void;
}

const RecursiveComplianceTreeNode: React.FC<RecursiveTreeNodeProps> = React.memo(({
  node,
  depth,
  collapsedIds,
  onToggleCollapse,
  activeHighlightSet,
  hasActiveHighlight,
  selectedNodeId,
  hoveredNodeId,
  onHoverNode,
  onSelectNode,
  onOpenReader,
  onAskAquaWithContext,
}) => {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isCollapsed = Boolean(collapsedIds[node.id]);
  const isHighlighted = activeHighlightSet.has(node.id);
  const isDirectFocus = selectedNodeId === node.id || hoveredNodeId === node.id;

  return (
    <div
      className={`relative transition-opacity duration-150 ${
        hasActiveHighlight && !isHighlighted ? 'opacity-40' : 'opacity-100'
      }`}
    >
      <div
        onMouseEnter={() => onHoverNode(node.id)}
        onMouseLeave={() => onHoverNode(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode(node);
        }}
        className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border transition cursor-pointer ${
          isDirectFocus
            ? 'bg-[#FFFDF5] dark:bg-[#28241A] border-[#C6A342] ring-2 ring-[#C6A342]/40 shadow-sm'
            : isHighlighted && hasActiveHighlight
            ? 'bg-[#FBF5DF]/65 dark:bg-[#221F17] border-[#C6A342]/80'
            : 'bg-white dark:bg-[#1E1D1B] border-stone-200 dark:border-[#2E2C28] hover:border-[#C6A342]/60'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(node.id);
              }}
              className="mt-0.5 p-1 rounded-md hover:bg-stone-200/70 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 shrink-0 cursor-pointer"
              title={isCollapsed ? 'Mở nhánh con' : 'Thu gọn nhánh'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span
              className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ml-1.5"
              style={{ backgroundColor: node.colorHex || '#C6A342' }}
            />
          )}

          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              {node.badgeText && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0"
                  style={{
                    backgroundColor: node.bgHex || '#FBF5DF',
                    color: node.colorHex || '#152D42',
                    border: `1px solid ${node.borderHex || '#C6A342'}`,
                  }}
                >
                  {node.badgeText}
                </span>
              )}
              <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                {node.name}
              </span>
              {node.relatedIds.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Link2 className="w-2.5 h-2.5" />
                  {node.relatedIds.length} liên kết chéo
                </span>
              )}
            </div>

            {node.subtitle && (
              <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                {node.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons on Document or Requirement Node */}
        <div className="flex items-center gap-1.5 shrink-0 pl-6 sm:pl-0">
          {node.doc && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenReader(node.doc!.id, node.doc!.articles[0]?.id);
              }}
              className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-[11px] font-semibold hover:border-[#C6A342] flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span>Toàn văn</span>
            </button>
          )}

          {node.requirement && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReader(node.requirement!.docId, node.requirement!.articleId);
                }}
                className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-[11px] font-medium hover:border-[#C6A342] cursor-pointer"
              >
                Điều khoản
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAskAquaWithContext(
                    `Phân tích yêu cầu tuân thủ ${node.requirement!.code} (${node.requirement!.citation}) mức ưu tiên ${node.requirement!.priority}.`,
                    `${node.requirement!.title} — Căn cứ: ${node.requirement!.citation}`
                  );
                }}
                className="px-2.5 py-1 rounded-lg bg-[#C6A342]/20 text-[#7A5F14] dark:text-amber-300 text-[11px] font-semibold hover:bg-[#C6A342]/30 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>AQUA</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recursive Children Rendering */}
      {hasChildren && !isCollapsed && (
        <div className="mt-2 ml-4 sm:ml-6 pl-3.5 border-l-2 border-stone-300 dark:border-stone-700 space-y-2">
          {node.children!.map((child) => (
            <RecursiveComplianceTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
              activeHighlightSet={activeHighlightSet}
              hasActiveHighlight={hasActiveHighlight}
              selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
              onHoverNode={onHoverNode}
              onSelectNode={onSelectNode}
              onOpenReader={onOpenReader}
              onAskAquaWithContext={onAskAquaWithContext}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export const LegalComplianceCheckView: React.FC<LegalComplianceCheckViewProps> = ({
  documents,
  crossReferences,
  centerDocId,
  initialSubMode,
  onSelectCenterDoc,
  selectedCrossRef,
  onSelectCrossRef,
  onOpenReader,
  onAskAquaWithContext,
}) => {
  const [subMode, setSubMode] = useState<CheckSubMode>(
    initialSubMode || 'tree_mindmap'
  );

  React.useEffect(() => {
    if (initialSubMode) {
      setSubMode(initialSubMode);
    }
  }, [initialSubMode]);
  const [activeClusterId, setActiveClusterId] = useState<TopicClusterId>('data_security');
  const [reqSearchQuery, setReqSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired'>('all');

  // Interactive Hover & Click Highlighting State across both d3-hierarchy SVG & Recursive Tree
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('doc-bvdlcn-91-2025');
  const [focusNodeMode, setFocusNodeMode] = useState<boolean>(false);
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<Record<string, boolean>>({});
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [checkedSituationItems, setCheckedSituationItems] = useState<
    Record<string, boolean>
  >({});

  // Project Dossier Export (PDF / High-DPI PNG / Vector SVG) State & SVG Ref
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [showExportConfig, setShowExportConfig] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'png' | 'svg' | null>(
    null
  );
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [dossierProjectName, setDossierProjectName] = useState<string>(
    'Dự án Đầu tư Xây dựng & Chuyển đổi số ĐẠI SƠN'
  );
  const [dossierOrgName, setDossierOrgName] = useState<string>(
    'Ban Pháp chế & Quản lý Dự án (QLDA) — Hệ thống SSoT ĐẠI SƠN'
  );
  const [dossierCode, setDossierCode] = useState<string>('HSPL-2026/ĐS-SSoT');
  const [includeAppendixTable, setIncludeAppendixTable] = useState<boolean>(true);
  const [exportScaleFactor, setExportScaleFactor] = useState<number>(2.5);

  const activeCluster = useMemo(
    () => TOPIC_CLUSTERS.find((c) => c.id === activeClusterId) || TOPIC_CLUSTERS[0],
    [activeClusterId]
  );

  // Resolve anchor node ID for Focus Node Mode before passing into useComplianceGraph
  const focusAnchorNodeId = useMemo(() => {
    if (selectedNodeId) return selectedNodeId;
    if (centerDocId && documents.some((d) => d.id === centerDocId)) {
      return centerDocId;
    }
    return documents[0]?.id || null;
  }, [selectedNodeId, centerDocId, documents]);

  const deferredReqSearchQuery = useDeferredValue(reqSearchQuery);

  // Production Custom Hook: O(1) Cross-Ref Adjacency Map, Cluster/Focus Filtering & d3-hierarchy Graph
  const {
    clusterDocs,
    activeDocs,
    expiredDocs,
    dynamicComplianceNodes,
    complianceHierarchyRootData,
    focusInfluenceChainInfo,
    displayedHierarchyRootData,
    displayedHierarchyNodeMap,
    d3GraphData,
  } = useComplianceGraph({
    documents,
    crossReferences,
    requirementNodes: COMPLIANCE_REQUIREMENT_NODES,
    selectedClusterId: activeCluster.id,
    clusterMatchFields: activeCluster.matchFields,
    clusterTitle: activeCluster.title,
    clusterSubtitle: activeCluster.subtitle,
    priorityFilter,
    validityFilter,
    focusNodeMode,
    focusAnchorNodeId,
  });

  // 8. Compute Highlighted Node IDs Set on Hover / Click via O(1) Map Lookup (Zero d3.hierarchy rebuilds)
  const activeFocusId = hoveredNodeId || selectedNodeId || (focusNodeMode ? focusAnchorNodeId : null);

  const activeHighlightSet = useMemo(() => {
    const set = new Set<string>();
    if (!activeFocusId) return set;

    const targetNode = displayedHierarchyNodeMap.get(activeFocusId);
    if (!targetNode) return set;

    // Add target node, all its ancestors, and all its descendants
    targetNode.ancestors().forEach((a) => set.add(a.data.id));
    targetNode.descendants().forEach((d) => set.add(d.data.id));

    // Add cross-referenced & replacement nodes + their ancestors in O(1) per related ID
    targetNode.data.relatedIds.forEach((relId) => {
      set.add(relId);
      const relNode = displayedHierarchyNodeMap.get(relId);
      if (relNode) {
        relNode.ancestors().forEach((a) => set.add(a.data.id));
      }
    });

    return set;
  }, [displayedHierarchyNodeMap, activeFocusId]);

  const hasActiveHighlight = Boolean(activeFocusId && activeHighlightSet.size > 0);

  // Filtered Requirement Nodes for the Right Inspector Drawer (non-blocking via useDeferredValue)
  const filteredRequirementNodes = useMemo(() => {
    const q = deferredReqSearchQuery.trim().toLowerCase();
    return dynamicComplianceNodes.filter((node) => {
      if (
        focusNodeMode &&
        focusInfluenceChainInfo.chainDocIds.size > 0 &&
        !focusInfluenceChainInfo.chainDocIds.has(node.docId)
      ) {
        return false;
      }
      if (priorityFilter !== 'all' && node.priority !== priorityFilter) {
        return false;
      }
      if (!q) return true;
      return (
        node.title.toLowerCase().includes(q) ||
        node.code.toLowerCase().includes(q) ||
        node.citation.toLowerCase().includes(q) ||
        node.groupTitle.toLowerCase().includes(q)
      );
    });
  }, [
    dynamicComplianceNodes,
    deferredReqSearchQuery,
    priorityFilter,
    focusNodeMode,
    focusInfluenceChainInfo,
  ]);

  const handleSelectCluster = (clusterId: TopicClusterId) => {
    setActiveClusterId(clusterId);
    if (clusterId === 'data_security') {
      setSelectedNodeId('doc-bvdlcn-91-2025');
      setReqSearchQuery('đồng ý');
    } else if (clusterId === 'construction_bidding') {
      setSelectedNodeId('doc-lxd-135-2025');
      setReqSearchQuery('khởi công');
    } else if (clusterId === 'ecommerce') {
      setSelectedNodeId('doc-ltmdt-122-2025');
      setReqSearchQuery('');
    } else {
      setSelectedNodeId('doc-lxd-135-2025');
      setReqSearchQuery('');
    }
  };

  const handleSelectTreeNode = useCallback(
    (datum: ComplianceTreeDatum) => {
      setSelectedNodeId((prev) => {
        if (focusNodeMode) {
          return datum.id;
        }
        return prev === datum.id ? null : datum.id;
      });
      if (datum.doc) {
        onSelectCenterDoc(datum.doc.id);
      } else if (datum.requirement) {
        onSelectCenterDoc(datum.requirement.docId);
      }
    },
    [focusNodeMode, onSelectCenterDoc]
  );

  const handleToggleFocusNodeMode = useCallback(() => {
    setFocusNodeMode((prev) => {
      const next = !prev;
      if (next && !selectedNodeId && focusAnchorNodeId) {
        setSelectedNodeId(focusAnchorNodeId);
      }
      return next;
    });
  }, [selectedNodeId, focusAnchorNodeId]);

  const handleToggleCollapseNode = useCallback((id: string) => {
    setCollapsedTreeIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // Export current d3-hierarchy Compliance Tree to PDF Dossier, High-DPI PNG, or Vector SVG
  const handleExportComplianceDossier = async (format: 'pdf' | 'png' | 'svg') => {
    if (!svgRef.current || exportingFormat) return;
    setExportingFormat(format);
    setExportNotice(null);

    try {
      const validityLabel =
        validityFilter === 'active'
          ? 'Chỉ nhánh Đang có hiệu lực'
          : validityFilter === 'expired'
          ? 'Chỉ nhánh Đã hết hiệu lực'
          : 'Tất cả nhánh hiệu lực';

      const priorityLabel =
        priorityFilter === 'all' ? 'Mọi mức độ ưu tiên' : `Ưu tiên ${priorityFilter}`;

      const selectedDatum = d3GraphData.nodes.find(
        (n) => n.data.id === selectedNodeId
      )?.data;

      const exportMeta: ProjectDossierExportMetadata = {
        projectName: dossierProjectName.trim() || 'Dự án Đầu tư & Quản trị Pháp lý ĐẠI SƠN',
        organizationName:
          dossierOrgName.trim() || 'Ban Pháp chế & Quản lý Dự án (QLDA)',
        dossierCode: dossierCode.trim() || 'HSPL-2026/ĐS-SSoT',
        clusterTitle: activeCluster.title,
        clusterSubtitle: activeCluster.subtitle,
        validityFilterLabel: validityLabel,
        priorityFilterLabel: priorityLabel,
        activeNodeLabel: selectedDatum ? selectedDatum.name : undefined,
        includeAppendixTable,
        scaleFactor: exportScaleFactor,
      };

      const veryHighCount = dynamicComplianceNodes.filter(
        (r) => r.priority === 'Rất cao'
      ).length;
      const highCount = dynamicComplianceNodes.filter(
        (r) => r.priority === 'Cao'
      ).length;
      const mediumCount = dynamicComplianceNodes.filter(
        (r) => r.priority === 'Trung bình'
      ).length;

      const stats = {
        activeCount: activeDocs.length,
        expiredCount: expiredDocs.length,
        veryHighCount,
        highCount,
        mediumCount,
        totalReqsCount: dynamicComplianceNodes.length,
      };

      const slug = activeCluster.id.toUpperCase();

      if (format === 'png') {
        await exportComplianceTreeToPNG(
          svgRef.current,
          d3GraphData.width,
          d3GraphData.height,
          exportMeta,
          stats,
          slug
        );
        setExportNotice(
          `Đã kết xuất ảnh PNG chất lượng cao (${Math.round(
            exportScaleFactor * 100
          )} DPI) kèm khung tên Hồ sơ Dự án (${exportMeta.dossierCode}).`
        );
      } else if (format === 'svg') {
        exportComplianceTreeToSVG(
          svgRef.current,
          d3GraphData.width,
          d3GraphData.height,
          slug
        );
        setExportNotice(
          'Đã kết xuất tệp đồ họa Vector (.SVG) chuẩn hồ sơ kỹ thuật để đính kèm CAD/BIM hoặc tài liệu dự án.'
        );
      } else {
        const filteredClusterDocs =
          validityFilter === 'active'
            ? activeDocs
            : validityFilter === 'expired'
            ? expiredDocs
            : clusterDocs;

        await exportComplianceTreeToPDF(
          svgRef.current,
          d3GraphData.width,
          d3GraphData.height,
          exportMeta,
          stats,
          filteredClusterDocs,
          filteredRequirementNodes,
          slug
        );
        setExportNotice(
          `Đã kết xuất Hồ sơ PDF khổ A3 ngang (${
            includeAppendixTable
              ? '2 trang: Sơ đồ Cây Pháp lý + Phụ lục Bảng kê SSoT'
              : '1 trang: Sơ đồ Cây Pháp lý'
          }) sẵn sàng đính kèm hồ sơ dự án.`
        );
      }
    } catch (err) {
      setExportNotice(
        `Không thể kết xuất tệp hồ sơ: ${
          err instanceof Error ? err.message : 'Lỗi xử lý đồ họa.'
        }`
      );
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FBF9F5] dark:bg-[#141413] text-[#1C1917] dark:text-[#F5F2EB] p-4 sm:p-6">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Header & Sub-Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200 dark:border-[#2E2C28] pb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B59745] mb-1">
              CÂY KIỂM TRA PHÁP LÝ · D3-HIERARCHY & ĐỆ QUY SSoT ĐẠI SƠN
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#152D42] dark:text-[#F5F2EB]">
              Cây Kiểm tra Pháp lý (Compliance Tree)
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
              Phân nhánh tự động bằng <code>d3-hierarchy</code> và cấu trúc đệ quy React theo <strong>Trạng thái hiệu lực</strong> (Đang có hiệu lực / Đã hết hiệu lực) và <strong>Mức độ ưu tiên</strong> (Rất cao / Cao / Trung bình). Di chuột hoặc nhấp vào nút để làm nổi bật toàn bộ chuỗi liên kết.
            </p>
          </div>

          {/* 3 Mode Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSubMode('tree_mindmap')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition cursor-pointer ${
                subMode === 'tree_mindmap'
                  ? 'bg-[#FFFDF7] dark:bg-[#23211D] border-[#C6A342] text-[#152D42] dark:text-amber-300 shadow-xs ring-1 ring-[#C6A342]/40'
                  : 'bg-white dark:bg-[#1A1917] border-stone-200 dark:border-[#2E2C28] text-stone-600 dark:text-stone-300'
              }`}
            >
              <span className="text-[#C6A342] font-bold">01</span>
              <GitBranch className="w-3.5 h-3.5 text-[#C6A342]" />
              <span>Cây Kiểm tra pháp lý (D3 Hierarchy & Đệ quy)</span>
            </button>

            <button
              onClick={() => setSubMode('situation_check')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition cursor-pointer ${
                subMode === 'situation_check'
                  ? 'bg-[#FFFDF7] dark:bg-[#23211D] border-[#C6A342] text-[#152D42] dark:text-amber-300 shadow-xs ring-1 ring-[#C6A342]/40'
                  : 'bg-white dark:bg-[#1A1917] border-stone-200 dark:border-[#2E2C28] text-stone-600 dark:text-stone-300'
              }`}
            >
              <span className="text-[#C6A342] font-bold">02</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C6A342]" />
              <span>Đánh giá theo tình huống thực tế</span>
            </button>

            <button
              onClick={() => setSubMode('ssot_graph_diff')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition cursor-pointer ${
                subMode === 'ssot_graph_diff'
                  ? 'bg-[#FFFDF7] dark:bg-[#23211D] border-[#C6A342] text-[#152D42] dark:text-amber-300 shadow-xs ring-1 ring-[#C6A342]/40'
                  : 'bg-white dark:bg-[#1A1917] border-stone-200 dark:border-[#2E2C28] text-stone-600 dark:text-stone-300'
              }`}
            >
              <span className="text-[#C6A342] font-bold">03</span>
              <Network className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-amber-400" />
              <span>Đồ thị Liên kết Chéo & Đối chiếu 2 Màn hình</span>
            </button>

            <button
              onClick={() => setSubMode('side_by_side')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition cursor-pointer ${
                subMode === 'side_by_side'
                  ? 'bg-[#152D42] border-[#C6A342] text-[#E9C96D] shadow-xs ring-1 ring-[#C6A342]/60'
                  : 'bg-white dark:bg-[#1A1917] border-stone-200 dark:border-[#2E2C28] text-stone-600 dark:text-stone-300'
              }`}
            >
              <span className="text-[#C6A342] font-bold">04</span>
              <Layers className="w-3.5 h-3.5 text-[#C6A342]" />
              <span>So sánh song song (Side-by-Side Diff)</span>
            </button>
          </div>
        </div>

        {/* Topic Cluster Selector Bar */}
        {subMode !== 'ssot_graph_diff' && subMode !== 'side_by_side' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TOPIC_CLUSTERS.map((cluster) => {
              const isSelected = activeClusterId === cluster.id;
              const docsInCluster =
                cluster.id === 'all_ssot'
                  ? documents
                  : documents.filter((d) => cluster.matchFields.includes(d.field));
              const activeCount = docsInCluster.filter(
                (d) => d.status !== 'HET_HIEU_LUC'
              ).length;
              const expiredCount = docsInCluster.filter(
                (d) => d.status === 'HET_HIEU_LUC'
              ).length;

              return (
                <button
                  key={cluster.id}
                  onClick={() => handleSelectCluster(cluster.id)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFFDF8] dark:bg-[#1E1D1A] border-[#C6A342] ring-1 ring-[#C6A342]/40 shadow-xs'
                      : 'bg-white dark:bg-[#1A1917] border-stone-200 dark:border-[#2E2C28] hover:border-[#C6A342]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[#152D42] dark:text-amber-300 truncate">
                      {cluster.title}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#C6A342]/20 text-[#8B6F1E] dark:text-amber-300 shrink-0">
                        Đang mở
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                    {cluster.subtitle}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-700 dark:text-stone-300 mt-2">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {activeCount} đang hiệu lực
                    </span>
                    <span>·</span>
                    <span className="text-stone-500">
                      {expiredCount} hết hiệu lực
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* SUB-MODE 1: D3-HIERARCHY COMPLIANCE TREE + RECURSIVE REACT TREE */}
        {subMode === 'tree_mindmap' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* LEFT + CENTER (8 cols): d3-hierarchy SVG Graph + Recursive React Tree */}
            <div className="xl:col-span-8 bg-white dark:bg-[#1A1917] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-5 shadow-xs space-y-5">
              {/* Interactive Filter & Zoom Control Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-[#2E2C28] pb-3.5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#152D42] dark:text-stone-100 flex items-center gap-2">
                    <span>Sơ đồ Cây Kiểm tra Pháp lý · {activeCluster.title}</span>
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Cấu trúc 4 tầng: <strong>SSoT Root</strong> → <strong>Trạng thái hiệu lực</strong> → <strong>Mức độ ưu tiên</strong> → <strong>Văn bản & Điều khoản</strong>
                  </p>
                </div>

                {/* Zoom, Reset, Focus Node & Project Dossier Export Controls (PDF / PNG / SVG) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Dynamic 'Focus Node' Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleFocusNodeMode}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      focusNodeMode
                        ? 'bg-[#7C3AED] text-white border-[#6D28D9] shadow-xs ring-2 ring-purple-300 dark:ring-purple-900'
                        : 'bg-[#FAF5FF] dark:bg-purple-950/30 hover:bg-purple-100 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800'
                    }`}
                    title="Chế độ Focus Node: Ẩn toàn bộ các nút rời rạc không liên kết, chỉ hiển thị chuỗi ảnh hưởng pháp lý trực tiếp của văn bản đang chọn"
                  >
                    {focusNodeMode ? (
                      <EyeOff className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <Crosshair className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
                    )}
                    <span>
                      {focusNodeMode
                        ? `Focus Node: Đang bật (Ẩn ${focusInfluenceChainInfo.hiddenDocNodesCount} VB)`
                        : 'Focus Node (Cô lập chuỗi)'}
                    </span>
                  </button>

                  {selectedNodeId && !focusNodeMode && (
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#FBF5DF] text-[#152D42] border border-[#C6A342] text-xs font-semibold cursor-pointer"
                    >
                      Bỏ cố định nút
                    </button>
                  )}

                  {/* Quick Export PDF Dossier Button */}
                  <button
                    type="button"
                    onClick={() => handleExportComplianceDossier('pdf')}
                    disabled={exportingFormat !== null}
                    className="px-3 py-1.5 rounded-lg bg-[#152D42] hover:bg-[#1E3A54] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-60"
                    title="Xuất Sơ đồ Cây Pháp lý kèm Khung tên & Phụ lục thành file PDF khổ A3 đính kèm hồ sơ dự án"
                  >
                    {exportingFormat === 'pdf' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E5C158]" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5 text-[#E5C158]" />
                    )}
                    <span>Xuất PDF Hồ sơ</span>
                  </button>

                  {/* Quick Export High-DPI PNG Button */}
                  <button
                    type="button"
                    onClick={() => handleExportComplianceDossier('png')}
                    disabled={exportingFormat !== null}
                    className="px-3 py-1.5 rounded-lg bg-[#FFFDF7] dark:bg-[#23211D] hover:bg-[#FBF5DF] text-[#152D42] dark:text-amber-300 border border-[#C6A342] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                    title="Xuất hình ảnh PNG độ phân giải cao (Retina 300 DPI) kèm Khung tên dự án"
                  >
                    {exportingFormat === 'png' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C6A342]" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-[#C6A342]" />
                    )}
                    <span>Xuất Ảnh PNG</span>
                  </button>

                  {/* Toggle Project Dossier Export Config Panel */}
                  <button
                    type="button"
                    onClick={() => setShowExportConfig((prev) => !prev)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                      showExportConfig
                        ? 'bg-[#C6A342] text-[#152D42] border-[#C6A342]'
                        : 'border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                    title="Tùy chỉnh Khung tên Dự án, Mã hồ sơ, Độ phân giải & Phụ lục trước khi xuất"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Khung tên HS</span>
                  </button>

                  <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-0.5" />

                  <button
                    onClick={() => setZoomScale((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}
                    className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    title="Thu nhỏ sơ đồ"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono-code px-1">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomScale((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))}
                    className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    title="Phóng to sơ đồ"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setZoomScale(1);
                      setPriorityFilter('all');
                      setValidityFilter('all');
                      setFocusNodeMode(false);
                      setSelectedNodeId(null);
                    }}
                    className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    title="Đặt lại góc nhìn & bộ lọc"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expandable Project Dossier Export Configuration Panel */}
              {showExportConfig && (
                <div className="rounded-xl border border-[#C6A342] bg-[#FFFDF7] dark:bg-[#1E1D19] p-4 space-y-3 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
                        <Settings2 className="w-4 h-4 text-[#C6A342]" />
                        <span>Cấu hình Khung Tên Hồ Sơ Dự Án Đính Kèm (PDF A3 / Ảnh PNG 300 DPI / Vector SVG)</span>
                      </h3>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400">
                        Thông tin dưới đây được đóng dấu trực tiếp vào Khung tên (Title Block), Chú giải & Khung chữ ký phê duyệt của bản vẽ Sơ đồ Cây Pháp lý.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowExportConfig(false)}
                      className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                    >
                      Thu gọn ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Tên Dự án / Gói thầu đính kèm
                      </label>
                      <input
                        type="text"
                        value={dossierProjectName}
                        onChange={(e) => setDossierProjectName(e.target.value)}
                        placeholder="Nhập tên dự án hoặc gói thầu..."
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-xs focus:outline-none focus:border-[#C6A342]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Đơn vị lập hồ sơ / Ban QLDA
                      </label>
                      <input
                        type="text"
                        value={dossierOrgName}
                        onChange={(e) => setDossierOrgName(e.target.value)}
                        placeholder="Nhập tên Chủ đầu tư / Ban QLDA..."
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-xs focus:outline-none focus:border-[#C6A342]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Mã hiệu Hồ sơ Pháp lý
                      </label>
                      <input
                        type="text"
                        value={dossierCode}
                        onChange={(e) => setDossierCode(e.target.value)}
                        placeholder="VD: HSPL-2026/ĐS-SSoT"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-xs font-mono-code focus:outline-none focus:border-[#C6A342]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeAppendixTable}
                          onChange={(e) => setIncludeAppendixTable(e.target.checked)}
                          className="rounded border-stone-300 text-[#152D42] focus:ring-[#C6A342]"
                        />
                        <span>Kèm Trang 2: Phụ lục Bảng kê Văn bản & Điều khoản tuân thủ (PDF)</span>
                      </label>

                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-stone-600 dark:text-stone-400 font-semibold">
                          Độ nét ảnh:
                        </span>
                        {[
                          { scale: 2, label: 'Chuẩn 2x (200 DPI)' },
                          { scale: 2.5, label: 'Cao 2.5x (250 DPI)' },
                          { scale: 3, label: 'In ấn A3 3x (300 DPI)' },
                        ].map((opt) => (
                          <button
                            key={opt.scale}
                            type="button"
                            onClick={() => setExportScaleFactor(opt.scale)}
                            className={`px-2 py-0.5 rounded border text-[11px] font-semibold cursor-pointer ${
                              exportScaleFactor === opt.scale
                                ? 'bg-[#152D42] text-white border-[#152D42]'
                                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportComplianceDossier('pdf')}
                        disabled={exportingFormat !== null}
                        className="px-3 py-1.5 rounded-lg bg-[#152D42] hover:bg-[#1E3A54] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <FileDown className="w-3.5 h-3.5 text-[#E5C158]" />
                        <span>Tải PDF Khổ A3 ({includeAppendixTable ? '2 Trang' : '1 Trang'})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportComplianceDossier('png')}
                        disabled={exportingFormat !== null}
                        className="px-3 py-1.5 rounded-lg bg-[#C6A342] hover:bg-[#B59235] text-[#152D42] text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Tải Ảnh PNG Siêu Nét</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportComplianceDossier('svg')}
                        disabled={exportingFormat !== null}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-[#C6A342] text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <FileCode2 className="w-3.5 h-3.5 text-[#152D42] dark:text-amber-300" />
                        <span>Tải Vector .SVG</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Status Feedback Banner */}
              {exportNotice && (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{exportNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExportNotice(null)}
                    className="text-[11px] font-bold underline cursor-pointer shrink-0"
                  >
                    Đóng
                  </button>
                </div>
              )}

              {/* Filter Pills for Validity Branch & Priority Level */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FBF9F5] dark:bg-[#141413] p-3 rounded-xl border border-stone-200 dark:border-[#2E2C28]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3 text-[#C6A342]" />
                    Nhánh hiệu lực:
                  </span>
                  {(
                    [
                      { id: 'all', label: 'Tất cả nhánh' },
                      { id: 'active', label: `Đang có hiệu lực (${activeDocs.length})` },
                      { id: 'expired', label: `Đã hết hiệu lực (${expiredDocs.length})` },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setValidityFilter(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        validityFilter === st.id
                          ? 'bg-[#152D42] text-white'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1 mr-1">
                    <Layers className="w-3 h-3 text-[#C6A342]" />
                    Mức ưu tiên:
                  </span>
                  {(['all', 'Rất cao', 'Cao', 'Trung bình'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setPriorityFilter(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                        priorityFilter === lvl
                          ? 'bg-[#C6A342] text-[#152D42] font-bold'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {lvl !== 'all' && (
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: PRIORITY_META[lvl].dotColor }}
                        />
                      )}
                      <span>{lvl === 'all' ? 'Mọi mức độ' : lvl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active 'Focus Node' Immediate Legal Influence Chain Banner */}
              {focusNodeMode && focusInfluenceChainInfo.anchorDatum && (
                <div className="rounded-xl border border-purple-300 dark:border-purple-800 bg-gradient-to-r from-[#FAF5FF] to-[#FFFDF7] dark:from-[#1F162B] dark:to-[#1A1917] p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#7C3AED] text-white text-[11px] font-bold">
                        <Crosshair className="w-3 h-3 text-amber-300" />
                        FOCUS NODE ĐANG BẬT
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#152D42] dark:text-stone-100">
                        Tâm điểm cô lập: {focusInfluenceChainInfo.anchorDatum.name}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                        Hiển thị {focusInfluenceChainInfo.visibleDocNodesCount}/
                        {focusInfluenceChainInfo.totalDocNodesCount} văn bản · Đã ẩn{' '}
                        {focusInfluenceChainInfo.hiddenDocNodesCount} nút rời rạc
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFocusNodeMode(false)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200 text-xs font-semibold hover:bg-purple-50 cursor-pointer"
                    >
                      Hiển thị lại toàn bộ đồ thị
                    </button>
                  </div>

                  {focusInfluenceChainInfo.immediateLinkedDocs.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-purple-200/70 dark:border-purple-900/60">
                      <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 mr-1">
                        Chuỗi ảnh hưởng trực tiếp ({focusInfluenceChainInfo.immediateLinkedDocs.length} văn bản liên kết chéo/thay thế — nhấp để chuyển tâm điểm):
                      </span>
                      {focusInfluenceChainInfo.immediateLinkedDocs.map((linked) => (
                        <button
                          key={linked.id}
                          type="button"
                          onClick={() => {
                            setSelectedNodeId(linked.id);
                            onSelectCenterDoc(linked.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 hover:border-[#7C3AED] border border-purple-200 dark:border-purple-800 text-xs font-semibold text-[#152D42] dark:text-purple-200 flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                        >
                          <Link2 className="w-3 h-3 text-[#7C3AED]" />
                          <span>{linked.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            {linked.relationType}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      Nút này chỉ có chuỗi phân cấp dọc (Trạng thái hiệu lực → Mức độ ưu tiên → Yêu cầu điều khoản), không có cung đối soát chéo sang văn bản khác.
                    </p>
                  )}
                </div>
              )}

              {/* D3-HIERARCHY INTERACTIVE SVG COMPLIANCE TREE */}
              <div className="w-full overflow-x-auto rounded-2xl border border-stone-200 dark:border-[#2E2C28] bg-gradient-to-b from-[#FCFBF8] to-[#F5F2EB] dark:from-[#161513] dark:to-[#121110] p-2">
                <div
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${d3GraphData.width} ${d3GraphData.height}`}
                    className="w-full h-auto min-w-[820px] select-none"
                  >
                    <defs>
                      <marker
                        id="d3-arrow-highlight"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#C6A342" />
                      </marker>
                      <marker
                        id="d3-arrow-xref"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#7C3AED" />
                      </marker>
                    </defs>

                    <g
                      transform={`translate(${d3GraphData.offsetX}, ${d3GraphData.offsetY})`}
                    >
                      {/* 1. Render d3-hierarchy Tree Links (Parent -> Child Bezier Paths) */}
                      {d3GraphData.links.map((link) => {
                        const sourceX = link.source.y;
                        const sourceY = link.source.x;
                        const targetX = link.target.y;
                        const targetY = link.target.x;
                        const midX = (sourceX + targetX) / 2;

                        const isEdgeHighlighted =
                          focusNodeMode ||
                          (activeHighlightSet.has(link.source.data.id) &&
                            activeHighlightSet.has(link.target.data.id));

                        return (
                          <path
                            key={`d3-link-${link.source.data.id}-${link.target.data.id}`}
                            d={`M ${sourceX + 95} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${
                              targetX - 95
                            } ${targetY}`}
                            fill="none"
                            stroke={
                              isEdgeHighlighted
                                ? '#C6A342'
                                : link.target.data.borderHex || '#CBD5E1'
                            }
                            strokeWidth={isEdgeHighlighted ? 3 : 1.6}
                            opacity={
                              !focusNodeMode && hasActiveHighlight && !isEdgeHighlighted
                                ? 0.22
                                : 0.95
                            }
                            markerEnd={
                              isEdgeHighlighted
                                ? 'url(#d3-arrow-highlight)'
                                : undefined
                            }
                          />
                        );
                      })}

                      {/* 2. Render Cross-Reference & Replacement Arcs between Document Nodes */}
                      {d3GraphData.crossLinks.map((cl) => {
                        const isRelatedToFocus =
                          focusNodeMode ||
                          activeFocusId === cl.source.data.id ||
                          activeFocusId === cl.target.data.id;
                        if (!isRelatedToFocus) return null;

                        const sx = cl.source.y + 95;
                        const sy = cl.source.x;
                        const tx = cl.target.y + 95;
                        const ty = cl.target.x;
                        const ctrlX = Math.max(sx, tx) + 95;
                        const ctrlY = (sy + ty) / 2;

                        return (
                          <g key={cl.id}>
                            <path
                              d={`M ${sx} ${sy} Q ${ctrlX} ${ctrlY} ${tx} ${ty}`}
                              fill="none"
                              stroke="#7C3AED"
                              strokeWidth={2.4}
                              strokeDasharray="5 3"
                              markerEnd="url(#d3-arrow-xref)"
                            />
                            <text
                              x={ctrlX - 25}
                              y={ctrlY}
                              className="fill-purple-700 text-[10px] font-bold"
                            >
                              {cl.label}
                            </text>
                          </g>
                        );
                      })}

                      {/* 3. Render d3-hierarchy Nodes */}
                      {d3GraphData.nodes.map((pointNode) => {
                        const datum = pointNode.data;
                        const nx = pointNode.y;
                        const ny = pointNode.x;
                        const isHighlighted =
                          focusNodeMode || activeHighlightSet.has(datum.id);
                        const isDirectFocus =
                          hoveredNodeId === datum.id ||
                          selectedNodeId === datum.id ||
                          (focusNodeMode && focusAnchorNodeId === datum.id);

                        const boxW = datum.nodeType === 'document' ? 215 : 190;
                        const boxH = 52;

                        return (
                          <g
                            key={`d3-node-${datum.id}`}
                            transform={`translate(${nx - 95}, ${ny - boxH / 2})`}
                            onMouseEnter={() => setHoveredNodeId(datum.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            onClick={() => handleSelectTreeNode(datum)}
                            className="cursor-pointer transition-opacity duration-150"
                            opacity={
                              !focusNodeMode && hasActiveHighlight && !isHighlighted
                                ? 0.28
                                : 1
                            }
                          >
                            <rect
                              width={boxW}
                              height={boxH}
                              rx={10}
                              fill={datum.bgHex || '#FFFFFF'}
                              stroke={
                                isDirectFocus
                                  ? focusNodeMode
                                    ? '#7C3AED'
                                    : '#152D42'
                                  : isHighlighted && hasActiveHighlight
                                  ? '#C6A342'
                                  : datum.borderHex || '#CBD5E1'
                              }
                              strokeWidth={
                                isDirectFocus
                                  ? 3
                                  : isHighlighted && hasActiveHighlight
                                  ? 2.2
                                  : 1.3
                              }
                            />
                            <text
                              x={10}
                              y={19}
                              fill={datum.colorHex || '#152D42'}
                              className="text-[10.5px] font-bold"
                            >
                              {datum.name.slice(0, 29)}
                            </text>
                            <text
                              x={10}
                              y={36}
                              fill="#44403C"
                              className="text-[9.5px]"
                            >
                              {datum.badgeText || datum.nodeType.toUpperCase()}
                              {datum.relatedIds.length > 0
                                ? ` · ${datum.relatedIds.length} liên kết`
                                : ''}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                </div>
              </div>

              {/* RECURSIVE REACT COMPLIANCE TREE (<RecursiveComplianceTreeNode />) */}
              <div className="pt-4 border-t border-stone-200 dark:border-[#2E2C28] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#152D42] dark:text-stone-100">
                      Cây Phân Nhánh Đệ Quy Chi Tiết (Recursive Compliance Tree)
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {focusNodeMode
                        ? 'Đang ở chế độ Focus Node: Chỉ hiển thị các nhánh thuộc chuỗi ảnh hưởng pháp lý trực tiếp của nút đang chọn.'
                        : 'Đồng bộ trực tiếp với đồ thị d3-hierarchy phía trên: Di chuột hoặc nhấp vào bất kỳ nhánh/văn bản nào để làm nổi bật các nút liên quan.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCollapsedTreeIds({})}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    >
                      Mở toàn bộ cây
                    </button>
                    {focusNodeMode && (
                      <button
                        onClick={() => setFocusNodeMode(false)}
                        className="px-2.5 py-1 rounded-lg border border-purple-300 bg-purple-50 text-purple-900 text-xs font-semibold cursor-pointer"
                      >
                        Tắt Focus Node
                      </button>
                    )}
                    {selectedNodeId && !focusNodeMode && (
                      <button
                        onClick={() => setSelectedNodeId(null)}
                        className="px-2.5 py-1 rounded-lg border border-[#C6A342] bg-[#FBF5DF] text-[#152D42] text-xs font-semibold cursor-pointer"
                      >
                        Xóa lọc nổi bật
                      </button>
                    )}
                  </div>
                </div>

                <RecursiveComplianceTreeNode
                  node={displayedHierarchyRootData}
                  depth={0}
                  collapsedIds={collapsedTreeIds}
                  onToggleCollapse={handleToggleCollapseNode}
                  activeHighlightSet={activeHighlightSet}
                  hasActiveHighlight={hasActiveHighlight}
                  selectedNodeId={selectedNodeId}
                  hoveredNodeId={hoveredNodeId}
                  onHoverNode={setHoveredNodeId}
                  onSelectNode={handleSelectTreeNode}
                  onOpenReader={onOpenReader}
                  onAskAquaWithContext={onAskAquaWithContext}
                />
              </div>
            </div>

            {/* RIGHT PANEL (4 cols): KẾT QUẢ TÌM KIẾM YÊU CẦU TUÂN THỦ SSoT */}
            <div className="xl:col-span-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Kết quả tìm kiếm yêu cầu SSoT
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {filteredRequirementNodes.length} nút yêu cầu khớp{' '}
                    <strong className="text-stone-800 dark:text-stone-200">
                      “{reqSearchQuery || 'toàn bộ nhánh'}”
                    </strong>
                  </p>
                </div>
                {(reqSearchQuery || priorityFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setReqSearchQuery('');
                      setPriorityFilter('all');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                  >
                    Đặt lại
                  </button>
                )}
              </div>

              {/* Search Input inside Requirements Drawer */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reqSearchQuery}
                  onChange={(e) => setReqSearchQuery(e.target.value)}
                  placeholder="Tìm điều khoản, yêu cầu (VD: đồng ý, khởi công, L2.1)..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] focus:outline-none focus:border-[#C6A342]"
                />
              </div>

              {/* Quick Filter Chips */}
              <div className="flex flex-wrap gap-1.5">
                {['đồng ý', 'nghiêm cấm', 'khởi công', 'đấu thầu', 'quyết toán', '±5%'].map(
                  (kw) => (
                    <button
                      key={kw}
                      onClick={() =>
                        setReqSearchQuery((prev) => (prev === kw ? '' : kw))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer ${
                        reqSearchQuery.toLowerCase() === kw
                          ? 'bg-[#152D42] text-white border-[#152D42]'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-transparent'
                      }`}
                    >
                      {kw}
                    </button>
                  )
                )}
              </div>

              {/* Scrollable list of Requirement Cards synchronized with Hover/Click Highlighting */}
              <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
                {filteredRequirementNodes.map((node) => {
                  const pMeta = PRIORITY_META[node.priority];
                  const isHighlighted =
                    activeHighlightSet.has(node.id) ||
                    activeHighlightSet.has(node.docId);

                  return (
                    <div
                      key={node.id}
                      onMouseEnter={() => setHoveredNodeId(node.docId)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => {
                        setSelectedNodeId(node.docId);
                        onOpenReader(node.docId, node.articleId);
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer space-y-1.5 ${
                        isHighlighted && hasActiveHighlight
                          ? 'border-[#C6A342] bg-[#FFFDF5] dark:bg-[#242016] shadow-xs'
                          : 'border-stone-200 dark:border-[#2E2C28] hover:border-[#286181] dark:hover:border-amber-400 bg-[#FBF9F5]/60 dark:bg-[#141413]'
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                        {node.title}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: pMeta.dotColor }}
                          />
                          <span
                            className="font-bold"
                            style={{ color: pMeta.dotColor }}
                          >
                            {node.priority}
                          </span>
                          <span className="text-stone-400">·</span>
                          <span className="text-stone-600 dark:text-stone-400 font-mono-code text-[11px]">
                            {node.citation}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskAquaWithContext(
                              `Giải thích chi tiết quy định tại ${node.citation}: "${node.title}"`,
                              `${node.title} (${node.citation})`
                            );
                          }}
                          className="text-[11px] font-semibold text-[#286181] dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          Hỏi AQUA →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODE 2: 02 ĐÁNH GIÁ THEO TÌNH HUỐNG THỰC TẾ */}
        {subMode === 'situation_check' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {SITUATION_CHECKLISTS.map((sit) => (
              <div
                key={sit.id}
                className="bg-white dark:bg-[#1A1917] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-xs font-bold inline-flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Mức độ rủi ro: {sit.riskLevel}
                    </span>
                    <button
                      onClick={() => onOpenReader(sit.docId, sit.articleId)}
                      className="text-xs font-semibold text-[#286181] dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Mở căn cứ gốc ↗
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {sit.title}
                  </h3>

                  <div className="space-y-2 pt-1">
                    {sit.questions.map((q, idx) => {
                      const checkKey = `${sit.id}-${idx}`;
                      const checked = !!checkedSituationItems[checkKey];
                      return (
                        <label
                          key={checkKey}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition ${
                            checked
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                              : 'bg-[#FBF9F5] dark:bg-[#141413] border-stone-200 dark:border-[#2E2C28]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setCheckedSituationItems((prev) => ({
                                ...prev,
                                [checkKey]: !checked,
                              }))
                            }
                            className="mt-0.5 accent-emerald-600"
                          />
                          <span>{q}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 dark:border-[#2E2C28] space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                    <strong className="inline-flex items-center gap-1 mr-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Kết luận pháp lý:
                    </strong>
                    {sit.legalConclusion}
                  </div>
                  <div className="flex justify-end flex-wrap gap-2">
                    <button
                      onClick={() => onOpenReader(sit.docId, sit.articleId)}
                      className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:border-[#C6A342] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem văn bản dẫn chiếu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        onAskAquaWithContext(
                          `Đánh giá rủi ro và hướng dẫn hồ sơ cần chuẩn bị cho: ${sit.title}`,
                          sit.legalConclusion
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-[#152D42] text-white text-xs font-semibold hover:bg-[#213E57] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E9C96D]" />
                      <span>Nhờ Trợ lý AQUA thẩm định tình huống này</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUB-MODE 3: ĐỒ THỊ NÚT MẠNG SSoT & ĐỐI CHIẾU 2 MÀN HÌNH */}
        {subMode === 'ssot_graph_diff' && (
          <LegalMapAndCrossCheck
            documents={documents}
            crossReferences={crossReferences}
            selectedCenterDocId={centerDocId}
            onSelectCenterDoc={onSelectCenterDoc}
            selectedCrossRef={selectedCrossRef}
            onSelectCrossRef={onSelectCrossRef}
            onOpenReader={onOpenReader}
          />
        )}

        {/* SUB-MODE 4: SO SÁNH SONG SONG 2 PHIÊN BẢN HOẶC 2 VĂN BẢN LIÊN QUAN (SIDE-BY-SIDE DIFF) */}
        {subMode === 'side_by_side' && (
          <SideBySideComparisonView
            documents={documents}
            crossReferences={crossReferences}
            initialLeftDocId={centerDocId}
            initialRightDocId={
              selectedCrossRef?.source_doc_id &&
              selectedCrossRef.source_doc_id !== centerDocId
                ? selectedCrossRef.source_doc_id
                : selectedCrossRef?.target_doc_id &&
                  selectedCrossRef.target_doc_id !== centerDocId
                ? selectedCrossRef.target_doc_id
                : undefined
            }
            onOpenReader={onOpenReader}
            onAskAquaWithContext={onAskAquaWithContext}
          />
        )}
      </div>
    </div>
  );
};
