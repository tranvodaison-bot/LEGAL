import { useMemo } from 'react';
import { hierarchy, tree as d3Tree, HierarchyPointNode } from 'd3-hierarchy';
import { LegalDocument, LegalCrossReference } from '../types/legal';
import { ComplianceRequirementNode } from '../types/compliance';

export type PriorityLevel = 'Rất cao' | 'Cao' | 'Trung bình';
export type TreeNodeType =
  | 'root'
  | 'status_branch'
  | 'priority_branch'
  | 'document'
  | 'requirement';

export interface ComplianceTreeDatum {
  id: string;
  name: string;
  subtitle?: string;
  nodeType: TreeNodeType;
  statusGroup?: 'CON_HIEU_LUC' | 'HET_HIEU_LUC';
  priority?: PriorityLevel;
  doc?: LegalDocument;
  requirement?: ComplianceRequirementNode;
  badgeText?: string;
  colorHex?: string;
  bgHex?: string;
  borderHex?: string;
  relatedIds: string[]; // Cross-referenced or replacement node IDs for hover/click highlighting
  children?: ComplianceTreeDatum[];
}

export const GRAPH_PRIORITY_META: Record<
  PriorityLevel,
  {
    label: PriorityLevel;
    dotColor: string;
    strokeColor: string;
    bgHex: string;
    borderHex: string;
    badgeBg: string;
    badgeText: string;
    desc: string;
  }
> = {
  'Rất cao': {
    label: 'Rất cao',
    dotColor: '#DC2626',
    strokeColor: '#DC2626',
    bgHex: '#FEE2E2',
    borderHex: '#EF4444',
    badgeBg: 'bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-800',
    badgeText: 'text-red-700 dark:text-red-300',
    desc: 'Chế tài phạt từ 100 triệu đồng / % doanh thu hoặc đình chỉ khởi công, xuất toán quyết toán vốn',
  },
  Cao: {
    label: 'Cao',
    dotColor: '#D97706',
    strokeColor: '#D97706',
    bgHex: '#FEF3C7',
    borderHex: '#F59E0B',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-800 dark:text-amber-300',
    desc: 'Nghĩa vụ pháp lý bắt buộc phải có biên bản, thiết lập kỹ thuật hoặc lưu nhật ký kiểm chứng',
  },
  'Trung bình': {
    label: 'Trung bình',
    dotColor: '#2563EB',
    strokeColor: '#2563EB',
    bgHex: '#DBEAFE',
    borderHex: '#3B82F6',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800',
    badgeText: 'text-blue-800 dark:text-blue-300',
    desc: 'Quy chuẩn kỹ thuật, định mức áp dụng và trình tự thủ tục phối hợp liên ngành',
  },
};

export function inferArticlePriority(
  doc: LegalDocument,
  articleTitle: string,
  articleContent: string,
  amendmentNote?: string
): PriorityLevel {
  const combined = `${articleTitle} ${articleContent} ${amendmentNote || ''}`.toLowerCase();
  if (
    combined.includes('nghiêm cấm') ||
    combined.includes('điều kiện khởi công') ||
    combined.includes('xử phạt') ||
    combined.includes('phạt tiền') ||
    combined.includes('doanh thu') ||
    combined.includes('nghiệm thu hoàn thành') ||
    combined.includes('bắt buộc') ||
    combined.includes('rất cao')
  ) {
    return 'Rất cao';
  }
  if (
    doc.doc_type === 'Luật' ||
    combined.includes('đồng ý') ||
    combined.includes('thẩm định') ||
    combined.includes('quyết toán') ||
    combined.includes('điều chỉnh đơn giá') ||
    combined.includes('bàn giao mặt bằng') ||
    combined.includes('trách nhiệm')
  ) {
    return 'Cao';
  }
  return 'Trung bình';
}

export function inferDocumentDominantPriority(
  doc: LegalDocument,
  docReqs: ComplianceRequirementNode[]
): PriorityLevel {
  if (doc.status === 'HET_HIEU_LUC') {
    return 'Trung bình';
  }
  const vhCount =
    doc.compliance_stats?.very_high_count ??
    docReqs.filter((r) => r.priority === 'Rất cao').length;
  const hCount =
    doc.compliance_stats?.high_count ??
    docReqs.filter((r) => r.priority === 'Cao').length;

  if (doc.doc_type === 'Luật' || vhCount >= 6) {
    return 'Rất cao';
  }
  if (doc.doc_type === 'Nghị định' || vhCount >= 1 || hCount >= 5) {
    return 'Cao';
  }
  return 'Trung bình';
}

export interface UseComplianceGraphParams {
  documents: LegalDocument[];
  crossReferences: LegalCrossReference[];
  requirementNodes: ComplianceRequirementNode[];
  selectedClusterId: string;
  clusterMatchFields?: string[];
  clusterTitle?: string;
  clusterSubtitle?: string;
  priorityFilter?: PriorityLevel | 'all';
  validityFilter?: 'all' | 'active' | 'expired';
  focusNodeMode: boolean;
  focusAnchorNodeId: string | null;
}

/**
 * Custom Hook chuẩn Production: Xử lý toàn bộ logic đồ thị d3-hierarchy,
 * ma trận kề đối soát chéo O(1) Lookup và cô lập chuỗi ảnh hưởng (Focus Node).
 */
export function useComplianceGraph({
  documents,
  crossReferences,
  requirementNodes,
  selectedClusterId,
  clusterMatchFields,
  clusterTitle = 'Toàn bộ Kho SSoT ĐẠI SƠN',
  clusterSubtitle = 'Tự động tổng hợp mọi văn bản quy phạm pháp luật đang lưu trữ trong hệ thống',
  priorityFilter = 'all',
  validityFilter = 'all',
  focusNodeMode,
  focusAnchorNodeId,
}: UseComplianceGraphParams) {
  // 1. Xây dựng ma trận kề đối soát chéo O(1) Lookup (cả cấp Văn bản lẫn Điều khoản)
  const crossRefAdjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    const addBidirectionalEdge = (a?: string, b?: string) => {
      if (!a || !b || a === b) return;
      if (!map.has(a)) map.set(a, new Set());
      if (!map.has(b)) map.set(b, new Set());
      map.get(a)!.add(b);
      map.get(b)!.add(a);
    };

    crossReferences.forEach((ref) => {
      const srcArt = ref.sourceArticleId || ref.source_article_id;
      const tgtArt = ref.targetArticleId || ref.target_article_id;
      addBidirectionalEdge(srcArt, tgtArt);
      addBidirectionalEdge(ref.source_doc_id, ref.target_doc_id);
    });

    // Bổ sung liên kết thay thế hai chiều từ SSoT metadata (replaced_by_doc_id)
    documents.forEach((doc) => {
      if (doc.replaced_by_doc_id) {
        addBidirectionalEdge(doc.id, doc.replaced_by_doc_id);
      }
    });

    return map;
  }, [documents, crossReferences]);

  // 2. Lọc danh sách văn bản theo chuyên đề (Cluster)
  const clusterDocs = useMemo(() => {
    if (
      selectedClusterId === 'ALL' ||
      selectedClusterId === 'all_ssot' ||
      (clusterMatchFields && clusterMatchFields.length === 0)
    ) {
      return documents;
    }
    if (clusterMatchFields && clusterMatchFields.length > 0) {
      return documents.filter((d) => clusterMatchFields.includes(d.field));
    }
    return documents.filter((d) => d.field === selectedClusterId);
  }, [documents, selectedClusterId, clusterMatchFields]);

  // Phân tách tự động theo trạng thái hiệu lực SSoT
  const expiredDocs = useMemo(
    () => clusterDocs.filter((d) => d.status === 'HET_HIEU_LUC'),
    [clusterDocs]
  );

  const activeDocs = useMemo(
    () => clusterDocs.filter((d) => d.status !== 'HET_HIEU_LUC'),
    [clusterDocs]
  );

  // Lọc danh sách văn bản theo chuyên đề và chế độ Focus Node
  const filteredDocuments = useMemo(() => {
    let docs = clusterDocs;

    if (focusNodeMode && focusAnchorNodeId) {
      const anchorDoc = documents.find(
        (d) => d.id === focusAnchorNodeId || d.doc_number === focusAnchorNodeId
      );
      if (anchorDoc) {
        const relatedIds = crossRefAdjacencyMap.get(anchorDoc.id) || new Set();
        docs = docs.filter(
          (d) => d.id === anchorDoc.id || relatedIds.has(d.id)
        );
      }
    }

    return docs;
  }, [
    documents,
    clusterDocs,
    focusNodeMode,
    focusAnchorNodeId,
    crossRefAdjacencyMap,
  ]);

  // 3. Tổng hợp động các nút yêu cầu tuân thủ (Requirement Nodes) từ SSoT
  const dynamicComplianceNodes = useMemo((): ComplianceRequirementNode[] => {
    const clusterDocIds = new Set(clusterDocs.map((d) => d.id));
    const result: ComplianceRequirementNode[] = [];
    const coveredArticleKeys = new Set<string>();

    requirementNodes.forEach((node) => {
      if (clusterDocIds.has(node.docId)) {
        result.push(node);
        if (node.articleId) {
          coveredArticleKeys.add(`${node.docId}:${node.articleId}`);
        }
      }
    });

    activeDocs.forEach((doc) => {
      doc.articles.forEach((art, idx) => {
        const key = `${doc.id}:${art.id}`;
        if (coveredArticleKeys.has(key)) return;

        const priority = inferArticlePriority(
          doc,
          art.article_title,
          art.content,
          art.amendment_note
        );
        const prefix = doc.doc_number.split('/')[0] || 'VB';
        result.push({
          id: `auto-req-${doc.id}-${art.id}`,
          code: `${prefix}.${idx + 1}`,
          groupCode: art.chapter_no || 'Chương I',
          groupTitle: `${art.chapter_no} · ${art.chapter_title}`,
          title: `${doc.short_title} · ${art.article_no}: ${art.article_title}`,
          priority,
          citation: `${art.article_no} (${doc.doc_number})`,
          docId: doc.id,
          articleId: art.id,
          penaltyNote: art.amendment_note,
        });
      });
    });

    return result;
  }, [clusterDocs, activeDocs, requirementNodes]);

  // Pre-index requirements by docId in O(R) for O(1) lookup per document (eliminates O(D * R) nested filters)
  const reqsByDocId = useMemo(() => {
    const map = new Map<string, ComplianceRequirementNode[]>();
    dynamicComplianceNodes.forEach((req) => {
      let bucket = map.get(req.docId);
      if (!bucket) {
        bucket = [];
        map.set(req.docId, bucket);
      }
      bucket.push(req);
    });
    return map;
  }, [dynamicComplianceNodes]);

  // 4. Xây dựng cây phân cấp hợp nhất (ComplianceTreeDatum) với độ phức tạp O(D + R)
  const complianceHierarchyRootData = useMemo((): ComplianceTreeDatum => {
    const levels: PriorityLevel[] = ['Rất cao', 'Cao', 'Trung bình'];

    const buildPriorityBranches = (
      docsSource: LegalDocument[],
      statusGroup: 'CON_HIEU_LUC' | 'HET_HIEU_LUC'
    ): ComplianceTreeDatum[] => {
      return levels
        .filter((lvl) => priorityFilter === 'all' || priorityFilter === lvl)
        .map((lvl): ComplianceTreeDatum => {
          const pMeta = GRAPH_PRIORITY_META[lvl];
          const docsInTier = docsSource.filter((doc) => {
            const docReqs = reqsByDocId.get(doc.id) || [];
            return inferDocumentDominantPriority(doc, docReqs) === lvl;
          });

          const docNodes: ComplianceTreeDatum[] = docsInTier.map(
            (doc): ComplianceTreeDatum => {
              const allDocReqs = reqsByDocId.get(doc.id) || [];
              const reqs =
                priorityFilter === 'all'
                  ? allDocReqs
                  : allDocReqs.filter((n) => n.priority === priorityFilter);

              const relatedDocIds = Array.from(
                crossRefAdjacencyMap.get(doc.id) || []
              );

              const reqChildren: ComplianceTreeDatum[] =
                statusGroup === 'CON_HIEU_LUC'
                  ? reqs.slice(0, 6).map((req): ComplianceTreeDatum => {
                      const reqMeta = GRAPH_PRIORITY_META[req.priority];
                      return {
                        id: req.id,
                        name: `[${req.code}] ${req.title}`,
                        subtitle: `Căn cứ: ${req.citation}${
                          req.penaltyNote ? ` · ${req.penaltyNote}` : ''
                        }`,
                        nodeType: 'requirement',
                        statusGroup: 'CON_HIEU_LUC',
                        priority: req.priority,
                        requirement: req,
                        badgeText: req.priority,
                        colorHex: reqMeta.dotColor,
                        bgHex: reqMeta.bgHex,
                        borderHex: reqMeta.borderHex,
                        relatedIds: [doc.id, ...relatedDocIds],
                      };
                    })
                  : [];

              if (statusGroup === 'HET_HIEU_LUC') {
                return {
                  id: doc.id,
                  name: `${doc.short_title}`,
                  subtitle: `Hết hiệu lực: ${
                    doc.expiration_date || 'Đã thay thế'
                  } → ${
                    doc.replaced_by_label || 'Đã có văn bản mới thay thế'
                  }`,
                  nodeType: 'document',
                  statusGroup: 'HET_HIEU_LUC',
                  priority: lvl,
                  doc,
                  badgeText: 'HẾT HIỆU LỰC',
                  colorHex: '#57534E',
                  bgHex: '#E7E5E4',
                  borderHex: '#A8A29E',
                  relatedIds: relatedDocIds,
                };
              }

              return {
                id: doc.id,
                name: `${doc.short_title}`,
                subtitle: `${doc.title} (HL: ${doc.effective_date})`,
                nodeType: 'document',
                statusGroup: 'CON_HIEU_LUC',
                priority: lvl,
                doc,
                badgeText: `${doc.doc_type} · ${reqs.length} yêu cầu`,
                colorHex: pMeta.dotColor,
                bgHex: pMeta.bgHex,
                borderHex: pMeta.borderHex,
                relatedIds: relatedDocIds,
                children: reqChildren,
              };
            }
          );

          const isExpiredBranch = statusGroup === 'HET_HIEU_LUC';
          return {
            id: `branch-${statusGroup.toLowerCase()}-priority-${lvl}`,
            name: `Nhánh Ưu tiên: ${lvl.toUpperCase()}`,
            subtitle: `${docNodes.length} văn bản · ${
              isExpiredBranch
                ? 'Đối chiếu lịch sử & văn bản thay thế'
                : pMeta.desc
            }`,
            nodeType: 'priority_branch',
            statusGroup,
            priority: lvl,
            badgeText: `${docNodes.length} VB`,
            colorHex: isExpiredBranch ? '#57534E' : pMeta.dotColor,
            bgHex: isExpiredBranch ? '#F5F5F4' : pMeta.bgHex,
            borderHex: isExpiredBranch ? '#A8A29E' : pMeta.borderHex,
            relatedIds: docNodes.map((d) => d.id),
            children: docNodes,
          };
        })
        .filter((b) => (b.children?.length || 0) > 0);
    };

    const activePriorityBranches = buildPriorityBranches(
      activeDocs,
      'CON_HIEU_LUC'
    );
    const expiredPriorityBranches = buildPriorityBranches(
      expiredDocs,
      'HET_HIEU_LUC'
    );

    const statusBranches: ComplianceTreeDatum[] = [];

    if (validityFilter !== 'expired' && activePriorityBranches.length > 0) {
      statusBranches.push({
        id: 'status-branch-active',
        name: `ĐANG CÓ HIỆU LỰC (${activeDocs.length} văn bản)`,
        subtitle:
          'Các văn bản đang có hiệu lực thi hành, phân nhánh theo 3 cấp độ ưu tiên tuân thủ SSoT',
        nodeType: 'status_branch',
        statusGroup: 'CON_HIEU_LUC',
        badgeText: 'HIỆU LỰC',
        colorHex: '#047857',
        bgHex: '#D1FAE5',
        borderHex: '#10B981',
        relatedIds: activePriorityBranches.map((b) => b.id),
        children: activePriorityBranches,
      });
    }

    if (validityFilter !== 'active' && expiredPriorityBranches.length > 0) {
      statusBranches.push({
        id: 'status-branch-expired',
        name: `ĐÃ HẾT HIỆU LỰC (${expiredDocs.length} văn bản)`,
        subtitle:
          'Các văn bản đã hết hiệu lực phân nhánh theo mức độ ảnh hưởng và liên kết tới văn bản thay thế',
        nodeType: 'status_branch',
        statusGroup: 'HET_HIEU_LUC',
        badgeText: 'LỊCH SỬ',
        colorHex: '#57534E',
        bgHex: '#E7E5E4',
        borderHex: '#A8A29E',
        relatedIds: expiredPriorityBranches.map((b) => b.id),
        children: expiredPriorityBranches,
      });
    }

    return {
      id: `root-${selectedClusterId}`,
      name: clusterTitle,
      subtitle: clusterSubtitle,
      nodeType: 'root',
      badgeText: 'SSoT ROOT',
      colorHex: '#152D42',
      bgHex: '#FFFDF7',
      borderHex: '#C6A342',
      relatedIds: [],
      children: statusBranches,
    };
  }, [
    selectedClusterId,
    clusterTitle,
    clusterSubtitle,
    activeDocs,
    expiredDocs,
    reqsByDocId,
    priorityFilter,
    validityFilter,
    crossRefAdjacencyMap,
  ]);

  // Pre-build O(1) lookup index for full hierarchy nodes (by id and doc_number)
  const fullHierarchyIndex = useMemo(() => {
    const fullHierarchy = hierarchy<ComplianceTreeDatum>(
      complianceHierarchyRootData
    );
    const allNodes = fullHierarchy.descendants();
    const nodeById = new Map<string, (typeof allNodes)[number]>();
    let totalDocNodesCount = 0;

    allNodes.forEach((n) => {
      nodeById.set(n.data.id, n);
      if (n.data.doc?.doc_number) {
        nodeById.set(n.data.doc.doc_number, n);
      }
      if (n.data.nodeType === 'document') {
        totalDocNodesCount += 1;
      }
    });

    return { nodeById, totalDocNodesCount };
  }, [complianceHierarchyRootData]);

  // 5. Cô lập chuỗi ảnh hưởng pháp lý trực tiếp (Focus Node Isolation) với O(1) Map Lookup
  const focusInfluenceChainInfo = useMemo(() => {
    const chainNodeIds = new Set<string>();
    const chainDocIds = new Set<string>();
    const { nodeById, totalDocNodesCount } = fullHierarchyIndex;

    const anchorNode = focusAnchorNodeId
      ? nodeById.get(focusAnchorNodeId)
      : undefined;

    if (!anchorNode) {
      return {
        anchorDatum: null as ComplianceTreeDatum | null,
        chainNodeIds,
        chainDocIds,
        totalDocNodesCount,
        visibleDocNodesCount: totalDocNodesCount,
        hiddenDocNodesCount: 0,
        immediateLinkedDocs: [] as Array<{
          id: string;
          name: string;
          badgeText: string;
          relationType: string;
        }>,
      };
    }

    anchorNode.ancestors().forEach((a) => chainNodeIds.add(a.data.id));
    anchorNode.descendants().forEach((d) => {
      chainNodeIds.add(d.data.id);
      if (d.data.nodeType === 'document') {
        chainDocIds.add(d.data.id);
      }
    });

    const immediateLinkedDocs: Array<{
      id: string;
      name: string;
      badgeText: string;
      relationType: string;
    }> = [];

    anchorNode.data.relatedIds.forEach((relId) => {
      chainNodeIds.add(relId);
      const relNode = nodeById.get(relId);
      if (relNode) {
        relNode.ancestors().forEach((a) => chainNodeIds.add(a.data.id));
        relNode.descendants().forEach((d) => {
          chainNodeIds.add(d.data.id);
          if (d.data.nodeType === 'document') {
            chainDocIds.add(d.data.id);
          }
        });

        if (relNode.data.nodeType === 'document') {
          const isReplacement =
            anchorNode.data.doc?.replaced_by_doc_id === relId ||
            relNode.data.doc?.replaced_by_doc_id === anchorNode.data.id;
          immediateLinkedDocs.push({
            id: relNode.data.id,
            name: relNode.data.name,
            badgeText: relNode.data.badgeText || 'VĂN BẢN LIÊN KẾT',
            relationType: isReplacement
              ? 'Văn bản Thay thế'
              : 'Đối soát chéo SSoT',
          });
        }
      }
    });

    const visibleDocNodesCount = chainDocIds.size;
    const hiddenDocNodesCount = Math.max(
      0,
      totalDocNodesCount - visibleDocNodesCount
    );

    return {
      anchorDatum: anchorNode.data,
      chainNodeIds,
      chainDocIds,
      totalDocNodesCount,
      visibleDocNodesCount,
      hiddenDocNodesCount,
      immediateLinkedDocs,
    };
  }, [fullHierarchyIndex, focusAnchorNodeId]);

  // Cắt tỉa các nhánh không thuộc chuỗi ảnh hưởng khi bật Focus Node
  const displayedHierarchyRootData = useMemo((): ComplianceTreeDatum => {
    if (!focusNodeMode || focusInfluenceChainInfo.chainNodeIds.size === 0) {
      return complianceHierarchyRootData;
    }

    const pruneDisconnected = (
      node: ComplianceTreeDatum
    ): ComplianceTreeDatum | null => {
      if (!focusInfluenceChainInfo.chainNodeIds.has(node.id)) {
        return null;
      }
      const filteredChildren = node.children
        ?.map(pruneDisconnected)
        .filter((child): child is ComplianceTreeDatum => child !== null);

      return {
        ...node,
        children:
          filteredChildren && filteredChildren.length > 0
            ? filteredChildren
            : undefined,
      };
    };

    return (
      pruneDisconnected(complianceHierarchyRootData) ||
      complianceHierarchyRootData
    );
  }, [complianceHierarchyRootData, focusNodeMode, focusInfluenceChainInfo]);

  // Pre-build O(1) lookup map for displayed hierarchy nodes (used for zero-lag hover/click highlighting)
  const displayedHierarchyNodeMap = useMemo(() => {
    const rootH = hierarchy<ComplianceTreeDatum>(displayedHierarchyRootData);
    const all = rootH.descendants();
    const map = new Map<string, (typeof all)[number]>();
    all.forEach((n) => map.set(n.data.id, n));
    return map;
  }, [displayedHierarchyRootData]);

  // 6. Tính toán bố cục đồ thị d3-hierarchy (Coordinates, Links & Cross-Links)
  const d3GraphData = useMemo(() => {
    const pruneForSvg = (node: ComplianceTreeDatum): ComplianceTreeDatum => {
      if (node.nodeType === 'document') {
        return { ...node, children: undefined };
      }
      return {
        ...node,
        children: node.children?.map(pruneForSvg),
      };
    };

    const rootHierarchy = hierarchy<ComplianceTreeDatum>(
      pruneForSvg(displayedHierarchyRootData)
    );
    const treeLayout = d3Tree<ComplianceTreeDatum>().nodeSize([68, 255]);
    const pointRoot = treeLayout(rootHierarchy);

    const nodes = pointRoot.descendants();
    const links = pointRoot.links();

    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    nodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const paddingX = 95;
    const paddingY = 140;
    const width = Math.max(1060, maxY - minY + paddingY * 2 + 180);
    const height = Math.max(380, maxX - minX + paddingX * 2);
    const offsetX = -minY + paddingY;
    const offsetY = -minX + paddingX;

    const nodeById = new Map<string, HierarchyPointNode<ComplianceTreeDatum>>();
    nodes.forEach((n) => nodeById.set(n.data.id, n));

    const crossLinks: Array<{
      id: string;
      source: HierarchyPointNode<ComplianceTreeDatum>;
      target: HierarchyPointNode<ComplianceTreeDatum>;
      label: string;
    }> = [];

    nodes.forEach((n) => {
      if (n.data.nodeType === 'document') {
        n.data.relatedIds.forEach((targetId) => {
          const targetNode = nodeById.get(targetId);
          if (targetNode && n.data.id < targetId) {
            crossLinks.push({
              id: `xref-arc-${n.data.id}-${targetId}`,
              source: n,
              target: targetNode,
              label:
                n.data.doc?.replaced_by_doc_id === targetId ||
                targetNode.data.doc?.replaced_by_doc_id === n.data.id
                  ? 'Thay thế'
                  : 'Đối soát chéo',
            });
          }
        });
      }
    });

    return {
      nodes,
      links,
      crossLinks,
      width,
      height,
      offsetX,
      offsetY,
    };
  }, [displayedHierarchyRootData]);

  return {
    crossRefAdjacencyMap,
    filteredDocuments,
    clusterDocs,
    activeDocs,
    expiredDocs,
    dynamicComplianceNodes,
    complianceHierarchyRootData,
    focusInfluenceChainInfo,
    displayedHierarchyRootData,
    displayedHierarchyNodeMap,
    d3GraphData,
  };
}
