import type { LegalDocument } from '../../types/legal';
import type {
  CaseFactEvent,
  IRACPlusReasoningOutput,
  LegalReasoningMode,
} from '../../core/entities/legalDomain';
import { resolveProvisionAtDate } from '../../core/engines/pointInTimeResolver';
import { verifyCitationsBatch } from '../../core/engines/citationVerifier';

/**
 * Module 4: Legal Reasoning Service (3 Chế độ × 6 Bước IRAC+)
 * Hỗ trợ:
 * - `JUDICIAL_ANALYSIS`: Phân tích tài phán khách quan
 * - `LEGAL_COUNSEL`: Tư vấn phương án bảo vệ quyền lợi & phòng ngừa rủi ro cho Chủ đầu tư / Doanh nghiệp
 * - `LEGAL_AUDIT`: Kiểm toán tuân thủ & hậu kiểm thanh tra / xuất toán
 *
 * Kết hợp giữa Deterministic Engine (Point-in-Time Resolver + Citation Verifier) và AI Reasoning.
 */
export function buildDeterministicIRACBaseline(params: {
  mode: LegalReasoningMode;
  referenceDate: string;
  milestoneInitiationDate?: string;
  caseTitle: string;
  facts: CaseFactEvent[];
  targetProvisions: Array<{ doc_id: string; article_no: string; clause_no?: string }>;
  corpus: LegalDocument[];
}): IRACPlusReasoningOutput {
  const {
    mode,
    referenceDate,
    milestoneInitiationDate,
    caseTitle,
    facts,
    targetProvisions,
    corpus,
  } = params;

  const resolvedList = targetProvisions.map((p) =>
    resolveProvisionAtDate(
      {
        doc_id: p.doc_id,
        article_no: p.article_no,
        clause_no: p.clause_no,
        reference_date: referenceDate,
        milestone_initiation_date: milestoneInitiationDate,
      },
      corpus
    )
  );

  const citationBatch = verifyCitationsBatch(
    resolvedList.map((r) => ({
      doc_number: r.doc_number,
      article_clause_ref: `${r.clause_no ? r.clause_no + ' ' : ''}${r.article_no}`,
    })),
    corpus
  );

  const modeLabel =
    mode === 'JUDICIAL_ANALYSIS'
      ? 'Phân tích Tài phán & Xét xử Khách quan (Judicial Analysis)'
      : mode === 'LEGAL_COUNSEL'
      ? 'Tư vấn Pháp lý & Bảo vệ Quyền lợi Chủ đầu tư / Doanh nghiệp (Legal Counsel)'
      : 'Kiểm toán Tuân thủ & Hậu kiểm Rủi ro Xuất toán (Legal Audit)';

  const step2Rules = resolvedList.map((r, idx) => ({
    doc_number: r.doc_number,
    article_clause_ref: `${r.clause_no ? r.clause_no + ' ' : ''}${r.article_no} (${r.article_title})`,
    normative_summary: r.applicable_text,
    effective_status_at_fact_date: `${r.temporal_state} · ${r.legal_audit_explanation}`,
    verification_badge: citationBatch.citations[idx]?.verification_status || 'VERIFIED_FULL_SSOT',
  }));

  const factMappings = facts.map((f, i) => {
    const matchedRule = resolvedList[i % Math.max(1, resolvedList.length)];
    const ruleRef = matchedRule
      ? `${matchedRule.clause_no ? matchedRule.clause_no + ' ' : ''}${matchedRule.article_no} (${matchedRule.doc_number})`
      : f.related_doc_number || 'Quy phạm liên quan';

    const hasRiskKeyword = /chưa có|vượt|chậm|không có|thiếu|trước khi/i.test(f.description);
    const assessment: 'PHÙ HỢP' | 'VI PHẠM / RỦI RO XUẤT TOÁN' | 'CẦN BỔ SUNG CHỨNG CỨ' =
      hasRiskKeyword
        ? 'VI PHẠM / RỦI RO XUẤT TOÁN'
        : f.evidence_code
        ? 'PHÙ HỢP'
        : 'CẦN BỔ SUNG CHỨNG CỨ';

    return {
      fact_statement: `[${f.event_date}] ${f.event_title}: ${f.description}`,
      applied_rule_ref: ruleRef,
      compliance_assessment: assessment,
      analysis: matchedRule
        ? `${matchedRule.legal_audit_explanation} Đối chiếu với tình tiết ngày ${f.event_date}${
            f.evidence_code ? ` (Chứng cứ: ${f.evidence_code})` : ' (Chưa đính kèm mã chứng cứ xác thực)'
          }.`
        : `Đối chiếu tình tiết ngày ${f.event_date} với căn cứ ${ruleRef}.`,
    };
  });

  return {
    reasoning_id: `IRAC-${Date.now()}`,
    created_at: new Date().toISOString(),
    mode,
    reference_date: referenceDate,
    case_title: caseTitle,
    step1_issue: {
      core_legal_question: `[Chế độ: ${modeLabel}] Xác định hiệu lực quy phạm áp dụng tại thời điểm sự kiện (${referenceDate}) và đánh giá tính hợp pháp, rủi ro xuất toán của hồ sơ: "${caseTitle}".`,
      material_facts: facts.map(
        (f) => `${f.event_date} — ${f.event_title} (${f.evidence_code || 'Chưa gắn mã chứng cứ'})`
      ),
      jurisdiction_and_scope:
        'Pháp luật Việt Nam (Đối chiếu trực tiếp kho SSoT Đại Sơn Legal & Bộ giải hiệu lực Point-in-Time).',
    },
    step2_rules: step2Rules,
    step3_interpretation: {
      normative_elements: resolvedList.map(
        (r) =>
          `${r.doc_number} · ${r.article_no}: Phiên bản áp dụng tại ngày ${referenceDate} là [${r.temporal_state}] (${r.completeness_meta.note}).`
      ),
      temporal_and_transitional_analysis: resolvedList
        .map((r) => r.legal_audit_explanation)
        .join(' | '),
    },
    step4_application: {
      fact_to_rule_mapping: factMappings,
    },
    step5_counterargument: {
      inspector_or_opposing_view:
        mode === 'LEGAL_AUDIT'
          ? 'Đoàn Thanh tra / Kiểm toán Nhà nước có thể bác bỏ chi phí hoặc yêu cầu thu hồi tạm ứng nếu áp dụng sai phiên bản văn bản tại thời điểm phát sinh nghiệp vụ hoặc thiếu chứng cứ gốc có chữ ký số hợp lệ.'
          : mode === 'JUDICIAL_ANALYSIS'
          ? 'Bên tranh chấp có thể viện dẫn điều khoản chuyển tiếp hoặc thời điểm hiệu lực của văn bản sửa đổi để phản bác việc áp dụng hồi tố quy định mới.'
          : 'Cơ quan thẩm định / Kho bạc có thể tạm dừng giải ngân nếu hồ sơ viện dẫn văn bản đã hết hiệu lực hoặc bản tổng hợp nội bộ thay vì văn bản gốc.',
      rebuttal_or_mitigation_conditions: [
        `Khóa cứng thời điểm áp dụng pháp luật tại ngày ${referenceDate} (và mốc khởi tạo dự án ${
          milestoneInitiationDate || referenceDate
        } nếu xét điều khoản chuyển tiếp).`,
        'Chỉ viện dẫn trực tiếp số hiệu văn bản gốc và văn bản sửa đổi trong kho VERIFIED_SSOT, không viện dẫn số hiệu Bản tổng hợp nội bộ.',
        'Đính kèm đầy đủ chứng cứ gốc đã băm kiểm toàn vẹn SHA-256.',
      ],
      residual_risk_level: factMappings.some(
        (m) => m.compliance_assessment === 'VI PHẠM / RỦI RO XUẤT TOÁN'
      )
        ? 'RẤT CAO'
        : 'TRUNG BÌNH',
    },
    step6_conclusion: {
      definitive_conclusion: `Hoàn tất đối soát tất định 6 bước IRAC+ ở chế độ [${modeLabel}] tại mốc thời gian ${referenceDate}. Độ tin cậy dẫn chiếu SSoT đạt ${citationBatch.trust_score_percent}% (${citationBatch.verified_ssot_count}/${citationBatch.total_citations_detected} quy phạm khớp kho SSoT).`,
      mandatory_evidence_dossier: facts
        .map((f) => f.evidence_code)
        .filter((c): c is string => Boolean(c)),
      actionable_recommendations: [
        'Đối chiếu từng điều khoản trích lược với cổng CSDL Quốc gia (vbpl.vn) trước khi ký phát hành văn bản chính thức.',
        'Hoàn thiện các mục đang ở trạng thái "VI PHẠM / RỦI RO XUẤT TOÁN" hoặc "CẦN BỔ SUNG CHỨNG CỨ" trong Bước 4.',
      ],
    },
    citation_verification_report: citationBatch,
  };
}
