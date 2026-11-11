import type { LegalDocument } from '../../types/legal';
import type {
  PointInTimeQuery,
  PointInTimeResolutionResult,
  TransitionalProvisionRule,
} from '../entities/legalDomain';
import {
  computeDocumentCompleteness,
  resolveAuthenticityTier,
} from './corpusIntegrityValidator';

/**
 * Danh mục Quy tắc Chuyển tiếp Chuẩn (Transitional Provision Rules) giữa các thế hệ Luật/Nghị định.
 */
export const DEFAULT_TRANSITIONAL_RULES: TransitionalProvisionRule[] = [
  {
    id: 'trans-lxd-135-2025',
    new_doc_id: 'doc-lxd-135-2025',
    new_doc_number: '135/2025/QH15',
    previous_doc_id: 'doc-nd-15-2023',
    previous_doc_number: '50/2014/QH13 (sửa đổi bởi 62/2020/QH14) & NĐ 15/2021/NĐ-CP',
    transition_article_ref: 'Điều 166 Luật Xây dựng số 135/2025/QH15',
    cutoff_date: '2026-07-01',
    trigger_condition:
      'Dự án đầu tư xây dựng đã được phê duyệt hoặc hợp đồng xây dựng đã ký kết trước ngày 01/07/2026',
    resolution_rule:
      'Tiếp tục thực hiện theo quy định của Luật Xây dựng số 50/2014/QH13 (đã sửa đổi, bổ sung theo Luật số 62/2020/QH14) và Nghị định 15/2021/NĐ-CP, trừ trường hợp chủ đầu tư đề nghị áp dụng quy định mới thuận lợi hơn.',
  },
  {
    id: 'trans-lkt-56-2024',
    new_doc_id: 'doc-lsd9luat-56-2024',
    new_doc_number: '56/2024/QH15',
    previous_doc_id: 'doc-lkt-88-2015',
    previous_doc_number: '88/2015/QH13 (Bản gốc trước 01/01/2025)',
    transition_article_ref: 'Điều 10 & Điều 11 Luật số 56/2024/QH15',
    cutoff_date: '2025-01-01',
    trigger_condition:
      'Kỳ kế toán và chứng từ kế toán phát sinh trước ngày 01/01/2025',
    resolution_rule:
      'Áp dụng quy định gốc của Luật Kế toán số 88/2015/QH13 trước khi sửa đổi bởi Luật số 56/2024/QH15.',
  },
  {
    id: 'trans-nd-217-2026',
    new_doc_id: 'doc-nd-217-2026',
    new_doc_number: '217/2026/NĐ-CP',
    previous_doc_id: 'doc-nd-15-2023',
    previous_doc_number: '15/2021/NĐ-CP',
    transition_article_ref: 'Điều 60 Nghị định số 217/2026/NĐ-CP',
    cutoff_date: '2026-07-01',
    trigger_condition:
      'Dự án đầu tư xây dựng đã trình thẩm định Báo cáo nghiên cứu khả thi trước ngày 01/07/2026',
    resolution_rule:
      'Tiếp tục thực hiện thẩm định, phê duyệt theo Nghị định số 15/2021/NĐ-CP; các bước tiếp theo sau phê duyệt thực hiện theo quy định mới.',
  },
];

function normalizeRef(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Bộ giải hiệu lực pháp luật theo thời điểm (Point-in-Time Legal Resolver).
 * Cho phép xác định tại ngày `reference_date` (VD: ngày ký hợp đồng, ngày nghiệm thu, ngày xuất hóa đơn),
 * phiên bản nào của Điều/Khoản có hiệu lực thi hành (bản gốc hay bản sửa đổi, hoặc áp dụng quy định chuyển tiếp).
 */
export function resolveProvisionAtDate(
  query: PointInTimeQuery,
  corpus: LegalDocument[],
  transitionalRules: TransitionalProvisionRule[] = DEFAULT_TRANSITIONAL_RULES
): PointInTimeResolutionResult {
  const doc = corpus.find((d) => d.id === query.doc_id || d.doc_number === query.doc_id);
  if (!doc) {
    throw new Error(`Không tìm thấy văn bản "${query.doc_id}" trong kho SSoT.`);
  }

  const completeness = computeDocumentCompleteness(doc);
  const tier = resolveAuthenticityTier(doc);

  const targetArticle = doc.articles.find(
    (a) => normalizeRef(a.article_no) === normalizeRef(query.article_no)
  );
  if (!targetArticle) {
    throw new Error(
      `Không tìm thấy ${query.article_no} trong văn bản ${doc.doc_number} (${completeness.note}).`
    );
  }

  const refDate = query.reference_date;
  const milestoneDate = query.milestone_initiation_date;

  // 1. Kiểm tra điều khoản chuyển tiếp nếu có ngày phê duyệt dự án / ký hợp đồng ban đầu (`milestone_initiation_date`)
  const matchedTransitional = transitionalRules.find(
    (r) =>
      (r.new_doc_id === doc.id || r.new_doc_number === doc.doc_number) &&
      milestoneDate &&
      milestoneDate < r.cutoff_date &&
      refDate >= r.cutoff_date
  );

  // 2. Nếu ngày tham chiếu sớm hơn ngày văn bản có hiệu lực
  if (refDate < doc.effective_date) {
    const prevRule = transitionalRules.find(
      (r) => r.new_doc_id === doc.id || r.new_doc_number === doc.doc_number
    );
    return {
      query,
      doc_number: doc.doc_number,
      doc_title: doc.title,
      article_no: targetArticle.article_no,
      article_title: targetArticle.article_title,
      clause_no: query.clause_no,
      temporal_state: 'NOT_YET_EFFECTIVE',
      applicable_text: `[CHƯA CÓ HIỆU LỰC TẠI NGÀY ${refDate}] Văn bản ${doc.doc_number} chỉ bắt đầu có hiệu lực từ ngày ${doc.effective_date}.${
        prevRule ? ` Tại thời điểm ${refDate}, áp dụng văn bản tiền nhiệm: ${prevRule.previous_doc_number}.` : ''
      }`,
      transitional_rule_applied: prevRule,
      authenticity_tier: tier,
      completeness_meta: completeness,
      legal_audit_explanation: `Tại thời điểm ${refDate}, văn bản ${doc.doc_number} chưa phát sinh hiệu lực thi hành (ngày hiệu lực: ${doc.effective_date}).`,
    };
  }

  // 3. Nếu văn bản đã hết hiệu lực tại ngày tham chiếu
  if (doc.expiration_date && refDate >= doc.expiration_date) {
    return {
      query,
      doc_number: doc.doc_number,
      doc_title: doc.title,
      article_no: targetArticle.article_no,
      article_title: targetArticle.article_title,
      clause_no: query.clause_no,
      temporal_state: 'EXPIRED_OR_REPEALED',
      applicable_text: targetArticle.content,
      replaced_by_doc_id: doc.replaced_by_doc_id,
      replaced_by_label: doc.replaced_by_label,
      authenticity_tier: tier,
      completeness_meta: completeness,
      legal_audit_explanation: `CẢNH BÁO HIỆU LỰC: Tại ngày ${refDate}, văn bản ${doc.doc_number} đã hết hiệu lực (từ ngày ${doc.expiration_date})${
        doc.replaced_by_label ? ` và được thay thế bởi ${doc.replaced_by_label}` : ''
      }. Chỉ được áp dụng nếu thuộc trường hợp chuyển tiếp hợp pháp.`,
    };
  }

  // 4. Nếu áp dụng quy định chuyển tiếp
  if (matchedTransitional) {
    const prevDoc = corpus.find((d) => d.id === matchedTransitional.previous_doc_id);
    const prevExcerpt = prevDoc?.articles[0]?.content
      ? `\n[Trích lục văn bản tiền nhiệm ${matchedTransitional.previous_doc_number}]: ${prevDoc.articles[0].content}`
      : '';
    return {
      query,
      doc_number: doc.doc_number,
      doc_title: doc.title,
      article_no: targetArticle.article_no,
      article_title: targetArticle.article_title,
      clause_no: query.clause_no,
      temporal_state: 'TRANSITIONAL_APPLIED',
      applicable_text: `[QUY TẮC CHUYỂN TIẾP — ${matchedTransitional.transition_article_ref}]: ${matchedTransitional.resolution_rule}${prevExcerpt}\n\n[Đối chiếu quy định mới tại ${targetArticle.article_no} ${doc.doc_number}]: ${targetArticle.content}`,
      transitional_rule_applied: matchedTransitional,
      authenticity_tier: tier,
      completeness_meta: completeness,
      legal_audit_explanation: `ÁP DỤNG QUY ĐỊNH CHUYỂP TIẾP (${matchedTransitional.transition_article_ref}): Do mốc khởi tạo hồ sơ/hợp đồng (${milestoneDate}) phát sinh trước ngày ${matchedTransitional.cutoff_date}, nên tại ngày sự kiện (${refDate}): ${matchedTransitional.resolution_rule}`,
    };
  }

  // 5. Giải quyết hiệu lực cấp Khoản (Clause-level Point-in-Time) nếu có `query.clause_no` hoặc `targetArticle.clauses`
  if (targetArticle.clauses && targetArticle.clauses.length > 0) {
    const matchedClause = query.clause_no
      ? targetArticle.clauses.find(
          (c) => normalizeRef(c.clause_no) === normalizeRef(query.clause_no!)
        )
      : targetArticle.clauses.find((c) => c.is_amended || c.is_annulled);

    if (matchedClause && matchedClause.diff_data) {
      const amendEffectiveDate = matchedClause.diff_data.effective_date;
      if (refDate < amendEffectiveDate) {
        // Tại thời điểm `refDate`, bản sửa đổi CHƯA có hiệu lực -> Phải áp dụng `original_text`!
        return {
          query,
          doc_number: doc.doc_number,
          doc_title: doc.title,
          article_no: targetArticle.article_no,
          article_title: targetArticle.article_title,
          clause_no: matchedClause.clause_no,
          temporal_state: 'EFFECTIVE_ORIGINAL',
          applicable_text: matchedClause.diff_data.original_text,
          original_text_before_amendment: matchedClause.diff_data.original_text,
          applied_amending_doc_number: matchedClause.diff_data.amending_doc_number,
          applied_amending_effective_date: amendEffectiveDate,
          authenticity_tier: tier,
          completeness_meta: completeness,
          legal_audit_explanation: `ĐỐI CHIẾU POINT-IN-TIME (${refDate}): Nội dung sửa đổi tại ${matchedClause.clause_no} ${targetArticle.article_no} theo văn bản ${matchedClause.diff_data.amending_doc_number} chỉ có hiệu lực từ ngày ${amendEffectiveDate}. Do ngày sự kiện (${refDate}) diễn ra trước ngày ${amendEffectiveDate}, căn cứ pháp lý bắt buộc phải áp dụng là VĂN BẢN GỐC BAN ĐẦU (${doc.doc_number}).`,
        };
      }

      if (matchedClause.is_annulled) {
        return {
          query,
          doc_number: doc.doc_number,
          doc_title: doc.title,
          article_no: targetArticle.article_no,
          article_title: targetArticle.article_title,
          clause_no: matchedClause.clause_no,
          temporal_state: 'ANNULLED_AT_DATE',
          applicable_text: matchedClause.diff_data.replaced_text,
          original_text_before_amendment: matchedClause.diff_data.original_text,
          applied_amending_doc_number: matchedClause.diff_data.amending_doc_number,
          applied_amending_effective_date: amendEffectiveDate,
          authenticity_tier: tier,
          completeness_meta: completeness,
          legal_audit_explanation: `CẢNH BÁO BÃI BỎ: Kể từ ngày ${amendEffectiveDate}, ${matchedClause.clause_no} ${targetArticle.article_no} đã bị bãi bỏ theo văn bản ${matchedClause.diff_data.amending_doc_number}. Tại ngày ${refDate}, khoản này không còn hiệu lực áp dụng.`,
        };
      }

      return {
        query,
        doc_number: doc.doc_number,
        doc_title: doc.title,
        article_no: targetArticle.article_no,
        article_title: targetArticle.article_title,
        clause_no: matchedClause.clause_no,
        temporal_state: 'EFFECTIVE_AMENDED',
        applicable_text: matchedClause.diff_data.replaced_text || matchedClause.text,
        original_text_before_amendment: matchedClause.diff_data.original_text,
        applied_amending_doc_number: matchedClause.diff_data.amending_doc_number,
        applied_amending_effective_date: amendEffectiveDate,
        authenticity_tier: tier,
        completeness_meta: completeness,
        legal_audit_explanation: `ĐỐI CHIẾU POINT-IN-TIME (${refDate}): Tại ngày ${refDate} (sau ngày ${amendEffectiveDate}), ${matchedClause.clause_no} ${targetArticle.article_no} áp dụng theo nội dung ĐÃ SỬA ĐỔI, BỔ SUNG bởi văn bản ${matchedClause.diff_data.amending_doc_number}.`,
      };
    }
  }

  // 6. Kiểm tra lịch sử sửa đổi cấp Điều (`targetArticle.amendment_info`)
  if (targetArticle.is_amended && targetArticle.amendment_info?.effective_date) {
    const amendDate = targetArticle.amendment_info.effective_date;
    if (refDate < amendDate) {
      const historicalExcerpt = targetArticle.amendment_info.previous_excerpt;
      if (!historicalExcerpt) {
        return {
          query,
          doc_number: doc.doc_number,
          doc_title: doc.title,
          article_no: targetArticle.article_no,
          article_title: targetArticle.article_title,
          clause_no: query.clause_no,
          temporal_state: 'EFFECTIVE_ORIGINAL',
          applicable_text: `[CẢNH BÁO DỮ LIỆU LỊCH SỬ TẠI NGÀY ${refDate}]: ${targetArticle.article_no} (${doc.doc_number}) đã được sửa đổi từ ngày ${amendDate} bởi ${targetArticle.amendment_info.amending_doc_number}. Hệ thống từ chối trả về nội dung mới sau sửa đổi cho mốc sự kiện ${refDate}; vui lòng tra cứu bản gốc Công báo năm ban hành (${doc.issue_date}).`,
          applied_amending_doc_number: targetArticle.amendment_info.amending_doc_number,
          applied_amending_effective_date: amendDate,
          authenticity_tier: tier,
          completeness_meta: completeness,
          legal_audit_explanation: `Tại ngày ${refDate} (trước ngày sửa đổi ${amendDate} của văn bản ${targetArticle.amendment_info.amending_doc_number}), bắt buộc áp dụng văn bản gốc của ${doc.doc_number}. Chưa nạp previous_excerpt nên đã khóa việc trả về văn bản tương lai.`,
        };
      }
      return {
        query,
        doc_number: doc.doc_number,
        doc_title: doc.title,
        article_no: targetArticle.article_no,
        article_title: targetArticle.article_title,
        clause_no: query.clause_no,
        temporal_state: 'EFFECTIVE_ORIGINAL',
        applicable_text: historicalExcerpt,
        original_text_before_amendment: historicalExcerpt,
        applied_amending_doc_number: targetArticle.amendment_info.amending_doc_number,
        applied_amending_effective_date: amendDate,
        authenticity_tier: tier,
        completeness_meta: completeness,
        legal_audit_explanation: `Tại ngày ${refDate} (trước ngày sửa đổi ${amendDate} của văn bản ${targetArticle.amendment_info.amending_doc_number}), ${targetArticle.article_no} áp dụng theo quy định gốc của ${doc.doc_number}.`,
      };
    }

    return {
      query,
      doc_number: doc.doc_number,
      doc_title: doc.title,
      article_no: targetArticle.article_no,
      article_title: targetArticle.article_title,
      clause_no: query.clause_no,
      temporal_state: 'EFFECTIVE_AMENDED',
      applicable_text: targetArticle.content,
      original_text_before_amendment: targetArticle.amendment_info.previous_excerpt,
      applied_amending_doc_number: targetArticle.amendment_info.amending_doc_number,
      applied_amending_effective_date: amendDate,
      authenticity_tier: tier,
      completeness_meta: completeness,
      legal_audit_explanation: `Tại ngày ${refDate} (từ ngày ${amendDate} trở đi), ${targetArticle.article_no} áp dụng theo quy định đã được sửa đổi, bổ sung bởi ${targetArticle.amendment_info.amending_doc_number}.`,
    };
  }

  // 7. Điều khoản nguyên bản chưa từng sửa đổi
  return {
    query,
    doc_number: doc.doc_number,
    doc_title: doc.title,
    article_no: targetArticle.article_no,
    article_title: targetArticle.article_title,
    clause_no: query.clause_no,
    temporal_state: 'EFFECTIVE_ORIGINAL',
    applicable_text: targetArticle.content,
    authenticity_tier: tier,
    completeness_meta: completeness,
    legal_audit_explanation: `Tại ngày ${refDate}, ${targetArticle.article_no} văn bản ${doc.doc_number} đang có hiệu lực thi hành nguyên bản (từ ngày ${doc.effective_date}).`,
  };
}
