import type {
  AuthenticityTier,
  CompletenessMetadata,
  LegalDocument,
  LegalArticle,
  ClauseItem,
} from '../../types/legal';

export type {
  AuthenticityTier,
  CompletenessMetadata,
  LegalDocument,
  LegalArticle,
  ClauseItem,
};

// ============================================================================
// 1. POINT-IN-TIME LEGAL RESOLVER & TRANSITIONAL PROVISION MODELS
// ============================================================================

export type TemporalEffectiveState =
  | 'NOT_YET_EFFECTIVE'     // Ngày sự kiện < Ngày văn bản có hiệu lực
  | 'EFFECTIVE_ORIGINAL'    // Đang có hiệu lực theo nội dung gốc ban đầu (chưa bị sửa đổi tại ngày sự kiện)
  | 'EFFECTIVE_AMENDED'     // Đang có hiệu lực theo nội dung đã sửa đổi, bổ sung tại ngày sự kiện
  | 'ANNULLED_AT_DATE'      // Khoản/Điều đã bị bãi bỏ tại ngày sự kiện
  | 'EXPIRED_OR_REPEALED'   // Văn bản đã hết hiệu lực hoặc bị thay thế tại ngày sự kiện
  | 'TRANSITIONAL_APPLIED'; // Áp dụng quy định chuyển tiếp do sự kiện phát sinh trước ngày luật mới có hiệu lực

export interface TransitionalProvisionRule {
  id: string;
  new_doc_id: string;
  new_doc_number: string;
  previous_doc_id: string;
  previous_doc_number: string;
  transition_article_ref: string; // VD: "Điều 160 Luật Xây dựng 135/2025/QH15" hoặc "Điều 110 Luật Đấu thầu 22/2023/QH15"
  cutoff_date: string;            // YYYY-MM-DD (Ngày ranh giới chuyển tiếp)
  trigger_condition: string;      // VD: "Dự án đã phê duyệt chủ trương đầu tư hoặc ký hợp đồng trước ngày hiệu lực"
  resolution_rule: string;        // VD: "Tiếp tục thực hiện theo quy định của Luật cũ cho đến khi kết thúc nghiệm thu quyết toán"
}

export interface PointInTimeQuery {
  doc_id: string;
  article_no: string;             // VD: "Điều 3", "Điều 6"
  clause_no?: string;             // VD: "Khoản 2"
  reference_date: string;         // YYYY-MM-DD (Ngày phát sinh giao dịch / ký hợp đồng / nghiệm thu)
  milestone_initiation_date?: string; // YYYY-MM-DD (Ngày phê duyệt dự án / mở thầu để xét điều khoản chuyển tiếp)
}

export interface PointInTimeResolutionResult {
  query: PointInTimeQuery;
  doc_number: string;
  doc_title: string;
  article_no: string;
  article_title: string;
  clause_no?: string;
  temporal_state: TemporalEffectiveState;
  applicable_text: string;
  original_text_before_amendment?: string;
  applied_amending_doc_number?: string;
  applied_amending_effective_date?: string;
  replaced_by_doc_id?: string;
  replaced_by_label?: string;
  transitional_rule_applied?: TransitionalProvisionRule;
  authenticity_tier: AuthenticityTier;
  completeness_meta: CompletenessMetadata;
  legal_audit_explanation: string;
}

// ============================================================================
// 2. DETERMINISTIC CITATION VERIFIER MODELS
// ============================================================================

export type CitationVerificationStatus =
  | 'VERIFIED_FULL_SSOT'     // Khớp cả số hiệu văn bản và Điều/Khoản trong văn bản toàn văn SSoT
  | 'VERIFIED_EXCERPT_SSOT'  // Khớp số hiệu văn bản và Điều trong văn bản trích lược SSoT
  | 'DOC_FOUND_ARTICLE_UNLOADED' // Văn bản có trong SSoT nhưng Điều được trích dẫn chưa nạp vào bản trích lược
  | 'UNVERIFIED_EXTERNAL';   // Không tìm thấy văn bản trong kho SSoT hiện tại

export interface VerifiedCitationItem {
  raw_citation: string;
  matched_doc_id?: string;
  matched_doc_number?: string;
  matched_article_no?: string;
  matched_clause_no?: string;
  verification_status: CitationVerificationStatus;
  authenticity_tier?: AuthenticityTier;
  source_excerpt?: string;
  warning_note?: string;
}

export interface CitationVerificationReport {
  total_citations_detected: number;
  verified_ssot_count: number;
  excerpt_warning_count: number;
  unverified_external_count: number;
  trust_score_percent: number;
  citations: VerifiedCitationItem[];
  has_hallucination_risk: boolean;
}

// ============================================================================
// 3. LEGAL AI REASONING ENGINE (3 MODES × 6 STEPS IRAC+)
// ============================================================================

export type LegalReasoningMode =
  | 'JUDICIAL_ANALYSIS' // Phân tích tài phán / xét xử khách quan
  | 'LEGAL_COUNSEL'     // Tư vấn bảo vệ quyền lợi & phương án phòng ngừa rủi ro cho Doanh nghiệp / Chủ đầu tư
  | 'LEGAL_AUDIT';      // Kiểm toán tuân thủ & hậu kiểm thanh tra / xuất toán

export interface IRACPlusStepRuleItem {
  doc_number: string;
  article_clause_ref: string;
  normative_summary: string;
  effective_status_at_fact_date: string;
  verification_badge?: CitationVerificationStatus;
}

export interface IRACPlusReasoningOutput {
  reasoning_id: string;
  created_at: string;
  mode: LegalReasoningMode;
  reference_date: string;
  case_title: string;
  // Bước 1: ISSUE
  step1_issue: {
    core_legal_question: string;
    material_facts: string[];
    jurisdiction_and_scope: string;
  };
  // Bước 2: RULE
  step2_rules: IRACPlusStepRuleItem[];
  // Bước 3: INTERPRETATION
  step3_interpretation: {
    normative_elements: string[];
    temporal_and_transitional_analysis: string;
  };
  // Bước 4: APPLICATION
  step4_application: {
    fact_to_rule_mapping: Array<{
      fact_statement: string;
      applied_rule_ref: string;
      compliance_assessment: 'PHÙ HỢP' | 'VI PHẠM / RỦI RO XUẤT TOÁN' | 'CẦN BỔ SUNG CHỨNG CỨ';
      analysis: string;
    }>;
  };
  // Bước 5: COUNTERARGUMENT
  step5_counterargument: {
    inspector_or_opposing_view: string;
    rebuttal_or_mitigation_conditions: string[];
    residual_risk_level: 'RẤT CAO' | 'CAO' | 'TRUNG BÌNH' | 'THẤP';
  };
  // Bước 6: CONCLUSION
  step6_conclusion: {
    definitive_conclusion: string;
    mandatory_evidence_dossier: string[];
    actionable_recommendations: string[];
  };
  // Hậu kiểm tất định từ CitationVerifier
  citation_verification_report: CitationVerificationReport;
}

// ============================================================================
// 4. LEGAL CASE WORKSPACE & EVIDENCE-BASED REPORT MODELS
// ============================================================================

export interface CaseFactEvent {
  id: string;
  event_date: string;       // YYYY-MM-DD
  event_title: string;
  description: string;
  related_doc_number?: string;
  related_article_no?: string;
  evidence_code?: string;
}

export interface CaseEvidenceArtifact {
  id: string;
  code: string;             // VD: "EV-HD-01"
  title: string;            // VD: "Hợp đồng thi công xây dựng số 18/2025/HĐ-XD"
  issued_date: string;      // YYYY-MM-DD
  sha256_hash: string;      // Mã băm xác thực chứng cứ
  verification_state: 'VERIFIED_ORIGINAL' | 'COPY_PENDING_CHECK' | 'MISSING_CRITICAL';
  linked_fact_ids: string[];
}

export interface LegalCaseWorkspace {
  id: string;
  case_code: string;        // VD: "HS-DAISON-2026-001"
  title: string;
  project_name: string;
  client_or_unit: string;
  created_at: string;
  updated_at: string;
  primary_reference_date: string; // YYYY-MM-DD
  milestone_initiation_date?: string; // YYYY-MM-DD
  facts: CaseFactEvent[];
  evidences: CaseEvidenceArtifact[];
  reasoning_history: IRACPlusReasoningOutput[];
}
