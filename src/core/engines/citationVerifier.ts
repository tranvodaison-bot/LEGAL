import type {
  CitationVerificationResult,
  CitationVerificationStatus,
  LegalDocument,
} from '../../types/legal';
import type {
  CitationVerificationReport,
  VerifiedCitationItem,
} from '../entities/legalDomain';
import {
  computeDocumentCompleteness,
  resolveAuthenticityTier,
} from './corpusIntegrityValidator';

/**
 * Bộ kiểm chứng dẫn chiếu tất định (Deterministic Citation Verifier).
 * Quét toàn bộ văn bản hoặc mảng dẫn chiếu của AI và đối chiếu 1–1 với kho SSoT hiện có.
 * Không bao giờ cho phép dẫn chiếu không tồn tại trong kho được gắn nhãn VERIFIED.
 */
export function verifySingleCitation(
  docNumberInput: string,
  articleClauseRefInput: string,
  corpus: LegalDocument[]
): VerifiedCitationItem {
  const cleanDocNo = docNumberInput.trim();
  const cleanArticleRef = articleClauseRefInput.trim();
  const normalizedInputCode = cleanDocNo.toLowerCase();

  // Tìm văn bản trong kho SSoT theo số hiệu chính xác hoặc có ranh giới từ rõ ràng (không dùng includes ngược gây dương tính giả)
  const matchedDoc = corpus.find((d) => {
    const code = d.doc_number.trim().toLowerCase();
    const consCode = d.consolidated_doc_number?.trim().toLowerCase();
    if (code === normalizedInputCode || (consCode && consCode === normalizedInputCode)) {
      return true;
    }
    const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\s|\\()${escapedCode}($|\\s|\\)|,|;)`, 'i').test(cleanDocNo);
  });

  if (!matchedDoc) {
    return {
      raw_citation: `${cleanArticleRef} (${cleanDocNo})`,
      verification_status: 'UNVERIFIED_EXTERNAL',
      warning_note: `Văn bản ${cleanDocNo} chưa có trong kho SSoT địa phương. Bắt buộc đối chiếu trực tiếp trên CSDL Quốc gia (vbpl.vn) trước khi sử dụng.`,
    };
  }

  const tier = resolveAuthenticityTier(matchedDoc);
  const completeness = computeDocumentCompleteness(matchedDoc);

  // Tách số Điều và số Khoản từ `cleanArticleRef` (VD: "Khoản 2 Điều 3" -> "Điều 3", "Khoản 2")
  const articleMatch = cleanArticleRef.match(/Điều\s+(\d+[a-zA-Z]?)/i);
  const clauseMatch = cleanArticleRef.match(/Khoản\s+(\d+)/i);
  const pointMatch = cleanArticleRef.match(/Điểm\s+([a-zđ])/i);
  const extractedArticleNo = articleMatch ? `Điều ${articleMatch[1]}` : undefined;
  const extractedClauseNum = clauseMatch ? Number(clauseMatch[1]) : undefined;
  const extractedClauseNo = clauseMatch ? `Khoản ${clauseMatch[1]}` : undefined;
  const extractedPointLetter = pointMatch ? pointMatch[1].toLowerCase() : undefined;

  if (!extractedArticleNo) {
    return {
      raw_citation: `${cleanArticleRef} (${matchedDoc.doc_number})`,
      matched_doc_id: matchedDoc.id,
      matched_doc_number: matchedDoc.doc_number,
      verification_status: completeness.is_full_text
        ? 'VERIFIED_FULL_SSOT'
        : 'VERIFIED_EXCERPT_SSOT',
      authenticity_tier: tier,
      source_excerpt: matchedDoc.summary,
      warning_note: completeness.is_full_text
        ? undefined
        : `Văn bản ${matchedDoc.doc_number} hiện nạp trích lược (${completeness.loaded_articles_count}/${completeness.total_articles_count} Điều).`,
    };
  }

  const matchedArticle = matchedDoc.articles.find(
    (a) => a.article_no.trim().toLowerCase() === extractedArticleNo.toLowerCase()
  );

  const extractedArticleNum = articleMatch ? parseInt(articleMatch[1], 10) : undefined;

  if (!matchedArticle) {
    if (
      extractedArticleNum !== undefined &&
      !Number.isNaN(extractedArticleNum) &&
      completeness.total_articles_count > 0 &&
      extractedArticleNum > completeness.total_articles_count
    ) {
      return {
        raw_citation: `${cleanArticleRef} (${matchedDoc.doc_number})`,
        matched_doc_id: matchedDoc.id,
        matched_doc_number: matchedDoc.doc_number,
        matched_article_no: extractedArticleNo,
        matched_clause_no: extractedClauseNo,
        verification_status: 'UNVERIFIED_EXTERNAL',
        authenticity_tier: tier,
        warning_note: `CẢNH BÁO ẢO GIÁC PHÁP LÝ (BLOCKED_HALLUCINATION): Văn bản ${matchedDoc.doc_number} chỉ có ${completeness.total_articles_count} Điều theo Công báo, không tồn tại ${extractedArticleNo}.`,
      };
    }

    return {
      raw_citation: `${cleanArticleRef} (${matchedDoc.doc_number})`,
      matched_doc_id: matchedDoc.id,
      matched_doc_number: matchedDoc.doc_number,
      matched_article_no: extractedArticleNo,
      matched_clause_no: extractedClauseNo,
      verification_status: 'DOC_FOUND_ARTICLE_UNLOADED',
      authenticity_tier: tier,
      warning_note: `Văn bản ${matchedDoc.doc_number} có trong kho SSoT nhưng mới nạp ${completeness.loaded_articles_count}/${completeness.total_articles_count} Điều (${extractedArticleNo} chưa được nạp toàn văn). Không tự động xác nhận nội dung điều khoản này.`,
    };
  }

  // Kiểm chứng cấp Khoản (Clause-level verification — Khắc phục FIND-INT-01)
  if (extractedClauseNo && extractedClauseNum !== undefined) {
    if (
      matchedArticle.clause_count !== undefined &&
      extractedClauseNum > matchedArticle.clause_count
    ) {
      return {
        raw_citation: `${cleanArticleRef} (${matchedDoc.doc_number})`,
        matched_doc_id: matchedDoc.id,
        matched_doc_number: matchedDoc.doc_number,
        matched_article_no: matchedArticle.article_no,
        matched_clause_no: extractedClauseNo,
        verification_status: 'UNVERIFIED_EXTERNAL',
        authenticity_tier: tier,
        warning_note: `CẢNH BÁO TRÍCH DẪN ẢO: ${matchedArticle.article_no} văn bản ${matchedDoc.doc_number} chỉ có ${matchedArticle.clause_count} khoản; không tồn tại ${extractedClauseNo}.`,
      };
    }

    const foundInClausesArray = (matchedArticle.clauses || []).some(
      (c) => c.clause_no.trim().toLowerCase() === extractedClauseNo.toLowerCase()
    );
    const clausePatternInContent = new RegExp(
      `(^|\\n)\\s*(\\(L\\d+\\.\\d+\\s*-\\s*Khoản\\s+${extractedClauseNum}\\b|\\(Khoản\\s+${extractedClauseNum}\\b|${extractedClauseNum}\\.\\s+|Khoản\\s+${extractedClauseNum}\\b)`,
      'i'
    );
    const foundInContent = clausePatternInContent.test(matchedArticle.content);

    if (!foundInClausesArray && !foundInContent) {
      return {
        raw_citation: `${cleanArticleRef} (${matchedDoc.doc_number})`,
        matched_doc_id: matchedDoc.id,
        matched_doc_number: matchedDoc.doc_number,
        matched_article_no: matchedArticle.article_no,
        matched_clause_no: extractedClauseNo,
        verification_status: 'UNVERIFIED_EXTERNAL',
        authenticity_tier: tier,
        warning_note: `Không tìm thấy nội dung ${extractedClauseNo} trong ${matchedArticle.article_no} văn bản ${matchedDoc.doc_number}. Hệ thống từ chối gắn nhãn xác thực.`,
      };
    }
  }

  // Kiểm chứng cấp Điểm (Point-level verification nếu có dẫn chiếu Điểm a/b/c/d/đ)
  if (extractedPointLetter) {
    const pointPattern = new RegExp(
      `(^|\\n|\\s)${extractedPointLetter}\\)\\s+|điểm\\s+${extractedPointLetter}\\b`,
      'i'
    );
    if (!pointPattern.test(matchedArticle.content)) {
      return {
        raw_citation: `${cleanArticleRef} (${matchedDoc.doc_number})`,
        matched_doc_id: matchedDoc.id,
        matched_doc_number: matchedDoc.doc_number,
        matched_article_no: matchedArticle.article_no,
        matched_clause_no: extractedClauseNo,
        verification_status: 'UNVERIFIED_EXTERNAL',
        authenticity_tier: tier,
        warning_note: `Không tìm thấy Điểm ${extractedPointLetter} trong ${matchedArticle.article_no} văn bản ${matchedDoc.doc_number}.`,
      };
    }
  }

  return {
    raw_citation: `${cleanArticleRef} (${matchedDoc.doc_number})`,
    matched_doc_id: matchedDoc.id,
    matched_doc_number: matchedDoc.doc_number,
    matched_article_no: matchedArticle.article_no,
    matched_clause_no: extractedClauseNo,
    verification_status: completeness.is_full_text
      ? 'VERIFIED_FULL_SSOT'
      : 'VERIFIED_EXCERPT_SSOT',
    authenticity_tier: tier,
    source_excerpt: matchedArticle.content.slice(0, 260),
    warning_note: completeness.is_full_text
      ? undefined
      : `Điều khoản đã khớp trong kho, lưu ý văn bản gốc đang ở chế độ trích lược (${completeness.loaded_articles_count}/${completeness.total_articles_count} Điều).`,
  };
}

/**
 * Quét tự động toàn bộ văn bản tự do hoặc danh sách quy phạm để tạo báo cáo `CitationVerificationReport`.
 */
export function verifyCitationsBatch(
  items: Array<{ doc_number: string; article_clause_ref: string }>,
  corpus: LegalDocument[]
): CitationVerificationReport {
  const verifiedItems: VerifiedCitationItem[] = items.map((item) =>
    verifySingleCitation(item.doc_number, item.article_clause_ref, corpus)
  );

  const total = verifiedItems.length;
  const verifiedSsotCount = verifiedItems.filter(
    (i) => i.verification_status === 'VERIFIED_FULL_SSOT' || i.verification_status === 'VERIFIED_EXCERPT_SSOT'
  ).length;
  const excerptWarningCount = verifiedItems.filter(
    (i) =>
      i.verification_status === 'VERIFIED_EXCERPT_SSOT' ||
      i.verification_status === 'DOC_FOUND_ARTICLE_UNLOADED'
  ).length;
  const unverifiedExternalCount = verifiedItems.filter(
    (i) => i.verification_status === 'UNVERIFIED_EXTERNAL' || i.verification_status === 'DOC_FOUND_ARTICLE_UNLOADED'
  ).length;

  const trustScore =
    total > 0 ? Math.round((verifiedSsotCount / total) * 100) : 100;

  return {
    total_citations_detected: total,
    verified_ssot_count: verifiedSsotCount,
    excerpt_warning_count: excerptWarningCount,
    unverified_external_count: unverifiedExternalCount,
    trust_score_percent: trustScore,
    citations: verifiedItems,
    has_hallucination_risk: unverifiedExternalCount > 0,
  };
}

/**
 * Chuyển đổi kết quả VerifiedCitationItem sang cấu trúc CitationVerificationResult (LEGAL_DOMAIN_DATA_MODEL.md §4.2)
 * và hỗ trợ các nhãn tương thích ngược trong ACCEPTANCE_TEST_PLAN.md (TC-P1-03).
 */
export function verifyCitationAgainstCorpus(
  rawCitationText: string,
  targetDocNumber: string,
  targetArticleNo: string,
  corpus: LegalDocument[]
): CitationVerificationResult & {
  verification_status:
    | 'VERIFIED_IN_SSOT'
    | 'DOC_FOUND_ARTICLE_NOT_LOADED'
    | 'UNVERIFIED_CITATION'
    | 'UNVERIFIED_EXTERNAL_CITATION';
  warning_banner?: string;
} {
  const item = verifySingleCitation(
    targetDocNumber,
    targetArticleNo || rawCitationText,
    corpus
  );

  const isHallucinatedNumber = Boolean(
    item.warning_note &&
      (item.warning_note.includes('BLOCKED_HALLUCINATION') ||
        item.warning_note.includes('CẢNH BÁO TRÍCH DẪN ẢO'))
  );

  let status: CitationVerificationStatus;
  let compatStatus:
    | 'VERIFIED_IN_SSOT'
    | 'DOC_FOUND_ARTICLE_NOT_LOADED'
    | 'UNVERIFIED_CITATION'
    | 'UNVERIFIED_EXTERNAL_CITATION';

  if (item.verification_status === 'VERIFIED_FULL_SSOT') {
    status = 'VERIFIED_FULL_SSOT';
    compatStatus = 'VERIFIED_IN_SSOT';
  } else if (item.verification_status === 'VERIFIED_EXCERPT_SSOT') {
    status = 'VERIFIED_EXCERPT_SSOT';
    compatStatus = 'VERIFIED_IN_SSOT';
  } else if (item.verification_status === 'DOC_FOUND_ARTICLE_UNLOADED') {
    status = 'DOC_FOUND_ARTICLE_UNLOADED';
    compatStatus = 'DOC_FOUND_ARTICLE_NOT_LOADED';
  } else if (isHallucinatedNumber || item.matched_doc_id) {
    status = 'BLOCKED_HALLUCINATION';
    compatStatus = 'UNVERIFIED_CITATION';
  } else {
    status = 'UNVERIFIED_EXTERNAL';
    compatStatus = 'UNVERIFIED_EXTERNAL_CITATION';
  }

  return {
    raw_citation_text: rawCitationText || item.raw_citation,
    status,
    verification_status: compatStatus,
    matched_doc_id: item.matched_doc_id,
    matched_doc_number: item.matched_doc_number,
    matched_article_no: item.matched_article_no,
    verification_note:
      item.warning_note ||
      `Đã xác thực 100% khớp với ${item.matched_article_no || 'văn bản'} (${
        item.matched_doc_number
      }) trong kho SSoT.`,
    warning_banner: item.warning_note,
  };
}

