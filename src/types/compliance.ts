export type { ComplianceRequirementNode } from './legal';

export type AuditPhaseCode = 'PHASE_I' | 'PHASE_II' | 'PHASE_III';

export type ComplianceGateCode =
  | 'G0'
  | 'G1'
  | 'G2'
  | 'G3'
  | 'G4'
  | 'G5'
  | 'G6'
  | 'G7'
  | 'G8'
  | 'G9'
  | 'G10'
  | 'G11'
  | 'G12'
  | 'G13'
  | 'G14'
  | 'G15'
  | 'G16';

export type StandardizedRiskFlagCode =
  | 'RISK_PLANNING'
  | 'RISK_AUTHORITY_CAPITAL'
  | 'RISK_CAPITAL_PLAN'
  | 'RISK_ENV_PROCEDURE'
  | 'RISK_FIRE_SAFETY'
  | 'RISK_SURVEY_BASE'
  | 'RISK_DESIGN_ESTIMATE_ADJUST'
  | 'RISK_VOLUME_UNIT_PRICE'
  | 'RISK_BIDDING_PROCEDURE'
  | 'RISK_CONTRACT_OVERRUN'
  | 'RISK_NO_CONTRACT_ADDENDUM'
  | 'RISK_SAFETY_QUALITY_PROGRESS'
  | 'RISK_MATERIAL_CERT'
  | 'RISK_ACCEPTANCE_BASE'
  | 'RISK_PAYMENT_DOCS'
  | 'RISK_SITE_HANDOVER_DELAY'
  | 'RISK_SETTLEMENT_DOCS'
  | 'RISK_MISSING_DOCS_ORDER';

export type ProjectStepStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'PASSED'
  | 'FLAGGED'
  | 'BLOCKED'
  | 'WAIVED';

export type DeliverableType =
  | 'Hồ sơ số'
  | 'BIM/CDE'
  | 'GIS'
  | 'Quyết định'
  | 'Tờ trình'
  | 'Báo cáo thẩm định'
  | 'Biên bản nghiệm thu'
  | 'Phụ lục hợp đồng';

export interface AuditPhase {
  phase_code: AuditPhaseCode;
  name: string;
  short_name: string;
  order_index: number;
  summary: string;
  accentColor: string;
  bgClass: string;
  borderClass: string;
}

export interface ComplianceGate {
  gate_code: ComplianceGateCode;
  phase_code: AuditPhaseCode;
  name: string;
  icon: string;
  description: string;
  order_index: number;
  prerequisite_gates: ComplianceGateCode[]; // Used by GatekeeperAgent
  total_master_steps: number; // Contributes to the 316 total steps scale
}

export interface RiskFlagMetadata {
  code: StandardizedRiskFlagCode;
  index: number; // 1 -> 18
  label: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  auditConsequence: string;
  legalBasisSummary: string;
}

export interface StepLegalReference {
  law: string;
  docNumber: string;
  article: string;
  excerpt: string;
  docId?: string;
  articleId?: string;
}

export interface MasterComplianceStep {
  step_code: string; // e.g., 'I.1', 'I.2.1', 'II.6.3.1'
  gate_code: ComplianceGateCode;
  phase_code: AuditPhaseCode;
  dossier_group: string; // One of the 32 standardized dossier groups
  step_name: string;
  is_mandatory: boolean; // 282 mandatory, 81 conditional
  governing_body: string; // Cơ quan lập/trình
  inspection_body: string; // Cơ quan thẩm định/kiểm tra/phê duyệt
  deliverables: DeliverableType[];
  risk_flags: StandardizedRiskFlagCode[];
  legal_references: StepLegalReference[];
  digital_checklist_template: string[]; // Biểu mẫu số cần kiểm tra trong DualDrawerInspector
}

export interface AttachedStepFile {
  filename: string;
  url: string;
  hash: string;
  sha256_hash?: string;
  uploaded_at: string;
  mime_type?: string;
  extracted_authority?: string; // Authority extracted by LegalCrossCheckAgent OCR
  extracted_doc_no?: string;
  extracted_doc_title?: string;
  extracted_issue_date?: string;
  extracted_signer?: string;
  total_investment_amount?: string;
  capital_source?: string;
  cited_legal_bases?: string[];
  ocr_full_text_excerpt?: string;
  ocr_confidence_note?: string;
  has_variation_overrun?: boolean; // Detected by AuditDeductionAgent
  has_approved_addendum?: boolean;
}

export interface MicroAgentVerdict {
  gatekeeper: {
    passed: boolean;
    blockedByGates: ComplianceGateCode[];
    message: string;
  };
  legalCrossCheck: {
    passed: boolean;
    detectedAuthority: string;
    expectedAuthority: string;
    triggeredFlags: StandardizedRiskFlagCode[];
    message: string;
  };
  auditDeduction: {
    passed: boolean;
    overrunDetected: boolean;
    addendumVerified: boolean;
    triggeredFlags: StandardizedRiskFlagCode[];
    message: string;
  };
  geminiExecutiveSummary?: string;
  evaluatedAt: string;
}

export interface ProjectStepRecord {
  id: string;
  project_id: string;
  step_code: string;
  status: ProjectStepStatus;
  attached_files: AttachedStepFile[];
  active_risk_flags: StandardizedRiskFlagCode[];
  completed_deliverables: string[];
  ai_audit_verdict: MicroAgentVerdict | null;
  audited_by: string;
  notes: string;
  updated_at: string;
}

export interface ComplianceAuditTrailEntry {
  id: number;
  project_id: string;
  step_code: string;
  action: string;
  actor_id: string;
  previous_state: Partial<ProjectStepRecord> | null;
  new_state: Partial<ProjectStepRecord>;
  created_at: string;
}
