# MÔ HÌNH DỮ LIỆU MIỀN PHÁP LUẬT (LEGAL DOMAIN DATA MODEL)
**Dự án:** ĐẠI SƠN LEGAL — Legal Knowledge & Reasoning Platform  
**Giai đoạn:** Bước 1 (Hoàn thiện) — Đặc tả Mô hình Dữ liệu, Quan hệ, Kiểm soát Phiên bản & Tính Trung thực Nguồn  
**Tệp đối chứng hiện trạng:** `src/types/legal.ts` (dòng 1–328), `src/types/compliance.ts` (dòng 1–186)

---

## 1. NGUYÊN TẮC THIẾT KẾ & BẢO TOÀN TƯƠNG THÍCH NGƯỢC

Mô hình dữ liệu miền pháp luật được thiết kế để:
1. **Bảo toàn 100% các trường hiện có** trong `src/types/legal.ts` (`LegalDocument`, `LegalArticle`, `ClauseItem`, `ClauseDiff`, `LegalCrossReference`) và `src/types/compliance.ts` (`ComplianceGate`, `MasterComplianceStep`, `ProjectStepRecord`) nhằm giữ nguyên toàn bộ giao diện hiện hành.
2. **Giải quyết triệt để 12 Khoảng trống (`GAP-01`..`GAP-12`) và 11 Rủi ro (`P0-01`..`P2-02`)** thông qua 6 nhóm thực thể chuẩn hóa tương ứng với 6 phân hệ trong `TARGET_WORKFLOW.md`.

---

## 2. SƠ ĐỒ QUAN HỆ THỰC THỂ & QUYỀN SỞ HỮU DỮ LIỆU (DATA OWNERSHIP)

| Phân hệ Nghiệp vụ | Thực thể Sở hữu Chính (Primary Entities) | Khóa Chính & Khóa Ngoại (PK / FK) | Ràng buộc Toàn vẹn Bắt buộc (Integrity Constraints) |
| :--- | :--- | :--- | :--- |
| **1. Legal Library** | `LegalDocument`, `OfficialSourceProvenance`, `LegalArticle`, `ClauseItem`, `LegalPointItem` | `doc.id` → `article.document_id` → `clause.id` → `point.id` | Văn bản có `authenticity_tier === 'VERIFIED_OFFICIAL_SSOT'` bắt buộc có `is_immutable = true` và cấm mọi thao tác ghi đè từ AI (`P0-01`). |
| **2. Legal Knowledge Graph** | `ProvisionTemporalVersion`, `TransitionalProvisionRule`, `LegalKnowledgeEdge` | `edge.source_doc_id`, `edge.source_article_id`, `edge.source_clause_id` ↔ `target_*` | Mọi cạnh sửa đổi/bãi bỏ phải có `effective_from` chuẩn `YYYY-MM-DD` và câu trích dẫn nguyên văn (`verbatim_basis_quote`). |
| **3. Cross-Law Audit** | `CrossLawAuditResponse`, `CrossLawMatrixItem`, `CitationVerificationRecord` | `item.target_doc_id`, `item.target_article_id` | Không được dùng mảng 4 luật cố định khi không có liên kết thực (`P0-05`); mọi trích dẫn phải qua `CitationVerifier` (`P1-02`). |
| **4. Legal AI Reasoning** | `LegalReasoningTrace` (6 bước `IRAC+`), `GroundedRuleCitation` | `trace.trace_id`, `citation.doc_id`, `citation.article_id`, `citation.clause_id` | Bắt buộc đi qua 6 bước `Issue → Rule → Interpretation → Application → Counterargument → Conclusion`; cấm trả lời khi thiếu căn cứ SSoT (`P0-05`, `P1-03`). |
| **5. Legal Case Workspace** | `LegalCaseDossier`, `CaseFactEvent`, `VerifiableEvidenceArtifact` | `case.case_id` → `event.event_id`, `evidence.evidence_id` | Mọi chứng cứ phải có mã băm `file_sha256_hash` chuẩn 64 ký tự hex (cấm dùng `Math.random()`, `P0-04`). |
| **6. Governance & Evidence Audit** | `AuditLogEntry`, `EvidenceBasedReportSnapshot`, `QuarantineVerificationRecord` | `report.report_id` → `case.case_id`, `trace.trace_id` | Mọi kết luận trong báo cáo đều phải truy ngược được về `citation_id` và `evidence_id`. |

---

## 3. ĐẶC TẢ TYPESCRIPT CHI TIẾT CHO CÁC THỰC THỂ MỤC TIÊU

### 3.1. Phân tầng Độ Xác thực Nguồn & Bản chất Hợp nhất (`GAP-01`, `GAP-02`, `GAP-03`, `GAP-05`)

```typescript
/**
 * Phân tầng độ xác thực của văn bản pháp luật trong hệ thống (Giải quyết P0-01, P0-02, P0-04).
 */
export type LegalAuthenticityTier =
  | 'VERIFIED_OFFICIAL_SSOT'          // Đã đối chiếu nguyên văn 100% với Công báo / vbpl.vn, khóa chỉ đọc
  | 'PARTIAL_VERIFIED_EXTRACT'        // Văn bản có thật trên Công báo, đã xác minh metadata nhưng mới nạp trích lược các Điều trọng tâm
  | 'UNVERIFIED_INGESTION_QUARANTINE' // Văn bản mới nạp qua OCR / nhập tay, đang cách ly chờ chuyên viên đối chiếu bản gốc
  | 'INTERNAL_GUIDE_SANDBOX';         // Tài liệu hướng dẫn sử dụng nội bộ hoặc kịch bản thử nghiệm (tách khỏi kho QPPL)

/**
 * Phân biệt bản chất pháp lý của văn bản gốc, VBHN chính thức và Bản tổng hợp nội bộ (Giải quyết P0-03).
 */
export type DocumentConsolidationNature =
  | 'ORIGINAL_ENACTED_LAW'            // Văn bản quy phạm pháp luật gốc (Luật, Nghị định, Thông tư)
  | 'OFFICIAL_SIGNED_VBHN'            // Văn bản hợp nhất chính thức do VP Quốc hội / Bộ trưởng ký xác thực theo Pháp lệnh 01/2012/UBTVQH13
  | 'INTERNAL_WORKING_SYNTHESIS';     // Bản tổng hợp nội bộ do phần mềm tự ghép để tra cứu (KHÔNG có giá trị thay thế VBHN chính thức)

/**
 * Bằng chứng nguồn gốc và tỷ lệ nạp toàn văn của văn bản (Giải quyết P0-02, P0-04, P2-01).
 */
export interface OfficialSourceProvenance {
  official_gazette_ref?: string;      // Số & ngày Công báo hoặc nguồn chính thức (chinhphu.vn, moc.gov.vn, vbpl.vn)
  national_db_url?: string;           // Đường dẫn trực tiếp tới văn bản gốc trên CSDL Quốc gia
  source_file_sha256?: string;        // Mã băm SHA-256 chuẩn 64 ký tự hex của tệp gốc (cấm dùng Math.random)
  verified_by?: string;               // Chuyên viên pháp chế đã kiểm duyệt
  verified_at?: string;               // Thời điểm ký xác nhận đưa vào SSoT (ISO 8601)
  is_immutable: boolean;              // true đối với VERIFIED_OFFICIAL_SSOT và PARTIAL_VERIFIED_EXTRACT
  completeness_ratio: {
    loaded_articles_count: number;    // Số Điều đã nạp trong mảng articles
    total_official_articles_count: number; // Tổng số Điều theo bản gốc Công báo
    loaded_clauses_count: number;     // Số Khoản đã nạp chi tiết
    total_official_clauses_count: number;  // Tổng số Khoản theo bản gốc Công báo
    is_full_verbatim: boolean;        // true khi và chỉ khi đã nạp đủ 100% nguyên văn
  };
}
```

---

### 3.2. Cấu trúc Điểm (`LegalPointItem`), Phiên bản Thời gian (`ProvisionTemporalVersion`) & Điều khoản Chuyển tiếp (`GAP-04`, `GAP-07`)

```typescript
/**
 * Lịch sử phiên bản theo thời điểm của một Điều/Khoản/Điểm (Giải quyết P1-01).
 */
export interface ProvisionTemporalVersion {
  version_id: string;
  version_seq: number;                // 1 = Bản gốc, 2 = Sửa đổi lần 1, 3 = Sửa đổi lần 2...
  verbatim_text: string;              // Nội dung nguyên văn trong khoảng thời gian có hiệu lực
  effective_from: string;             // Ngày bắt đầu có hiệu lực (YYYY-MM-DD)
  effective_to: string | null;        // Ngày kết thúc hiệu lực (null nếu đang có hiệu lực)
  amending_doc_id: string;            // ID văn bản ban hành hoặc sửa đổi
  amending_doc_number: string;        // Số hiệu văn bản (VD: "88/2015/QH13", "56/2024/QH15")
  change_type: 'ORIGINAL' | 'AMENDED' | 'SUPPLEMENTED' | 'REPEALED';
}

/**
 * Điều khoản chuyển tiếp (Transitional Provision) để giải bài toán giao dịch phát sinh trước ngày luật mới có hiệu lực.
 */
export interface TransitionalProvisionRule {
  rule_id: string;
  amending_doc_id: string;
  amending_doc_number: string;
  article_ref: string;                // VD: "Điều 10 Luật số 56/2024/QH15"
  effective_cutoff_date: string;      // VD: "2025-01-01"
  applies_to_scope: string;           // Phạm vi hồ sơ/giao dịch áp dụng chuyển tiếp
  rule_before_cutoff: 'APPLY_ORIGINAL_PROVISION' | 'APPLY_AMENDED_PROVISION' | 'CONDITIONAL';
  verbatim_transitional_text: string; // Nguyên văn quy định chuyển tiếp
}

/**
 * Đơn vị quy phạm cấp Điểm (a, b, c, d, đ...) thuộc Khoản (Giải quyết GAP-04).
 */
export interface LegalPointItem {
  id: string;
  point_letter: string;               // "a", "b", "c", "đ"...
  text: string;                       // Nội dung nguyên văn của Điểm
  is_amended?: boolean;
  is_repealed?: boolean;
  temporal_versions?: ProvisionTemporalVersion[];
}
```

---

### 3.3. Đồ thị Tri thức Pháp lý Đa chiều & Bộ Kiểm chứng Trích dẫn (`GAP-08`)

```typescript
export type KnowledgeGraphEdgeType =
  | 'HUONG_DAN_THI_HANH'
  | 'SUA_DOI_BO_SUNG'
  | 'THAY_THE'
  | 'BAI_BO_MOT_PHAN'
  | 'DAN_CHIEU'
  | 'RANG_BUOC_DIEU_KIEN_TIEN_QUYET'
  | 'DIEU_KHOAN_CHUYEN_TIEP';

export interface LegalKnowledgeEdge {
  id: string;
  source_doc_id: string;
  source_article_id: string;
  source_clause_id?: string;
  source_point_id?: string;
  target_doc_id: string;
  target_article_id: string;
  target_clause_id?: string;
  target_point_id?: string;
  relation_type: KnowledgeGraphEdgeType;
  effective_from: string;
  effective_to?: string | null;
  verbatim_basis_quote: string;
  is_verified_in_ssot: boolean;
}

/**
 * Kết quả hậu kiểm trích dẫn từ Deterministic Citation Verifier (Giải quyết P1-02, P1-03).
 */
export interface CitationVerificationResult {
  raw_citation_text: string;
  matched_doc_id: string | null;
  matched_doc_number: string | null;
  matched_article_id: string | null;
  matched_article_no: string | null;
  matched_clause_id?: string | null;
  verification_status:
    | 'VERIFIED_IN_SSOT'              // Tồn tại chính xác trong kho văn bản đã xác minh
    | 'DOC_FOUND_ARTICLE_NOT_LOADED'  // Văn bản có trong kho nhưng Điều này thuộc phần chưa nạp toàn văn
    | 'UNVERIFIED_EXTERNAL_CITATION'  // Không tìm thấy trong kho SSoT (cần kiểm chứng bản gốc ngoài hệ thống)
    | 'BLOCKED_HALLUCINATION';        // Phát hiện số Điều vượt quá tổng số Điều của văn bản hoặc sai lệch số hiệu
  validity_at_target_date?: 'ACTIVE' | 'AMENDED' | 'NOT_YET_EFFECTIVE' | 'EXPIRED';
}
```

---

### 3.4. Bộ máy Lập luận Pháp lý 3 Chế độ × 6 Bước `IRAC+` (`GAP-06`, `GAP-09`)

```typescript
export type LegalReasoningMode =
  | 'JUDICIAL_ANALYSIS'               // Phân tích xét xử / tài phán khách quan
  | 'LEGAL_COUNSEL'                   // Tư vấn pháp chế & giải pháp tuân thủ
  | 'LEGAL_AUDIT';                    // Kiểm toán tuân thủ & kiểm soát rủi ro xuất toán

export type EpistemicConclusionStatus =
  | 'CONCLUSIVE_VERIFIED'             // Đủ căn cứ pháp lý trong SSoT và đủ chứng cứ xác thực
  | 'CONDITIONAL_ON_EVIDENCE'         // Có căn cứ pháp lý trong SSoT nhưng cần bổ sung chứng cứ hồ sơ thực tế
  | 'ABSTAINED_INSUFFICIENT_SSOT'     // Từ chối đưa ra kết luận khẳng định vì kho SSoT chưa có toàn văn điều khoản liên quan
  | 'ABSTAINED_SERVICE_UNAVAILABLE';  // Từ chối sinh câu trả lời giả định khi dịch vụ AI không khả dụng (chỉ xuất dữ liệu Deterministic)

export interface LegalReasoningTrace {
  trace_id: string;
  reasoning_mode: LegalReasoningMode;
  as_of_date: string;                 // Ngày sự kiện pháp lý được xét (YYYY-MM-DD)
  transaction_inception_date?: string;// Ngày bắt đầu giao dịch/dự án (để xét điều khoản chuyển tiếp)
  created_at: string;

  /** Bước 1: ISSUE — Xác định vấn đề pháp lý, chủ thể và mốc thời gian */
  step1_issue: {
    legal_question: string;
    key_subjects: string[];
    relevant_event_date: string;
    factual_premises: string[];
  };

  /** Bước 2: RULE — Quy phạm pháp luật áp dụng (đã khóa từ SSoT tại thời điểm as_of_date) */
  step2_rule: {
    grounded_provisions: Array<{
      doc_id: string;
      doc_number: string;
      article_no: string;
      clause_no?: string;
      verbatim_text_at_event_date: string;
      version_effective_from: string;
      authenticity_tier: LegalAuthenticityTier;
      verification: CitationVerificationResult;
    }>;
    transitional_notes: string[];
    unloaded_provisions_disclosure: string[]; // Công khai các điều khoản chưa nạp toàn văn trong kho
  };

  /** Bước 3: INTERPRETATION — Giải thích quy phạm & điều kiện áp dụng */
  step3_interpretation: {
    mandatory_conditions: string[];
    prohibitions_and_limits: string[];
    implementing_decree_circular_notes: string;
  };

  /** Bước 4: APPLICATION — Đối chiếu quy phạm vào tình tiết và chứng cứ hồ sơ */
  step4_application: {
    condition_checks: Array<{
      condition: string;
      evidence_ref?: string;
      evidence_status: 'VERIFIED' | 'MISSING' | 'PENDING_REVIEW';
      evaluation: string;
    }>;
  };

  /** Bước 5: COUNTERARGUMENT — Phản biện, ngoại lệ và rủi ro giải thích khác */
  step5_counterargument: {
    alternative_interpretations: string[];
    statutory_exceptions: string[];
    audit_disallowance_or_dispute_risks: string[];
  };

  /** Bước 6: CONCLUSION — Kết luận pháp lý dựa trên bằng chứng */
  step6_conclusion: {
    epistemic_status: EpistemicConclusionStatus;
    summary: string;
    recommended_actions: string[];
    disallowance_exposure_level?: 'RẤT CAO' | 'CAO' | 'TRUNG BÌNH' | 'THẤP';
  };

  /** Chốt chặn kiểm toán chống bịa đặt (Guardrail Audit) */
  guardrail_audit: {
    citations_checked_count: number;
    verified_in_ssot_count: number;
    blocked_or_unverified_count: number;
    citation_verifications: CitationVerificationResult[];
  };
}
```

---

### 3.5. Hồ sơ Vụ việc (`LegalCaseWorkspace`) & Báo cáo Dựa trên Bằng chứng (`GAP-10`, `GAP-11`)

```typescript
export interface CaseFactMilestone {
  milestone_id: string;
  event_date: string;                 // YYYY-MM-DD (truyền trực tiếp vào PointInTimeLegalResolver)
  title: string;
  stage_gate_code?: string;           // Liên kết với G0..G16
  evidence_artifact_ids: string[];
  notes?: string;
}

export interface EvidenceBasedReportSnapshot {
  report_id: string;
  report_title: string;
  generated_at: string;
  as_of_date: string;
  case_milestones: CaseFactMilestone[];
  verified_provisions_used: LegalReasoningTrace['step2_rule']['grounded_provisions'];
  reasoning_traces: LegalReasoningTrace[];
  stage_gate_verdicts: Array<{
    gate_code: string;
    gate_name: string;
    status: 'PASSED' | 'LOCKED' | 'WARNING';
    evidence_sha256_list: string[];
  }>;
  epistemic_limitations_disclosure: string[];
  report_integrity_sha256: string;
}
```
