import type { LegalArticle, LegalDocument } from '../../types/legal';
import {
  enrichDocumentIntegrityMetadata,
  validateCorpusIntegrity,
} from '../../core/engines/corpusIntegrityValidator';
import {
  saveAiDraftForDocument,
  saveQuarantineDocument,
} from '../../infrastructure/storage/partitionedStorage';

/**
 * Module 1: Legal Library & SSoT Governance Service
 * Đảm bảo mọi văn bản khi nạp vào ứng dụng đều được:
 * 1. Lọc bỏ mọi điều khoản do AI tự sinh (chặn đứng P0-01).
 * 2. Tính toán đầy đủ `authenticity_tier` và `completeness_meta` (`loaded / total` Điều) (khắc phục P0-02).
 * 3. Đưa văn bản OCR vào hàng đợi `QUARANTINE_REVIEW` thay vì trộn thẳng vào `VERIFIED_SSOT` (khắc phục P0-04).
 */
export function prepareVerifiedCorpus(rawDocuments: LegalDocument[]): LegalDocument[] {
  return rawDocuments.map((doc) => enrichDocumentIntegrityMetadata(doc));
}

export function attachAiExpandedDraftSafely(
  targetDoc: LegalDocument,
  generatedArticles: LegalArticle[]
): {
  untouchedSsotDoc: LegalDocument;
  savedDraftCount: number;
  warningBanner: string;
} {
  // Nguyên tắc bất biến P0-01: TUYỆT ĐỐI KHÔNG nối `generatedArticles` vào `targetDoc.articles` của SSoT.
  const markedDrafts: LegalArticle[] = generatedArticles.map((art, idx) => ({
    ...art,
    id: `${targetDoc.id}-ai-draft-${Date.now()}-${idx}`,
    document_id: targetDoc.id,
    is_ai_draft: true,
  }));

  const disclaimer =
    'CẢNH BÁO PHÁP LÝ: Đây là Bản nháp Gợi ý Tham khảo do AI tổng hợp (AI_ANALYSIS_DRAFT), được lưu tách biệt hoàn toàn khỏi kho SSoT. Tuyệt đối không dùng làm căn cứ trích dẫn trong hồ sơ pháp lý chính thức.';

  saveAiDraftForDocument({
    doc_id: targetDoc.id,
    doc_number: targetDoc.doc_number,
    generated_at: new Date().toISOString(),
    disclaimer,
    draft_articles: markedDrafts,
  });

  return {
    untouchedSsotDoc: enrichDocumentIntegrityMetadata(targetDoc),
    savedDraftCount: markedDrafts.length,
    warningBanner: disclaimer,
  };
}

export function ingestOcrDocumentToQuarantine(doc: LegalDocument, sha256Hash: string): LegalDocument {
  const quarantinedDoc: LegalDocument = enrichDocumentIntegrityMetadata({
    ...doc,
    status: 'DANG_DU_THAO',
    authenticity_tier: 'QUARANTINE_REVIEW',
    sha256_hash: sha256Hash,
    summary: `[HÀNG ĐỢI KIỂM DUYỆT OCR · SHA-256: ${sha256Hash.slice(0, 23)}...] ${doc.summary}`,
  });

  saveQuarantineDocument(quarantinedDoc);
  return quarantinedDoc;
}

export { validateCorpusIntegrity };
