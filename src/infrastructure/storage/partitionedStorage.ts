import type { LegalArticle, LegalDocument } from '../../types/legal';
import type { LegalCaseWorkspace } from '../../core/entities/legalDomain';

/**
 * Phân vùng Lưu trữ Tách biệt (Partitioned Storage Infrastructure) — ĐẠI SƠN LEGAL
 * Đảm bảo nguyên tắc bất biến P0-01 & P0-04:
 * 1. `VERIFIED_SSOT_KEY`: Chỉ chứa văn bản pháp luật đã xác minh, không chứa điều khoản AI tự sinh.
 * 2. `QUARANTINE_OCR_KEY`: Hàng đợi lưu các văn bản nạp qua OCR chờ kiểm duyệt viên đối chiếu bản gốc.
 * 3. `AI_DRAFTS_KEY`: Vùng lưu bản nháp phân tích/gợi ý điều khoản của AI (tách biệt hoàn toàn khỏi SSoT).
 * 4. `CASE_WORKSPACES_KEY`: Lưu trữ hồ sơ vụ việc, dòng thời gian sự kiện (Fact Timeline) và chứng cứ.
 */
export const STORAGE_KEYS = {
  VERIFIED_SSOT: 'daison_os_documents_v5',
  DOCS: 'daison_os_documents_v5',
  XREFS: 'daison_os_xrefs_v5',
  SAVED_DOCS: 'daison_os_saved_docs_v4',
  SAVED_CLAUSES: 'daison_os_saved_clauses_v4',
  OFFLINE_IDS: 'daison_os_offline_ids_v4',
  FOLDERS: 'daison_os_folders_v4',
  ALERTS: 'daison_os_alerts_v4',
  NOTIF_PREFS: 'daison_os_notif_prefs_v4',
  READER_SETTINGS: 'daison_os_reader_settings_v4',
  RECENT_IDS: 'daison_os_recent_ids_v4',
  AUDIT_LOGS: 'daison_os_audit_logs_v4',
  QUARANTINE_OCR: 'daison_legal_quarantine_ocr_v1',
  AI_DRAFTS: 'daison_legal_ai_draft_notes_v1',
  CASE_WORKSPACES: 'daison_legal_case_workspaces_v1',
} as const;

export interface AiDocumentDraftRecord {
  doc_id: string;
  doc_number: string;
  generated_at: string;
  disclaimer: string;
  draft_articles: LegalArticle[];
}

export function saveAiDraftForDocument(record: AiDocumentDraftRecord): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.AI_DRAFTS);
    const map: Record<string, AiDocumentDraftRecord> = raw ? JSON.parse(raw) : {};
    map[record.doc_id] = record;
    window.localStorage.setItem(STORAGE_KEYS.AI_DRAFTS, JSON.stringify(map));
  } catch (err) {
    console.error('[PartitionedStorage] Không thể lưu bản nháp AI:', err);
  }
}

export function loadAiDraftForDocument(docId: string): AiDocumentDraftRecord | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.AI_DRAFTS);
    if (!raw) return null;
    const map: Record<string, AiDocumentDraftRecord> = JSON.parse(raw);
    return map[docId] || null;
  } catch {
    return null;
  }
}

export function saveQuarantineDocument(doc: LegalDocument): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.QUARANTINE_OCR);
    const list: LegalDocument[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((d) => d.id !== doc.id);
    filtered.unshift({
      ...doc,
      authenticity_tier: 'QUARANTINE_REVIEW',
    });
    window.localStorage.setItem(STORAGE_KEYS.QUARANTINE_OCR, JSON.stringify(filtered));
  } catch (err) {
    console.error('[PartitionedStorage] Không thể lưu văn bản Quarantine:', err);
  }
}

export function loadQuarantineDocuments(): LegalDocument[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.QUARANTINE_OCR);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadCaseWorkspaces(defaultCases: LegalCaseWorkspace[]): LegalCaseWorkspace[] {
  if (typeof window === 'undefined' || !window.localStorage) return defaultCases;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.CASE_WORKSPACES);
    if (!raw) return defaultCases;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCases;
  } catch {
    return defaultCases;
  }
}

export function saveCaseWorkspaces(cases: LegalCaseWorkspace[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.CASE_WORKSPACES, JSON.stringify(cases));
  } catch (err) {
    console.error('[PartitionedStorage] Không thể lưu Case Workspaces:', err);
  }
}
