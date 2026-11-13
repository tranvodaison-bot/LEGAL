import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useDeferredValue,
  useCallback,
} from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  FilePlus2,
  GitCompare,
  Moon,
  Network,
  Search,
  Sun,
  WifiOff,
  X,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Send,
  Scale,
  HelpCircle,
  BarChart3,
  Download,
  Printer,
  Copy,
  ListTree,
  FileCheck2,
  ShieldCheck,
  ClipboardCheck,
  Calendar,
  Columns3,
  SlidersHorizontal,
  Zap,
  GitBranch,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LegalCrossReference,
  LegalDocType,
  LegalDocument,
  LegalDocumentStatus,
  LegalField,
  NotificationPreferences,
  ProjectLifecycleStage,
  ReaderSettings,
  SavedClauseItem,
  SavedDocumentItem,
  DailyLegalUpdateAlert,
  AuditLogEntry,
  McpSessionAuditRecord,
  DocumentStatusFilterType,
} from './types/legal';
import {
  INITIAL_CROSS_REFERENCES,
  INITIAL_DAILY_ALERTS,
  INITIAL_LEGAL_DOCUMENTS,
  PROJECT_LIFECYCLE_STAGES,
  WBS_STAGE_LABELS,
  STATUS_META,
  RELATION_META,
  VBPL_CATEGORY_GROUPS,
  POPULAR_SEARCH_KEYWORDS,
} from './data/legalCorpus';
import { buildSynchronizedLegalCorpus } from './data/regMasterCatalog';
import { PWAInstallButton } from './components/PWAInstallButton';
import { LegalReaderModal } from './components/LegalReaderModal';
import {
  LegalComplianceCheckView,
  CheckSubMode,
} from './components/LegalComplianceCheckView';
import { ContractReviewView } from './components/ContractReviewView';
import { PersonalCabinetView } from './components/PersonalCabinetView';
import { DailyDigestAndNotifications } from './components/DailyDigestAndNotifications';
import { CreateDocumentModal } from './components/CreateDocumentModal';
import { AquaAssistantDrawer } from './components/AquaAssistantDrawer';
import { BackupAndStatsModal } from './components/BackupAndStatsModal';
import {
  GlobalAuditSummaryPanel,
  INITIAL_SESSION_MCP_AUDITS,
  parseMcpAnalysisToChecklistItems,
} from './components/GlobalAuditSummaryPanel';
import { StageGateAuditView } from './components/StageGateAuditView';
import { InPlaceClauseDiffViewer } from './components/InPlaceClauseDiffViewer';
import { CrossLawAiDrawer } from './components/CrossLawAiDrawer';
import { DocumentGenealogyTreeDrawer } from './components/DocumentGenealogyTreeDrawer';
import { ConsolidatedDocumentDrawer } from './components/ConsolidatedDocumentDrawer';
import { ContinuousA4Reader } from './components/ContinuousA4Reader';
import { VirtualList } from './components/VirtualList';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  attachAiExpandedDraftSafely,
  ingestOcrDocumentToQuarantine,
  prepareVerifiedCorpus,
} from './modules/legal-library/legalLibrary.service';
import {
  STORAGE_KEYS,
  loadAiDraftForDocument,
  loadQuarantineDocuments,
} from './infrastructure/storage/partitionedStorage';
import { computeStringSha256Sync } from './infrastructure/crypto/sha256';
import { computeDocumentCompleteness } from './core/engines/corpusIntegrityValidator';
import { LegalReasoningAndCaseView } from './ui/views/LegalReasoningAndCaseView';
import { LegalReasoningDrawer } from './components/LegalReasoningDrawer';
import { EvidenceBasedReportModal } from './components/EvidenceBasedReportModal';
import { resolveDocumentAtDate } from './utils/pointInTimeResolver';
import { IRACPlusReasoningOutput } from './core/entities/legalDomain';

type SidebarVirtualRow =
  | {
      key: string;
      type: 'group_header';
      groupName: string;
      count: number;
      isExpanded: boolean;
      isActiveGroup: boolean;
    }
  | {
      key: string;
      type: 'field_item';
      field: LegalField;
      count: number;
      isSelected: boolean;
    }
  | {
      key: string;
      type: 'wbs_header';
      hasActiveStage: boolean;
    }
  | {
      key: string;
      type: 'wbs_stage';
      stage: ProjectLifecycleStage;
      label: string;
      count: number;
      isActive: boolean;
    }
  | {
      key: string;
      type: 'stage_gate_cta';
    };

function getSidebarVirtualRowHeight(row: SidebarVirtualRow): number {
  switch (row.type) {
    case 'group_header':
      return 36;
    case 'field_item':
      return 32;
    case 'wbs_header':
      return 42;
    case 'wbs_stage':
      return 34;
    case 'stage_gate_cta':
      return 48;
  }
}

function getSidebarVirtualRowKey(row: SidebarVirtualRow): string {
  return row.key;
}

type ActiveView =
  | 'library'
  | 'reasoning_case'
  | 'stage_gate'
  | 'compliance'
  | 'contract'
  | 'cabinet'
  | 'digest';
type CatalogTab = 'docs' | 'results' | 'bookmarks' | 'recent';
type MobilePane = 'fields' | 'list' | 'reader';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Normalize Vietnamese text for accent-insensitive or accent-sensitive search (from VBPL HTML)
function normalizeSearchText(str: string, matchAccent: boolean): string {
  const lower = String(str ?? '').toLowerCase();
  if (matchAccent) return lower;
  return lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

// Debounced storage persistence hook with automatic timer cleanup to prevent main-thread JSON.stringify thrashing & memory leaks
function useDebouncedStorageEffect<T>(
  key: string,
  value: T,
  delayMs = 280,
  storageType: 'local' | 'session' = 'local'
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timerId = window.setTimeout(() => {
      try {
        const target =
          storageType === 'session' ? window.sessionStorage : window.localStorage;
        target.setItem(key, JSON.stringify(value));
      } catch {
        // ignore storage quota errors
      }
    }, delayMs);

    return () => window.clearTimeout(timerId);
  }, [key, value, delayMs, storageType]);
}

interface CatalogDocumentCardProps {
  doc: LegalDocument;
  index?: number;
  isSelected: boolean;
  isBookmarked: boolean;
  activeArticleId: string | null;
  onSelectDoc: (doc: LegalDocument, articleId?: string) => void;
  onOpenGenealogyTree?: (doc: LegalDocument) => void;
  onOpenConsolidatedDrawer?: (doc: LegalDocument) => void;
}

/**
 * Memoized Column 2 Document Card with lightweight motion layout & filter/sort transitions:
 * Prevents re-rendering the entire document catalog and nested article pills
 * when typing in Column 3 inputs or changing unrelated reader state.
 */
const CatalogDocumentCard = React.memo<CatalogDocumentCardProps>(
  ({
    doc,
    index = 0,
    isSelected,
    isBookmarked,
    activeArticleId,
    onSelectDoc,
    onOpenGenealogyTree,
    onOpenConsolidatedDrawer,
  }) => {
    const statusMeta = STATUS_META[doc.status];
    const amendedCount = doc.amended_count ?? doc.amendment_history?.length ?? 0;
    const isAmendingDoc = Boolean(
      doc.is_amending_document ||
        (doc.amends_doc_ids && doc.amends_doc_ids.length > 0) ||
        /sửa đổi,\s*bổ sung\s+một\s+số\s+điều/i.test(doc.title)
    );

    const badgeColor =
      doc.doc_type === 'Luật'
        ? 'bg-[#9C483F] text-white'
        : doc.doc_type === 'Thông tư'
        ? 'bg-[#43775C] text-white'
        : doc.doc_type === 'Tài liệu'
        ? 'bg-[#777289] text-white'
        : 'bg-[#37677F] text-white';

    // Cap stagger delay at 150ms so long lists remain ultra-snappy
    const staggerDelay = Math.min(index * 0.014, 0.15);

    return (
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.995 }}
        transition={{
          layout: {
            type: 'spring',
            stiffness: 420,
            damping: 34,
            mass: 0.7,
          },
          opacity: { duration: 0.18, delay: staggerDelay },
          y: {
            duration: 0.22,
            ease: [0.22, 1, 0.36, 1],
            delay: staggerDelay,
          },
          scale: { duration: 0.18, delay: staggerDelay },
        }}
        onClick={() => onSelectDoc(doc)}
        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors duration-150 cursor-pointer ${
          isSelected
            ? 'bg-[#FBF5DF] dark:bg-[#2B271C] border-[#B69B4F] border-l-[3px] border-l-[#C6A342] shadow-xs'
            : 'bg-white dark:bg-[#1E1D1B] border-[#E5E5DF] dark:border-[#2E2C28] hover:border-[#91B0C3]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider ${badgeColor}`}
          >
            {doc.doc_type}
          </span>
          <span className="text-xs font-mono-code font-bold text-stone-900 dark:text-stone-100">
            {doc.doc_number}
          </span>

          {(doc.is_blocked_p0 || doc.reg_master_meta?.is_blocked_p0) && (
            <span
              className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-700"
              title={
                doc.reg_master_meta?.xac_minh_nguon_phap_ly_qa ||
                'BLOCKED_P0 — Cấm sử dụng cho AI suy luận pháp lý'
              }
            >
              ⛔ BLOCKED_P0
            </span>
          )}

          {doc.status === 'HET_HIEU_LUC' && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
              hết hiệu lực
            </span>
          )}

          {amendedCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDoc(doc);
                onOpenGenealogyTree?.(doc);
              }}
              className="text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300/80 inline-flex items-center gap-0.5 cursor-pointer transition"
              title={`Đã qua ${amendedCount} lần sửa đổi — Mở Phả hệ văn bản`}
            >
              🧬 {amendedCount}
            </button>
          )}

          {isAmendingDoc && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDoc(doc);
                onOpenGenealogyTree?.(doc);
              }}
              className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/70 text-purple-900 dark:text-purple-300 border border-purple-300/80 uppercase cursor-pointer transition"
              title="Văn bản sửa đổi, bổ sung — Mở Phả hệ văn bản"
            >
              SĐ
            </button>
          )}

          {(doc.is_expiring_soon ||
            (doc.status !== 'HET_HIEU_LUC' && Boolean(doc.expiration_date))) && (
            <span
              className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/70 text-orange-900 dark:text-orange-300 border border-orange-300/80"
              title={`Sắp hết hiệu lực${doc.expiration_date ? `: ${doc.expiration_date}` : ''}`}
            >
              ⏳ Sắp hết HL
            </span>
          )}

          {isBookmarked && (
            <span className="ml-auto text-[#AD8B26]" title="Đã đánh dấu">
              ⚑
            </span>
          )}
        </div>

        <div className="text-xs font-medium text-stone-800 dark:text-stone-200 line-clamp-2 mt-1 leading-snug">
          {doc.title}
        </div>

        {isSelected && (
          <div className="mt-2 pt-2 border-t border-stone-200/80 dark:border-stone-800 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-stone-500 dark:text-stone-400">
              <span className="truncate">
                {doc.field} · {doc.issuing_body}
              </span>
              {doc.legacy_doc_id && (
                <span className="font-mono-code text-sky-800 dark:text-sky-300 font-semibold">
                  {doc.legacy_doc_id}
                  {doc.parent_doc_id ? ` ↳ ${doc.parent_doc_id}` : ''}
                </span>
              )}
            </div>

            {doc.articles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {doc.articles.map((art) => {
                  const isArtActive = activeArticleId === art.id;
                  return (
                    <button
                      key={art.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDoc(doc, art.id);
                      }}
                      title={
                        art.is_amended
                          ? `${art.article_no}: Đã sửa đổi bởi ${art.amendment_info?.amending_doc_number || 'văn bản sửa đổi'}`
                          : art.article_title
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-code cursor-pointer inline-flex items-center gap-0.5 ${
                        isArtActive
                          ? 'bg-[#152D42] text-[#E9C96D] font-bold'
                          : art.is_amended
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 hover:bg-amber-100'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      <span>{art.article_no}</span>
                      {art.is_amended && <span className="text-[9px] text-amber-600 dark:text-amber-400">⚠</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

interface ReaderArticleSectionProps {
  art: LegalDocument['articles'][number];
  docNumber: string;
  isFocused: boolean;
  articleByNoMap: Map<string, LegalDocument['articles'][number]>;
  onSelectArticle: (articleId: string, scroll?: boolean) => void;
  onAskAqua: (question: string, clauseContext: string) => void;
  onOpenCrossLawDrawer: (art: LegalDocument['articles'][number]) => void;
  onOpenReasoningDrawer?: (art: LegalDocument['articles'][number]) => void;
  onOpenAmendingDoc?: (amendingDocId: string) => void;
  asOfDate?: string;
}

/**
 * Memoized Column 3 Article Section with In-place Clause Diff Viewer & Cross-Law AI Action:
 */
const ReaderArticleSection = React.memo<ReaderArticleSectionProps>(
  ({
    art,
    docNumber,
    isFocused,
    articleByNoMap,
    onSelectArticle,
    onAskAqua,
    onOpenCrossLawDrawer,
    onOpenReasoningDrawer,
    onOpenAmendingDoc,
    asOfDate,
  }) => {
    const amendingDocCode =
      art.amendment_info?.amending_doc_number || 'Văn bản sửa đổi';

    return (
      <section
        id={`sec-art-${art.id}`}
        onClick={() => onSelectArticle(art.id, false)}
        className={`p-5 rounded-2xl border transition ${
          isFocused
            ? 'bg-[#FFFDF7] dark:bg-[#1E1D1B] border-[#C6A342] shadow-xs'
            : art.is_amended
            ? 'bg-[#FFFDF9] dark:bg-[#1A1916] border-amber-300/80 dark:border-amber-800/60'
            : 'bg-white dark:bg-[#181715] border-stone-200 dark:border-[#2E2C28]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            {art.chapter_no} · {art.chapter_title}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {onOpenReasoningDrawer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReasoningDrawer(art);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                title="Mở Drawer Suy luận Pháp lý 6 Bước (IRAC+) & Xuất Báo cáo bằng chứng (SHA-256) cho Điều khoản này"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-200" />
                <span>⚖ Suy luận IRAC+</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCrossLawDrawer(art);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#152D42] hover:bg-[#1E3F5A] text-[#E9C96D] text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
              title="Kích hoạt Prompt Engine AI phân tích ma trận đối soát chéo liên luật (Luật Xây dựng, Đất đai, Đấu thầu) & cảnh báo rủi ro xuất toán"
            >
              <Zap className="w-3.5 h-3.5 text-[#E9C96D]" />
              <span>⚡ Đối soát chéo liên luật</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAskAqua(
                  `Phân tích quy định và lưu ý tuân thủ tại ${art.article_no} (${docNumber}): ${art.article_title}`,
                  art.content
                );
              }}
              className="px-2.5 py-1 rounded-lg bg-[#C6A342]/20 text-[#7A5F14] dark:text-amber-300 text-xs font-semibold hover:bg-[#C6A342]/30 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Hỏi AQUA về {art.article_no}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg leading-snug">
            <span className="text-[#152D42] dark:text-amber-400 font-mono-code mr-1.5">
              {art.article_no}.
            </span>
            <span className={art.is_annulled ? 'line-through opacity-60' : ''}>
              {art.article_title}
            </span>
          </h3>

          {/* Nhãn cảnh báo màu vàng "⚠ Đã sửa đổi bởi [Số hiệu]" ngay cạnh tên Điều nếu is_amended = true */}
          {art.is_amended && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (art.amendment_info?.amending_doc_id && onOpenAmendingDoc) {
                  onOpenAmendingDoc(art.amendment_info.amending_doc_id);
                }
              }}
              title={
                art.amendment_info?.summary ||
                `Điều khoản đã được sửa đổi, bổ sung bởi ${amendingDocCode}`
              }
              className={`px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold inline-flex items-center gap-1 shadow-2xs ${
                art.amendment_info?.amending_doc_id && onOpenAmendingDoc
                  ? 'hover:bg-amber-200 dark:hover:bg-amber-900 cursor-pointer'
                  : ''
              }`}
            >
              <span>⚠ Đã sửa đổi bởi {amendingDocCode}</span>
              {art.amendment_info?.amending_doc_id && onOpenAmendingDoc && (
                <ArrowUpRight className="w-3 h-3 shrink-0" />
              )}
            </button>
          )}

          {art.is_annulled && (
            <span className="px-2.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 text-xs font-bold inline-flex items-center gap-1">
              ⛔ Đã bãi bỏ bởi {amendingDocCode}
            </span>
          )}
        </div>

        {/* Component In-place Diff Viewer hiển thị từng Khoản và nút "So sánh với bản gốc" */}
        <InPlaceClauseDiffViewer
          article={art}
          articleByNoMap={articleByNoMap}
          onSelectArticle={onSelectArticle}
          onOpenAmendingDoc={onOpenAmendingDoc}
          asOfDate={asOfDate}
        />

        {/* Chi tiết Phả hệ sửa đổi của riêng Điều khoản (amendment_info) */}
        {art.amendment_info && (
          <div className="mt-3 p-3 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/30 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <span>🧬 Phả hệ sửa đổi {art.article_no}:</span>
                <span className="font-mono-code px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100">
                  {art.amendment_info.amending_doc_number}
                </span>
              </strong>
              {art.amendment_info.promulgation_date && (
                <span className="text-[11px] font-mono-code text-amber-800 dark:text-amber-300">
                  Ban hành: {art.amendment_info.promulgation_date}
                  {art.amendment_info.effective_date
                    ? ` · Hiệu lực: ${art.amendment_info.effective_date}`
                    : ''}
                </span>
              )}
            </div>
            {art.amendment_info.summary && (
              <p className="text-stone-800 dark:text-stone-200 leading-relaxed">
                {art.amendment_info.summary}
              </p>
            )}
            {art.amendment_info.previous_excerpt && (
              <div className="p-2 rounded bg-white/80 dark:bg-stone-900/70 border border-amber-200/80 dark:border-amber-900 text-[11px] text-stone-600 dark:text-stone-400 italic">
                {art.amendment_info.previous_excerpt}
              </div>
            )}
          </div>
        )}

        {art.amendment_note && (
          <div className="mt-3 p-3 rounded-xl border-l-4 border-[#C6A342] bg-[#FBF5DF]/70 dark:bg-amber-950/20 text-xs text-stone-800 dark:text-amber-200">
            {art.amendment_note}
          </div>
        )}
      </section>
    );
  }
);

export default function App() {
  const isOnline = useOnlineStatus();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const tocSectionRef = useRef<HTMLDivElement | null>(null);

  // Deduplicated SSoT Relational State with LocalStorage Persistence + Genealogy Schema Hydration
  const [documents, setDocuments] = useState<LegalDocument[]>(() => {
    const synchronizedSeed = buildSynchronizedLegalCorpus(INITIAL_LEGAL_DOCUMENTS);
    const stored = loadFromStorage<LegalDocument[]>(
      STORAGE_KEYS.DOCS,
      synchronizedSeed
    );
    const initialById = new Map<string, LegalDocument>(
      synchronizedSeed.map((d) => [d.id, d])
    );
    // Ensure all initial + REG_Master documents exist without duplication and receive latest genealogy fields
    const mapById = new Map<string, LegalDocument>();
    const seenNumbers = new Set<string>();
    [...stored, ...synchronizedSeed].forEach((d) => {
      const codeKey = d.doc_number.trim().toUpperCase();
      if (!mapById.has(d.id) && !seenNumbers.has(codeKey)) {
        const seedDoc = initialById.get(d.id);
        if (seedDoc) {
          const seedArtMap = new Map(seedDoc.articles.map((a) => [a.id, a]));
          const existingById = new Map(d.articles.map((a) => [a.id, a]));
          // Merge seed articles in canonical order + preserve any extra AI-expanded articles
          const mergedFromSeed = seedDoc.articles.map((seedArt) => {
            const existing = existingById.get(seedArt.id);
            return existing
              ? {
                  ...existing,
                  content: seedArt.clauses ? seedArt.content : existing.content,
                  is_amended: existing.is_amended ?? seedArt.is_amended,
                  is_annulled: existing.is_annulled ?? seedArt.is_annulled,
                  amendment_info: seedArt.amendment_info ?? existing.amendment_info,
                  clause_count: existing.clause_count ?? seedArt.clause_count,
                  point_count: existing.point_count ?? seedArt.point_count,
                  clauses: seedArt.clauses ?? existing.clauses,
                }
              : seedArt;
          });
          const extraArticles = d.articles.filter(
            (a) =>
              !seedArtMap.has(a.id) &&
              !a.is_ai_draft &&
              !a.id.includes('-art-exp-')
          );
          const mergedArticles = [...mergedFromSeed, ...extraArticles];

          mapById.set(d.id, {
            ...d,
            title: seedDoc.title,
            short_title: seedDoc.short_title,
            doc_number: seedDoc.doc_number,
            issue_date: seedDoc.issue_date,
            effective_date: seedDoc.effective_date,
            authenticity_tier: seedDoc.authenticity_tier ?? d.authenticity_tier,
            total_articles_count:
              seedDoc.total_articles_count ?? d.total_articles_count,
            national_database_url:
              d.national_database_url ?? seedDoc.national_database_url,
            total_clauses_count:
              d.total_clauses_count ?? seedDoc.total_clauses_count,
            amended_count: d.amended_count ?? seedDoc.amended_count,
            amendment_history: d.amendment_history ?? seedDoc.amendment_history,
            is_amending_document:
              d.is_amending_document ?? seedDoc.is_amending_document,
            amends_doc_ids: d.amends_doc_ids ?? seedDoc.amends_doc_ids,
            is_consolidated: seedDoc.is_consolidated ?? d.is_consolidated,
            consolidated_doc_number:
              seedDoc.consolidated_doc_number ?? d.consolidated_doc_number,
            is_expiring_soon: d.is_expiring_soon ?? seedDoc.is_expiring_soon,
            expiration_date: d.expiration_date ?? seedDoc.expiration_date,
            legacy_doc_id: seedDoc.legacy_doc_id ?? d.legacy_doc_id,
            parent_doc_id: seedDoc.parent_doc_id ?? d.parent_doc_id,
            is_blocked_p0: seedDoc.is_blocked_p0 ?? d.is_blocked_p0,
            reg_master_meta: seedDoc.reg_master_meta ?? d.reg_master_meta,
            source_url: seedDoc.source_url ?? d.source_url,
            articles: mergedArticles,
          });
        } else {
          mapById.set(d.id, d);
        }
        seenNumbers.add(codeKey);
      }
    });
    return prepareVerifiedCorpus(Array.from(mapById.values()));
  });

  const [crossReferences, setCrossReferences] = useState<LegalCrossReference[]>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.XREFS, INITIAL_CROSS_REFERENCES);
    const mapById = new Map<string, LegalCrossReference>();
    [...stored, ...INITIAL_CROSS_REFERENCES].forEach((x) => {
      if (!mapById.has(x.id)) {
        mapById.set(x.id, x);
      }
    });
    return Array.from(mapById.values());
  });

  const [savedDocs, setSavedDocs] = useState<SavedDocumentItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.SAVED_DOCS, [
      {
        docId: 'doc-lxd-135-2025',
        folder: 'Hồ sơ Pháp lý Dự án & QLDA',
        savedAt: '2026-11-06',
        personalNote:
          'Luật khung kiểm soát điều kiện khởi công (Điều 14), cấp Giấy phép xây dựng (Điều 89) và Nghiệm thu hoàn thành đưa vào sử dụng (Điều 123).',
      },
      {
        docId: 'doc-bvdlcn-91-2025',
        folder: 'Dữ liệu cá nhân & An ninh mạng',
        savedAt: '2026-11-07',
        personalNote:
          'Kiểm soát điều kiện xin sự đồng ý hợp lệ (Điều 9, Điều 11) và nghiêm cấm chia sẻ dữ liệu khách hàng trái phép (Điều 7).',
      },
      {
        docId: 'doc-nd-15-2023',
        folder: 'Hồ sơ Pháp lý Dự án & QLDA',
        savedAt: '2026-11-07',
        personalNote:
          'Quy định chi tiết về quản lý dự án đầu tư xây dựng công trình, thẩm định Báo cáo nghiên cứu khả thi (Điều 12).',
      },
    ])
  );

  const [savedClauses, setSavedClauses] = useState<SavedClauseItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.SAVED_CLAUSES, [
      {
        id: 'sc-pmu-1',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d14',
        folder: 'Hồ sơ Pháp lý Dự án & QLDA',
        note: 'Hồ sơ nghiệm thu cần bổ sung biên bản kiểm tra điều kiện mặt bằng sạch theo điểm a khoản 1 điều này để tránh rủi ro xuất toán khi quyết toán vốn.',
        savedAt: '2026-11-08',
      },
    ])
  );

  const [offlineDocIds, setOfflineDocIds] = useState<string[]>(() =>
    loadFromStorage(
      STORAGE_KEYS.OFFLINE_IDS,
      INITIAL_LEGAL_DOCUMENTS.map((d) => d.id)
    )
  );

  const [recentDocIds, setRecentDocIds] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.RECENT_IDS, [
      'doc-lxd-135-2025',
      'doc-bvdlcn-91-2025',
      'doc-nd-217-2026',
    ])
  );

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'log-init-1',
        at: new Date().toISOString(),
        action: 'KHỞI_TẠO_HỆ_THỐNG_ĐẠI_SƠN',
        documentId: 'doc-lxd-135-2025',
        detail: 'Đồng bộ SSoT + Thư viện VBPL + LegalFlow',
      },
    ])
  );

  const [folders, setFolders] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.FOLDERS, [
      'Hồ sơ Pháp lý Dự án & QLDA',
      'Dữ liệu cá nhân & An ninh mạng',
      'Đấu thầu & Hợp đồng EPC',
      'Thẩm duyệt PCCC & Cấp phép XD',
      'Thanh quyết toán & Kiểm toán',
    ])
  );

  const [alerts, setAlerts] = useState<DailyLegalUpdateAlert[]>(() =>
    loadFromStorage(STORAGE_KEYS.ALERTS, INITIAL_DAILY_ALERTS)
  );

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() =>
    loadFromStorage(STORAGE_KEYS.NOTIF_PREFS, {
      enabled: true,
      browserPermission:
        typeof window !== 'undefined' && 'Notification' in window
          ? Notification.permission
          : 'unsupported',
      dailyTime: '07:30',
      subscribedCategories: [
        'Xây dựng',
        'Đấu thầu',
        'Đất đai',
        'PCCC',
        'Tài chính',
        'Dữ liệu cá nhân & An ninh mạng',
      ],
      subscribedStages: ['Quy hoạch', 'Chuẩn bị đầu tư', 'Thực thi', 'Quyết toán'],
      notifyOnSavedDocAmended: true,
      lastDigestDate: '2026-11-08 07:30',
    })
  );

  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() =>
    loadFromStorage(STORAGE_KEYS.READER_SETTINGS, {
      theme: 'light',
      fontFamily: 'serif',
      fontSize: 'md',
      fontSizePx: 16,
    })
  );

  // Navigation & Multi-Facet Filter States
  const [activeView, setActiveView] = useState<ActiveView>('library');
  const [complianceInitialSubMode, setComplianceInitialSubMode] =
    useState<CheckSubMode>('tree_mindmap');
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('docs');
  const [mobilePane, setMobilePane] = useState<MobilePane>('reader');
  const [showWelcomeHero, setShowWelcomeHero] = useState(false);
  const [crossLawDrawerState, setCrossLawDrawerState] = useState<{
    doc: LegalDocument;
    article: LegalDocument['articles'][number];
  } | null>(null);
  const [genealogyDrawerDocId, setGenealogyDrawerDocId] = useState<string | null>(
    null
  );
  const [consolidatedDrawerDocId, setConsolidatedDrawerDocId] = useState<
    string | null
  >(null);
  const [readerAsOfDate, setReaderAsOfDate] = useState<string>('');
  const [reasoningDrawerState, setReasoningDrawerState] = useState<{
    doc: LegalDocument;
    article: LegalDocument['articles'][number] | null;
  } | null>(null);
  const [evidenceReportOutput, setEvidenceReportOutput] =
    useState<IRACPlusReasoningOutput | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [categoryFilterText, setCategoryFilterText] = useState('');
  const [selectedField, setSelectedField] = useState<LegalField | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<ProjectLifecycleStage | 'all'>('all');
  const [selectedDocType, setSelectedDocType] = useState<LegalDocType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatusFilterType>('all');
  const [selectedIssuingBody, setSelectedIssuingBody] = useState<string>('all');
  const [selectedSigner, setSelectedSigner] = useState<string>('all');
  const [authoritySearchText, setAuthoritySearchText] = useState<string>('');
  const [catalogSortBy, setCatalogSortBy] = useState<
    'default' | 'issue_date_desc' | 'issue_date_asc' | 'doc_number_asc' | 'amended_desc'
  >('default');
  const [showAdvancedCatalogFilters, setShowAdvancedCatalogFilters] = useState<boolean>(true);
  const [issueDateFrom, setIssueDateFrom] = useState<string>('');
  const [issueDateTo, setIssueDateTo] = useState<string>('');
  const [matchVietnameseAccent, setMatchVietnameseAccent] = useState(false);
  const [onlyOfflineFilter, setOnlyOfflineFilter] = useState(false);

  // Flexible 3-Column Resizable Layout State (persisted in localStorage)
  const [colLayout, setColLayout] = useState<{
    col1Width: number;
    col2Width: number;
    col1Collapsed: boolean;
    col2Collapsed: boolean;
  }>(() =>
    loadFromStorage('daison_three_col_layout_v1', {
      col1Width: 260,
      col2Width: 350,
      col1Collapsed: false,
      col2Collapsed: false,
    })
  );
  const [showColLayoutPanel, setShowColLayoutPanel] = useState(false);
  const [activeResizingCol, setActiveResizingCol] = useState<1 | 2 | null>(null);
  const threeColContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync CSS variables for 3-column grid template without inline style props
  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty(
      '--daison-col1-w',
      colLayout.col1Collapsed ? '0px' : `${colLayout.col1Width}px`
    );
    root.style.setProperty(
      '--daison-col2-w',
      colLayout.col2Collapsed ? '0px' : `${colLayout.col2Width}px`
    );
  }, [colLayout]);

  const handleStartColumnResize = useCallback(
    (colIndex: 1 | 2, e: React.MouseEvent) => {
      e.preventDefault();
      setActiveResizingCol(colIndex);
      const startX = e.clientX;
      const startCol1 = colLayout.col1Width;
      const startCol2 = colLayout.col2Width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        if (colIndex === 1) {
          const nextCol1 = Math.max(180, Math.min(420, startCol1 + deltaX));
          setColLayout((prev) => ({
            ...prev,
            col1Collapsed: false,
            col1Width: nextCol1,
          }));
        } else {
          const nextCol2 = Math.max(260, Math.min(580, startCol2 + deltaX));
          setColLayout((prev) => ({
            ...prev,
            col2Collapsed: false,
            col2Width: nextCol2,
          }));
        }
      };

      const handleMouseUp = () => {
        setActiveResizingCol(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [colLayout.col1Width, colLayout.col2Width]
  );

  // 3-Column Master-Detail-Inspector Active Selection State
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-lxd-135-2025');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('art-lxd-d14');
  const [docPersonalNoteInput, setDocPersonalNoteInput] = useState<string>('');
  const [readerViewFormat, setReaderViewFormat] = useState<'cards' | 'continuous'>('cards');
  const [isExpandingFullDoc, setIsExpandingFullDoc] = useState(false);

  // MCP AI Legal Assistant & Session Global Audit Summary State in Column 3
  const [mcpCustomPrompt, setMcpCustomPrompt] = useState('');
  const [mcpAnalysisMap, setMcpAnalysisMap] = useState<Record<string, string>>({});
  const [mcpAuditRecords, setMcpAuditRecords] = useState<McpSessionAuditRecord[]>(
    () => {
      if (typeof window === 'undefined') return INITIAL_SESSION_MCP_AUDITS;
      try {
        const raw = window.sessionStorage.getItem('daison_mcp_session_audits_v1');
        return raw ? (JSON.parse(raw) as McpSessionAuditRecord[]) : INITIAL_SESSION_MCP_AUDITS;
      } catch {
        return INITIAL_SESSION_MCP_AUDITS;
      }
    }
  );
  const [isMcpLoading, setIsMcpLoading] = useState(false);

  // Trợ lý AQUA Floating Drawer State
  const [isAquaOpen, setIsAquaOpen] = useState(false);
  const [aquaPromptContext, setAquaPromptContext] = useState<{
    question: string;
    clauseContext: string;
  }>({ question: '', clauseContext: '' });

  // Modals State
  const [readingDocState, setReadingDocState] = useState<{
    docId: string;
    articleId?: string;
  } | null>(null);
  const [mapCenterDocId, setMapCenterDocId] = useState<string>('doc-lxd-135-2025');
  const [selectedCrossRef, setSelectedCrossRef] = useState<LegalCrossReference | null>(
    INITIAL_CROSS_REFERENCES[0] || null
  );
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [backupStatsModalMode, setBackupStatsModalMode] = useState<
    'export' | 'stats' | 'help' | null
  >(null);
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    message: string;
    docId?: string;
  } | null>(null);

  const handleLogAction = useCallback(
    (action: string, detail?: string, docId?: string) => {
      setAuditLogs((prev) => {
        const next: AuditLogEntry[] = [
          ...prev,
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            at: new Date().toISOString(),
            action,
            documentId: docId || selectedDocId || null,
            detail,
          },
        ].slice(-1000);
        return next;
      });
    },
    [selectedDocId]
  );

  const handleExpandFullDocumentWithAi = useCallback(
    async (doc: LegalDocument) => {
      setIsExpandingFullDoc(true);
      try {
        const existingArticleNos = doc.articles.map((a) => a.article_no);
        const res = await fetch('/api/expand-full-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            docNumber: doc.doc_number,
            docTitle: doc.title,
            docType: doc.doc_type,
            issuingBody: doc.issuing_body,
            field: doc.field,
            existingArticleNos,
          }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.articles) && data.articles.length > 0) {
          const existingSet = new Set(
            doc.articles.map((a) => a.article_no.trim().toLowerCase())
          );
          const aiDraftArticles = data.articles
            .filter(
              (item: { article_no?: string }) =>
                item.article_no &&
                !existingSet.has(item.article_no.trim().toLowerCase())
            )
            .map(
              (
                item: {
                  chapter_no: string;
                  chapter_title: string;
                  article_no: string;
                  article_title: string;
                  content: string;
                },
                idx: number
              ) => ({
                id: `${doc.id}-ai-draft-${Date.now()}-${idx + 1}`,
                document_id: doc.id,
                chapter_no: item.chapter_no || 'Chương tham khảo AI',
                chapter_title: item.chapter_title || 'Bản nháp tham khảo AI',
                article_no: item.article_no,
                article_title: item.article_title,
                content: item.content,
                is_active: doc.status !== 'HET_HIEU_LUC',
                is_ai_draft: true,
                keywords: [
                  item.article_no.toLowerCase(),
                  doc.field.toLowerCase(),
                ],
              })
            );

          if (aiDraftArticles.length > 0) {
            // Khắc phục triệt để P0-01: Lưu bản nháp AI vào phân vùng cách ly AI_DRAFTS, tuyệt đối KHÔNG nối vào doc.articles của VERIFIED_SSOT!
            const { savedDraftCount, warningBanner } =
              attachAiExpandedDraftSafely(doc, aiDraftArticles);

            setReaderViewFormat('continuous');
            setToastNotification({
              title: 'Đã lưu Bản nháp AI vào phân vùng cách ly (AI_DRAFTS)',
              message: `${warningBanner} (+${savedDraftCount} điều tham khảo cho ${doc.doc_number}, giữ nguyên ${doc.articles.length} điều SSoT).`,
              docId: doc.id,
            });
            handleLogAction(
              'LƯU_NHÁP_AI_CÁCH_LY_P0_01',
              `${doc.doc_number} (+${savedDraftCount} Điều nháp cách ly, không ghi đè SSoT)`,
              doc.id
            );
          }
        }
      } catch {
        setToastNotification({
          title: 'Chế độ Đọc Toàn văn SSoT',
          message:
            'Đang hiển thị các điều khoản đã xác thực trong kho SSoT chuẩn Nghị định 30/2020/NĐ-CP.',
        });
        setReaderViewFormat('continuous');
      } finally {
        setIsExpandingFullDoc(false);
      }
    },
    [handleLogAction]
  );

  // Sync Dark Mode & Font Size on <html>
  useEffect(() => {
    const root = window.document.documentElement;
    if (readerSettings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(
      STORAGE_KEYS.READER_SETTINGS,
      JSON.stringify(readerSettings)
    );
  }, [readerSettings]);

  // Debounced SSoT state persistence (eliminates synchronous main-thread JSON.stringify blocking)
  useDebouncedStorageEffect(STORAGE_KEYS.DOCS, documents, 350);
  useDebouncedStorageEffect(STORAGE_KEYS.XREFS, crossReferences, 300);
  useDebouncedStorageEffect(STORAGE_KEYS.SAVED_DOCS, savedDocs, 250);
  useDebouncedStorageEffect(STORAGE_KEYS.SAVED_CLAUSES, savedClauses, 250);
  useDebouncedStorageEffect(STORAGE_KEYS.OFFLINE_IDS, offlineDocIds, 250);
  useDebouncedStorageEffect(STORAGE_KEYS.RECENT_IDS, recentDocIds, 250);
  useDebouncedStorageEffect(STORAGE_KEYS.AUDIT_LOGS, auditLogs, 400);
  useDebouncedStorageEffect(STORAGE_KEYS.FOLDERS, folders, 250);
  useDebouncedStorageEffect(STORAGE_KEYS.ALERTS, alerts, 250);
  useDebouncedStorageEffect(STORAGE_KEYS.NOTIF_PREFS, notifPrefs, 250);
  useDebouncedStorageEffect('daison_three_col_layout_v1', colLayout, 200);
  useDebouncedStorageEffect(
    'daison_mcp_session_audits_v1',
    mcpAuditRecords,
    300,
    'session'
  );

  // Pre-build O(1) Document & Global Article Lookup Maps
  const { docMap, globalArticleByDocAndIdMap } = useMemo(() => {
    const m = new Map<string, LegalDocument>();
    const aMap = new Map<string, LegalDocument['articles'][number]>();
    documents.forEach((d) => {
      m.set(d.id, d);
      d.articles.forEach((a) => aMap.set(`${d.id}:${a.id}`, a));
    });
    return { docMap: m, globalArticleByDocAndIdMap: aMap };
  }, [documents]);

  // Pre-build O(1) Field, Stage & Category Group Counter Maps (eliminates O(G * D) .filter() & .reduce() inside Sidebar JSX)
  const { fieldCountsMap, stageCountsMap, groupCountsMap } = useMemo(() => {
    const fMap = new Map<LegalField, number>();
    const sMap = new Map<ProjectLifecycleStage, number>();
    documents.forEach((d) => {
      fMap.set(d.field, (fMap.get(d.field) || 0) + 1);
      sMap.set(d.project_stage, (sMap.get(d.project_stage) || 0) + 1);
    });

    const gMap = new Map<string, number>();
    VBPL_CATEGORY_GROUPS.forEach((grp) => {
      let sum = 0;
      for (let i = 0; i < grp.fields.length; i++) {
        sum += fMap.get(grp.fields[i]) || 0;
      }
      gMap.set(grp.groupName, sum);
    });

    return {
      fieldCountsMap: fMap,
      stageCountsMap: sMap,
      groupCountsMap: gMap,
    };
  }, [documents]);

  // Pre-build O(1) Offline & Bookmark Set / Map Lookups
  const offlineDocIdSet = useMemo(() => new Set(offlineDocIds), [offlineDocIds]);
  const { bookmarkedDocIdSet, savedDocByIdMap } = useMemo(() => {
    const set = new Set<string>();
    const map = new Map<string, SavedDocumentItem>();
    savedDocs.forEach((s) => {
      set.add(s.docId);
      map.set(s.docId, s);
    });
    return { bookmarkedDocIdSet: set, savedDocByIdMap: map };
  }, [savedDocs]);

  // Sync personal note input when selectedDocId changes via O(1) savedDocByIdMap
  useEffect(() => {
    const saved = savedDocByIdMap.get(selectedDocId);
    setDocPersonalNoteInput(saved?.personalNote || '');
  }, [selectedDocId, savedDocByIdMap]);

  // Pre-build O(1) Cross-Reference Adjacency Index by Document ID & Article Key
  const { crossRefsByDocId, crossRefsByArticleKey } = useMemo(() => {
    const byDoc = new Map<string, LegalCrossReference[]>();
    const byArtKey = new Map<string, LegalCrossReference[]>();

    crossReferences.forEach((xref) => {
      const srcList = byDoc.get(xref.source_doc_id) || [];
      srcList.push(xref);
      byDoc.set(xref.source_doc_id, srcList);

      if (xref.target_doc_id !== xref.source_doc_id) {
        const tgtList = byDoc.get(xref.target_doc_id) || [];
        tgtList.push(xref);
        byDoc.set(xref.target_doc_id, tgtList);
      }

      if (xref.source_article_id) {
        const srcKey = `${xref.source_doc_id}:${xref.source_article_id}`;
        const list = byArtKey.get(srcKey) || [];
        list.push(xref);
        byArtKey.set(srcKey, list);
      }

      if (xref.target_article_id) {
        const tgtKey = `${xref.target_doc_id}:${xref.target_article_id}`;
        if (
          tgtKey !== `${xref.source_doc_id}:${xref.source_article_id}`
        ) {
          const list = byArtKey.get(tgtKey) || [];
          list.push(xref);
          byArtKey.set(tgtKey, list);
        }
      }
    });

    return { crossRefsByDocId: byDoc, crossRefsByArticleKey: byArtKey };
  }, [crossReferences]);

  // Pre-build O(1) Full-Text & Metadata Normalized Search Index + Issuing Body / Signer / Status Filter Maps
  const {
    searchIndexByDocId,
    issuingBodyOptions,
    signerOptions,
    statusFilterCounts,
  } = useMemo(() => {
    const index = new Map<
      string,
      {
        accentedFull: string;
        unaccentedFull: string;
        unaccentedMeta: string;
        unaccentedAuthority: string;
        accentedAuthority: string;
        isCurrentlyEffective: boolean;
        isExpiringSoon: boolean;
        isConsolidated: boolean;
      }
    >();
    const bodyCounts = new Map<string, number>();
    const signerCounts = new Map<string, number>();
    const counts: Record<DocumentStatusFilterType, number> = {
      all: documents.length,
      DANG_HIEU_LUC: 0,
      SAP_HET_HIEU_LUC: 0,
      VAN_BAN_HOP_NHAT: 0,
      SUA_DOI_BO_SUNG: 0,
      HET_HIEU_LUC: 0,
    };

    documents.forEach((doc) => {
      const body = (doc.issuing_body || '').trim();
      const signer = (doc.signer || '').trim();
      if (body) {
        bodyCounts.set(body, (bodyCounts.get(body) || 0) + 1);
      }
      if (signer) {
        signerCounts.set(signer, (signerCounts.get(signer) || 0) + 1);
      }

      const isCurrentlyEffective =
        doc.status === 'CON_HIEU_LUC' || doc.status === 'SUA_DOI_BO_SUNG';
      const isExpiringSoon = Boolean(
        doc.is_expiring_soon ||
          (doc.status !== 'HET_HIEU_LUC' && Boolean(doc.expiration_date))
      );
      const isConsolidated = Boolean(
        doc.is_consolidated ||
          doc.consolidated_doc_number ||
          (doc.amended_count ?? 0) > 0 ||
          (doc.amendment_history && doc.amendment_history.length > 0) ||
          /VBHN|văn bản hợp nhất/i.test(`${doc.doc_number} ${doc.title}`)
      );

      if (isCurrentlyEffective) counts.DANG_HIEU_LUC += 1;
      if (isExpiringSoon) counts.SAP_HET_HIEU_LUC += 1;
      if (isConsolidated) counts.VAN_BAN_HOP_NHAT += 1;
      if (doc.status === 'SUA_DOI_BO_SUNG' || doc.is_amending_document) {
        counts.SUA_DOI_BO_SUNG += 1;
      }
      if (doc.status === 'HET_HIEU_LUC') counts.HET_HIEU_LUC += 1;

      const authorityRaw = `${body} ${signer}`;
      const metaRaw = `${doc.doc_number} ${doc.title} ${doc.short_title} ${doc.field} ${body} ${signer} ${doc.summary} ${
        doc.consolidated_doc_number || ''
      }`;
      const articlesRaw = doc.articles
        .map((a) => `${a.article_no} ${a.article_title} ${a.content}`)
        .join(' ');
      const fullRaw = `${metaRaw} ${articlesRaw}`;
      index.set(doc.id, {
        accentedFull: normalizeSearchText(fullRaw, true),
        unaccentedFull: normalizeSearchText(fullRaw, false),
        unaccentedMeta: normalizeSearchText(metaRaw, false),
        unaccentedAuthority: normalizeSearchText(authorityRaw, false),
        accentedAuthority: normalizeSearchText(authorityRaw, true),
        isCurrentlyEffective,
        isExpiringSoon,
        isConsolidated,
      });
    });

    const sortedBodies = Array.from(bodyCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
      .map(([name, count]) => ({ name, count }));

    const sortedSigners = Array.from(signerCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
      .map(([name, count]) => ({ name, count }));

    return {
      searchIndexByDocId: index,
      issuingBodyOptions: sortedBodies,
      signerOptions: sortedSigners,
      statusFilterCounts: counts,
    };
  }, [documents]);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredAuthoritySearchText = useDeferredValue(authoritySearchText);
  const deferredCategoryFilterText = useDeferredValue(categoryFilterText);

  // Filtered Sidebar Category Groups
  const filteredCategoryGroups = useMemo(() => {
    const q = normalizeSearchText(
      deferredCategoryFilterText.trim(),
      matchVietnameseAccent
    );
    if (!q) return VBPL_CATEGORY_GROUPS;
    return VBPL_CATEGORY_GROUPS.filter((grp) =>
      normalizeSearchText(
        `${grp.groupName} ${grp.fields.join(' ')}`,
        matchVietnameseAccent
      ).includes(q)
    );
  }, [deferredCategoryFilterText, matchVietnameseAccent]);

  // Expandable state for Column 1 VirtualList category groups
  const [expandedSidebarGroups, setExpandedSidebarGroups] = useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    VBPL_CATEGORY_GROUPS.forEach((grp) => {
      init[grp.groupName] =
        grp.groupName.includes('Xây dựng') || grp.groupName.includes('Dữ liệu');
    });
    return init;
  });

  const handleToggleSidebarGroup = useCallback((groupName: string) => {
    setExpandedSidebarGroups((prev) => ({
      ...prev,
      [groupName]: !(
        prev[groupName] ??
        (groupName.includes('Xây dựng') || groupName.includes('Dữ liệu'))
      ),
    }));
  }, []);

  // Flattened VirtualList stream for Column 1 Sidebar (Category Groups + Sub-Fields + WBS Lifecycle Stages)
  const sidebarVirtualItems = useMemo<SidebarVirtualRow[]>(() => {
    const rows: SidebarVirtualRow[] = [];
    const hasFilterText = Boolean(deferredCategoryFilterText.trim());

    for (let i = 0; i < filteredCategoryGroups.length; i++) {
      const grp = filteredCategoryGroups[i];
      const isActiveGroup =
        selectedField !== 'all' && grp.fields.includes(selectedField);
      const isExpanded =
        hasFilterText ||
        isActiveGroup ||
        (expandedSidebarGroups[grp.groupName] ??
          (grp.groupName.includes('Xây dựng') ||
            grp.groupName.includes('Dữ liệu')));

      rows.push({
        key: `grp:${grp.groupName}`,
        type: 'group_header',
        groupName: grp.groupName,
        count: groupCountsMap.get(grp.groupName) || 0,
        isExpanded,
        isActiveGroup,
      });

      if (isExpanded) {
        for (let j = 0; j < grp.fields.length; j++) {
          const f = grp.fields[j];
          rows.push({
            key: `field:${grp.groupName}:${f}`,
            type: 'field_item',
            field: f,
            count: fieldCountsMap.get(f) || 0,
            isSelected: selectedField === f,
          });
        }
      }
    }

    rows.push({
      key: 'wbs:header',
      type: 'wbs_header',
      hasActiveStage: selectedStage !== 'all',
    });

    for (let i = 0; i < PROJECT_LIFECYCLE_STAGES.length; i++) {
      const stage = PROJECT_LIFECYCLE_STAGES[i];
      rows.push({
        key: `wbs:stage:${stage}`,
        type: 'wbs_stage',
        stage,
        label: WBS_STAGE_LABELS[stage],
        count: stageCountsMap.get(stage) || 0,
        isActive: selectedStage === stage,
      });
    }

    rows.push({
      key: 'wbs:stage_gate_cta',
      type: 'stage_gate_cta',
    });

    return rows;
  }, [
    filteredCategoryGroups,
    deferredCategoryFilterText,
    selectedField,
    selectedStage,
    expandedSidebarGroups,
    groupCountsMap,
    fieldCountsMap,
    stageCountsMap,
  ]);

  const renderSidebarVirtualRow = useCallback(
    (row: SidebarVirtualRow) => {
      switch (row.type) {
        case 'group_header':
          return (
            <button
              type="button"
              onClick={() => handleToggleSidebarGroup(row.groupName)}
              className="w-full h-full flex items-center gap-2 px-2.5 rounded-lg text-xs font-semibold hover:bg-white/10 select-none text-left cursor-pointer"
            >
              <span className="text-[#8EACBF] text-[10px]">
                {row.isExpanded ? '▾' : '▸'}
              </span>
              <span className="text-[#8EACBF]">▣</span>
              <span
                className={`truncate ${
                  row.isActiveGroup ? 'text-[#E9C96D]' : 'text-[#D6E1E9]'
                }`}
              >
                {row.groupName}
              </span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#9FB9CC] font-mono-code">
                {row.count}
              </span>
            </button>
          );

        case 'field_item':
          return (
            <div className="h-full pl-5 pr-0.5 flex items-center">
              <div className="w-full h-full pl-2 border-l border-white/15 flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedField(row.field);
                    setCatalogTab('docs');
                    setMobilePane('list');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs text-left transition cursor-pointer ${
                    row.isSelected
                      ? 'bg-[#C6A342] text-[#152D42] font-bold'
                      : 'text-[#ADBFCC] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="truncate">▧ &nbsp; {row.field}</span>
                  <span
                    className={`text-[10px] font-mono-code px-1.5 rounded ${
                      row.isSelected
                        ? 'bg-black/15 text-[#152D42]'
                        : 'text-[#8FAEC3]'
                    }`}
                  >
                    {row.count}
                  </span>
                </button>
              </div>
            </div>
          );

        case 'wbs_header':
          return (
            <div className="h-full pt-2.5 mt-1 border-t border-white/15 px-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#DFC66E]">
                VÒNG ĐỜI DỰ ÁN (WBS)
              </span>
              {row.hasActiveStage && (
                <button
                  type="button"
                  onClick={() => setSelectedStage('all')}
                  className="text-[10px] text-[#E9C96D] hover:underline cursor-pointer"
                >
                  Bỏ lọc
                </button>
              )}
            </div>
          );

        case 'wbs_stage':
          return (
            <div className="h-full px-1 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedStage(row.isActive ? 'all' : row.stage);
                  setMobilePane('list');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                  row.isActive
                    ? 'bg-[#C6A342] text-[#152D42] font-bold'
                    : 'text-[#ADBFCC] hover:bg-white/10'
                }`}
              >
                <span className="truncate">{row.label}</span>
                <span className="text-[10px] font-mono-code">{row.count}</span>
              </button>
            </div>
          );

        case 'stage_gate_cta':
          return (
            <div className="h-full px-1 pt-1.5 flex items-center">
              <button
                type="button"
                onClick={() => setActiveView('stage_gate')}
                className="w-full px-2.5 py-2 rounded-lg bg-[#C6A342]/15 border border-[#C6A342]/50 text-[#E9C96D] hover:bg-[#C6A342]/25 text-[11px] font-semibold flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>17 Stage-Gates (G0–G16)</span>
                </span>
                <span className="text-[10px] font-mono-code bg-[#C6A342] text-[#152D42] px-1.5 py-0.5 rounded font-bold">
                  316 bước
                </span>
              </button>
            </div>
          );
      }
    },
    [handleToggleSidebarGroup]
  );

  // Multi-Dimensional Filtered Documents for Column 2 (O(1) pre-indexed full-text lookup + useDeferredValue)
  const filteredDocuments = useMemo(() => {
    const q = normalizeSearchText(
      deferredSearchQuery.trim(),
      matchVietnameseAccent
    );
    const authQ = normalizeSearchText(
      deferredAuthoritySearchText.trim(),
      matchVietnameseAccent
    );

    let list = documents.filter((doc) => {
      if (
        catalogTab === 'docs' &&
        selectedField !== 'all' &&
        doc.field !== selectedField
      ) {
        return false;
      }
      if (selectedStage !== 'all' && doc.project_stage !== selectedStage) return false;
      if (selectedDocType !== 'all' && doc.doc_type !== selectedDocType) return false;

      const indexed = searchIndexByDocId.get(doc.id);
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'DANG_HIEU_LUC') {
          if (!indexed?.isCurrentlyEffective) return false;
        } else if (selectedStatus === 'SAP_HET_HIEU_LUC') {
          if (!indexed?.isExpiringSoon) return false;
        } else if (selectedStatus === 'VAN_BAN_HOP_NHAT') {
          if (!indexed?.isConsolidated) return false;
        } else if (selectedStatus === 'SUA_DOI_BO_SUNG') {
          if (doc.status !== 'SUA_DOI_BO_SUNG' && !doc.is_amending_document) {
            return false;
          }
        } else if (selectedStatus === 'HET_HIEU_LUC') {
          if (doc.status !== 'HET_HIEU_LUC') return false;
        }
      }

      if (
        selectedIssuingBody !== 'all' &&
        doc.issuing_body.trim() !== selectedIssuingBody
      ) {
        return false;
      }
      if (selectedSigner !== 'all' && doc.signer.trim() !== selectedSigner) {
        return false;
      }
      if (issueDateFrom && doc.issue_date < issueDateFrom) return false;
      if (issueDateTo && doc.issue_date > issueDateTo) return false;
      if (onlyOfflineFilter && !offlineDocIdSet.has(doc.id)) return false;

      if (authQ) {
        if (!indexed) return false;
        const authHaystack = matchVietnameseAccent
          ? indexed.accentedAuthority
          : indexed.unaccentedAuthority;
        if (!authHaystack.includes(authQ)) return false;
      }

      if (!q) return true;
      if (!indexed) return false;
      const haystack = matchVietnameseAccent
        ? indexed.accentedFull
        : indexed.unaccentedFull;
      return haystack.includes(q);
    });

    if (catalogTab === 'bookmarks') {
      list = list.filter((d) => bookmarkedDocIdSet.has(d.id));
    } else if (catalogTab === 'recent') {
      const filteredById = new Map<string, LegalDocument>();
      list.forEach((d) => filteredById.set(d.id, d));
      list = recentDocIds
        .map((id) => filteredById.get(id))
        .filter((d): d is LegalDocument => Boolean(d));
    }

    if (catalogSortBy !== 'default') {
      list = [...list].sort((a, b) => {
        if (catalogSortBy === 'issue_date_desc') {
          return b.issue_date.localeCompare(a.issue_date);
        }
        if (catalogSortBy === 'issue_date_asc') {
          return a.issue_date.localeCompare(b.issue_date);
        }
        if (catalogSortBy === 'doc_number_asc') {
          return a.doc_number.localeCompare(b.doc_number, 'vi');
        }
        if (catalogSortBy === 'amended_desc') {
          const countA = a.amended_count ?? a.amendment_history?.length ?? 0;
          const countB = b.amended_count ?? b.amendment_history?.length ?? 0;
          return countB - countA || b.issue_date.localeCompare(a.issue_date);
        }
        return 0;
      });
    }

    return list;
  }, [
    documents,
    deferredSearchQuery,
    deferredAuthoritySearchText,
    matchVietnameseAccent,
    catalogTab,
    selectedField,
    selectedStage,
    selectedDocType,
    selectedStatus,
    selectedIssuingBody,
    selectedSigner,
    issueDateFrom,
    issueDateTo,
    catalogSortBy,
    onlyOfflineFilter,
    offlineDocIdSet,
    searchIndexByDocId,
    bookmarkedDocIdSet,
    recentDocIds,
  ]);

  // Search Autocomplete Suggestions via O(1) pre-indexed metadata
  const searchAutocompleteItems = useMemo(() => {
    const q = normalizeSearchText(deferredSearchQuery.trim(), false);
    if (!q) return [];
    const matches: LegalDocument[] = [];
    for (let i = 0; i < documents.length; i++) {
      const d = documents[i];
      const indexed = searchIndexByDocId.get(d.id);
      if (indexed && indexed.unaccentedMeta.includes(q)) {
        matches.push(d);
        if (matches.length >= 5) break;
      }
    }
    return matches;
  }, [documents, deferredSearchQuery, searchIndexByDocId]);

  // Progressive Windowing for Column 2 when filteredDocuments is very large
  const CATALOG_BATCH_SIZE = 40;
  const [visibleCatalogLimit, setVisibleCatalogLimit] =
    useState<number>(CATALOG_BATCH_SIZE);

  useEffect(() => {
    setVisibleCatalogLimit(CATALOG_BATCH_SIZE);
  }, [
    deferredSearchQuery,
    deferredAuthoritySearchText,
    catalogTab,
    selectedField,
    selectedStage,
    selectedDocType,
    selectedStatus,
    selectedIssuingBody,
    selectedSigner,
    issueDateFrom,
    issueDateTo,
    onlyOfflineFilter,
  ]);

  const visibleCatalogDocuments = useMemo(() => {
    if (filteredDocuments.length <= visibleCatalogLimit) {
      return filteredDocuments;
    }
    const sliced = filteredDocuments.slice(0, visibleCatalogLimit);
    // Ensure currently selected document is always mounted if present in filtered list
    if (
      selectedDocId &&
      !sliced.some((d) => d.id === selectedDocId)
    ) {
      const selectedDoc = docMap.get(selectedDocId);
      if (selectedDoc) {
        return [...sliced, selectedDoc];
      }
    }
    return sliced;
  }, [filteredDocuments, visibleCatalogLimit, selectedDocId, docMap]);

  const handleCatalogListScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (visibleCatalogLimit >= filteredDocuments.length) return;
      const el = e.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) {
        setVisibleCatalogLimit((prev) =>
          Math.min(filteredDocuments.length, prev + CATALOG_BATCH_SIZE)
        );
      }
    },
    [visibleCatalogLimit, filteredDocuments.length]
  );

  // Active Document & Article for Column 3 Inspector (O(1) Map Lookup)
  const inspectedDoc = useMemo(() => {
    return (
      docMap.get(selectedDocId) ||
      filteredDocuments[0] ||
      documents[0]
    );
  }, [docMap, selectedDocId, filteredDocuments, documents]);

  // Isolated AI reference draft & Quarantine inspection state (REM-P2-01)
  const inspectedAiDraft = useMemo(() => {
    if (!inspectedDoc) return null;
    return loadAiDraftForDocument(inspectedDoc.id);
  }, [inspectedDoc, isExpandingFullDoc]);

  const quarantineQueueCount = useMemo(
    () => loadQuarantineDocuments().length,
    [documents.length, showCreateDocModal]
  );

  const inspectedArticle = useMemo(() => {
    if (!inspectedDoc) return null;
    return (
      globalArticleByDocAndIdMap.get(
        `${inspectedDoc.id}:${selectedArticleId}`
      ) ||
      inspectedDoc.articles[0] ||
      null
    );
  }, [inspectedDoc, selectedArticleId, globalArticleByDocAndIdMap]);

  // O(1) Article Lookup Map by normalized article_no for the currently inspected document
  const inspectedArticleByNoMap = useMemo(() => {
    const map = new Map<string, LegalDocument['articles'][number]>();
    if (!inspectedDoc) return map;
    inspectedDoc.articles.forEach((art) => {
      map.set(art.article_no.trim().toLowerCase(), art);
    });
    return map;
  }, [inspectedDoc]);

  // Cross-references linked to the currently inspected article or document (Pure O(1) Map Lookup)
  const inspectedCrossRefs = useMemo(() => {
    if (!inspectedDoc) return [];
    if (inspectedArticle) {
      const exactArticleRefs = crossRefsByArticleKey.get(
        `${inspectedDoc.id}:${inspectedArticle.id}`
      );
      if (exactArticleRefs && exactArticleRefs.length > 0) {
        return exactArticleRefs;
      }
    }
    return crossRefsByDocId.get(inspectedDoc.id) || [];
  }, [
    crossRefsByArticleKey,
    crossRefsByDocId,
    inspectedDoc,
    inspectedArticle,
  ]);

  const handleSelectDocInGrid = useCallback(
    (doc: LegalDocument, articleId?: string) => {
      setSelectedDocId(doc.id);
      setSelectedArticleId(articleId || doc.articles[0]?.id || '');
      setShowWelcomeHero(false);
      setRecentDocIds((prev) =>
        [doc.id, ...prev.filter((id) => id !== doc.id)].slice(0, 30)
      );
      setMobilePane('reader');
      handleLogAction('MỞ_VĂN_BẢN', doc.doc_number, doc.id);
    },
    [handleLogAction]
  );

  const handleSelectArticleInReader = useCallback(
    (articleId: string, shouldScroll = false) => {
      setSelectedArticleId(articleId);
      if (shouldScroll) {
        const el = document.getElementById(`sec-art-${articleId}`);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    []
  );

  const handleAskAquaWithContext = useCallback(
    (question: string, clauseContext: string) => {
      setAquaPromptContext({ question, clauseContext });
      setIsAquaOpen(true);
    },
    []
  );

  // Helper to upsert a completed MCP Audit into the Session Global Audit Summary
  const upsertMcpSessionAuditRecord = (
    doc: LegalDocument,
    article: LegalDocument['articles'][number],
    analysisText: string,
    customPromptText?: string
  ) => {
    const recordId = `${doc.id}:${article.id}`;
    const nowTime = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const parsedChecklist = parseMcpAnalysisToChecklistItems(recordId, analysisText);

    setMcpAuditRecords((prev) => {
      const existing = prev.find((r) => r.id === recordId);
      const checkedMap = new Map<string, boolean>();
      existing?.checklistItems.forEach((item) => checkedMap.set(item.id, item.checked));

      const mergedRecord: McpSessionAuditRecord = {
        id: recordId,
        docId: doc.id,
        docNumber: doc.doc_number,
        docTitle: doc.title,
        field: doc.field,
        projectStage: doc.project_stage,
        articleId: article.id,
        articleNo: article.article_no,
        articleTitle: article.article_title,
        auditedAt: nowTime,
        customPrompt: customPromptText || undefined,
        rawAnalysis: analysisText,
        checklistItems: parsedChecklist.map((item) => ({
          ...item,
          checked: checkedMap.get(item.id) ?? false,
        })),
      };

      return [mergedRecord, ...prev.filter((r) => r.id !== recordId)];
    });
  };

  const handleToggleMcpChecklistItem = useCallback(
    (recordId: string, itemId: string) => {
      setMcpAuditRecords((prev) =>
        prev.map((rec) =>
          rec.id !== recordId
            ? rec
            : {
                ...rec,
                checklistItems: rec.checklistItems.map((item) =>
                  item.id === itemId ? { ...item, checked: !item.checked } : item
                ),
              }
        )
      );
    },
    []
  );

  const handleMarkAllMcpChecklistItems = useCallback((checked: boolean) => {
    setMcpAuditRecords((prev) =>
      prev.map((rec) => ({
        ...rec,
        checklistItems: rec.checklistItems.map((item) => ({
          ...item,
          checked,
        })),
      }))
    );
  }, []);

  const handleRemoveMcpAuditRecord = useCallback((recordId: string) => {
    setMcpAuditRecords((prev) => prev.filter((rec) => rec.id !== recordId));
  }, []);

  const handleClearAllMcpAuditRecords = useCallback(() => {
    setMcpAuditRecords([]);
  }, []);

  const handleNavigateToClause = useCallback(
    (docId: string, articleId: string) => {
      const targetDoc = docMap.get(docId);
      if (targetDoc) {
        handleSelectDocInGrid(targetDoc, articleId);
        setTimeout(() => {
          const el = document.getElementById(`sec-art-${articleId}`);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    },
    [docMap, handleSelectDocInGrid]
  );

  // Run MCP AI Legal Audit via Server-Side Gemini 3.8 Flash endpoint (with offline fallback)
  const handleRunMcpAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inspectedDoc || !inspectedArticle) return;

    const key = `${inspectedDoc.id}:${inspectedArticle.id}`;
    const promptUsed = mcpCustomPrompt.trim();
    setIsMcpLoading(true);
    handleLogAction('KIỂM_TOÁN_MCP_AI', `${inspectedDoc.doc_number} - ${inspectedArticle.article_no}`);
    try {
      const response = await fetch('/api/legal-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docNumber: inspectedDoc.doc_number,
          docTitle: inspectedDoc.title,
          projectStage: WBS_STAGE_LABELS[inspectedDoc.project_stage],
          articleNo: inspectedArticle.article_no,
          articleTitle: inspectedArticle.article_title,
          articleContent: inspectedArticle.content,
          crossReferences: inspectedCrossRefs,
          customQuestion: promptUsed,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.analysis) {
        const errMessage =
          data?.error ||
          `[CẢNH BÁO KẾT NỐI AI]: Không thể kết nối máy chủ kiểm toán MCP (HTTP ${response.status}). Hệ thống từ chối tự sinh kết luận giả định. ${
            inspectedArticle.amendment_note
              ? `Ghi chú SSoT đã xác thực: ${inspectedArticle.amendment_note}`
              : 'Vui lòng đối chiếu trực tiếp nội dung Điều khoản trong kho SSoT.'
          }`;
        setMcpAnalysisMap((prev) => ({
          ...prev,
          [key]: errMessage,
        }));
        return;
      }

      const resolvedAnalysis = String(data.analysis);
      setMcpAnalysisMap((prev) => ({
        ...prev,
        [key]: resolvedAnalysis,
      }));
      upsertMcpSessionAuditRecord(
        inspectedDoc,
        inspectedArticle,
        resolvedAnalysis,
        promptUsed
      );
    } catch (err: unknown) {
      const explicitOfflineMessage = `[CẢNH BÁO KẾT NỐI AI]: ${
        err instanceof Error ? err.message : 'Mất kết nối tới máy chủ kiểm toán AI'
      }. Hệ thống từ chối tự sinh kết luận giả định. ${
        inspectedArticle.amendment_note
          ? `Ghi chú SSoT đã xác thực: ${inspectedArticle.amendment_note}`
          : 'Vui lòng đối chiếu trực tiếp nội dung Điều khoản trong kho SSoT.'
      }`;

      setMcpAnalysisMap((prev) => ({
        ...prev,
        [key]: explicitOfflineMessage,
      }));
    } finally {
      setIsMcpLoading(false);
    }
  };

  const handleToggleSaveDoc = useCallback(
    (docId: string, folder = folders[0] || 'Hồ sơ Pháp lý Dự án & QLDA') => {
      setSavedDocs((prev) => {
        const exists = prev.some((d) => d.docId === docId);
        handleLogAction(
          exists ? 'BỎ_ĐÁNH_DẤU' : 'ĐÁNH_DẤU_VĂN_BẢN',
          docId,
          docId
        );
        if (exists) {
          return prev.filter((d) => d.docId !== docId);
        }
        return [
          {
            docId,
            folder,
            savedAt: new Date().toISOString().slice(0, 10),
            personalNote: '',
          },
          ...prev,
        ];
      });
    },
    [folders, handleLogAction]
  );

  // Global Keyboard Shortcuts from VBPL HTML: Ctrl+K (search), M (TOC), D (Bookmark)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchSuggestions(true);
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.toLowerCase() === 'm') {
        tocSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key.toLowerCase() === 'd' && selectedDocId) {
        handleToggleSaveDoc(selectedDocId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedDocId, handleToggleSaveDoc]);

  const handleSaveDocNoteInline = () => {
    if (!inspectedDoc) return;
    setSavedDocs((prev) => {
      const exists = prev.some((s) => s.docId === inspectedDoc.id);
      if (exists) {
        return prev.map((s) =>
          s.docId === inspectedDoc.id
            ? { ...s, personalNote: docPersonalNoteInput }
            : s
        );
      }
      return [
        {
          docId: inspectedDoc.id,
          folder: folders[0] || 'Hồ sơ Pháp lý Dự án & QLDA',
          savedAt: new Date().toISOString().slice(0, 10),
          personalNote: docPersonalNoteInput,
        },
        ...prev,
      ];
    });
    handleLogAction('LƯU_GHI_CHÚ_VĂN_BẢN', inspectedDoc.doc_number, inspectedDoc.id);
    setToastNotification({
      title: 'Đã lưu ghi chú cá nhân',
      message: `Ghi chú cho văn bản ${inspectedDoc.doc_number} đã được lưu vào trình duyệt.`,
    });
  };

  const handleCopyCurrentDoc = async () => {
    if (!inspectedDoc) return;
    const text = `${inspectedDoc.title}\nSố hiệu: ${inspectedDoc.doc_number} · Trạng thái: ${
      STATUS_META[inspectedDoc.status].label
    }\n\n${inspectedDoc.articles
      .map((a) => `${a.article_no}. ${a.article_title}\n${a.content}`)
      .join('\n\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setToastNotification({
        title: 'Đã sao chép toàn văn',
        message: `Đã sao chép nội dung văn bản ${inspectedDoc.doc_number} vào khay nhớ tạm.`,
      });
    } catch {
      // ignore
    }
  };

  const handleAdjustFontSizePx = (delta: number) => {
    setReaderSettings((prev) => {
      const currentPx = prev.fontSizePx || 16;
      const nextPx = Math.max(13, Math.min(24, currentPx + delta));
      return { ...prev, fontSizePx: nextPx };
    });
  };

  const handleToggleOfflineDoc = useCallback((docId: string) => {
    setOfflineDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  }, []);

  const handleCacheAllDocsOffline = useCallback(() => {
    setOfflineDocIds(documents.map((d) => d.id));
    setToastNotification({
      title: 'Đã đồng bộ toàn bộ CSDL SSoT ngoại tuyến',
      message: `${documents.length} văn bản pháp luật và ${crossReferences.length} liên kết đối soát đã sẵn sàng phục vụ khi không có kết nối mạng.`,
    });
  }, [documents, crossReferences.length]);

  const handleSaveClauseNote = useCallback(
    (docId: string, articleId: string, note: string, folder: string) => {
      setSavedClauses((prev) => {
        const filtered = prev.filter(
          (c) => !(c.docId === docId && c.articleId === articleId)
        );
        return [
          {
            id: `sc-${Date.now()}`,
            docId,
            articleId,
            folder,
            note,
            savedAt: new Date().toISOString().slice(0, 10),
          },
          ...filtered,
        ];
      });
    },
    []
  );

  const handleRemoveClauseNote = useCallback((docId: string, articleId: string) => {
    setSavedClauses((prev) =>
      prev.filter((c) => !(c.docId === docId && c.articleId === articleId))
    );
  }, []);

  const handleTriggerDailyPush = () => {
    const latestAlert = alerts[0];
    const nowStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setNotifPrefs((prev) => ({
      ...prev,
      lastDigestDate: `2026-11-08 ${nowStr}`,
    }));

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      latestAlert
    ) {
      new Notification(`ĐẠI SƠN Điểm tin Pháp lý (${latestAlert.code})`, {
        body: latestAlert.title,
        icon: '/pwa-192x192.png',
      });
    }

    if (latestAlert) {
      setToastNotification({
        title: `Bản tin Pháp lý ĐẠI SƠN · ${latestAlert.code}`,
        message: latestAlert.title,
        docId: latestAlert.docId,
      });
    }
  };

  const handleSaveNewDocument = (
    newDoc: LegalDocument,
    newCrossRef?: LegalCrossReference
  ) => {
    const isQuarantinedOcr =
      newDoc.authenticity_tier === 'QUARANTINE_REVIEW' ||
      newDoc.status === 'DANG_DU_THAO';

    if (isQuarantinedOcr) {
      // Khắc phục triệt để P0-01: Bắt buộc cô lập tài liệu OCR/Dự thảo vào phân vùng QUARANTINE_OCR, tuyệt đối KHÔNG ghi đè kho VERIFIED_SSOT!
      const quarantinedDoc = ingestOcrDocumentToQuarantine(
        newDoc,
        newDoc.sha256_hash || computeStringSha256Sync(newDoc.title || newDoc.doc_number)
      );
      handleLogAction(
        'CÁCH_LY_HỒ_SƠ_OCR_QUARANTINE',
        `${quarantinedDoc.doc_number} (SHA-256: ${quarantinedDoc.sha256_hash?.slice(0, 12) || 'N/A'})`,
        quarantinedDoc.id
      );
      setToastNotification({
        title: `Đã lưu Hồ sơ OCR ${quarantinedDoc.doc_number} vào Khu Cách ly (QUARANTINE_OCR)`,
        message: `Tài liệu OCR (${quarantinedDoc.articles.length} điều khoản, tổng số hàng đợi cách ly: ${quarantineQueueCount + 1}) được bảo vệ tách biệt, tuyệt đối không ghi đè kho văn bản SSoT.`,
      });
      return;
    }

    const [verifiedNewDoc] = prepareVerifiedCorpus([newDoc]);
    setDocuments((prev) => {
      // Bảo vệ bất biến các văn bản gốc trong INITIAL_LEGAL_DOCUMENTS: không bao giờ cho phép ghi đè trùng số hiệu của SSoT gốc
      const coreIds = new Set(INITIAL_LEGAL_DOCUMENTS.map((d) => d.id));
      const coreDocNumbers = new Set(
        INITIAL_LEGAL_DOCUMENTS.map((d) => d.doc_number.trim().toUpperCase())
      );
      if (
        coreIds.has(verifiedNewDoc.id) ||
        coreDocNumbers.has(verifiedNewDoc.doc_number.trim().toUpperCase())
      ) {
        return prev;
      }
      const filtered = prev.filter(
        (d) =>
          d.id !== verifiedNewDoc.id &&
          d.doc_number.toUpperCase() !== verifiedNewDoc.doc_number.toUpperCase()
      );
      return [verifiedNewDoc, ...filtered];
    });
    setOfflineDocIds((prev) => [...new Set([verifiedNewDoc.id, ...prev])]);
    setSelectedDocId(verifiedNewDoc.id);
    if (verifiedNewDoc.articles[0]) {
      setSelectedArticleId(verifiedNewDoc.articles[0].id);
    }
    if (newCrossRef) {
      setCrossReferences((prev) => [newCrossRef, ...prev]);
    }
    handleLogAction('NẠP_VĂN_BẢN_MỚI', verifiedNewDoc.doc_number, verifiedNewDoc.id);

    const newAlert: DailyLegalUpdateAlert = {
      id: `alert-${Date.now()}`,
      date: verifiedNewDoc.issue_date,
      docId: verifiedNewDoc.id,
      code: verifiedNewDoc.doc_number,
      title: `Văn bản mới nạp vào SSoT ĐẠI SƠN: ${verifiedNewDoc.title}`,
      category: verifiedNewDoc.field,
      projectStage: verifiedNewDoc.project_stage,
      changeType: 'Ban hành mới',
      summary: verifiedNewDoc.summary,
      impactedDocIds: newCrossRef
        ? [verifiedNewDoc.id, newCrossRef.target_doc_id]
        : [verifiedNewDoc.id],
      isRead: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setToastNotification({
      title: `Đã bóc tách & lưu văn bản ${verifiedNewDoc.doc_number}`,
      message: `${verifiedNewDoc.articles.length} điều khoản đã được chuẩn hóa (${
        verifiedNewDoc.authenticity_tier
      })${inspectedAiDraft ? ` · Có bản nháp AI cách ly` : ''}.`,
      docId: verifiedNewDoc.id,
    });
  };

  const handleImportBackupData = (
    incomingDocs: LegalDocument[],
    incomingBookmarks: string[],
    incomingNotes: Record<string, string>
  ) => {
    let addedCount = 0;
    let quarantinedCount = 0;
    setDocuments((prev) => {
      const existingIds = new Set(prev.map((d) => d.id));
      const existingCodes = new Set(
        prev.map((d) => d.doc_number.trim().toUpperCase())
      );
      const verifiedBatch: LegalDocument[] = [];
      incomingDocs.forEach((d) => {
        if (!d || typeof d.id !== 'string' || typeof d.doc_number !== 'string') return;
        const code = d.doc_number.trim().toUpperCase();
        if (existingIds.has(d.id) || existingCodes.has(code)) return;
        existingIds.add(d.id);
        existingCodes.add(code);
        if (d.authenticity_tier === 'QUARANTINE_REVIEW' || d.status === 'DANG_DU_THAO') {
          ingestOcrDocumentToQuarantine(
            d,
            d.sha256_hash || computeStringSha256Sync(d.title || d.doc_number)
          );
          quarantinedCount += 1;
        } else {
          verifiedBatch.push(d);
        }
      });
      const preparedIncoming = prepareVerifiedCorpus(verifiedBatch);
      addedCount = preparedIncoming.length;
      return [...prev, ...preparedIncoming];
    });

    if (incomingBookmarks.length > 0 || Object.keys(incomingNotes).length > 0) {
      setSavedDocs((prev) => {
        const map = new Map(prev.map((s) => [s.docId, s]));
        incomingBookmarks.forEach((id) => {
          if (!map.has(id)) {
            map.set(id, {
              docId: id,
              folder: folders[0] || 'Hồ sơ Pháp lý Dự án & QLDA',
              savedAt: new Date().toISOString().slice(0, 10),
              personalNote: incomingNotes[id] || '',
            });
          }
        });
        Object.entries(incomingNotes).forEach(([id, note]) => {
          const item = map.get(id);
          if (item && !item.personalNote) {
            map.set(id, { ...item, personalNote: note });
          }
        });
        return Array.from(map.values());
      });
    }

    handleLogAction(
      'NHẬP_SAO_LƯU_JSON',
      `Bổ sung ${addedCount} văn bản đã hậu kiểm, cách ly ${quarantinedCount} văn bản thiếu ngày hiệu lực`
    );
    setToastNotification({
      title: 'Khôi phục sao lưu hoàn tất (Đã hậu kiểm toàn vẹn)',
      message: `Đã bổ sung ${addedCount} văn bản hợp lệ và chuyển ${quarantinedCount} bản ghi thiếu ngày hiệu lực vào QUARANTINE_OCR.`,
    });
  };

  const activeReadingDocument = useMemo(
    () => (readingDocState?.docId ? docMap.get(readingDocState.docId) || null : null),
    [docMap, readingDocState]
  );

  const unreadAlertsCount = useMemo(
    () => alerts.filter((a) => !a.isRead).length,
    [alerts]
  );
  const totalMcpChecklistRisksCount = useMemo(
    () =>
      mcpAuditRecords.reduce((acc, r) => acc + r.checklistItems.length, 0),
    [mcpAuditRecords]
  );
  const activeMcpKey =
    inspectedDoc && inspectedArticle
      ? `${inspectedDoc.id}:${inspectedArticle.id}`
      : '';
  const activeMcpText =
    (activeMcpKey && mcpAnalysisMap[activeMcpKey]) ||
    inspectedArticle?.amendment_note ||
    'Hồ sơ nghiệm thu cần bổ sung biên bản kiểm tra điều kiện mặt bằng sạch và đối chiếu đầy đủ các quy định liên ngành trước khi trình phê duyệt quyết toán vốn đầu tư.';

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden bg-[#FBF9F5] dark:bg-[#141413] text-[#1C1917] dark:text-[#F5F2EB] ${
        readerSettings.fontFamily === 'serif' ? 'serif' : ''
      }`}
    >
      {/* TOP HEADER BAR: Unified ĐẠI SƠN Institutional Navy & Gold Header */}
      <header className="bg-gradient-to-r from-[#152D42] via-[#1C3D59] to-[#285272] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 border-b-[3px] border-[#C6A342] shrink-0">
        {/* Brand Identity: ĐẠI SƠN */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('library');
            setShowWelcomeHero(true);
          }}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer"
        >
          <span className="w-9 h-9 rounded-xl bg-[#C6A342]/20 border border-[#C6A342] flex items-center justify-center text-[#E9C96D] shadow-xs">
            <Scale className="w-5 h-5" />
          </span>
          <div>
            <strong className="text-base sm:text-lg font-display font-bold tracking-wider text-white block leading-none">
              ĐẠI SƠN
            </strong>
            <small className="text-[10px] tracking-[0.14em] text-[#E9C96D] font-semibold uppercase block mt-0.5">
              PHÁP LUẬT · HỒ SƠ · ĐỐI SOÁT SSoT
            </small>
          </div>
        </a>

        {/* Global Search Box with Autocomplete & Ctrl+K (VBPL + LegalFlow Screenshot 2) */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-[#B5C8D6] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 180)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCatalogTab('results');
              if (activeView !== 'library') setActiveView('library');
              setShowWelcomeHero(false);
            }}
            placeholder="Tìm số hiệu (135/2025/QH15, 91/2025/QH15), tiêu đề, nội dung…"
            className="w-full pl-9 pr-16 py-1.5 text-xs sm:text-sm rounded-lg border border-white/25 bg-white/10 text-white placeholder:text-[#D2DCE4] focus:outline-none focus:border-[#E9C96D] focus:bg-white/15"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-stone-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/25 text-[#DCE5EE] font-mono-code">
            Ctrl K
          </kbd>

          {/* Search Autocomplete Dropdown (LegalFlow Screenshot 2) */}
          {showSearchSuggestions && searchAutocompleteItems.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1E1D1B] text-stone-900 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-[#2E2C28] shadow-2xl z-50 overflow-hidden">
              <div className="px-3 py-1.5 bg-stone-50 dark:bg-[#141413] text-[10px] font-bold uppercase tracking-wider text-stone-400">
                GỢI Ý TRA CỨU NHANH ĐẠI SƠN
              </div>
              {searchAutocompleteItems.map((doc) => (
                <button
                  key={doc.id}
                  onMouseDown={() => {
                    handleSelectDocInGrid(doc);
                    setActiveView('library');
                    setShowSearchSuggestions(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#FBF5DF]/60 dark:hover:bg-stone-800 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="truncate">
                    <div className="text-xs font-semibold truncate">{doc.title}</div>
                    <div className="text-[11px] text-stone-500">{doc.field}</div>
                  </div>
                  <span className="text-xs font-mono-code font-bold text-[#286181] dark:text-amber-400 shrink-0">
                    {doc.doc_number}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Header Utilities (VBPL + PWA) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setBackupStatsModalMode('help')}
            className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1 cursor-pointer"
            title="Hướng dẫn sử dụng & Phím tắt"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#E9C96D]" />
            <span className="hidden xl:inline">Hướng dẫn</span>
          </button>
          <button
            onClick={() => setBackupStatsModalMode('stats')}
            className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1 cursor-pointer"
            title="Thống kê thư viện & Nhật ký"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#E9C96D]" />
            <span className="hidden xl:inline">Thống kê</span>
          </button>
          <button
            onClick={() => setBackupStatsModalMode('export')}
            className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1 cursor-pointer"
            title="Xuất sao lưu JSON hoặc HTML độc lập"
          >
            <Download className="w-3.5 h-3.5 text-[#E9C96D]" />
            <span className="hidden xl:inline">Xuất</span>
          </button>
          <button
            onClick={() =>
              setReaderSettings((prev) => ({
                ...prev,
                fontFamily: prev.fontFamily === 'serif' ? 'sans' : 'serif',
              }))
            }
            className="hidden md:flex px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-serif font-bold text-white cursor-pointer"
            title="Đổi kiểu chữ đọc sách (Serif / Sans)"
          >
            Aa
          </button>
          <button
            onClick={() =>
              setReaderSettings((prev) => ({
                ...prev,
                theme: prev.theme === 'light' ? 'dark' : 'light',
              }))
            }
            className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer"
            title="Chuyển chế độ Sáng / Tối"
          >
            {readerSettings.theme === 'light' ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#E9C96D]" />
            )}
          </button>
          <PWAInstallButton onOpenNewDocModal={() => setShowCreateDocModal(true)} />
        </div>
      </header>

      {/* SECONDARY NAVIGATION RIBBON: Slim Single-Row Navigation */}
      <div className="bg-[#112436] text-stone-200 px-4 sm:px-6 py-1 border-b border-[#1E3B56] flex items-center justify-between gap-2 shrink-0">
        <nav className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium">
          <button
            onClick={() => setActiveView('library')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeView === 'library'
                ? 'bg-[#C6A342] text-[#152D42] font-bold shadow-xs'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tra cứu VBPL</span>
          </button>

          <button
            onClick={() => setActiveView('reasoning_case')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeView === 'reasoning_case'
                ? 'bg-[#C6A342] text-[#152D42] font-bold shadow-xs'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>IRAC+ &amp; Vụ việc</span>
          </button>

          <button
            onClick={() => setActiveView('stage_gate')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeView === 'stage_gate'
                ? 'bg-[#C6A342] text-[#152D42] font-bold shadow-xs'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Stage-Gate (17)</span>
          </button>

          <button
            onClick={() => setActiveView('compliance')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeView === 'compliance'
                ? 'bg-[#C6A342] text-[#152D42] font-bold shadow-xs'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kiểm tra &amp; Bản đồ</span>
          </button>

          <button
            onClick={() => setActiveView('contract')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeView === 'contract'
                ? 'bg-[#C6A342] text-[#152D42] font-bold shadow-xs'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Hợp đồng</span>
          </button>

          <button
            onClick={() => setActiveView('cabinet')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeView === 'cabinet'
                ? 'bg-[#C6A342] text-[#152D42] font-bold shadow-xs'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Tủ sách & Bảng SSoT ({savedDocs.length})</span>
          </button>

          <button
            onClick={() => setActiveView('digest')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeView === 'digest'
                ? 'bg-[#C6A342] text-[#152D42] font-bold shadow-xs'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>
              Bản tin Luật mới {unreadAlertsCount > 0 ? `(${unreadAlertsCount})` : ''}
            </span>
          </button>
        </nav>

        <div className="hidden lg:flex items-center gap-3 text-[11px] text-[#B5C8D6]">
          <span>
            Hệ sinh thái ĐẠI SƠN · {documents.length} văn bản SSoT · {crossReferences.length} đối soát chéo
          </span>
          {!isOnline && (
            <span className="text-amber-400 font-semibold inline-flex items-center gap-1">
              <WifiOff className="w-3.5 h-3.5" />
              Chế độ Ngoại tuyến PWA
            </span>
          )}
        </div>
      </div>

      {/* Toast Notification Banner if triggered */}
      {toastNotification && (
        <div className="bg-[#1C3D50] text-white px-6 py-2 flex items-center justify-between gap-4 text-xs shrink-0 border-b border-[#C6A342]/40">
          <div>
            <strong className="text-[#E9C96D] mr-2">{toastNotification.title}:</strong>
            <span>{toastNotification.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {toastNotification.docId && (
              <button
                onClick={() => {
                  setReadingDocState({ docId: toastNotification.docId! });
                  setToastNotification(null);
                }}
                className="px-2.5 py-1 rounded bg-[#D0AF54] text-[#152D42] font-semibold cursor-pointer"
              >
                Mở toàn văn
              </button>
            )}
            <button
              onClick={() => setToastNotification(null)}
              className="p-1 hover:bg-white/10 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE ROUTER */}
      {activeView === 'library' ? (
        /* 3-COLUMN VBPL + SSoT WORKSPACE (FLEXIBLY RESIZABLE VIA CSS VARIABLES + DRAG SPLITTERS) */
        <div
          ref={threeColContainerRef}
          className={`flex-1 grid grid-cols-1 lg:grid-cols-[var(--daison-col1-w,260px)_var(--daison-col2-w,350px)_minmax(0,1fr)] overflow-hidden ${
            activeResizingCol ? 'select-none cursor-col-resize' : ''
          }`}
        >
          {/* CỘT 1: Cây Lĩnh vực VBPL + Bộ lọc Vòng đời Dự án (WBS) */}
          <aside
            className={`${
              mobilePane === 'fields'
                ? 'flex'
                : colLayout.col1Collapsed
                ? 'hidden'
                : 'hidden lg:flex'
            } relative bg-[#152D42] text-[#D6E1E9] flex-col min-h-0 border-r border-[#102233] overflow-hidden`}
          >
            <div className="p-4 pb-3 border-b border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#DFC66E]">
                  ▤ &nbsp; LĨNH VỰC & VÒNG ĐỜI WBS
                </span>
                {selectedField !== 'all' && (
                  <button
                    onClick={() => setSelectedField('all')}
                    className="text-[11px] text-[#E9C96D] hover:underline cursor-pointer"
                  >
                    Tất cả
                  </button>
                )}
              </div>
              <input
                type="text"
                value={categoryFilterText}
                onChange={(e) => setCategoryFilterText(e.target.value)}
                placeholder="Lọc nhanh lĩnh vực..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-white/15 bg-white/10 text-white placeholder:text-[#8FA5B5] focus:outline-none focus:border-[#C6A342]"
              />
            </div>

            <VirtualList
              items={sidebarVirtualItems}
              itemHeight={getSidebarVirtualRowHeight}
              overscan={8}
              className="flex-1 p-2.5"
              getItemKey={getSidebarVirtualRowKey}
              renderItem={renderSidebarVirtualRow}
            />

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-white/10 space-y-2">
              <button
                onClick={() => {
                  setSelectedField('all');
                  setSelectedStage('all');
                  setSearchQuery('');
                  setIssueDateFrom('');
                  setIssueDateTo('');
                  setCatalogTab('docs');
                  setMobilePane('list');
                }}
                className="w-full py-2 px-3 rounded-lg border border-[#C6A342]/60 text-[#E9C96D] hover:bg-[#C6A342]/15 text-xs font-semibold cursor-pointer"
              >
                ◎ &nbsp; Tra cứu toàn thư viện ({documents.length})
              </button>
              <div className="text-[10px] text-center text-[#7C97A9] tracking-wider">
                HỆ SINH THÁI ĐẠI SƠN · SSoT V4.0
              </div>
            </div>

            {/* Interactive Drag Splitter between Column 1 and Column 2 */}
            <div
              onMouseDown={(e) => handleStartColumnResize(1, e)}
              onDoubleClick={() =>
                setColLayout((prev) => ({
                  ...prev,
                  col1Width: 260,
                  col1Collapsed: false,
                }))
              }
              title="Kéo trái/phải để co giãn Cột 1 (Nhấp đúp để về mặc định 260px)"
              className={`hidden lg:flex absolute top-0 right-0 bottom-0 w-1.5 z-20 cursor-col-resize items-center justify-center group transition ${
                activeResizingCol === 1
                  ? 'bg-[#C6A342]'
                  : 'hover:bg-[#C6A342]/80'
              }`}
            >
              <span className="w-0.5 h-8 rounded-full bg-white/30 group-hover:bg-[#152D42]" />
            </div>
          </aside>

          {/* CỘT 2: Danh mục Văn bản, 4 Tabs, Bộ lọc Ngày ban hành & Khớp dấu tiếng Việt */}
          <section
            className={`${
              mobilePane === 'list'
                ? 'flex'
                : colLayout.col2Collapsed
                ? 'hidden'
                : 'hidden lg:flex'
            } relative bg-[#F1EFE9] dark:bg-[#181715] border-r border-stone-300 dark:border-[#2E2C28] flex-col min-h-0 overflow-hidden`}
          >
            {/* 4 Catalog Mode Tabs from VBPL HTML */}
            <div className="flex bg-white dark:bg-[#1E1D1B] px-2 border-b border-stone-200 dark:border-[#2E2C28] shrink-0">
              {(
                [
                  { id: 'docs', label: '▱ Văn bản' },
                  { id: 'results', label: '⌕ Kết quả' },
                  { id: 'bookmarks', label: `⚑ Đánh dấu (${savedDocs.length})` },
                  { id: 'recent', label: '◷ Gần đây' },
                ] as Array<{ id: CatalogTab; label: string }>
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCatalogTab(t.id)}
                  className={`flex-1 py-3 px-1.5 text-[11px] border-b-2 transition whitespace-nowrap cursor-pointer ${
                    catalogTab === t.id
                      ? 'border-[#C6A342] text-[#152D42] dark:text-amber-300 font-bold'
                      : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filters Bar (Loại văn bản, Trạng thái văn bản, Ngày ban hành, Cơ quan & Người ký) */}
            <div className="p-3 bg-white dark:bg-[#1E1D1B] border-b border-stone-200 dark:border-[#2E2C28] space-y-2.5 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedDocType}
                  onChange={(e) =>
                    setSelectedDocType(e.target.value as LegalDocType | 'all')
                  }
                  className="w-full px-2 py-1.5 text-xs rounded-md border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413]"
                >
                  <option value="all">Loại: Tất cả văn bản</option>
                  <option value="Luật">Luật</option>
                  <option value="Nghị định">Nghị định</option>
                  <option value="Thông tư">Thông tư</option>
                  <option value="Tài liệu">Tài liệu</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(
                      e.target.value as DocumentStatusFilterType
                    )
                  }
                  aria-label="Trạng thái văn bản"
                  className="w-full px-2 py-1.5 text-xs rounded-md border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413]"
                >
                  <option value="all">
                    Trạng thái: Tất cả ({statusFilterCounts.all})
                  </option>
                  <option value="DANG_HIEU_LUC">
                    Đang hiệu lực ({statusFilterCounts.DANG_HIEU_LUC})
                  </option>
                  <option value="SAP_HET_HIEU_LUC">
                    Sắp hết hiệu lực ({statusFilterCounts.SAP_HET_HIEU_LUC})
                  </option>
                  <option value="VAN_BAN_HOP_NHAT">
                    Văn bản hợp nhất ({statusFilterCounts.VAN_BAN_HOP_NHAT})
                  </option>
                  <option value="SUA_DOI_BO_SUNG">
                    Sửa đổi, bổ sung ({statusFilterCounts.SUA_DOI_BO_SUNG})
                  </option>
                  <option value="HET_HIEU_LUC">
                    Đã hết hiệu lực ({statusFilterCounts.HET_HIEU_LUC})
                  </option>
                </select>
              </div>

              {/* Bộ lọc nhanh Trạng thái văn bản: Đang hiệu lực, Sắp hết hiệu lực, Văn bản hợp nhất */}
              <div className="p-2 rounded-lg bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                    Trạng thái văn bản
                  </span>
                  {selectedStatus !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('all')}
                      className="text-[10px] font-semibold text-[#286181] dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Tất cả trạng thái
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      {
                        id: 'all',
                        label: 'Tất cả',
                        count: statusFilterCounts.all,
                      },
                      {
                        id: 'DANG_HIEU_LUC',
                        label: '🟢 Đang hiệu lực',
                        count: statusFilterCounts.DANG_HIEU_LUC,
                      },
                      {
                        id: 'SAP_HET_HIEU_LUC',
                        label: '⏳ Sắp hết hiệu lực',
                        count: statusFilterCounts.SAP_HET_HIEU_LUC,
                      },
                      {
                        id: 'VAN_BAN_HOP_NHAT',
                        label: '📑 Văn bản hợp nhất',
                        count: statusFilterCounts.VAN_BAN_HOP_NHAT,
                      },
                      {
                        id: 'HET_HIEU_LUC',
                        label: 'Đã hết hiệu lực',
                        count: statusFilterCounts.HET_HIEU_LUC,
                      },
                    ] as Array<{
                      id: DocumentStatusFilterType;
                      label: string;
                      count: number;
                    }>
                  ).map((item) => {
                    const isActive = selectedStatus === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedStatus(item.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer inline-flex items-center gap-1 ${
                          isActive
                            ? 'bg-[#152D42] text-[#E9C96D] dark:bg-[#C6A342] dark:text-[#152D42]'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-[#C6A342]'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className="font-mono-code opacity-80">
                          ({item.count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bộ lọc Ngày ban hành (Issue Date Range Filter + Quick Year Presets) */}
              <div className="p-2 rounded-lg bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#C6A342]" />
                    <span>Ngày ban hành</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { label: 'Tất cả', from: '', to: '' },
                      {
                        label: '2025–2026',
                        from: '2025-01-01',
                        to: '2026-12-31',
                      },
                      { label: '2026', from: '2026-01-01', to: '2026-12-31' },
                      { label: '2025', from: '2025-01-01', to: '2025-12-31' },
                      { label: '≤ 2024', from: '', to: '2024-12-31' },
                    ].map((preset) => {
                      const isActivePreset =
                        issueDateFrom === preset.from &&
                        issueDateTo === preset.to;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setIssueDateFrom(preset.from);
                            setIssueDateTo(preset.to);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                            isActivePreset
                              ? 'bg-[#152D42] text-[#E9C96D] dark:bg-[#C6A342] dark:text-[#152D42]'
                              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-[#C6A342]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 items-center">
                  <div>
                    <label className="block text-[9px] text-stone-400 mb-0.5">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={issueDateFrom}
                      onChange={(e) => setIssueDateFrom(e.target.value)}
                      className="w-full px-1.5 py-1 text-[11px] font-mono-code rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1D1B] text-stone-800 dark:text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-stone-400 mb-0.5">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={issueDateTo}
                      onChange={(e) => setIssueDateTo(e.target.value)}
                      className="w-full px-1.5 py-1 text-[11px] font-mono-code rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1D1B] text-stone-800 dark:text-stone-200"
                    />
                  </div>
                </div>
              </div>

              {/* Bộ lọc nâng cao: Cơ quan ban hành & Người ký */}
              <div className="p-2 rounded-lg bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAdvancedCatalogFilters((prev) => !prev)
                    }
                    className="text-[10px] font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-[#C6A342]" />
                    <span>Bộ lọc nâng cao: Cơ quan & Người ký</span>
                    <span className="text-[9px] text-stone-400">
                      {showAdvancedCatalogFilters ? '▾' : '▸'}
                    </span>
                  </button>

                  {(selectedIssuingBody !== 'all' ||
                    selectedSigner !== 'all' ||
                    authoritySearchText) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIssuingBody('all');
                        setSelectedSigner('all');
                        setAuthoritySearchText('');
                      }}
                      className="text-[10px] font-semibold text-[#286181] dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Xóa lọc cơ quan/người ký
                    </button>
                  )}
                </div>

                {showAdvancedCatalogFilters && (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[9px] text-stone-400 mb-0.5">
                          🏛 Cơ quan ban hành ({issuingBodyOptions.length})
                        </label>
                        <select
                          value={selectedIssuingBody}
                          onChange={(e) =>
                            setSelectedIssuingBody(e.target.value)
                          }
                          className="w-full px-1.5 py-1 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1D1B] text-stone-800 dark:text-stone-200"
                        >
                          <option value="all">
                            Tất cả cơ quan ({documents.length})
                          </option>
                          {issuingBodyOptions.map((item) => (
                            <option key={item.name} value={item.name}>
                              {item.name} ({item.count})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-stone-400 mb-0.5">
                          ✍ Người ký ({signerOptions.length})
                        </label>
                        <select
                          value={selectedSigner}
                          onChange={(e) => setSelectedSigner(e.target.value)}
                          className="w-full px-1.5 py-1 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1D1B] text-stone-800 dark:text-stone-200"
                        >
                          <option value="all">
                            Tất cả người ký ({documents.length})
                          </option>
                          {signerOptions.map((item) => (
                            <option key={item.name} value={item.name}>
                              {item.name} ({item.count})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={authoritySearchText}
                        onChange={(e) => setAuthoritySearchText(e.target.value)}
                        placeholder="Nhập nhanh tên Người ký hoặc Cơ quan ban hành (VD: Phạm Minh Chính, Quốc hội, Bộ Xây dựng...)"
                        className="w-full px-2 py-1 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1D1B] text-stone-800 dark:text-stone-200 pr-6"
                      />
                      {authoritySearchText && (
                        <button
                          type="button"
                          onClick={() => setAuthoritySearchText('')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={matchVietnameseAccent}
                    onChange={(e) => setMatchVietnameseAccent(e.target.checked)}
                    className="accent-[#286181]"
                  />
                  <span>Khớp dấu tiếng Việt</span>
                </label>

                <div className="flex items-center gap-2">
                  <select
                    value={catalogSortBy}
                    onChange={(e) =>
                      setCatalogSortBy(
                        e.target.value as
                          | 'default'
                          | 'issue_date_desc'
                          | 'issue_date_asc'
                          | 'doc_number_asc'
                          | 'amended_desc'
                      )
                    }
                    aria-label="Sắp xếp danh sách văn bản"
                    className="px-1.5 py-0.5 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] text-stone-700 dark:text-stone-300"
                  >
                    <option value="default">Sắp xếp: Mặc định</option>
                    <option value="issue_date_desc">Ban hành: Mới nhất ↓</option>
                    <option value="issue_date_asc">Ban hành: Cũ nhất ↑</option>
                    <option value="amended_desc">Phả hệ: Nhiều sửa đổi 🧬 ↓</option>
                    <option value="doc_number_asc">Số hiệu: A → Z</option>
                  </select>

                  <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">
                    {filteredDocuments.length} văn bản
                  </span>
                </div>
              </div>
            </div>

            {/* Document Cards List (Progressive Windowed + Smooth Motion Transitions) */}
            <div
              onScroll={handleCatalogListScroll}
              className="flex-1 overflow-y-auto p-2.5 space-y-2"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-1 py-0.5 flex items-center justify-between">
                <span>
                  {catalogTab === 'results'
                    ? 'KẾT QUẢ TOÀN THƯ VIỆN'
                    : catalogTab === 'bookmarks'
                    ? 'VĂN BẢN ĐÃ ĐÁNH DẤU'
                    : catalogTab === 'recent'
                    ? 'ĐÃ MỞ GẦN ĐÂY'
                    : selectedField === 'all'
                    ? 'TOÀN BỘ LĨNH VỰC'
                    : selectedField}
                </span>
                {(searchQuery ||
                  selectedField !== 'all' ||
                  selectedStage !== 'all' ||
                  selectedDocType !== 'all' ||
                  selectedStatus !== 'all' ||
                  selectedIssuingBody !== 'all' ||
                  selectedSigner !== 'all' ||
                  authoritySearchText ||
                  catalogSortBy !== 'default' ||
                  issueDateFrom ||
                  issueDateTo) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedField('all');
                      setSelectedStage('all');
                      setSelectedDocType('all');
                      setSelectedStatus('all');
                      setSelectedIssuingBody('all');
                      setSelectedSigner('all');
                      setAuthoritySearchText('');
                      setCatalogSortBy('default');
                      setIssueDateFrom('');
                      setIssueDateTo('');
                      setCatalogTab('docs');
                    }}
                    className="text-[#286181] dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>

              {filteredDocuments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 text-center text-xs text-stone-500 space-y-2"
                >
                  <strong className="block text-stone-800 dark:text-stone-200">
                    Chưa có văn bản phù hợp
                  </strong>
                  <p>Hãy đổi bộ lọc hoặc nạp thêm tài liệu mới vào thư viện.</p>
                </motion.div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {visibleCatalogDocuments.map((doc, idx) => {
                      const isSelected =
                        inspectedDoc?.id === doc.id && !showWelcomeHero;
                      return (
                        <CatalogDocumentCard
                          key={doc.id}
                          doc={doc}
                          index={idx}
                          isSelected={isSelected}
                          isBookmarked={bookmarkedDocIdSet.has(doc.id)}
                          activeArticleId={
                            isSelected ? inspectedArticle?.id || null : null
                          }
                          onSelectDoc={handleSelectDocInGrid}
                          onOpenGenealogyTree={(targetDoc) =>
                            setGenealogyDrawerDocId(targetDoc.id)
                          }
                          onOpenConsolidatedDrawer={(targetDoc) =>
                            setConsolidatedDrawerDocId(targetDoc.id)
                          }
                        />
                      );
                    })}
                  </AnimatePresence>
                  {filteredDocuments.length > visibleCatalogDocuments.length && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCatalogLimit((prev) =>
                          Math.min(
                            filteredDocuments.length,
                            prev + CATALOG_BATCH_SIZE
                          )
                        )
                      }
                      className="w-full py-2 text-xs font-semibold text-[#152D42] dark:text-amber-300 bg-white dark:bg-[#1E1D1B] rounded-lg border border-stone-300 dark:border-stone-700 hover:border-[#C6A342] cursor-pointer"
                    >
                      Hiển thị thêm ({visibleCatalogDocuments.length}/
                      {filteredDocuments.length} văn bản)
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Catalog Footer */}
            <div className="px-3.5 py-2 bg-white dark:bg-[#1E1D1B] border-t border-stone-200 dark:border-[#2E2C28] text-[10px] text-stone-500 flex items-center justify-between shrink-0">
              <span>
                {documents.length} văn bản trong thư viện · {savedDocs.length} đánh dấu
              </span>
              <button
                onClick={() => setShowCreateDocModal(true)}
                className="text-[#286181] dark:text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                + Nạp thêm
              </button>
            </div>

            {/* Interactive Drag Splitter between Column 2 and Column 3 */}
            <div
              onMouseDown={(e) => handleStartColumnResize(2, e)}
              onDoubleClick={() =>
                setColLayout((prev) => ({
                  ...prev,
                  col2Width: 350,
                  col2Collapsed: false,
                }))
              }
              title="Kéo trái/phải để co giãn Cột 2 (Nhấp đúp để về mặc định 350px)"
              className={`hidden lg:flex absolute top-0 right-0 bottom-0 w-1.5 z-20 cursor-col-resize items-center justify-center group transition ${
                activeResizingCol === 2
                  ? 'bg-[#C6A342]'
                  : 'hover:bg-[#C6A342]/80'
              }`}
            >
              <span className="w-0.5 h-8 rounded-full bg-stone-400/50 group-hover:bg-[#152D42]" />
            </div>
          </section>

          {/* CỘT 3: Trình đọc Văn bản, Mục lục tự động, Đối soát chéo SSoT & MCP Engine */}
          <main
            className={`${
              mobilePane === 'reader' ? 'flex' : 'hidden lg:flex'
            } flex-col min-w-0 min-h-0 bg-white dark:bg-[#141413] overflow-hidden`}
          >
            {/* Reader Toolbar matching VBPL HTML + 3-Column Resizer Controls */}
            <div className="px-4 py-2.5 bg-[#F7F9FA] dark:bg-[#1E1D1B] border-b border-stone-200 dark:border-[#2E2C28] flex items-center gap-2 shrink-0">
              {(colLayout.col1Collapsed || colLayout.col2Collapsed) && (
                <div className="hidden lg:flex items-center gap-1">
                  {colLayout.col1Collapsed && (
                    <button
                      type="button"
                      onClick={() =>
                        setColLayout((prev) => ({ ...prev, col1Collapsed: false }))
                      }
                      className="px-2 py-1 rounded bg-[#152D42] text-[#E9C96D] text-[11px] font-semibold cursor-pointer"
                      title="Mở lại Cột 1 (Lĩnh vực & WBS)"
                    >
                      + Cột 1
                    </button>
                  )}
                  {colLayout.col2Collapsed && (
                    <button
                      type="button"
                      onClick={() =>
                        setColLayout((prev) => ({ ...prev, col2Collapsed: false }))
                      }
                      className="px-2 py-1 rounded bg-[#152D42] text-[#E9C96D] text-[11px] font-semibold cursor-pointer"
                      title="Mở lại Cột 2 (Danh mục văn bản)"
                    >
                      + Cột 2
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setShowWelcomeHero(false);
                  tocSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-xs font-medium hover:bg-stone-50 cursor-pointer"
                title="Về mục lục (Phím M)"
              >
                ☷ Mục lục
              </button>

              <button
                onClick={() => setShowWelcomeHero((v) => !v)}
                className={`px-2.5 py-1 rounded border text-xs font-medium cursor-pointer ${
                  showWelcomeHero
                    ? 'border-[#C6A342] bg-[#FBF5DF] text-[#152D42] font-semibold'
                    : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413]'
                }`}
              >
                Trang chủ Tra cứu
              </button>

              <button
                type="button"
                onClick={() => setShowColLayoutPanel((v) => !v)}
                className={`hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium cursor-pointer transition ${
                  showColLayoutPanel
                    ? 'border-[#C6A342] bg-[#152D42] text-[#E9C96D] font-semibold'
                    : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-stone-700 dark:text-stone-200 hover:border-[#C6A342]'
                }`}
                title="Tùy chỉnh độ rộng & co giãn linh hoạt giữa 3 cột"
              >
                <Columns3 className="w-3.5 h-3.5 text-[#C6A342]" />
                <span>
                  Co giãn 3 cột (
                  {colLayout.col1Collapsed ? '0' : colLayout.col1Width} ·{' '}
                  {colLayout.col2Collapsed ? '0' : colLayout.col2Width} · 1fr)
                </span>
              </button>

              {/* View Mode Toggle in Column 3 Top Header: "📋 Thẻ Điều khoản" vs "📄 Toàn văn A4 liên tục" */}
              <div className="hidden sm:inline-flex items-center rounded-lg border border-[#C6A342]/70 bg-white dark:bg-[#141413] p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowWelcomeHero(false);
                    setReaderViewFormat('cards');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    readerViewFormat === 'cards' && !showWelcomeHero
                      ? 'bg-[#152D42] text-[#E9C96D] shadow-2xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="Chế độ xem từng Thẻ Điều khoản"
                >
                  📋 Thẻ Điều khoản
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWelcomeHero(false);
                    setReaderViewFormat('continuous');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    readerViewFormat === 'continuous' && !showWelcomeHero
                      ? 'bg-[#152D42] text-[#E9C96D] shadow-2xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="Chế độ đọc Toàn văn A4 liên tục kèm Mục lục tự động highlight"
                >
                  📄 Toàn văn A4 liên tục
                </button>
              </div>

              <span className="text-xs text-stone-500 dark:text-stone-400 truncate flex-1">
                {inspectedDoc
                  ? `${inspectedDoc.doc_number} · ${inspectedDoc.title}`
                  : 'Chưa mở văn bản'}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowWelcomeHero(false);
                    setTimeout(() => {
                      const el = document.getElementById('global-mcp-audit-summary');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 60);
                  }}
                  className="px-2.5 py-1 rounded border border-[#C6A342] bg-[#FBF5DF] dark:bg-amber-950/40 text-[#152D42] dark:text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Di chuyển tới Bảng Tổng Hợp Kiểm Toán MCP (Global Audit Summary)"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-[#152D42] dark:text-amber-300" />
                  <span className="hidden md:inline">
                    Tổng hợp MCP ({totalMcpChecklistRisksCount} rủi ro)
                  </span>
                </button>
                <button
                  onClick={() => handleAdjustFontSizePx(-1)}
                  className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-xs font-semibold cursor-pointer"
                  title="Giảm cỡ chữ"
                >
                  A−
                </button>
                <button
                  onClick={() => handleAdjustFontSizePx(1)}
                  className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-xs font-semibold cursor-pointer"
                  title="Tăng cỡ chữ"
                >
                  A+
                </button>
                {inspectedDoc && (
                  <>
                    <button
                      onClick={() => handleToggleSaveDoc(inspectedDoc.id)}
                      className={`px-2.5 py-1 rounded border text-xs font-semibold cursor-pointer ${
                        bookmarkedDocIdSet.has(inspectedDoc.id)
                          ? 'border-[#C6A342] bg-[#FBF5DF] text-[#AD8B26]'
                          : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413]'
                      }`}
                      title="Đánh dấu văn bản (Phím D)"
                    >
                      ⚑
                    </button>
                    <button
                      onClick={handleCopyCurrentDoc}
                      className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-xs cursor-pointer"
                      title="Sao chép nội dung"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413] text-xs cursor-pointer"
                      title="In / Lưu PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setReadingDocState({
                          docId: inspectedDoc.id,
                          articleId: inspectedArticle?.id,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-[#152D42] text-white text-xs font-semibold hover:bg-[#213E57] hidden sm:inline-flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Toàn màn hình</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Interactive 3-Column Width & Preset Configurator Bar */}
            {showColLayoutPanel && (
              <div className="hidden lg:block px-4 py-3 bg-[#FFFDF7] dark:bg-[#1A1917] border-b border-[#C6A342]/50 space-y-2.5 shrink-0 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#C6A342]" />
                    <strong className="text-[#152D42] dark:text-amber-300">
                      Cấu hình Co giãn Linh hoạt 3 Cột (Kéo thanh chia dọc giữa các cột hoặc chọn chế độ bên dưới):
                    </strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      {
                        label: 'Chuẩn (260 · 350 · 1fr)',
                        col1Width: 260,
                        col2Width: 350,
                        col1Collapsed: false,
                        col2Collapsed: false,
                      },
                      {
                        label: 'Tập trung Đọc (200 · 280 · 1fr)',
                        col1Width: 200,
                        col2Width: 280,
                        col1Collapsed: false,
                        col2Collapsed: false,
                      },
                      {
                        label: 'Rà soát Danh mục (230 · 480 · 1fr)',
                        col1Width: 230,
                        col2Width: 480,
                        col1Collapsed: false,
                        col2Collapsed: false,
                      },
                      {
                        label: 'Mở rộng Lĩnh vực (340 · 360 · 1fr)',
                        col1Width: 340,
                        col2Width: 360,
                        col1Collapsed: false,
                        col2Collapsed: false,
                      },
                      {
                        label: 'Toàn cảnh Văn bản (Ẩn Cột 1 & 2)',
                        col1Width: 260,
                        col2Width: 350,
                        col1Collapsed: true,
                        col2Collapsed: true,
                      },
                    ].map((preset) => {
                      const isCurrent =
                        colLayout.col1Collapsed === preset.col1Collapsed &&
                        colLayout.col2Collapsed === preset.col2Collapsed &&
                        (preset.col1Collapsed ||
                          colLayout.col1Width === preset.col1Width) &&
                        (preset.col2Collapsed ||
                          colLayout.col2Width === preset.col2Width);
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setColLayout(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            isCurrent
                              ? 'bg-[#152D42] text-[#E9C96D] border-[#C6A342]'
                              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#C6A342]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pt-1">
                  <div className="flex items-center gap-2 bg-white dark:bg-[#141413] p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                    <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">
                      Cột 1 (Lĩnh vực):
                    </span>
                    <input
                      type="range"
                      min={180}
                      max={420}
                      step={5}
                      disabled={colLayout.col1Collapsed}
                      value={colLayout.col1Width}
                      onChange={(e) =>
                        setColLayout((prev) => ({
                          ...prev,
                          col1Collapsed: false,
                          col1Width: Number(e.target.value),
                        }))
                      }
                      className="flex-1 accent-[#152D42] cursor-pointer"
                    />
                    <code className="font-mono-code text-[11px] font-bold text-[#152D42] dark:text-amber-300 w-12 text-right">
                      {colLayout.col1Collapsed ? 'Ẩn' : `${colLayout.col1Width}px`}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        setColLayout((prev) => ({
                          ...prev,
                          col1Collapsed: !prev.col1Collapsed,
                        }))
                      }
                      className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-semibold cursor-pointer"
                    >
                      {colLayout.col1Collapsed ? 'Hiện' : 'Thu gọn'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-[#141413] p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                    <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">
                      Cột 2 (Danh mục):
                    </span>
                    <input
                      type="range"
                      min={260}
                      max={580}
                      step={5}
                      disabled={colLayout.col2Collapsed}
                      value={colLayout.col2Width}
                      onChange={(e) =>
                        setColLayout((prev) => ({
                          ...prev,
                          col2Collapsed: false,
                          col2Width: Number(e.target.value),
                        }))
                      }
                      className="flex-1 accent-[#152D42] cursor-pointer"
                    />
                    <code className="font-mono-code text-[11px] font-bold text-[#152D42] dark:text-amber-300 w-12 text-right">
                      {colLayout.col2Collapsed ? 'Ẩn' : `${colLayout.col2Width}px`}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        setColLayout((prev) => ({
                          ...prev,
                          col2Collapsed: !prev.col2Collapsed,
                        }))
                      }
                      className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-semibold cursor-pointer"
                    >
                      {colLayout.col2Collapsed ? 'Hiện' : 'Thu gọn'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white dark:bg-[#141413] p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                    <span className="text-[11px] text-stone-600 dark:text-stone-300">
                      Cột 3 (Trình đọc & MCP): <b className="font-mono-code text-[#152D42] dark:text-amber-300">minmax(0, 1fr)</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowColLayoutPanel(false)}
                      className="px-2 py-0.5 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-semibold cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reader Scroll Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 scroll-smooth">
              {showWelcomeHero || !inspectedDoc ? (
                /* WELCOME HUB (Merging VBPL Welcome + LegalFlow Smart Hub Screenshot 1 & 2) */
                <div className="max-w-3xl mx-auto py-4 space-y-8">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full border border-[#E9DFC8] bg-gradient-to-br from-[#FFFDF8] to-[#F7F1E4] dark:from-[#283D48] dark:to-[#1E2E38] flex items-center justify-center mx-auto text-[#B59745] text-3xl shadow-xs">
                      ⚖
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B29755]">
                      TRI THỨC PHÁP LUẬT · DẪN LỐI TƯƠNG LAI
                    </p>
                    <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#152D42] dark:text-stone-100 leading-tight">
                      Tra cứu pháp luật ĐẠI SƠN{' '}
                      <span className="italic text-[#B59745]">một cách thông minh</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
                      Hệ thống hóa văn bản quy phạm pháp luật, sơ đồ cây kiểm tra pháp lý, rà soát hợp đồng và đối soát chéo điều khoản trong một không gian thống nhất.
                    </p>
                  </div>

                  {/* Popular Keywords Strip (Screenshot 1 & 2) */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-xs text-stone-500">Từ khóa phổ biến:</span>
                    {POPULAR_SEARCH_KEYWORDS.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => {
                          setSearchQuery(kw);
                          setCatalogTab('results');
                          setShowWelcomeHero(false);
                        }}
                        className="px-3 py-1 rounded-full bg-[#FBF5DF] dark:bg-stone-800 border border-[#E5D5A7] dark:border-stone-700 text-xs font-medium text-[#152D42] dark:text-amber-300 hover:bg-[#f4e8be] cursor-pointer"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>

                  {/* 4 Quick Feature Cards from LegalFlow Screenshot 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      onClick={() => setShowWelcomeHero(false)}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] hover:border-[#C6A342] text-left flex items-center gap-3.5 transition cursor-pointer"
                    >
                      <span className="w-10 h-10 rounded-xl bg-[#FBF5DF] dark:bg-stone-800 text-[#B59745] flex items-center justify-center font-bold shrink-0">
                        <Search className="w-5 h-5" />
                      </span>
                      <div>
                        <strong className="block text-sm text-[#152D42] dark:text-stone-100">
                          01 · Tra cứu văn bản 3 cột
                        </strong>
                        <span className="text-xs text-stone-500">
                          Mục lục tự động, đánh dấu, ghi chú & đối soát chéo SSoT
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveView('compliance')}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] hover:border-[#C6A342] text-left flex items-center gap-3.5 transition cursor-pointer"
                    >
                      <span className="w-10 h-10 rounded-xl bg-[#FBF5DF] dark:bg-stone-800 text-[#B59745] flex items-center justify-center font-bold shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </span>
                      <div>
                        <strong className="block text-sm text-[#152D42] dark:text-stone-100">
                          02 · Kiểm tra pháp lý & Bản đồ cây
                        </strong>
                        <span className="text-xs text-stone-500">
                          Phân nhánh Đang hiệu lực / Đã hết hiệu lực & mức ưu tiên
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveView('contract')}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] hover:border-[#C6A342] text-left flex items-center gap-3.5 transition cursor-pointer"
                    >
                      <span className="w-10 h-10 rounded-xl bg-[#FBF5DF] dark:bg-stone-800 text-[#B59745] flex items-center justify-center font-bold shrink-0">
                        <FileCheck2 className="w-5 h-5" />
                      </span>
                      <div>
                        <strong className="block text-sm text-[#152D42] dark:text-stone-100">
                          03 · Soạn thảo & Rà soát hợp đồng
                        </strong>
                        <span className="text-xs text-stone-500">
                          Chỉ rõ vấn đề, căn cứ pháp lý và câu thay thế gợi ý
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setIsAquaOpen(true)}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] hover:border-[#C6A342] text-left flex items-center gap-3.5 transition cursor-pointer"
                    >
                      <span className="w-10 h-10 rounded-xl bg-[#FBF5DF] dark:bg-stone-800 text-[#B59745] flex items-center justify-center font-bold shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </span>
                      <div>
                        <strong className="block text-sm text-[#152D42] dark:text-stone-100">
                          04 · Trợ lý pháp lý AQUA
                        </strong>
                        <span className="text-xs text-stone-500">
                          Hỏi đáp nhanh điều khoản kèm trích dẫn nguồn nguyên văn
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Stats Bar from LegalFlow Screenshot 1 & 2 */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FBF9F5] dark:bg-[#1E1D1B] border border-stone-200 dark:border-[#2E2C28] text-center">
                    <div>
                      <strong className="text-xl font-bold text-[#152D42] dark:text-amber-300">
                        {VBPL_CATEGORY_GROUPS.length}
                      </strong>
                      <span className="block text-[11px] text-stone-500">
                        nhóm lĩnh vực chuyên ngành
                      </span>
                    </div>
                    <div>
                      <strong className="text-xl font-bold text-[#152D42] dark:text-amber-300">
                        {documents.length}
                      </strong>
                      <span className="block text-[11px] text-stone-500">
                        nguồn văn bản SSoT
                      </span>
                    </div>
                    <div>
                      <strong className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                        08/11/2026
                      </strong>
                      <span className="block text-[11px] text-stone-500">
                        đồng bộ & rà soát nguồn
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* DOCUMENT ARTICLE READER + AUTO-TOC + CROSS-CHECK + MCP + NOTES */
                <article
                  style={{ fontSize: `${readerSettings.fontSizePx || 16}px` }}
                  className={`${
                    readerViewFormat === 'continuous' ? 'max-w-6xl' : 'max-w-4xl'
                  } mx-auto space-y-6 leading-relaxed transition-all duration-200`}
                >
                  {/* Breadcrumb & Header Metadata */}
                  <div className="space-y-2 border-b border-stone-200 dark:border-[#2E2C28] pb-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      THƯ VIỆN ĐẠI SƠN &nbsp; / &nbsp; {inspectedDoc.field.toUpperCase()} &nbsp; / &nbsp;{' '}
                      {WBS_STAGE_LABELS[inspectedDoc.project_stage].toUpperCase()}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#152D42] text-[#E9C96D] text-xs font-bold uppercase">
                        {inspectedDoc.doc_type}
                      </span>
                      <span className="font-mono-code text-sm font-bold text-[#286181] dark:text-amber-400">
                        {inspectedDoc.doc_number}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          STATUS_META[inspectedDoc.status].badgeClass
                        }`}
                      >
                        {STATUS_META[inspectedDoc.status].label}
                      </span>

                      {(inspectedDoc.amended_count ??
                        inspectedDoc.amendment_history?.length ??
                        0) > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setGenealogyDrawerDocId(inspectedDoc.id)
                          }
                          className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold font-mono-code inline-flex items-center gap-1 cursor-pointer transition"
                          title="Nhấp để mở Biểu đồ Phả hệ văn bản dạng cây (D3 Tree)"
                        >
                          🧬 Đã qua{' '}
                          {inspectedDoc.amended_count ??
                            inspectedDoc.amendment_history?.length}{' '}
                          lần sửa đổi
                        </button>
                      )}

                      {inspectedDoc.is_amending_document && (
                        <button
                          type="button"
                          onClick={() =>
                            setGenealogyDrawerDocId(inspectedDoc.id)
                          }
                          className="px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 border border-purple-400 dark:border-purple-700 text-purple-900 dark:text-purple-200 text-xs font-bold font-mono-code cursor-pointer transition"
                          title="Nhấp để xem Biểu đồ Phả hệ văn bản (D3 Tree)"
                        >
                          SĐ · Văn bản sửa đổi, bổ sung
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setGenealogyDrawerDocId(inspectedDoc.id)}
                        className="px-2.5 py-0.5 rounded bg-[#152D42] hover:bg-[#1E3D58] text-[#E9C96D] border border-[#C6A342]/70 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="Trực quan hóa lịch sử các lần sửa đổi, bổ sung và phạm vi Điều/Khoản bằng Biểu đồ Phả hệ dạng cây (D3.js)"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Biểu đồ Phả hệ (D3 Tree)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setConsolidatedDrawerDocId(inspectedDoc.id)
                        }
                        className="px-2.5 py-0.5 rounded bg-teal-800 hover:bg-teal-700 text-white border border-teal-500/60 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="Tự động ghép các điều khoản sửa đổi và mở Bản Văn bản Hợp nhất (VBHN) kèm chế độ In A4 chuẩn Nghị định 30/2020/NĐ-CP"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-teal-200" />
                        <span>📑 Bản Hợp nhất (VBHN)</span>
                      </button>
                    </div>

                    <h1 className="font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 leading-snug pt-1">
                      {inspectedDoc.title}
                    </h1>

                    {/* HỘP THÔNG BÁO ĐỐI CHIẾU CSDL QUỐC GIA (Đầu Cột 3 - Dưới tiêu đề) */}
                    <div className="mt-2.5 p-3 rounded-xl bg-[#FBF5DF] dark:bg-[#231F16] border border-[#C6A342]/70 dark:border-amber-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                      <div className="flex items-center gap-2.5 text-xs text-[#152D42] dark:text-amber-200">
                        <span
                          className="w-7 h-7 rounded-lg bg-[#152D42] text-[#E9C96D] flex items-center justify-center text-sm shrink-0 shadow-2xs"
                          aria-hidden="true"
                        >
                          ⚖
                        </span>
                        <div>
                          <div className="font-bold text-[#152D42] dark:text-amber-300">
                            Đối chiếu với bản gốc trước khi dùng cho hồ sơ chính thức
                          </div>
                          <div className="text-[11px] text-stone-600 dark:text-stone-400">
                            Cơ sở dữ liệu quốc gia về văn bản pháp luật · Công báo Chính phủ nước CHXHCN Việt Nam
                          </div>
                        </div>
                      </div>

                      <a
                        href={
                          inspectedDoc.national_database_url ||
                          inspectedDoc.source_url ||
                          'https://vbpl.vn'
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#152D42] hover:bg-[#1E3D58] text-[#E9C96D] text-xs font-bold shrink-0 inline-flex items-center gap-1.5 transition shadow-2xs self-start sm:self-center"
                      >
                        <span>↗ Mở CSDL Quốc gia</span>
                      </a>
                    </div>

                    {/* DÒNG TÓM LƯỢC CẤU TRÚC VĂN BẢN: X Điều / Y Khoản/Điểm */}
                    {(() => {
                      const totalArticlesCount = inspectedDoc.articles.length;
                      const computedClausesAndPoints =
                        inspectedDoc.total_clauses_count ??
                        inspectedDoc.articles.reduce((sum, art) => {
                          const clauses =
                            art.clause_count ??
                            (
                              art.content.match(
                                /(?:^|\n)\s*\d+\.\s+/g
                              ) || []
                            ).length ??
                            1;
                          const points =
                            art.point_count ??
                            (
                              art.content.match(
                                /(?:^|\n)\s*[a-zđ]\)\s+/gi
                              ) || []
                            ).length;
                          return sum + Math.max(1, clauses) + points;
                        }, 0);

                      return (
                        <div className="pt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#152D42] dark:text-amber-300">
                          <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 font-mono-code">
                            Cấu trúc văn bản: {totalArticlesCount} Điều / {computedClausesAndPoints} Khoản/Điểm
                          </span>
                          {inspectedDoc.compliance_stats?.total_sections &&
                            inspectedDoc.compliance_stats.total_sections >
                              totalArticlesCount && (
                              <span className="text-[11px] font-normal text-stone-500 dark:text-stone-400">
                                (Quy mô toàn văn công báo:{' '}
                                <b className="font-mono-code text-stone-700 dark:text-stone-300">
                                  {inspectedDoc.compliance_stats.total_sections} Điều
                                </b>
                                )
                              </span>
                            )}
                        </div>
                      );
                    })()}

                    <div className="flex flex-wrap gap-4 text-xs text-stone-500 dark:text-stone-400 pt-1">
                      <span>
                        Cơ quan ban hành: <b className="text-stone-800 dark:text-stone-200">{inspectedDoc.issuing_body}</b>
                      </span>
                      <span>
                        Người ký: <b className="text-stone-800 dark:text-stone-200">{inspectedDoc.signer}</b>
                      </span>
                      <span>
                        Ban hành: <b className="font-mono-code">{inspectedDoc.issue_date}</b>
                      </span>
                      <span>
                        Hiệu lực: <b className="font-mono-code">{inspectedDoc.effective_date}</b>
                      </span>
                      {inspectedDoc.expiration_date && (
                        <span className="text-red-600 font-semibold">
                          Hết hiệu lực: {inspectedDoc.expiration_date}
                        </span>
                      )}
                      {inspectedDoc.source_url && (
                        <a
                          href={inspectedDoc.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#286181] dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Nguồn công báo gốc</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* KHỐI TÓM LƯỢC PHẢ HỆ SỬA ĐỔI VĂN BẢN ("🧬 Đã qua X lần sửa đổi" kèm danh sách xếp theo thời gian) */}
                    {((inspectedDoc.amended_count ?? 0) > 0 ||
                      (inspectedDoc.amendment_history &&
                        inspectedDoc.amendment_history.length > 0)) && (
                      <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]/60 dark:from-[#262013] dark:to-[#1F1A10] border border-amber-300 dark:border-amber-700/80 space-y-3 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#152D42] text-[#E9C96D] text-xs font-bold font-mono-code">
                              🧬 Đã qua{' '}
                              {inspectedDoc.amended_count ??
                                inspectedDoc.amendment_history?.length ??
                                0}{' '}
                              lần sửa đổi
                            </span>
                            <span className="text-xs font-semibold text-amber-950 dark:text-amber-200">
                              Phả hệ sửa đổi, bổ sung văn bản theo trình tự thời gian
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setConsolidatedDrawerDocId(inspectedDoc.id)
                              }
                              className="px-3 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-white border border-teal-500/70 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-teal-200" />
                              <span>📑 Tự động ghép & Xem Bản Hợp nhất (VBHN)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setGenealogyDrawerDocId(inspectedDoc.id)
                              }
                              className="px-3 py-1 rounded-lg bg-[#152D42] hover:bg-[#1E3D58] text-[#E9C96D] border border-[#C6A342] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                            >
                              <GitBranch className="w-3.5 h-3.5" />
                              <span>🌳 Mở Biểu đồ Phả hệ dạng cây (D3)</span>
                            </button>
                          </div>
                        </div>

                        {inspectedDoc.amendment_history &&
                          inspectedDoc.amendment_history.length > 0 && (
                            <div className="space-y-2">
                              {[...inspectedDoc.amendment_history]
                                .sort((a, b) =>
                                  a.promulgation_date.localeCompare(
                                    b.promulgation_date
                                  )
                                )
                                .map((item, idx) => {
                                  const targetAmendingDoc = docMap.get(
                                    item.amending_doc_id
                                  );
                                  const actionLabel =
                                    item.action_type === 'SUA_DOI_BO_SUNG'
                                      ? 'Sửa đổi, bổ sung'
                                      : item.action_type === 'BAI_BO_MOT_PHAN'
                                      ? 'Bãi bỏ một phần'
                                      : item.action_type === 'THAY_THE'
                                      ? 'Thay thế'
                                      : 'Đính chính';

                                  return (
                                    <div
                                      key={`${item.amending_doc_id}-${idx}`}
                                      className="p-3 rounded-xl bg-white/90 dark:bg-[#181715]/90 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                    >
                                      <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 text-[10px] font-bold font-mono-code">
                                            Lần {idx + 1} · {item.promulgation_date}
                                          </span>
                                          <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[10px] font-bold uppercase">
                                            {actionLabel}
                                          </span>
                                          {item.amending_doc_number && (
                                            <span className="font-mono-code text-xs font-bold text-[#152D42] dark:text-amber-300">
                                              [{item.amending_doc_number}]
                                            </span>
                                          )}
                                        </div>

                                        <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                                          {item.amending_doc_title}
                                        </div>

                                        {item.summary && (
                                          <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                                            {item.summary}
                                          </p>
                                        )}

                                        {/* Danh sách phạm vi Điều khoản bị tác động (scopes) */}
                                        {item.scopes && item.scopes.length > 0 && (
                                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                            <span className="text-[10px] font-semibold text-stone-500">
                                              Phạm vi tác động:
                                            </span>
                                            {item.scopes.map((scope) => {
                                              const matchedArt =
                                                inspectedArticleByNoMap.get(
                                                  scope.trim().toLowerCase()
                                                );
                                              return (
                                                <button
                                                  key={scope}
                                                  type="button"
                                                  onClick={() => {
                                                    if (matchedArt) {
                                                      handleSelectArticleInReader(
                                                        matchedArt.id,
                                                        true
                                                      );
                                                    }
                                                  }}
                                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono-code font-semibold border ${
                                                    matchedArt
                                                      ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-400 text-amber-950 dark:text-amber-200 hover:bg-amber-200 cursor-pointer underline underline-offset-2'
                                                      : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                                                  }`}
                                                  title={
                                                    matchedArt
                                                      ? `Cuộn đến ${matchedArt.article_no}: ${matchedArt.article_title}`
                                                      : scope
                                                  }
                                                >
                                                  {scope}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>

                                      {targetAmendingDoc && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSelectDocInGrid(
                                              targetAmendingDoc
                                            )
                                          }
                                          className="px-2.5 py-1.5 rounded-lg bg-[#152D42] hover:bg-[#1E3D58] text-[#E9C96D] text-xs font-semibold shrink-0 inline-flex items-center gap-1 cursor-pointer self-start sm:self-center"
                                        >
                                          <span>
                                            Mở{' '}
                                            {item.amending_doc_number ||
                                              targetAmendingDoc.doc_number}
                                          </span>
                                          <ArrowUpRight className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                      </div>
                    )}

                    {/* Nếu đang xem một Văn bản sửa đổi (SĐ), hiển thị liên kết ngược về Văn bản gốc */}
                    {inspectedDoc.is_amending_document &&
                      inspectedDoc.amends_doc_ids &&
                      inspectedDoc.amends_doc_ids.length > 0 && (
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200 flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <strong>Văn bản sửa đổi, bổ sung (SĐ):</strong> Văn bản này sửa đổi, bổ sung trực tiếp các điều khoản của văn bản gốc trong kho SSoT.
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {inspectedDoc.amends_doc_ids.map((origId) => {
                              const origDoc = docMap.get(origId);
                              if (!origDoc) return null;
                              return (
                                <button
                                  key={origId}
                                  type="button"
                                  onClick={() => handleSelectDocInGrid(origDoc)}
                                  className="px-2.5 py-1 rounded bg-[#152D42] text-[#E9C96D] font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span>
                                    Mở văn bản gốc {origDoc.doc_number} (🧬{' '}
                                    {origDoc.amended_count ??
                                      origDoc.amendment_history?.length ??
                                      1}
                                    )
                                  </span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* Thanh công cụ Đọc Trọn Vẹn Toàn Văn (View Mode Toggle: "📋 Thẻ Điều khoản" & "📄 Toàn văn A4 liên tục") */}
                    <div className="p-3 rounded-xl bg-[#FBF5DF]/80 dark:bg-stone-900 border border-[#C6A342]/60 flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-[#152D42] dark:text-amber-300 mr-1">
                          Chế độ xem (View Mode):
                        </span>
                        <button
                          type="button"
                          onClick={() => setReaderViewFormat('cards')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            readerViewFormat === 'cards'
                              ? 'bg-[#152D42] text-[#E9C96D] border-[#C6A342] shadow-2xs'
                              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-[#C6A342]'
                          }`}
                        >
                          📋 Thẻ Điều khoản ({inspectedDoc.articles.length} Điều)
                        </button>
                        <button
                          type="button"
                          onClick={() => setReaderViewFormat('continuous')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            readerViewFormat === 'continuous'
                              ? 'bg-[#152D42] text-[#E9C96D] border-[#C6A342] shadow-2xs'
                              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-[#C6A342]'
                          }`}
                        >
                          📄 Toàn văn A4 liên tục
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-[#C6A342]" />
                          <span className="font-bold text-[#152D42] dark:text-amber-300">
                            Thời điểm hiệu lực:
                          </span>
                          <input
                            type="date"
                            value={readerAsOfDate}
                            onChange={(e) => setReaderAsOfDate(e.target.value)}
                            className="bg-transparent font-mono-code font-bold text-[#152D42] dark:text-stone-100 focus:outline-none cursor-pointer"
                            title="Chọn ngày sự kiện pháp lý (Point-in-Time Reference Date) để tự động đối chiếu hiệu lực văn bản và hiển thị phiên bản điều khoản tương ứng"
                          />
                          {readerAsOfDate && (
                            <button
                              type="button"
                              onClick={() => setReaderAsOfDate('')}
                              className="text-[10px] text-stone-400 hover:text-red-600 font-bold cursor-pointer"
                              title="Xóa mốc thời gian để xem trạng thái hiện hành"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setReasoningDrawerState({
                              doc: inspectedDoc,
                              article:
                                inspectedArticle ||
                                inspectedDoc.articles[0] ||
                                null,
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500/70 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                          title="Mở Drawer Suy luận Pháp lý 6 Bước (IRAC+) & Xuất Báo cáo bằng chứng có kiểm chứng SHA-256"
                        >
                          <Scale className="w-3.5 h-3.5 text-emerald-200" />
                          <span>⚖ Suy luận IRAC+ (6 bước)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConsolidatedDrawerDocId(inspectedDoc.id)
                          }
                          className="px-3 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-white border border-teal-500/70 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                          title="Mở Drawer Bản Văn bản Hợp nhất (VBHN) & Xuất Bản in A4 chuẩn Nghị định 30/2020/NĐ-CP kèm Mục lục Phả hệ"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-teal-200" />
                          <span>📑 Bản Hợp nhất (VBHN)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setGenealogyDrawerDocId(inspectedDoc.id)
                          }
                          className="px-3 py-1 rounded-lg bg-[#FBF5DF] dark:bg-amber-950/60 hover:bg-amber-200/80 dark:hover:bg-amber-900 border border-[#C6A342] text-[#152D42] dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                          title="Mở Drawer Biểu đồ Phả hệ văn bản dạng cây (D3.js) để trực quan hóa lịch sử các lần sửa đổi, bổ sung"
                        >
                          <GitBranch className="w-3.5 h-3.5 text-[#152D42] dark:text-amber-300" />
                          <span>🧬 Biểu đồ Phả hệ (D3)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMapCenterDocId(inspectedDoc.id);
                            setComplianceInitialSubMode('side_by_side');
                            setActiveView('compliance');
                          }}
                          className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-400 dark:border-amber-700 text-[#152D42] dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                          title="Mở màn hình So sánh song song (Side-by-Side Comparison) giữa các phiên bản của văn bản này hoặc với văn bản liên quan"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          <span>⇄ So sánh song song</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExpandFullDocumentWithAi(inspectedDoc)}
                          disabled={isExpandingFullDoc}
                          className="px-3 py-1 rounded-lg bg-[#152D42] hover:bg-[#1E3D58] text-[#E9C96D] text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                          title="Tự động tải & bổ sung trọn vẹn các Chương, Điều còn lại của văn bản này bằng AI Pháp điển hóa"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {isExpandingFullDoc
                              ? 'Đang tải đầy đủ các Chương/Điều...'
                              : '✨ Tải trọn vẹn toàn bộ Chương/Điều (AI)'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setReadingDocState({
                              docId: inspectedDoc.id,
                              articleId: inspectedArticle?.id,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#C6A342] text-[#152D42] text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Đọc toàn màn hình</span>
                        </button>
                      </div>
                    </div>

                    {inspectedDoc.replaced_by_label && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                        <span>
                          <strong>Văn bản đã hết hiệu lực:</strong> Nội dung hiện nay được thay thế bởi{' '}
                          <b>{inspectedDoc.replaced_by_label}</b>.
                        </span>
                        {inspectedDoc.replaced_by_doc_id && (
                          <button
                            onClick={() => {
                              const target = docMap.get(inspectedDoc.replaced_by_doc_id!);
                              if (target) handleSelectDocInGrid(target);
                            }}
                            className="px-2.5 py-1 rounded bg-[#152D42] text-white font-semibold shrink-0 cursor-pointer"
                          >
                            Mở văn bản thay thế →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AUTO-GENERATED TABLE OF CONTENTS (Hiển thị ở chế độ Thẻ Điều khoản; ở chế độ Toàn văn A4 liên tục đã có Sticky Floating TOC 280px bên trái) */}
                  {readerViewFormat === 'cards' && (
                    <div
                      ref={tocSectionRef}
                      className="p-4 rounded-xl bg-[#F7F9FA] dark:bg-[#1E1D1B] border border-stone-200 dark:border-[#2E2C28] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-xs uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
                          <ListTree className="w-4 h-4 text-[#C6A342]" />
                          <span>☷ &nbsp; MỤC LỤC ĐIỀU KHOẢN ({inspectedDoc.articles.length} Mục)</span>
                        </strong>
                        <span className="text-[11px] text-stone-400">
                          Nhấp vào điều khoản để di chuyển & đối soát chéo
                        </span>
                      </div>

                      <div className="divide-y divide-stone-200/70 dark:divide-stone-800 max-h-60 overflow-y-auto">
                        {inspectedDoc.articles.map((art) => {
                          const isCurrent = inspectedArticle?.id === art.id;
                          const clauseCount =
                            art.clause_count ??
                            Math.max(
                              1,
                              (art.content.match(/(?:^|\n)\s*\d+\.\s+/g) || [])
                                .length
                            );
                          return (
                            <button
                              key={art.id}
                              onClick={() => {
                                setSelectedArticleId(art.id);
                                const el = document.getElementById(`sec-art-${art.id}`);
                                el?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className={`w-full py-2 px-2 text-left text-xs sm:text-sm flex items-center justify-between gap-2 hover:bg-[#FBF5DF]/60 dark:hover:bg-stone-800 rounded transition cursor-pointer ${
                                isCurrent
                                  ? 'font-bold text-[#152D42] dark:text-amber-300 bg-[#FBF5DF]/80 dark:bg-stone-800/80'
                                  : 'text-[#286181] dark:text-stone-300'
                              }`}
                            >
                              <span className="truncate flex items-center gap-1.5 min-w-0">
                                <span className="font-mono-code shrink-0">
                                  {art.article_no}.
                                </span>
                                <span className="truncate">{art.article_title}</span>
                                {art.is_amended && (
                                  <span
                                    className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 border border-amber-400 text-amber-900 dark:text-amber-200 text-[10px] font-bold shrink-0 inline-flex items-center gap-1"
                                    title={
                                      art.amendment_info?.amending_doc_number
                                        ? `Đã sửa đổi bởi ${art.amendment_info.amending_doc_number}`
                                        : 'Điều khoản đã qua sửa đổi, bổ sung'
                                    }
                                  >
                                    <span>⚠</span>
                                    <span className="hidden sm:inline">
                                      Đã sửa đổi bởi{' '}
                                      {art.amendment_info?.amending_doc_number ||
                                        'VB SĐ'}
                                    </span>
                                  </span>
                                )}
                              </span>
                              <span className="flex items-center gap-2 shrink-0">
                                <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono-code text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                                  [{clauseCount}] khoản
                                </span>
                                <span className="text-[10px] text-stone-400 hidden md:inline">
                                  {art.chapter_no}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* BANNER HIỆU LỰC THEO THỜI ĐIỂM (POINT-IN-TIME RESOLUTION BANNER) */}
                  {readerAsOfDate &&
                    (() => {
                      const pitRes = resolveDocumentAtDate(
                        inspectedDoc,
                        readerAsOfDate,
                        documents
                      );
                      return (
                        <div
                          className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                            pitRes.is_applicable_at_date
                              ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                              : 'bg-amber-50/95 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-200'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                Đối chiếu hiệu lực thời điểm (Point-in-Time:{' '}
                                {readerAsOfDate}) — Trạng thái:{' '}
                                <span className="font-mono-code underline">
                                  {pitRes.temporal_status}
                                </span>
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              {pitRes.explanation}
                            </p>
                          </div>
                          {pitRes.recommended_doc_id &&
                            pitRes.recommended_doc_id !== inspectedDoc.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  const target = docMap.get(
                                    pitRes.recommended_doc_id!
                                  );
                                  if (target) handleSelectDocInGrid(target);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#152D42] text-[#E9C96D] font-bold text-[11px] cursor-pointer shrink-0"
                              >
                                Mở VB có hiệu lực tại ngày {readerAsOfDate} (
                                {pitRes.recommended_doc_number}) →
                              </button>
                            )}
                        </div>
                      );
                    })()}

                  {/* ARTICLES CONTENT STREAM: CONTINUOUS A4 VIEW (WITH STICKY FLOATING TOC) OR CLAUSE CARDS */}
                  {readerViewFormat === 'continuous' ? (
                    <div ref={tocSectionRef}>
                      <ContinuousA4Reader
                        document={inspectedDoc}
                        activeArticleId={inspectedArticle?.id || null}
                        fontSizePx={readerSettings.fontSizePx || 16}
                        articleByNoMap={inspectedArticleByNoMap}
                        asOfDate={readerAsOfDate || undefined}
                        onSelectArticle={handleSelectArticleInReader}
                        onOpenCrossLawDrawer={(targetArt) =>
                          setCrossLawDrawerState({
                            doc: inspectedDoc,
                            article: targetArt,
                          })
                        }
                        onOpenAmendingDoc={(amendingDocId) => {
                          const targetDoc = docMap.get(amendingDocId);
                          if (targetDoc) {
                            handleSelectDocInGrid(targetDoc);
                          }
                        }}
                        onAskAqua={handleAskAquaWithContext}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {inspectedDoc.articles.map((art) => (
                        <ReaderArticleSection
                          key={art.id}
                          art={art}
                          docNumber={inspectedDoc.doc_number}
                          isFocused={inspectedArticle?.id === art.id}
                          articleByNoMap={inspectedArticleByNoMap}
                          asOfDate={readerAsOfDate || undefined}
                          onSelectArticle={handleSelectArticleInReader}
                          onAskAqua={handleAskAquaWithContext}
                          onOpenCrossLawDrawer={(targetArt) =>
                            setCrossLawDrawerState({
                              doc: inspectedDoc,
                              article: targetArt,
                            })
                          }
                          onOpenReasoningDrawer={(targetArt) =>
                            setReasoningDrawerState({
                              doc: inspectedDoc,
                              article: targetArt,
                            })
                          }
                          onOpenAmendingDoc={(amendingDocId) => {
                            const targetDoc = docMap.get(amendingDocId);
                            if (targetDoc) {
                              handleSelectDocInGrid(targetDoc);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* ĐỐI SOÁT CHÉO LIÊN NGÀNH (SSoT CROSS-REFERENCES) */}
                  <div className="pt-4 border-t border-stone-200 dark:border-[#2E2C28] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#B45309] dark:text-amber-400 flex items-center gap-1.5">
                        <GitCompare className="w-4 h-4" />
                        <span>
                          🔗 Đối Soát Chéo Liên Ngành (Cross-References · {inspectedCrossRefs.length})
                        </span>
                      </h3>
                      <button
                        onClick={() => {
                          setMapCenterDocId(inspectedDoc.id);
                          setActiveView('compliance');
                        }}
                        className="text-xs font-semibold text-[#286181] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Network className="w-3.5 h-3.5" />
                        <span>Mở Bản đồ Pháp lý</span>
                      </button>
                    </div>

                    {inspectedCrossRefs.length === 0 ? (
                      <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#1E1D1B] border border-stone-200 dark:border-[#2E2C28] text-xs text-stone-500">
                        Chưa có liên kết đối soát chéo cho văn bản này. Bạn có thể tạo liên kết mới qua nút <b>+ Nạp văn bản</b>.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {inspectedCrossRefs.map((xref) => {
                          const relMeta = RELATION_META[xref.relation_type];
                          const isSource = xref.source_doc_id === inspectedDoc.id;
                          const counterpartDocId = isSource
                            ? xref.target_doc_id
                            : xref.source_doc_id;
                          const counterpartArticleId = isSource
                            ? xref.target_article_id
                            : xref.source_article_id;
                          const counterpartDoc = docMap.get(counterpartDocId);

                          return (
                            <div
                              key={xref.id}
                              onClick={() => {
                                if (counterpartDoc) {
                                  handleSelectDocInGrid(
                                    counterpartDoc,
                                    counterpartArticleId
                                  );
                                }
                              }}
                              className={`p-3.5 rounded-xl border text-xs transition cursor-pointer ${relMeta.boxClass}`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-bold flex items-center gap-1">
                                  <span>{xref.title}</span>
                                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                </span>
                              </div>
                              <p className="opacity-90 leading-relaxed">
                                {xref.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* TRỢ LÝ AI PHÁP CHẾ (MCP ENGINE) */}
                  <div className="p-4 rounded-2xl bg-[#152D42] text-[#FBF9F5] space-y-3 shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#E9C96D] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>🤖 Trợ Lý Kiểm Toán Pháp Chế ĐẠI SƠN (MCP Engine)</span>
                      </h4>
                      <button
                        onClick={() => handleRunMcpAudit()}
                        disabled={isMcpLoading}
                        className="px-3 py-1 rounded-lg bg-[#C6A342] text-[#152D42] text-[11px] font-bold hover:bg-[#d8b655] transition cursor-pointer disabled:opacity-50"
                      >
                        {isMcpLoading ? 'Đang phân tích...' : 'Phân tích chuyên sâu'}
                      </button>
                    </div>

                    <div className="text-xs text-stone-200 whitespace-pre-line leading-relaxed bg-black/20 p-3 rounded-xl border border-white/10">
                      <strong className="text-[#E9C96D]">Gợi ý kiểm toán:</strong>{' '}
                      {activeMcpText}
                    </div>

                    <form onSubmit={handleRunMcpAudit} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={mcpCustomPrompt}
                        onChange={(e) => setMcpCustomPrompt(e.target.value)}
                        placeholder="Đặt câu hỏi kiểm toán cho điều khoản này..."
                        className="flex-1 bg-white/10 text-xs px-3 py-2 rounded-lg border border-white/20 text-white placeholder:text-stone-400 focus:outline-none focus:border-[#E9C96D]"
                      />
                      <button
                        type="submit"
                        disabled={isMcpLoading}
                        className="px-3 py-2 rounded-lg bg-[#C6A342] text-[#152D42] font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Hỏi MCP</span>
                      </button>
                    </form>
                  </div>

                  {/* GLOBAL AUDIT SUMMARY (CONSOLIDATED SESSION MCP RISK CHECKLIST) */}
                  <GlobalAuditSummaryPanel
                    auditRecords={mcpAuditRecords}
                    currentDocNumber={inspectedDoc.doc_number}
                    currentArticleNo={inspectedArticle?.article_no}
                    documents={documents}
                    isMcpLoading={isMcpLoading}
                    onToggleChecklistItem={handleToggleMcpChecklistItem}
                    onMarkAllChecklistItems={handleMarkAllMcpChecklistItems}
                    onRemoveAuditRecord={handleRemoveMcpAuditRecord}
                    onClearAllAuditRecords={handleClearAllMcpAuditRecords}
                    onNavigateToClause={handleNavigateToClause}
                    onRunAuditOnCurrentClause={() => handleRunMcpAudit()}
                    onAskAquaWithContext={handleAskAquaWithContext}
                  />

                  {/* PERSONAL ANNOTATION BOX (✎ Ghi chú của bạn from VBPL HTML) */}
                  <div className="p-4 rounded-2xl bg-[#F7F9FA] dark:bg-[#1E1D1B] border border-stone-200 dark:border-[#2E2C28] space-y-2.5">
                    <label className="block text-xs font-bold text-[#152D42] dark:text-amber-300">
                      ✎ &nbsp; Ghi chú cá nhân của bạn cho văn bản {inspectedDoc.doc_number}
                    </label>
                    <textarea
                      value={docPersonalNoteInput}
                      onChange={(e) => setDocPersonalNoteInput(e.target.value)}
                      rows={3}
                      placeholder="Ghi lại nội dung cần đối chiếu, hồ sơ cần bổ sung hoặc vấn đề cần theo dõi..."
                      className="w-full p-3 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141413]"
                    />
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Ghi chú được lưu riêng trong trình duyệt hiện tại và xuất kèm khi sao lưu JSON/HTML.</span>
                      <button
                        onClick={handleSaveDocNoteInline}
                        className="px-3.5 py-1.5 rounded-lg bg-[#152D42] text-white text-xs font-semibold hover:bg-[#213E57] cursor-pointer"
                      >
                        Lưu ghi chú
                      </button>
                    </div>
                  </div>
                </article>
              )}
            </div>

            {/* Reader Bottom Status Bar matching VBPL HTML */}
            <div className="px-5 py-2 border-t border-stone-200 dark:border-[#2E2C28] bg-[#F7F9FA] dark:bg-[#1E1D1B] flex items-center justify-between text-[11px] text-stone-500 shrink-0">
              <span>
                {inspectedDoc
                  ? `${inspectedDoc.field} · ${inspectedDoc.articles.length} điều khoản SSoT`
                  : 'Sẵn sàng tra cứu'}
              </span>
              <span className="hidden sm:inline">
                <b>Ctrl K</b> tìm kiếm &nbsp; · &nbsp; <b>M</b> mục lục &nbsp; · &nbsp; <b>D</b> đánh dấu
              </span>
            </div>
          </main>
        </div>
      ) : activeView === 'reasoning_case' ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-10">
          <LegalReasoningAndCaseView
            documents={documents}
            onOpenDocumentInReader={(docId, articleNo) => {
              const targetDoc = docMap.get(docId);
              if (targetDoc) {
                const matchedArt = articleNo
                  ? targetDoc.articles.find(
                      (a) =>
                        a.article_no.trim().toLowerCase() ===
                        articleNo.trim().toLowerCase()
                    )
                  : targetDoc.articles[0];
                handleSelectDocInGrid(targetDoc, matchedArt?.id);
                setActiveView('library');
                setShowWelcomeHero(false);
              }
            }}
          />
        </div>
      ) : activeView === 'stage_gate' ? (
        <StageGateAuditView
          documents={documents}
          mcpAuditRecords={mcpAuditRecords}
          onOpenInThreeColumnLibrary={(docId, articleId) => {
            const targetDoc = docMap.get(docId);
            if (targetDoc) {
              handleSelectDocInGrid(targetDoc, articleId);
            }
            setActiveView('library');
            setShowWelcomeHero(false);
          }}
          onOpenReaderModal={(docId, articleId) =>
            setReadingDocState({ docId, articleId })
          }
          onAskAquaWithContext={handleAskAquaWithContext}
          onSyncAuditToGlobalSummary={(step, summaryText) => {
            const firstRef = step.legal_references[0];
            const targetDoc =
              (firstRef?.docId ? docMap.get(firstRef.docId) : undefined) ||
              documents[0];
            if (targetDoc) {
              const targetArt =
                (firstRef?.articleId
                  ? globalArticleByDocAndIdMap.get(
                      `${targetDoc.id}:${firstRef.articleId}`
                    )
                  : undefined) || targetDoc.articles[0];
              if (targetArt) {
                upsertMcpSessionAuditRecord(
                  targetDoc,
                  targetArt,
                  summaryText,
                  `[Stage-Gate ${step.gate_code} · Bước ${step.step_code}] ${step.step_name}`
                );
              }
            }
            handleLogAction(
              'Kiểm toán Stage-Gate Multi-Agent',
              `${step.gate_code} · Bước ${step.step_code} (${firstRef?.docNumber || step.dossier_group})`
            );
          }}
        />
      ) : activeView === 'compliance' ? (
        <LegalComplianceCheckView
          documents={documents}
          crossReferences={crossReferences}
          centerDocId={mapCenterDocId}
          initialSubMode={complianceInitialSubMode}
          onSelectCenterDoc={(docId) => setMapCenterDocId(docId)}
          selectedCrossRef={selectedCrossRef}
          onSelectCrossRef={(xref) => setSelectedCrossRef(xref)}
          onOpenReader={(docId, articleId) =>
            setReadingDocState({ docId, articleId })
          }
          onAskAquaWithContext={handleAskAquaWithContext}
        />
      ) : activeView === 'contract' ? (
        <ContractReviewView
          onOpenReader={(docId, articleId) =>
            setReadingDocState({ docId, articleId })
          }
          onAskAquaWithContext={handleAskAquaWithContext}
          onLogAction={(action, detail) => handleLogAction(action, detail)}
        />
      ) : activeView === 'cabinet' ? (
        <div className="flex-1 overflow-y-auto pb-20 md:pb-8">
          <PersonalCabinetView
            documents={documents}
            crossReferences={crossReferences}
            savedDocs={savedDocs}
            savedClauses={savedClauses}
            offlineDocIds={offlineDocIds}
            folders={folders}
            onAddFolder={(folderName: string) => {
              if (!folders.includes(folderName)) {
                setFolders((prev) => [...prev, folderName]);
              }
            }}
            onUpdateSavedDocFolder={(
              docId: string,
              folder: string,
              personalNote: string
            ) =>
              setSavedDocs((prev) =>
                prev.map((d) =>
                  d.docId === docId ? { ...d, personalNote, folder } : d
                )
              )
            }
            onRemoveSavedDoc={(docId: string) =>
              setSavedDocs((prev) => prev.filter((d) => d.docId !== docId))
            }
            onRemoveSavedClause={handleRemoveClauseNote}
            onToggleOfflineDoc={handleToggleOfflineDoc}
            onCacheAllDocsOffline={handleCacheAllDocsOffline}
            onOpenReader={(docId: string, articleId?: string) =>
              setReadingDocState({ docId, articleId })
            }
            onOpenLegalMap={(docId: string) => {
              setMapCenterDocId(docId);
              setActiveView('compliance');
            }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-20 md:pb-8">
          <DailyDigestAndNotifications
            alerts={alerts}
            documents={documents}
            preferences={notifPrefs}
            onUpdatePreferences={(prefs: Partial<NotificationPreferences>) =>
              setNotifPrefs((prev) => ({ ...prev, ...prefs }))
            }
            onMarkAlertRead={(alertId: string) =>
              setAlerts((prev) =>
                prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
              )
            }
            onMarkAllAlertsRead={() =>
              setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))
            }
            onTriggerTestPush={handleTriggerDailyPush}
            onOpenReader={(docId: string) => setReadingDocState({ docId })}
            onOpenLegalMap={(docId: string) => {
              setMapCenterDocId(docId);
              setActiveView('compliance');
            }}
          />
        </div>
      )}

      {/* Mobile 3-Pane Switcher when in Library View on screens < 1024px */}
      {activeView === 'library' && (
        <nav className="lg:hidden flex h-10 bg-white dark:bg-[#1E1D1B] border-t border-stone-200 dark:border-[#2E2C28] shrink-0">
          <button
            onClick={() => setMobilePane('fields')}
            className={`flex-1 text-xs font-semibold ${
              mobilePane === 'fields'
                ? 'bg-[#FBF5DF] text-[#9B7D27]'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            ▤ Lĩnh vực
          </button>
          <button
            onClick={() => setMobilePane('list')}
            className={`flex-1 text-xs font-semibold ${
              mobilePane === 'list'
                ? 'bg-[#FBF5DF] text-[#9B7D27]'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            ▱ Danh mục ({filteredDocuments.length})
          </button>
          <button
            onClick={() => setMobilePane('reader')}
            className={`flex-1 text-xs font-semibold ${
              mobilePane === 'reader'
                ? 'bg-[#FBF5DF] text-[#9B7D27]'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            ▧ Nội dung
          </button>
        </nav>
      )}

      {/* Bottom Footer Status Bar */}
      <footer className="h-6 px-4 bg-[#F7F9FA] dark:bg-[#1A1917] border-t border-stone-200 dark:border-[#2E2C28] flex items-center justify-between text-[10px] text-stone-500 shrink-0">
        <span>
          HỆ SINH THÁI PHÁP LÝ ĐẠI SƠN &nbsp; / &nbsp; Hợp nhất SSoT · VBPL · LegalFlow
        </span>
        <span>
          Dữ liệu lưu cục bộ & PWA ngoại tuyến · Đã ghi nhận {auditLogs.length} thao tác kiểm toán
        </span>
      </footer>

      {/* Floating Trợ lý AQUA Drawer */}
      <AquaAssistantDrawer
        isOpen={isAquaOpen}
        onToggleOpen={setIsAquaOpen}
        initialQuestion={aquaPromptContext.question}
        initialClauseContext={aquaPromptContext.clauseContext}
        documents={documents}
        onOpenReader={(docId, articleId) =>
          setReadingDocState({ docId, articleId })
        }
      />

      {/* Full-Screen Reader Modal */}
      {activeReadingDocument && (
        <LegalReaderModal
          document={activeReadingDocument}
          initialArticleId={readingDocState?.articleId}
          allDocuments={documents}
          crossReferences={crossReferences}
          isSavedDoc={bookmarkedDocIdSet.has(activeReadingDocument.id)}
          isOfflineCached={offlineDocIdSet.has(activeReadingDocument.id)}
          savedClauses={savedClauses}
          readerSettings={readerSettings}
          onUpdateReaderSettings={(settings: Partial<ReaderSettings>) =>
            setReaderSettings((prev) => ({ ...prev, ...settings }))
          }
          onToggleSaveDoc={handleToggleSaveDoc}
          onToggleOfflineDoc={handleToggleOfflineDoc}
          onSaveClauseNote={handleSaveClauseNote}
          onRemoveClauseNote={handleRemoveClauseNote}
          onOpenCrossCheck={(xref) => {
            setReadingDocState(null);
            setMapCenterDocId(xref.source_doc_id);
            setSelectedCrossRef(xref);
            setActiveView('compliance');
          }}
          onOpenLegalMap={(docId: string) => {
            setReadingDocState(null);
            setMapCenterDocId(docId);
            setActiveView('compliance');
          }}
          onSelectDocument={(docId, articleId) =>
            setReadingDocState({ docId, articleId })
          }
          onClose={() => setReadingDocState(null)}
        />
      )}

      {/* Create / Auto-Parse Document Modal (TXT / MD / HTML + Raw Text) */}
      {showCreateDocModal && (
        <CreateDocumentModal
          existingDocuments={documents}
          onSaveNewDocument={handleSaveNewDocument}
          onClose={() => setShowCreateDocModal(false)}
        />
      )}

      {/* Backup JSON/HTML, Stats & Help Modal */}
      <BackupAndStatsModal
        mode={backupStatsModalMode}
        onClose={() => setBackupStatsModalMode(null)}
        documents={documents}
        crossReferences={crossReferences}
        savedDocs={savedDocs}
        savedClauses={savedClauses}
        logs={auditLogs}
        onImportBackupData={handleImportBackupData}
        onOpenGuideDoc={() => {
          const guideDoc = docMap.get('huong-dan');
          if (guideDoc) {
            handleSelectDocInGrid(guideDoc);
            setActiveView('library');
          }
        }}
        onLogAction={(action, detail) => handleLogAction(action, detail)}
      />

      {/* Prompt Engine AI Cross-Law Matrix Drawer ("⚡ Đối soát chéo liên luật") */}
      <CrossLawAiDrawer
        isOpen={Boolean(crossLawDrawerState)}
        onClose={() => setCrossLawDrawerState(null)}
        sourceDoc={crossLawDrawerState?.doc || null}
        sourceArticle={crossLawDrawerState?.article || null}
        allDocuments={documents}
        crossReferences={crossReferences}
        onNavigateToDoc={(targetDoc, articleId) => {
          handleSelectDocInGrid(targetDoc, articleId);
          setActiveView('library');
        }}
        onSaveToGlobalAudit={(doc, art, summaryText, customLabel) => {
          upsertMcpSessionAuditRecord(doc, art, summaryText, customLabel);
          handleLogAction(
            'Đối soát chéo liên luật AI',
            `${doc.doc_number} · ${art.article_no}`
          );
        }}
        onAskAquaWithContext={(q, ctx) => {
          setCrossLawDrawerState(null);
          handleAskAquaWithContext(q, ctx);
        }}
      />

      {/* D3.js Document Genealogy Tree Drawer ("🌳 Biểu đồ Phả hệ văn bản") */}
      <DocumentGenealogyTreeDrawer
        isOpen={Boolean(genealogyDrawerDocId)}
        onClose={() => setGenealogyDrawerDocId(null)}
        document={
          genealogyDrawerDocId
            ? docMap.get(genealogyDrawerDocId) || inspectedDoc || null
            : null
        }
        allDocuments={documents}
        crossReferences={crossReferences}
        onSelectDocument={(targetDoc, articleId) => {
          handleSelectDocInGrid(targetDoc, articleId);
          setActiveView('library');
        }}
        onNavigateToArticleInReader={(articleId) => {
          handleSelectArticleInReader(articleId, true);
        }}
        onOpenSideBySideComparison={(leftDocId) => {
          setGenealogyDrawerDocId(null);
          setMapCenterDocId(leftDocId);
          setComplianceInitialSubMode('side_by_side');
          setActiveView('compliance');
        }}
        onAskAquaWithContext={(q, ctx) => {
          setGenealogyDrawerDocId(null);
          handleAskAquaWithContext(q, ctx);
        }}
      />

      {/* Automated Consolidated Document (VBHN) Right Drawer + Decree 30/2020 A4 Print */}
      <ConsolidatedDocumentDrawer
        isOpen={Boolean(consolidatedDrawerDocId)}
        onClose={() => setConsolidatedDrawerDocId(null)}
        document={
          consolidatedDrawerDocId
            ? docMap.get(consolidatedDrawerDocId) || inspectedDoc || null
            : null
        }
        allDocuments={documents}
        onSelectDocument={(targetDoc, articleId) => {
          handleSelectDocInGrid(targetDoc, articleId);
          setActiveView('library');
        }}
        onNavigateToArticleInReader={(articleId) => {
          handleSelectArticleInReader(articleId, true);
        }}
        onOpenGenealogyTree={(targetDoc) => {
          setConsolidatedDrawerDocId(null);
          setGenealogyDrawerDocId(targetDoc.id);
        }}
      />

      {/* Structured 6-Step IRAC+ Legal Reasoning Drawer ("⚖ Suy luận IRAC+") */}
      <LegalReasoningDrawer
        isOpen={Boolean(reasoningDrawerState)}
        onClose={() => setReasoningDrawerState(null)}
        document={reasoningDrawerState?.doc || null}
        article={reasoningDrawerState?.article || null}
        allDocuments={documents}
        initialAsOfDate={readerAsOfDate || '2026-08-15'}
        onOpenEvidenceReport={(output) => {
          setEvidenceReportOutput(output);
        }}
      />

      {/* Evidence-Based Report Export Modal with FIPS 180-4 SHA-256 Checksum */}
      <EvidenceBasedReportModal
        isOpen={Boolean(evidenceReportOutput)}
        onClose={() => setEvidenceReportOutput(null)}
        asOfDate={readerAsOfDate || '2026-08-15'}
        documents={documents}
        auditRecords={mcpAuditRecords}
        reasoningOutputs={evidenceReportOutput ? [evidenceReportOutput] : []}
      />
    </div>
  );
}
