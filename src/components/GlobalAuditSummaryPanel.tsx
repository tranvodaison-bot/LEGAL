import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  ArrowUpRight,
  Copy,
  Trash2,
  Filter,
  Layers,
  FileWarning,
  FileCheck2,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  PlusCircle,
  BarChart3,
} from 'lucide-react';
import {
  McpRiskCategory,
  McpRiskChecklistItem,
  McpSessionAuditRecord,
  LegalDocument,
} from '../types/legal';
import { GlobalAuditDashboard } from './GlobalAuditDashboard';
import { EvidenceBasedReportModal } from './EvidenceBasedReportModal';

interface GlobalAuditSummaryPanelProps {
  auditRecords: McpSessionAuditRecord[];
  documents?: LegalDocument[];
  currentDocNumber?: string;
  currentArticleNo?: string;
  isMcpLoading: boolean;
  onToggleChecklistItem: (recordId: string, itemId: string) => void;
  onMarkAllChecklistItems: (checked: boolean) => void;
  onRemoveAuditRecord: (recordId: string) => void;
  onClearAllAuditRecords: () => void;
  onNavigateToClause: (docId: string, articleId: string) => void;
  onRunAuditOnCurrentClause: () => void;
  onAskAquaWithContext: (question: string, clauseContext: string) => void;
}

const RISK_BADGE_STYLE: Record<
  'Rất cao' | 'Cao' | 'Trung bình',
  { badge: string; dot: string }
> = {
  'Rất cao': {
    badge:
      'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    dot: '#DC2626',
  },
  Cao: {
    badge:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: '#D97706',
  },
  'Trung bình': {
    badge:
      'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dot: '#2563EB',
  },
};

const CATEGORY_BADGE_STYLE: Record<McpRiskCategory, string> = {
  'Hồ sơ bắt buộc':
    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Rủi ro xuất toán / Chế tài':
    'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'Khuyến nghị hành động':
    'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
};

/**
 * Parses raw MCP Engine analysis text into structured, actionable compliance checklist items.
 */
export function parseMcpAnalysisToChecklistItems(
  recordKey: string,
  rawAnalysis: string
): McpRiskChecklistItem[] {
  const lines = rawAnalysis
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-*•]+/, '').trim())
    .filter((line) => line.length > 10);

  if (lines.length === 0) {
    return [
      {
        id: `${recordKey}-item-0`,
        category: 'Rủi ro xuất toán / Chế tài',
        riskLevel: 'Cao',
        text: rawAnalysis.trim() || 'Rà soát tuân thủ điều khoản và hồ sơ pháp lý liên quan.',
        checked: false,
      },
    ];
  }

  return lines.slice(0, 6).map((line, index): McpRiskChecklistItem => {
    const cleanText = line.replace(/^\d+[.)]\s*/, '').trim();
    const lower = cleanText.toLowerCase();

    let category: McpRiskCategory = 'Khuyến nghị hành động';
    if (
      lower.includes('hồ sơ') ||
      lower.includes('biên bản') ||
      lower.includes('giấy phép') ||
      lower.includes('chứng từ') ||
      lower.includes('bắt buộc') ||
      index === 0
    ) {
      category = 'Hồ sơ bắt buộc';
    }
    if (
      lower.includes('rủi ro') ||
      lower.includes('xuất toán') ||
      lower.includes('xử phạt') ||
      lower.includes('chế tài') ||
      lower.includes('vi phạm') ||
      lower.includes('nghiêm cấm') ||
      index === 1
    ) {
      category = 'Rủi ro xuất toán / Chế tài';
    }
    if (
      lower.includes('khuyến nghị') ||
      lower.includes('hành động') ||
      lower.includes('ban qlda') ||
      lower.includes('chủ đầu tư')
    ) {
      category = 'Khuyến nghị hành động';
    }

    let riskLevel: 'Rất cao' | 'Cao' | 'Trung bình' = 'Cao';
    if (
      lower.includes('xuất toán') ||
      lower.includes('nghiêm cấm') ||
      lower.includes('đình chỉ') ||
      lower.includes('tước quyền') ||
      lower.includes('100 triệu') ||
      lower.includes('5% doanh thu') ||
      category === 'Rủi ro xuất toán / Chế tài'
    ) {
      riskLevel = 'Rất cao';
    } else if (category === 'Khuyến nghị hành động') {
      riskLevel = 'Trung bình';
    }

    return {
      id: `${recordKey}-item-${index}`,
      category,
      riskLevel,
      text: cleanText,
      checked: false,
    };
  });
}

export const INITIAL_SESSION_MCP_AUDITS: McpSessionAuditRecord[] = [
  {
    id: 'doc-lxd-135-2025:art-lxd-d14',
    docId: 'doc-lxd-135-2025',
    docNumber: '135/2025/QH15',
    docTitle: 'Luật Xây dựng (Sửa đổi toàn diện năm 2025)',
    field: 'Xây dựng',
    projectStage: 'Thực thi',
    articleId: 'art-lxd-d14',
    articleNo: 'Điều 14',
    articleTitle: 'Điều kiện khởi công xây dựng công trình',
    auditedAt: '2026-11-08 08:15',
    rawAnalysis:
      '1. Hồ sơ bắt buộc: Phải có Biên bản bàn giao mặt bằng (toàn bộ hoặc từng phần), Giấy phép xây dựng hợp lệ, Hồ sơ thiết kế bản vẽ thi công kèm mô hình BIM LOD 200 đã đóng dấu thẩm duyệt cho dự án nhóm A/B.\n2. Rủi ro xuất toán / Xử phạt cần tránh: Khởi công khi chưa có thiết kế PCCC thẩm duyệt hoặc thiếu bảo lãnh tạm ứng hợp đồng EPC dẫn đến bị đình chỉ thi công và xuất toán chi phí quản lý dự án.\n3. Hành động khuyến nghị cho Ban QLDA: Lập Phiếu kiểm tra điều kiện khởi công 6 mục có chữ ký xác nhận của Tư vấn giám sát và Nhà thầu chính trước ngày phát lệnh khởi công tối thiểu 07 ngày làm việc.',
    checklistItems: [
      {
        id: 'doc-lxd-135-2025:art-lxd-d14-item-0',
        category: 'Hồ sơ bắt buộc',
        riskLevel: 'Cao',
        text: 'Hoàn thiện Biên bản bàn giao mặt bằng, Giấy phép xây dựng và Hồ sơ thiết kế bản vẽ thi công kèm mô hình BIM LOD 200 đã đóng dấu phê duyệt.',
        checked: true,
      },
      {
        id: 'doc-lxd-135-2025:art-lxd-d14-item-1',
        category: 'Rủi ro xuất toán / Chế tài',
        riskLevel: 'Rất cao',
        text: 'Rủi ro đình chỉ thi công & xuất toán chi phí QLDA nếu phát lệnh khởi công trước khi có Văn bản thẩm duyệt thiết kế PCCC và bảo lãnh hợp đồng EPC.',
        checked: false,
      },
      {
        id: 'doc-lxd-135-2025:art-lxd-d14-item-2',
        category: 'Khuyến nghị hành động',
        riskLevel: 'Trung bình',
        text: 'Ban QLDA lập Phiếu đối soát 6 điều kiện khởi công có chữ ký xác nhận của Tư vấn giám sát trước ngày khởi công tối thiểu 07 ngày làm việc.',
        checked: false,
      },
    ],
  },
  {
    id: 'doc-bvdlcn-91-2025:art-bvdlcn-d9',
    docId: 'doc-bvdlcn-91-2025',
    docNumber: '91/2025/QH15',
    docTitle: 'Luật Bảo vệ dữ liệu cá nhân',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    projectStage: 'Thực thi',
    articleId: 'art-bvdlcn-d9',
    articleNo: 'Điều 9',
    articleTitle: 'Sự đồng ý của chủ thể dữ liệu cá nhân',
    auditedAt: '2026-11-08 09:05',
    rawAnalysis:
      '1. Hồ sơ bắt buộc: Lưu vết điện tử (Audit Log) chứng minh sự đồng ý tự nguyện, tách biệt từng mục đích xử lý dữ liệu cá nhân theo Khoản 3, Khoản 4 Điều 9 Luật 91/2025/QH15.\n2. Rủi ro xuất toán / Xử phạt cần tránh: Gộp chung mục đích tiếp thị vào điều khoản dịch vụ bắt buộc hoặc coi sự im lặng của khách hàng là đồng ý sẽ bị phạt hành chính tới 5% tổng doanh thu theo Nghị định 330/2026/NĐ-CP.\n3. Hành động khuyến nghị cho Ban QLDA / Pháp chế: Thiết kế lại biểu mẫu thu thập dữ liệu với các ô tích chọn độc lập (Granular Opt-in) và bổ sung Phụ lục Xử lý Dữ liệu (DPA) với nhà thầu CNTT.',
    checklistItems: [
      {
        id: 'doc-bvdlcn-91-2025:art-bvdlcn-d9-item-0',
        category: 'Hồ sơ bắt buộc',
        riskLevel: 'Cao',
        text: 'Thiết lập cơ chế lưu vết điện tử (Audit Log) kiểm chứng được sự đồng ý của chủ thể dữ liệu theo từng mục đích riêng biệt.',
        checked: false,
      },
      {
        id: 'doc-bvdlcn-91-2025:art-bvdlcn-d9-item-1',
        category: 'Rủi ro xuất toán / Chế tài',
        riskLevel: 'Rất cao',
        text: 'Chế tài phạt tới 5% doanh thu (NĐ 330/2026/NĐ-CP) nếu mặc định tích sẵn ô đồng ý (Pre-ticked box) hoặc ép buộc đồng ý gộp mục đích thương mại.',
        checked: false,
      },
      {
        id: 'doc-bvdlcn-91-2025:art-bvdlcn-d9-item-2',
        category: 'Khuyến nghị hành động',
        riskLevel: 'Cao',
        text: 'Ký Phụ lục Xử lý Dữ liệu Cá nhân (DPA) với toàn bộ đối tác vận hành hạ tầng đám mây và cổng thanh toán.',
        checked: false,
      },
    ],
  },
];

export const GlobalAuditSummaryPanel: React.FC<GlobalAuditSummaryPanelProps> = React.memo(({
  auditRecords,
  documents = [],
  currentDocNumber,
  currentArticleNo,
  isMcpLoading,
  onToggleChecklistItem,
  onMarkAllChecklistItems,
  onRemoveAuditRecord,
  onClearAllAuditRecords,
  onNavigateToClause,
  onRunAuditOnCurrentClause,
  onAskAquaWithContext,
}) => {
  const [viewLayout, setViewLayout] = useState<'consolidated' | 'grouped'>(
    'consolidated'
  );
  const [categoryFilter, setCategoryFilter] = useState<McpRiskCategory | 'all'>(
    'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>(
    'all'
  );
  const [expandedRecordIds, setExpandedRecordIds] = useState<
    Record<string, boolean>
  >({});
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [showVisualDashboard, setShowVisualDashboard] = useState(true);
  const [showEvidenceReportModal, setShowEvidenceReportModal] = useState(false);

  // Flatten all checklist items across all session MCP audits with parent record metadata
  const allFlattenedItems = useMemo(() => {
    const list: Array<{
      record: McpSessionAuditRecord;
      item: McpRiskChecklistItem;
    }> = [];

    auditRecords.forEach((rec) => {
      rec.checklistItems.forEach((item) => {
        list.push({ record: rec, item });
      });
    });

    // Sort by unchecked first, then by riskLevel ('Rất cao' -> 'Cao' -> 'Trung bình')
    const priorityRank = { 'Rất cao': 0, Cao: 1, 'Trung bình': 2 };
    return list.sort((a, b) => {
      if (a.item.checked !== b.item.checked) {
        return a.item.checked ? 1 : -1;
      }
      return priorityRank[a.item.riskLevel] - priorityRank[b.item.riskLevel];
    });
  }, [auditRecords]);

  // Filtered checklist items
  const filteredFlatItems = useMemo(() => {
    return allFlattenedItems.filter(({ item }) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === 'pending' && item.checked) return false;
      if (statusFilter === 'done' && !item.checked) return false;
      return true;
    });
  }, [allFlattenedItems, categoryFilter, statusFilter]);

  // Single-pass O(N) Summary KPIs, Category Counters, and Per-Record Done Lookup Map
  const { summaryStats, doneCountByRecordIdMap } = useMemo(() => {
    const totalItems = allFlattenedItems.length;
    let checkedItems = 0;
    let veryHighRisks = 0;
    let highRisks = 0;
    let mandatoryDocsCount = 0;
    let deductionRisksCount = 0;
    let actionRecsCount = 0;

    for (let i = 0; i < totalItems; i++) {
      const { item } = allFlattenedItems[i];
      if (item.checked) {
        checkedItems += 1;
      } else {
        if (item.riskLevel === 'Rất cao') veryHighRisks += 1;
        else if (item.riskLevel === 'Cao') highRisks += 1;
      }

      if (item.category === 'Hồ sơ bắt buộc') mandatoryDocsCount += 1;
      else if (item.category === 'Rủi ro xuất toán / Chế tài')
        deductionRisksCount += 1;
      else if (item.category === 'Khuyến nghị hành động') actionRecsCount += 1;
    }

    const doneMap = new Map<string, number>();
    for (let i = 0; i < auditRecords.length; i++) {
      const rec = auditRecords[i];
      let done = 0;
      for (let j = 0; j < rec.checklistItems.length; j++) {
        if (rec.checklistItems[j].checked) done += 1;
      }
      doneMap.set(rec.id, done);
    }

    const pendingItems = totalItems - checkedItems;
    const progressPercent =
      totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return {
      summaryStats: {
        totalAudits: auditRecords.length,
        totalItems,
        checkedItems,
        pendingItems,
        progressPercent,
        veryHighRisks,
        highRisks,
        mandatoryDocsCount,
        deductionRisksCount,
        actionRecsCount,
      },
      doneCountByRecordIdMap: doneMap,
    };
  }, [auditRecords, allFlattenedItems]);

  const handleCopyConsolidatedChecklist = async () => {
    const lines: string[] = [
      '====================================================================',
      'BÁO CÁO TỔNG HỢP KIỂM TOÁN RỦI RO PHÁP CHẾ (GLOBAL MCP AUDIT SUMMARY)',
      `Hệ sinh thái Pháp lý ĐẠI SƠN · Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`,
      `Tổng số điều khoản đã kiểm toán MCP: ${summaryStats.totalAudits}`,
      `Tiến độ kiểm soát rủi ro: ${summaryStats.checkedItems}/${summaryStats.totalItems} mục hoàn thành (${summaryStats.progressPercent}%)`,
      '====================================================================',
      '',
    ];

    auditRecords.forEach((rec, idx) => {
      lines.push(
        `${idx + 1}. [${rec.docNumber} · ${rec.articleNo}] ${rec.articleTitle} (${rec.field} - ${rec.projectStage})`
      );
      rec.checklistItems.forEach((item) => {
        lines.push(
          `   [${item.checked ? 'x' : ' '}] (${item.riskLevel} | ${item.category}) ${item.text}`
        );
      });
      lines.push('');
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <section
      id="global-mcp-audit-summary"
      className="rounded-2xl border-2 border-[#C6A342]/70 bg-gradient-to-b from-[#FFFDF7] to-[#F7F3E8] dark:from-[#1B1A17] dark:to-[#151412] p-5 shadow-sm space-y-4"
    >
      {/* Top Header & Quick Audit Action */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5D5A7] dark:border-[#2E2C28] pb-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#152D42] text-[#E9C96D] text-[11px] font-bold uppercase tracking-wider">
              <ClipboardCheck className="w-3.5 h-3.5" />
              GLOBAL AUDIT SUMMARY · MCP SESSION
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              {summaryStats.totalAudits} điều khoản đã kiểm toán · {summaryStats.totalItems} mục rủi ro
            </span>
            {summaryStats.veryHighRisks > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                <ShieldAlert className="w-3.5 h-3.5" />
                {summaryStats.veryHighRisks} rủi ro Rất cao chưa xử lý
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#152D42] dark:text-stone-100">
            Bảng Tổng Hợp Rủi Ro & Hồ Sơ Kiểm Toán Phiên Hiện Tại (Consolidated Risk Checklist)
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Tự động hợp nhất tất cả kết quả phân tích từ <strong>Trợ lý Kiểm toán MCP Engine</strong> trong phiên làm việc thành danh mục kiểm tra (Checklist) để Ban QLDA / Pháp chế rà soát trước khi trình ký.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {currentDocNumber && currentArticleNo && (
            <button
              type="button"
              onClick={onRunAuditOnCurrentClause}
              disabled={isMcpLoading}
              className="px-3 py-1.5 rounded-xl bg-[#152D42] hover:bg-[#1E3A54] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-60"
              title="Chạy Kiểm toán MCP cho điều khoản đang mở và tự động gộp vào danh sách tổng hợp"
            >
              {isMcpLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E9C96D]" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5 text-[#E9C96D]" />
              )}
              <span>
                Kiểm toán & Gộp {currentArticleNo} ({currentDocNumber})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowVisualDashboard((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
              showVisualDashboard
                ? 'bg-[#C6A342] text-[#152D42] border-[#C6A342] font-bold'
                : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-stone-700 dark:text-stone-200 hover:border-[#C6A342]'
            }`}
            title="Ẩn / Hiện Biểu đồ Global Audit Dashboard (Top 5 Legal Risks & Tiến độ Vòng đời)"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showVisualDashboard ? 'Ẩn Dashboard Biểu đồ' : 'Mở Dashboard Biểu đồ'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEvidenceReportModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-[#152D42] text-[#E9C96D] border border-[#C6A342] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#1E3F5A]"
            title="Kết xuất Báo cáo Pháp lý có dẫn chứng xác thực (A4 / JSON kèm SHA-256)"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo Có Dẫn Chứng</span>
          </button>

          <button
            type="button"
            onClick={handleCopyConsolidatedChecklist}
            className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] hover:border-[#C6A342] text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 cursor-pointer"
            title="Sao chép toàn bộ Biên bản Checklist Rủi ro MCP vào khay nhớ tạm"
          >
            {copiedNotice ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Đã sao chép biên bản</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#152D42] dark:text-amber-300" />
                <span>Sao chép Checklist</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Embedded Global Audit Dashboard (Recharts Top 5 Legal Risks & Lifecycle Progression) */}
      {showVisualDashboard && (
        <GlobalAuditDashboard
          mcpAuditRecords={auditRecords}
          compactMode={false}
        />
      )}

      {/* KPI Progress Bar & Risk Severity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-[#141413] p-3.5 rounded-xl border border-stone-200 dark:border-[#2E2C28]">
        <div className="md:col-span-7 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#152D42] dark:text-stone-200">
              Tiến độ hoàn thành rà soát tuân thủ phiên hiện tại
            </span>
            <span className="font-mono-code font-bold text-emerald-700 dark:text-emerald-400">
              {summaryStats.checkedItems}/{summaryStats.totalItems} mục ({summaryStats.progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#152D42] via-[#286181] to-[#10B981] transition-all duration-300"
              style={{ width: `${summaryStats.progressPercent}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-stone-500">
            <span>
              Còn lại <strong>{summaryStats.pendingItems}</strong> mục rủi ro/hồ sơ cần xác nhận
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onMarkAllChecklistItems(true)}
                className="text-[#286181] dark:text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                Đánh dấu hoàn tất tất cả
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onMarkAllChecklistItems(false)}
                className="text-stone-500 hover:underline cursor-pointer"
              >
                Đặt lại trạng thái
              </button>
            </div>
          </div>
        </div>

        {/* 3 Category Counters (O(1) pre-computed in summaryStats) */}
        <div className="md:col-span-5 grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-center">
            <span className="block text-sm font-bold text-emerald-800 dark:text-emerald-300">
              {summaryStats.mandatoryDocsCount}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              Hồ sơ bắt buộc
            </span>
          </div>
          <div className="p-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center">
            <span className="block text-sm font-bold text-rose-800 dark:text-rose-300">
              {summaryStats.deductionRisksCount}
            </span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400">
              Rủi ro / Chế tài
            </span>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-center">
            <span className="block text-sm font-bold text-indigo-800 dark:text-indigo-300">
              {summaryStats.actionRecsCount}
            </span>
            <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">
              Khuyến nghị QLDA
            </span>
          </div>
        </div>
      </div>

      {/* Filter & View Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-[#C6A342]" />
            Nhóm rủi ro:
          </span>
          {(
            [
              'all',
              'Hồ sơ bắt buộc',
              'Rủi ro xuất toán / Chế tài',
              'Khuyến nghị hành động',
            ] as const
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#152D42] text-white'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {cat === 'all' ? 'Tất cả hạng mục' : cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status filter */}
          {(
            [
              { id: 'all', label: 'Mọi trạng thái' },
              { id: 'pending', label: `Chưa xử lý (${summaryStats.pendingItems})` },
              { id: 'done', label: `Đã xong (${summaryStats.checkedItems})` },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-[#C6A342] text-[#152D42] font-bold'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {st.label}
            </button>
          ))}

          <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-0.5" />

          {/* Switch between Consolidated Checklist vs Grouped by Clause */}
          <button
            type="button"
            onClick={() =>
              setViewLayout((prev) =>
                prev === 'consolidated' ? 'grouped' : 'consolidated'
              )
            }
            className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-[#152D42] dark:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3 h-3 text-[#C6A342]" />
            <span>
              {viewLayout === 'consolidated'
                ? 'Xem theo Văn bản'
                : 'Xem Checklist hợp nhất'}
            </span>
          </button>
        </div>
      </div>

      {/* Checklist Content Area */}
      {auditRecords.length === 0 ? (
        <div className="p-6 rounded-xl bg-white dark:bg-[#141413] border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2">
          <FileWarning className="w-6 h-6 text-[#C6A342] mx-auto" />
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            Chưa có bản ghi kiểm toán MCP nào trong phiên hiện tại.
          </p>
          <p className="text-[11px] text-stone-500">
            Nhấn nút <strong>“Kiểm toán & Gộp”</strong> phía trên hoặc <strong>“Phân tích chuyên sâu”</strong> trong hộp Trợ lý Kiểm toán MCP để tổng hợp danh mục rủi ro.
          </p>
        </div>
      ) : viewLayout === 'consolidated' ? (
        /* MODE A: CONSOLIDATED RISK CHECKLIST */
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filteredFlatItems.length === 0 ? (
            <div className="p-4 rounded-xl bg-white dark:bg-[#141413] border border-stone-200 dark:border-stone-800 text-xs text-stone-500 text-center">
              Không có mục rủi ro nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredFlatItems.map(({ record, item }) => {
              const riskStyle = RISK_BADGE_STYLE[item.riskLevel];
              const catStyle = CATEGORY_BADGE_STYLE[item.category];

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                    item.checked
                      ? 'bg-stone-50/80 dark:bg-[#141413]/60 border-stone-200 dark:border-stone-800 opacity-75'
                      : 'bg-white dark:bg-[#141413] border-stone-200 dark:border-[#2E2C28] hover:border-[#C6A342]'
                  }`}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => onToggleChecklistItem(record.id, item.id)}
                      className="mt-1 rounded border-stone-300 text-[#152D42] focus:ring-[#C6A342] cursor-pointer"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${riskStyle.badge}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: riskStyle.dot }}
                          />
                          {item.riskLevel}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${catStyle}`}
                        >
                          {item.category}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigateToClause(record.docId, record.articleId);
                          }}
                          className="text-[11px] font-mono-code font-bold text-[#286181] dark:text-amber-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                          title={`Di chuyển tới ${record.articleNo} - ${record.docNumber}`}
                        >
                          <span>
                            {record.docNumber} · {record.articleNo}
                          </span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] text-stone-400">
                          ({record.projectStage})
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-relaxed ${
                          item.checked
                            ? 'line-through text-stone-400 dark:text-stone-500'
                            : 'text-stone-800 dark:text-stone-200 font-medium'
                        }`}
                      >
                        {item.text}
                      </p>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      onAskAquaWithContext(
                        `Hướng dẫn chi tiết cách khắc phục rủi ro và lập hồ sơ kiểm toán cho mục: "${item.text}" theo ${record.articleNo} (${record.docNumber})`,
                        `${record.docNumber} - ${record.articleNo} (${record.articleTitle}): ${item.text}`
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-[#FBF5DF] dark:bg-stone-800 text-[#7A5F14] dark:text-amber-300 text-[11px] font-semibold hover:bg-[#f3e6bd] flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Hỏi Trợ lý AQUA cách xử lý rủi ro này"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">Hỏi AQUA</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* MODE B: GROUPED BY AUDITED DOCUMENT & CLAUSE */
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {auditRecords.map((rec) => {
            const isExpanded = expandedRecordIds[rec.id] ?? true;
            const doneCount = doneCountByRecordIdMap.get(rec.id) || 0;

            return (
              <div
                key={rec.id}
                className="rounded-xl border border-stone-200 dark:border-[#2E2C28] bg-white dark:bg-[#141413] overflow-hidden"
              >
                <div className="px-3.5 py-2.5 bg-stone-50 dark:bg-[#1A1917] flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRecordIds((prev) => ({
                        ...prev,
                        [rec.id]: !isExpanded,
                      }))
                    }
                    className="flex items-center gap-2 text-left cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-stone-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-stone-500" />
                    )}
                    <span className="text-xs font-mono-code font-bold text-[#152D42] dark:text-amber-300">
                      {rec.docNumber} · {rec.articleNo}
                    </span>
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {rec.articleTitle}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                      {doneCount}/{rec.checklistItems.length} đã kiểm
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400">
                      Lúc {rec.auditedAt}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateToClause(rec.docId, rec.articleId)}
                      className="text-[11px] font-semibold text-[#286181] dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Mở điều khoản
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveAuditRecord(rec.id)}
                      className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                      title="Xóa bản ghi kiểm toán này khỏi phiên"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 space-y-2 border-t border-stone-200 dark:border-stone-800">
                    {rec.customPrompt && (
                      <div className="text-[11px] italic text-stone-500 bg-stone-50 dark:bg-stone-900 px-2.5 py-1 rounded">
                        Câu hỏi kiểm toán: “{rec.customPrompt}”
                      </div>
                    )}
                    {rec.checklistItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => onToggleChecklistItem(rec.id, item.id)}
                          className="mt-0.5 rounded border-stone-300 text-[#152D42] focus:ring-[#C6A342]"
                        />
                        <div className="text-xs flex-1">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border mr-1.5 ${
                              RISK_BADGE_STYLE[item.riskLevel].badge
                            }`}
                          >
                            {item.riskLevel}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border mr-1.5 ${
                              CATEGORY_BADGE_STYLE[item.category]
                            }`}
                          >
                            {item.category}
                          </span>
                          <span
                            className={
                              item.checked
                                ? 'line-through text-stone-400'
                                : 'text-stone-800 dark:text-stone-200'
                            }
                          >
                            {item.text}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Note */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5D5A7]/70 dark:border-[#2E2C28] text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5">
          <FileCheck2 className="w-3.5 h-3.5 text-[#152D42] dark:text-amber-400" />
          <span>
            Mỗi lần chạy <strong>Trợ lý Kiểm toán MCP</strong> trên bất kỳ điều khoản nào, hệ thống sẽ tự động phân rã rủi ro và cập nhật vào bảng tổng hợp này.
          </span>
        </span>
        {auditRecords.length > 0 && (
          <button
            type="button"
            onClick={onClearAllAuditRecords}
            className="text-stone-400 hover:text-red-600 font-medium cursor-pointer"
          >
            Làm mới phiên kiểm toán
          </button>
        )}
      </div>

      <EvidenceBasedReportModal
        isOpen={showEvidenceReportModal}
        onClose={() => setShowEvidenceReportModal(false)}
        documents={documents}
        auditRecords={auditRecords}
      />
    </section>
  );
});
