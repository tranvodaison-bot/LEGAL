import type {
  CaseFactEvent,
  IRACPlusReasoningOutput,
  LegalReasoningMode,
} from '../../core/entities/legalDomain';

export interface LegalReasoningRequestPayload {
  mode: LegalReasoningMode;
  referenceDate: string;
  milestoneInitiationDate?: string;
  caseTitle: string;
  facts: CaseFactEvent[];
  rulesContext: IRACPlusReasoningOutput['step2_rules'];
}

export interface LegalReasoningAiEnrichmentResponse {
  core_legal_question?: string;
  sub_issues?: string[];
  normative_elements?: string[];
  counterarguments?: string[];
  rebuttal_or_mitigation_conditions?: string[];
  definitive_conclusion?: string;
  recommended_actions?: string[];
  additional_rules?: Array<{
    doc_number: string;
    article_clause_ref: string;
    normative_summary: string;
    effective_status_at_fact_date?: string;
  }>;
}

/**
 * HTTP Client gọi API Backend có xử lý lỗi minh bạch (Không bao giờ dùng silent fake fallback — Khắc phục P0-05 & P1-03).
 */
export async function invokeLegalReasoningApi(
  payload: LegalReasoningRequestPayload
): Promise<LegalReasoningAiEnrichmentResponse> {
  const response = await fetch('/api/legal-reasoning', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || !data.aiReasoning) {
    const errMsg =
      data?.error ||
      `Lỗi kết nối máy chủ suy luận pháp lý (HTTP ${response.status}). Hệ thống giữ nguyên Kết quả Suy luận Tất định (Deterministic IRAC+ Baseline) từ kho SSoT.`;
    throw new Error(errMsg);
  }

  return data.aiReasoning as LegalReasoningAiEnrichmentResponse;
}
