import type {
  ClauseItem,
  LegalArticle,
  LegalDocument,
} from '../types/legal';
import {
  DEFAULT_TRANSITIONAL_RULES,
  resolveProvisionAtDate,
} from '../core/engines/pointInTimeResolver';

export { DEFAULT_TRANSITIONAL_RULES, resolveProvisionAtDate };

export interface DocumentPointInTimeStatusResult {
  doc_id: string;
  doc_number: string;
  as_of_date: string;
  status_at_date:
    | 'NOT_YET_EFFECTIVE'
    | 'EFFECTIVE'
    | 'EXPIRED_OR_REPLACED'
    | 'TRANSITIONAL_APPLIED';
  temporal_status:
    | 'NOT_YET_EFFECTIVE'
    | 'EFFECTIVE_AT_DATE'
    | 'EXPIRED_REPLACED'
    | 'TRANSITIONAL_APPLICABLE';
  is_applicable_at_date: boolean;
  applicable_law_doc_id: string;
  applicable_law_doc_number: string;
  replacement_doc_id?: string;
  replacement_doc_number?: string;
  recommended_doc_id?: string;
  recommended_doc_number?: string;
  transitional_evaluation?: {
    applies: boolean;
    rule_id?: string;
    transition_article_ref?: string;
    resolution_rule?: string;
  };
  explanation: string;
}

/**
 * Giải trạng thái hiệu lực của một văn bản tại ngày `asOfDate` (hỗ trợ cả truyền `doc: LegalDocument` hoặc `docId: string`).
 */
export function resolveDocumentAtDate(
  docOrId: LegalDocument | string,
  asOfDate: string,
  corpus: LegalDocument[],
  transitionalEventDate?: string
): DocumentPointInTimeStatusResult {
  const doc =
    typeof docOrId === 'string'
      ? corpus.find(
          (d) =>
            d.id === docOrId ||
            d.doc_number.trim().toLowerCase() === docOrId.trim().toLowerCase()
        )
      : docOrId;

  if (!doc) {
    throw new Error(`Không tìm thấy văn bản trong kho SSoT: ${String(docOrId)}`);
  }

  const matchedTransitional = DEFAULT_TRANSITIONAL_RULES.find(
    (r) =>
      (r.new_doc_id === doc.id || r.new_doc_number === doc.doc_number) &&
      Boolean(transitionalEventDate) &&
      transitionalEventDate! < r.cutoff_date &&
      asOfDate >= r.cutoff_date
  );

  const replacementDoc = doc.replaced_by_doc_id
    ? corpus.find((d) => d.id === doc.replaced_by_doc_id)
    : undefined;

  const predecessorDoc = corpus.find((d) => d.replaced_by_doc_id === doc.id);
  const effectiveExpirationDate =
    doc.expiration_date ||
    (replacementDoc ? replacementDoc.effective_date : undefined);

  let statusAtDate: DocumentPointInTimeStatusResult['status_at_date'] = 'EFFECTIVE';
  let temporalStatus: DocumentPointInTimeStatusResult['temporal_status'] =
    'EFFECTIVE_AT_DATE';
  let isApplicableAtDate = true;
  let explanation = `Tại ngày ${asOfDate}, văn bản ${doc.doc_number} đang có hiệu lực thi hành (từ ngày ${doc.effective_date}).`;

  if (asOfDate < doc.effective_date) {
    statusAtDate = 'NOT_YET_EFFECTIVE';
    temporalStatus = 'NOT_YET_EFFECTIVE';
    isApplicableAtDate = false;
    explanation = `Tại ngày ${asOfDate}, văn bản ${doc.doc_number} chưa phát sinh hiệu lực (ngày có hiệu lực: ${doc.effective_date}).${
      predecessorDoc
        ? ` Áp dụng văn bản tiền nhiệm có hiệu lực tại thời điểm đó: ${predecessorDoc.doc_number}.`
        : ''
    }`;
  } else if (effectiveExpirationDate && asOfDate >= effectiveExpirationDate) {
    statusAtDate = 'EXPIRED_OR_REPLACED';
    temporalStatus = 'EXPIRED_REPLACED';
    isApplicableAtDate = false;
    explanation = `Tại ngày ${asOfDate}, văn bản ${doc.doc_number} đã hết hiệu lực (từ ngày ${effectiveExpirationDate})${
      replacementDoc
        ? ` và được thay thế bởi ${replacementDoc.doc_number}`
        : doc.replaced_by_label
        ? ` và được thay thế bởi ${doc.replaced_by_label}`
        : ''
    }.`;
  } else if (matchedTransitional) {
    statusAtDate = 'TRANSITIONAL_APPLIED';
    temporalStatus = 'TRANSITIONAL_APPLICABLE';
    isApplicableAtDate = true;
    explanation = `Áp dụng điều khoản chuyển tiếp (${matchedTransitional.transition_article_ref}): Do mốc khởi tạo dự án/hợp đồng (${transitionalEventDate}) trước ngày ${matchedTransitional.cutoff_date}, nên tại ngày ${asOfDate}: ${matchedTransitional.resolution_rule}`;
  }

  const applicableDoc =
    statusAtDate === 'EXPIRED_OR_REPLACED' && replacementDoc
      ? replacementDoc
      : statusAtDate === 'NOT_YET_EFFECTIVE' && predecessorDoc
      ? predecessorDoc
      : matchedTransitional
      ? corpus.find((d) => d.id === matchedTransitional.previous_doc_id) || doc
      : doc;

  return {
    doc_id: doc.id,
    doc_number: doc.doc_number,
    as_of_date: asOfDate,
    status_at_date: statusAtDate,
    temporal_status: temporalStatus,
    is_applicable_at_date: isApplicableAtDate,
    applicable_law_doc_id: applicableDoc.id,
    applicable_law_doc_number: applicableDoc.doc_number,
    replacement_doc_id: replacementDoc?.id,
    replacement_doc_number: replacementDoc?.doc_number || doc.replaced_by_label,
    recommended_doc_id: applicableDoc.id !== doc.id ? applicableDoc.id : replacementDoc?.id,
    recommended_doc_number:
      applicableDoc.id !== doc.id
        ? applicableDoc.doc_number
        : replacementDoc?.doc_number || doc.replaced_by_label,
    transitional_evaluation: matchedTransitional
      ? {
          applies: true,
          rule_id: matchedTransitional.id,
          transition_article_ref: matchedTransitional.transition_article_ref,
          resolution_rule: matchedTransitional.resolution_rule,
        }
      : { applies: false },
    explanation,
  };
}

/**
 * Giải nội dung Khoản/Điều có hiệu lực tại thời điểm `asOfDate` (TC-P1-02).
 */
export function resolveClauseAtDate(
  doc: LegalDocument,
  article: LegalArticle,
  clause: ClauseItem | undefined,
  asOfDate: string
): {
  effective_status_at_date:
    | 'NOT_YET_EFFECTIVE'
    | 'EFFECTIVE_ORIGINAL'
    | 'EFFECTIVE_AMENDED'
    | 'EXPIRED_OR_REPEALED'
    | 'HISTORICAL_TEXT_UNAVAILABLE';
  version_state:
    | 'NOT_YET_EFFECTIVE'
    | 'ORIGINAL_PRE_AMENDMENT'
    | 'AMENDED_CURRENT'
    | 'EXPIRED_OR_REPEALED'
    | 'HISTORICAL_TEXT_UNAVAILABLE';
  applicable_text: string;
  active_text: string;
  enacting_doc_number: string;
  amending_effective_date?: string;
  change_summary?: string;
} {
  const res = resolveProvisionAtDate(
    {
      doc_id: doc.id,
      article_no: article.article_no,
      clause_no: clause?.clause_no,
      reference_date: asOfDate,
    },
    [doc]
  );

  let effectiveStatus:
    | 'NOT_YET_EFFECTIVE'
    | 'EFFECTIVE_ORIGINAL'
    | 'EFFECTIVE_AMENDED'
    | 'EXPIRED_OR_REPEALED'
    | 'HISTORICAL_TEXT_UNAVAILABLE' = 'EFFECTIVE_ORIGINAL';
  let versionState:
    | 'NOT_YET_EFFECTIVE'
    | 'ORIGINAL_PRE_AMENDMENT'
    | 'AMENDED_CURRENT'
    | 'EXPIRED_OR_REPEALED'
    | 'HISTORICAL_TEXT_UNAVAILABLE' = 'ORIGINAL_PRE_AMENDMENT';

  if (res.temporal_state === 'NOT_YET_EFFECTIVE') {
    effectiveStatus = 'NOT_YET_EFFECTIVE';
    versionState = 'NOT_YET_EFFECTIVE';
  } else if (
    res.temporal_state === 'EXPIRED_OR_REPEALED' ||
    res.temporal_state === 'ANNULLED_AT_DATE'
  ) {
    effectiveStatus = 'EXPIRED_OR_REPEALED';
    versionState = 'EXPIRED_OR_REPEALED';
  } else if (res.temporal_state === 'EFFECTIVE_AMENDED') {
    effectiveStatus = 'EFFECTIVE_AMENDED';
    versionState = 'AMENDED_CURRENT';
  } else if (
    res.applicable_text.startsWith('[CẢNH BÁO DỮ LIỆU LỊCH SỬ')
  ) {
    effectiveStatus = 'HISTORICAL_TEXT_UNAVAILABLE';
    versionState = 'HISTORICAL_TEXT_UNAVAILABLE';
  } else {
    effectiveStatus = 'EFFECTIVE_ORIGINAL';
    versionState = 'ORIGINAL_PRE_AMENDMENT';
  }

  const enactingDocNumber =
    effectiveStatus === 'EFFECTIVE_AMENDED'
      ? res.applied_amending_doc_number ||
        clause?.diff_data?.amending_doc_number ||
        article.amendment_info?.amending_doc_number ||
        doc.doc_number
      : doc.doc_number;

  return {
    effective_status_at_date: effectiveStatus,
    version_state: versionState,
    applicable_text: res.applicable_text,
    active_text: res.applicable_text,
    enacting_doc_number: enactingDocNumber,
    amending_effective_date:
      res.applied_amending_effective_date ||
      clause?.diff_data?.effective_date ||
      article.amendment_info?.effective_date,
    change_summary:
      clause?.diff_data?.change_summary ||
      article.amendment_info?.summary ||
      res.legal_audit_explanation,
  };
}

/**
 * Đánh giá điều khoản chuyển tiếp dựa trên mốc sự kiện thực tế của dự án (BL-2.1).
 */
export function evaluateTransitionalEligibility(
  doc: LegalDocument,
  eventDate: string,
  asOfDate: string,
  corpus: LegalDocument[]
) {
  return resolveDocumentAtDate(doc, asOfDate, corpus, eventDate);
}
