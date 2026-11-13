import type {
  EpistemicConclusionStatus,
  LegalDocument,
  LegalReasoningTrace,
} from '../../types/legal';
import type {
  CaseFactEvent,
  IRACPlusReasoningOutput,
  LegalReasoningMode,
  PointInTimeResolutionResult,
} from '../../core/entities/legalDomain';
import { resolveProvisionAtDate } from '../../core/engines/pointInTimeResolver';
import {
  verifyCitationAgainstCorpus,
  verifyCitationsBatch,
} from '../../core/engines/citationVerifier';

const OUT_OF_SSOT_DOMAIN_PATTERNS: Array<{ regex: RegExp; domainName: string }> = [
  { regex: /hàng hải|tàu biển|tai nạn tàu biển|cảng biển quốc tế|bộ luật hàng hải/i, domainName: 'Pháp luật Hàng hải (Bộ luật Hàng hải)' },
  { regex: /sở hữu trí tuệ|bằng sáng chế|nhãn hiệu độc quyền|bản quyền tác giả/i, domainName: 'Pháp luật Sở hữu trí tuệ (Luật Sở hữu trí tuệ)' },
  { regex: /hôn nhân và gia đình|ly hôn|chia tài sản vợ chồng|quyền nuôi con/i, domainName: 'Pháp luật Hôn nhân và Gia đình' },
  { regex: /hàng không dân dụng|tàu bay|khai thác cảng hàng không/i, domainName: 'Pháp luật Hàng không dân dụng' },
];

/**
 * Kiểm tra xem câu hỏi hoặc tình huống vụ việc có thuộc lĩnh vực ngoài phạm vi kho SSoT hiện tại hay không (TC-P1-05).
 */
export function detectOutOfCorpusDomain(text: string): string | null {
  for (const item of OUT_OF_SSOT_DOMAIN_PATTERNS) {
    if (item.regex.test(text)) {
      return item.domainName;
    }
  }
  return null;
}

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

  const combinedInputText = `${caseTitle} ${facts.map((f) => `${f.event_title} ${f.description}`).join(' ')}`;
  const outOfCorpusDomain = detectOutOfCorpusDomain(combinedInputText);

  // Loại bỏ hoàn toàn các bản ghi BLOCKED_P0 khỏi kho suy luận pháp lý AI (Lakehouse Quarantine Gate)
  const safeCorpus = corpus.filter((d) => !d.is_blocked_p0 && !d.reg_master_meta?.is_blocked_p0);

  const resolvedList: PointInTimeResolutionResult[] = [];
  for (const p of targetProvisions) {
    try {
      resolvedList.push(
        resolveProvisionAtDate(
          {
            doc_id: p.doc_id,
            article_no: p.article_no,
            clause_no: p.clause_no,
            reference_date: referenceDate,
            milestone_initiation_date: milestoneInitiationDate,
          },
          safeCorpus
        )
      );
    } catch {
      // Bỏ qua an toàn nếu điều khoản đích không tồn tại trong kho SSoT (Khắc phục FIND-ARCH-05)
    }
  }

  const modeLabel =
    mode === 'JUDICIAL_ANALYSIS'
      ? 'Phân tích Tài phán & Xét xử Khách quan (Judicial Analysis)'
      : mode === 'LEGAL_COUNSEL'
      ? 'Tư vấn Pháp lý & Bảo vệ Quyền lợi Chủ đầu tư / Doanh nghiệp (Legal Counsel)'
      : 'Kiểm toán Tuân thủ & Hậu kiểm Rủi ro Xuất toán (Legal Audit)';

  // Nếu câu hỏi thuộc lĩnh vực ngoài kho SSoT (VD: Luật Hàng hải, Sở hữu trí tuệ) hoặc không có quy phạm nào trong SSoT khớp:
  // Thực thi Honest Abstention (ABSTAINED_INSUFFICIENT_SSOT — TC-P1-05)
  if (outOfCorpusDomain || resolvedList.length === 0) {
    const abstentionReason = outOfCorpusDomain
      ? `Chưa đủ dữ liệu văn bản xác thực trong SSoT cho lĩnh vực [${outOfCorpusDomain}]. Hệ thống từ chối suy đoán hoặc tự bịa số hiệu điều khoản ngoài kho SSoT.`
      : `Không tìm thấy quy phạm pháp luật xác thực tương ứng trong kho SSoT cho yêu cầu "${caseTitle}". Hệ thống thực thi giao thức Từ chối kết luận khi thiếu căn cứ SSoT (Honest Abstention).`;

    return {
      reasoning_id: `IRAC-ABSTAIN-${Date.now()}`,
      created_at: new Date().toISOString(),
      mode,
      reference_date: referenceDate,
      case_title: caseTitle,
      epistemic_status: 'ABSTAINED_INSUFFICIENT_SSOT',
      step1_issue: {
        core_legal_question: `[Chế độ: ${modeLabel}] Yêu cầu phân tích: "${caseTitle}" tại thời điểm ${referenceDate}.`,
        material_facts: facts.map(
          (f) => `${f.event_date} — ${f.event_title} (${f.evidence_code || 'Chưa gắn mã chứng cứ'})`
        ),
        jurisdiction_and_scope: outOfCorpusDomain
          ? `Ngoài phạm vi kho SSoT hiện hành (${outOfCorpusDomain}).`
          : 'Chưa nạp quy phạm tương ứng trong kho SSoT.',
      },
      step2_rules: [],
      step3_interpretation: {
        normative_elements: [abstentionReason],
        temporal_and_transitional_analysis:
          'Không áp dụng giải hiệu lực Point-in-Time do văn bản chuyên ngành chưa được nạp vào kho SSoT.',
      },
      step4_application: {
        fact_to_rule_mapping: facts.map((f) => ({
          fact_statement: `[${f.event_date}] ${f.event_title}: ${f.description}`,
          applied_rule_ref: 'CHƯA CÓ TRONG SSoT',
          compliance_assessment: 'CẦN BỔ SUNG CHỨNG CỨ',
          analysis: abstentionReason,
        })),
      },
      step5_counterargument: {
        inspector_or_opposing_view:
          'Mọi kết luận pháp lý không dựa trên văn bản quy phạm pháp luật đã xác thực trong kho SSoT đều có nguy cơ dẫn chiếu sai hoặc ảo giác pháp lý.',
        rebuttal_or_mitigation_conditions: [
          'Nạp văn bản quy phạm pháp luật chính thức từ Công báo / CSDL Quốc gia (vbpl.vn) vào kho SSoT trước khi chạy suy luận.',
        ],
        residual_risk_level: 'CAO',
      },
      step6_conclusion: {
        definitive_conclusion: `[ABSTAINED_INSUFFICIENT_SSOT — TỪ CHỐI KẾT LUẬN DO THIẾU DỮ LIỆU SSoT]: ${abstentionReason}`,
        mandatory_evidence_dossier: [],
        actionable_recommendations: [
          `Tra cứu trực tiếp văn bản gốc thuộc lĩnh vực ${outOfCorpusDomain || 'liên quan'} trên Cổng Thông tin điện tử Chính phủ / Công báo nước CHXHCN Việt Nam.`,
          'Bổ sung văn bản xác thực vào kho SSoT trước khi lập báo cáo thẩm định pháp lý.',
        ],
        epistemic_status: 'ABSTAINED_INSUFFICIENT_SSOT',
        abstention_reason: abstentionReason,
      },
      citation_verification_report: {
        total_citations_detected: 0,
        verified_ssot_count: 0,
        excerpt_warning_count: 0,
        unverified_external_count: 0,
        trust_score_percent: 0,
        citations: [],
        has_hallucination_risk: false,
      },
    };
  }

  const citationBatch = verifyCitationsBatch(
    resolvedList.map((r) => ({
      doc_number: r.doc_number,
      article_clause_ref: `${r.clause_no ? r.clause_no + ' ' : ''}${r.article_no}`,
    })),
    corpus
  );

  const hasExcerptInRules = resolvedList.some((r) => !r.completeness_meta.is_full_text);
  const epistemicStatus: 'VERIFIED_IN_SSOT' | 'PARTIAL_EXCERPT_WARNING' = hasExcerptInRules
    ? 'PARTIAL_EXCERPT_WARNING'
    : 'VERIFIED_IN_SSOT';

  const modeSpecificQuestion =
    mode === 'JUDICIAL_ANALYSIS'
      ? `[Phân tích Tài phán — Judicial Adjudication]: Đánh giá hiệu lực quy phạm tại ngày ${referenceDate}, đối chiếu chứng cứ khách quan và xác định nghĩa vụ pháp lý đối với hồ sơ "${caseTitle}".`
      : mode === 'LEGAL_COUNSEL'
      ? `[Tư vấn Pháp chế Chủ đầu tư — Legal Counsel]: Xác định phương án bảo vệ quyền lợi hợp pháp, điều khoản chuyển tiếp có lợi và giải pháp khắc phục hồ sơ cho "${caseTitle}" tại mốc ${referenceDate}.`
      : `[Kiểm toán Tuân thủ & Xuất toán — Compliance Auditor]: Hậu kiểm 3 chân kiềng (Quy phạm tại ${referenceDate} ↔ Hồ sơ chứng cứ SHA-256 ↔ Rủi ro xuất toán/chế tài) đối với "${caseTitle}".`;

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
    epistemic_status: epistemicStatus,
    step1_issue: {
      core_legal_question: modeSpecificQuestion,
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
      epistemic_status: epistemicStatus,
    },
    citation_verification_report: citationBatch,
  };
}

/**
 * Chuyển đổi kết quả suy luận IRAC+ sang cấu trúc chuẩn `LegalReasoningTrace` (LEGAL_DOMAIN_DATA_MODEL.md §5.1).
 */
export function buildLegalReasoningTrace(
  iracOutput: IRACPlusReasoningOutput,
  corpus: LegalDocument[]
): LegalReasoningTrace {
  const mappedEpistemic: EpistemicConclusionStatus =
    iracOutput.epistemic_status === 'ABSTAINED_INSUFFICIENT_SSOT'
      ? 'ABSTAINED_MISSING_DATA'
      : iracOutput.epistemic_status === 'PARTIAL_EXCERPT_WARNING'
      ? 'CONDITIONAL_ON_EXCERPT'
      : 'VERIFIED_DETERMINISTIC';

  return {
    trace_id: iracOutput.reasoning_id,
    created_at: iracOutput.created_at,
    reasoning_mode: iracOutput.mode,
    as_of_date: iracOutput.reference_date,
    epistemic_status: mappedEpistemic,
    step_1_legal_issues: [
      iracOutput.step1_issue.core_legal_question,
      ...iracOutput.step1_issue.material_facts,
    ],
    step_2_applicable_provisions: iracOutput.step2_rules.map((r) => {
      const verification = verifyCitationAgainstCorpus(
        `${r.article_clause_ref} (${r.doc_number})`,
        r.doc_number,
        r.article_clause_ref,
        corpus
      );
      const pitStatus = r.effective_status_at_fact_date.includes('TRANSITIONAL')
        ? 'TRANSITIONAL_APPLIED'
        : r.effective_status_at_fact_date.includes('AMENDED')
        ? 'AMENDED_AT_DATE'
        : r.effective_status_at_fact_date.includes('EXPIRED')
        ? 'EXPIRED_AT_DATE'
        : 'ACTIVE_AT_DATE';

      return {
        doc_number: r.doc_number,
        clause_ref: r.article_clause_ref,
        verbatim_quote: r.normative_summary,
        point_in_time_status: pitStatus,
        verification,
      };
    }),
    step_3_statutory_interpretation: [
      ...iracOutput.step3_interpretation.normative_elements,
      iracOutput.step3_interpretation.temporal_and_transitional_analysis,
    ].join('\n'),
    step_4_fact_application: iracOutput.step4_application.fact_to_rule_mapping.map((m) => ({
      fact_summary: m.fact_statement,
      compliance_match:
        m.compliance_assessment === 'PHÙ HỢP'
          ? 'COMPLIANT'
          : m.compliance_assessment === 'VI PHẠM / RỦI RO XUẤT TOÁN'
          ? 'NON_COMPLIANT'
          : 'INSUFFICIENT_EVIDENCE',
      analysis: m.analysis,
    })),
    step_5_counter_arguments_and_exceptions: [
      iracOutput.step5_counterargument.inspector_or_opposing_view,
      ...iracOutput.step5_counterargument.rebuttal_or_mitigation_conditions,
    ],
    step_6_actionable_conclusion: {
      verdict_summary: iracOutput.step6_conclusion.definitive_conclusion,
      deduction_or_invalidity_risk:
        iracOutput.step5_counterargument.residual_risk_level === 'RẤT CAO'
          ? 'CRITICAL'
          : iracOutput.step5_counterargument.residual_risk_level === 'CAO'
          ? 'HIGH'
          : iracOutput.step5_counterargument.residual_risk_level === 'TRUNG BÌNH'
          ? 'MEDIUM'
          : 'LOW',
      mandatory_remediation_steps: iracOutput.step6_conclusion.actionable_recommendations,
      abstention_reason: iracOutput.step6_conclusion.abstention_reason,
    },
  };
}

