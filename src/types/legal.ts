export type LegalField =
  | 'Xây dựng'
  | 'Đấu thầu'
  | 'Hợp đồng xây dựng'
  | 'Đất đai'
  | 'Môi trường'
  | 'PCCC'
  | 'Tài chính'
  | 'Đầu tư & QLDA'
  | 'Doanh nghiệp & HĐQT'
  | 'Lao động & An toàn'
  | 'Dữ liệu cá nhân & An ninh mạng'
  | 'Thương mại điện tử'
  | 'Chuyển đổi số'
  | 'Kế toán · Kiểm toán'
  | 'Thuế · Phí'
  | 'Hóa đơn · Chứng từ'
  | 'Hải quan · XNK'
  | 'Thanh tra'
  | 'Thủ tục hành chính'
  | 'Hướng dẫn sử dụng';

export type ProjectLifecycleStage =
  | 'Quy hoạch'
  | 'Chuẩn bị đầu tư'
  | 'Thực thi'
  | 'Quyết toán';

export type LegalDocType =
  | 'Bộ luật'
  | 'Luật'
  | 'Nghị quyết'
  | 'Nghị định'
  | 'Thông tư'
  | 'Thông tư liên tịch'
  | 'Quyết định'
  | 'Văn bản hợp nhất'
  | 'Công văn'
  | 'Biểu mẫu'
  | 'Quy chuẩn QCVN'
  | 'Tài liệu';

export type LegalDocumentStatus =
  | 'CON_HIEU_LUC'
  | 'SUA_DOI_BO_SUNG'
  | 'DANG_DU_THAO'
  | 'HET_HIEU_LUC';

export type CrossRefRelationType =
  | 'HUONG_DAN_THI_HANH'
  | 'SUA_DOI_BO_SUNG'
  | 'THAY_THE'
  | 'DAN_CHIEU';

// Legacy aliases for compatibility across components
export type LegalCategory = LegalField;
export type LegalStatus = LegalDocumentStatus;

export interface ComplianceRequirementNode {
  id: string;
  code: string; // e.g., "L1.1", "L2.1"
  groupCode: string; // e.g., "L1", "L2"
  groupTitle: string; // e.g., "L1 · Nguyên tắc chung và hành vi bị cấm"
  title: string; // e.g., "Đồng ý chỉ hợp lệ khi tự nguyện và biết rõ loại dữ liệu, mục đích, bên kiểm soát, quyền và nghĩa vụ"
  priority: 'Rất cao' | 'Cao' | 'Trung bình';
  citation: string; // e.g., "Khoản 2 Điều 9 Luật 91/2025/QH15"
  docId: string;
  articleId?: string;
  penaltyNote?: string;
}

export type AmendmentActionType =
  | 'SUA_DOI_BO_SUNG'
  | 'BAI_BO_MOT_PHAN'
  | 'THAY_THE'
  | 'DINH_CHINH';

export interface AmendmentHistoryItem {
  amending_doc_id: string;
  amending_doc_number?: string;
  amending_doc_title: string;
  promulgation_date: string;       // YYYY-MM-DD
  effective_date?: string;         // YYYY-MM-DD
  scopes: string[];                // e.g., ["Điều 11", "Điều 20", "Điều 29"]
  action_type: AmendmentActionType;
  summary?: string;
}

export interface ArticleAmendmentInfo {
  amending_doc_id?: string;
  amending_doc_number: string;     // Số hiệu văn bản sửa đổi hiển thị trên badge: VD "56/2024/QH15" hoặc "38/2019/QH14, 108/2025/QH15"
  amending_doc_title?: string;
  promulgation_date?: string;
  effective_date?: string;
  action_type?: AmendmentActionType;
  scopes?: string[];
  summary?: string;
  previous_excerpt?: string;
}

export interface ClauseDiff {
  original_text: string;          // Văn bản gốc bị gạch bỏ (trước khi sửa đổi)
  replaced_text: string;          // Nội dung thay thế mới đang có hiệu lực
  amending_doc_id: string;        // ID văn bản sửa đổi trong kho SSoT (VD: 'doc-lsd9luat-56-2024')
  amending_doc_number?: string;   // Số hiệu văn bản sửa đổi (VD: '56/2024/QH15')
  amending_doc_title?: string;    // Trích yếu văn bản sửa đổi
  effective_date: string;         // Ngày bắt đầu có hiệu lực của nội dung sửa đổi (YYYY-MM-DD)
  change_summary?: string;        // Tóm tắt nội dung & lý do sửa đổi tại chỗ
}

export interface LegalPointItem {
  id: string;                     // VD: "art-lkt88-d3-k1-pa"
  point_letter: string;           // VD: "Điểm a", "Điểm b", "Điểm đ"
  text: string;                   // Nội dung hiện hành của Điểm
  is_amended?: boolean;
  is_annulled?: boolean;
  temporal_versions?: ProvisionTemporalVersion[];
}

export interface ProvisionTemporalVersion {
  version_id: string;             // VD: "ver-lkt88-d3-k1-2015", "ver-lkt88-d3-k1-2025"
  text: string;                   // Nguyên văn lời văn tại giai đoạn lịch sử này
  effective_from: string;         // Ngày bắt đầu có hiệu lực (YYYY-MM-DD)
  effective_to: string | null;    // Ngày hết hiệu lực (YYYY-MM-DD) hoặc null nếu đang hiện hành
  enacting_doc_id: string;        // ID văn bản ban hành/sửa đổi tạo ra phiên bản này
  enacting_doc_number: string;    // Số hiệu văn bản (VD: "88/2015/QH13" hoặc "56/2024/QH15")
  change_type: 'ORIGINAL' | 'AMENDED' | 'SUPPLEMENTED' | 'ANNULLED';
  change_summary?: string;
}

export interface TransitionalProvisionRule {
  id: string;
  rule_article_ref: string;       // VD: "Điều 95 Luật Xây dựng 135/2025/QH15"
  cut_off_event: string;          // Sự kiện mốc (VD: "Ngày phê duyệt dự án đầu tư", "Ngày phát hành HSMT")
  cut_off_date: string;           // Ngày mốc chuyển tiếp (YYYY-MM-DD, VD: "2026-01-01")
  before_cut_off_law_doc_id: string; // Văn bản áp dụng nếu sự kiện xảy ra TRƯỚC ngày mốc
  before_cut_off_rule_summary: string;
  on_or_after_cut_off_law_doc_id: string; // Văn bản áp dụng nếu sự kiện xảy ra TỪ ngày mốc trở đi
  on_or_after_cut_off_rule_summary: string;
}

export interface ClauseItem {
  id: string;                     // ID định danh Khoản (VD: 'art-lkt88-d3-k1')
  clause_no: string;              // Nhãn Khoản (VD: 'Khoản 1', 'Khoản 2')
  text: string;                   // Nội dung hiện hành của Khoản
  is_amended?: boolean;           // Cờ đánh dấu Khoản đã bị sửa đổi, bổ sung
  is_annulled?: boolean;          // Cờ đánh dấu Khoản đã bị bãi bỏ
  diff_data?: ClauseDiff;         // Dữ liệu đối chiếu bản gốc và bản sửa đổi tại chỗ (In-place Diff)
  points?: string[];              // Danh sách các Điểm a), b), c) thuộc Khoản (tùy chọn)
  structured_points?: LegalPointItem[]; // Cấu trúc Điểm chuẩn hóa theo LEGAL_DOMAIN_DATA_MODEL.md
  temporal_versions?: ProvisionTemporalVersion[]; // Lịch sử hiệu lực theo thời điểm (Point-in-Time)
}

export type LegalClause = ClauseItem;

export type CitationVerificationStatus =
  | 'VERIFIED_FULL_SSOT'          // Khớp 100% với Điều/Khoản có thật trong văn bản Toàn văn SSoT
  | 'VERIFIED_EXCERPT_SSOT'       // Khớp 100% với Điều/Khoản đã nạp trong văn bản Trích lược SSoT
  | 'DOC_FOUND_ARTICLE_UNLOADED'  // Văn bản có trong SSoT nhưng Điều được trích dẫn chưa nạp toàn văn
  | 'UNVERIFIED_EXTERNAL'         // Văn bản nằm ngoài SSoT hiện tại (cần tra cứu Công báo độc lập)
  | 'BLOCKED_HALLUCINATION';      // BỊ CHẶN: Trích dẫn mâu thuẫn với SSoT (VD: Điều số 500 trên Luật chỉ có 95 Điều)

export interface CitationVerificationResult {
  raw_citation_text: string;      // VD: "Khoản 3 Điều 14 Luật Xây dựng số 135/2025/QH15"
  status: CitationVerificationStatus;
  matched_doc_id?: string;
  matched_doc_number?: string;
  matched_article_id?: string;
  matched_article_no?: string;
  matched_clause_id?: string;
  verification_note: string;      // Thuyết minh hiển thị trên badge kiểm chứng
}

export interface CrossLawMatrixItem {
  target_law_domain: string;      // VD: "Luật Xây dựng", "Luật Đất đai", "Luật Đấu thầu", "Nghị định hướng dẫn"
  target_doc_id?: string;         // ID văn bản đích trong kho SSoT nếu có
  target_doc_number: string;      // Số hiệu văn bản đích (VD: "135/2025/QH15", "22/2023/QH15")
  target_clause_ref: string;      // Điều/Khoản/Điểm đối chiếu (VD: "Khoản 3 Điều 14 & Điều 112")
  relation_nature: 'ĐỒNG BỘ BẮT BUỘC' | 'ĐIỀU KIỆN TIÊN QUYẾT' | 'GIAO THOA THẨM QUYỀN' | 'RỦI RO XUNG ĐỘT HỒ SƠ';
  cross_analysis: string;         // Phân tích ma trận đối soát chéo giữa Điều đang xem và quy định liên ngành
  audit_evidence_required: string;// Chứng từ / Hồ sơ pháp lý bắt buộc phải khớp nối
  citation_verification?: CitationVerificationResult; // Kết quả hậu kiểm tất định từ CitationVerifier
}

export interface CrossLawAuditResponse {
  executive_conclusion: string;
  deduction_risk_level: 'RẤT CAO' | 'CAO' | 'TRUNG BÌNH';
  deduction_risk_warning: string;
  matrix_items: CrossLawMatrixItem[];
  mandatory_checklist: string[];
}

export type AuthenticityTier =
  | 'VERIFIED_SSOT'       // Văn bản QPPL chính thức đã đối chiếu Công báo và nạp đầy đủ toàn văn
  | 'VERIFIED_FULL_SSOT'  // Alias chuẩn theo LEGAL_DOMAIN_DATA_MODEL.md
  | 'VERIFIED_EXCERPT'    // Văn bản QPPL có thật trên Công báo, hiện nạp trích lược các điều khoản trọng tâm
  | 'OFFICIAL_VBHN'       // Văn bản hợp nhất chính thức do VPQH hoặc Bộ/Ngành ký xác thực hợp nhất
  | 'INTERNAL_SYNTHESIS'  // Bản tổng hợp nội bộ phục vụ tra cứu nhanh (không phải VBHN chính thức)
  | 'INTERNAL_WORKING_SYNTHESIS' // Alias chuẩn theo LEGAL_DOMAIN_DATA_MODEL.md
  | 'QUARANTINE_REVIEW'   // Văn bản nạp qua OCR hoặc người dùng tải lên đang chờ kiểm duyệt SSoT
  | 'UNVERIFIED_OCR_QUARANTINE' // Alias chuẩn theo LEGAL_DOMAIN_DATA_MODEL.md
  | 'REFERENCE_GUIDE';    // Tài liệu hướng dẫn sử dụng nội bộ

export type LegalAuthenticityTier =
  | 'VERIFIED_FULL_SSOT'
  | 'VERIFIED_EXCERPT'
  | 'OFFICIAL_VBHN'
  | 'INTERNAL_WORKING_SYNTHESIS'
  | 'UNVERIFIED_OCR_QUARANTINE';

export type DocumentConsolidationNature =
  | 'PRIMARY_PROMULGATED' // Văn bản gốc ban hành lần đầu hoặc văn bản sửa đổi, bổ sung độc lập
  | 'OFFICIAL_VBHN'       // Văn bản hợp nhất chính thức của cơ quan nhà nước có thẩm quyền
  | 'INTERNAL_SYNTHESIS'; // Bản tổng hợp nội bộ của hệ thống (CẤM đóng dấu sao y bản chính)

export interface OfficialSourceProvenance {
  official_gazette_no?: string;    // Số Công báo (VD: "Công báo số 815 + 816 năm 2024")
  official_portal_url?: string;    // URL tới vbpl.vn, congbao.chinhphu.vn hoặc chinhphu.vn
  verified_at: string;             // Ngày kiểm chứng đối chiếu văn bản gốc (YYYY-MM-DD)
  verified_by: string;             // Chủ thể kiểm chứng (VD: "Hội đồng Pháp chế & Kiểm toán ĐẠI SƠN")
  sha256_checksum: string;         // Mã băm SHA-256 thực tế (Web Crypto / Node Crypto) của nội dung chuẩn
}

export interface DocumentCompletenessMeta {
  total_articles_in_official_doc: number;  // Tổng số Điều của văn bản gốc ngoài đời thực (VD: 260 Điều với Luật Đất đai)
  loaded_articles_count: number;           // Số Điều hiện đã nạp nguyên văn vào SSoT (VD: 3 Điều)
  total_clauses_in_loaded_articles?: number; // Tổng số Khoản của các Điều đã nạp
  loaded_clauses_count?: number;           // Số Khoản đã tách cấu trúc chi tiết
  is_full_text: boolean;                   // Chỉ = true khi loaded_articles_count === total_articles_in_official_doc
  completeness_ratio_label: string;        // VD: "Bản trích lược: 3/260 Điều trọng tâm (1.2%)" hoặc "Toàn văn: 12/12 Điều (100%)"
}

export interface CompletenessMetadata {
  loaded_articles_count: number;
  total_articles_count: number;
  completeness_percent: number;
  is_full_text: boolean;
  note?: string;
}

export interface LegalArticle {
  id: string;              // UUID / PK (document_articles.id)
  document_id: string;     // FK -> documents.id
  chapter_no: string;      // e.g., "Chương III"
  chapter_title: string;   // e.g., "Quản lý dự án đầu tư xây dựng"
  section_no?: string;     // e.g., "Mục 1" (Bổ sung cấp Mục)
  section_title?: string;  // e.g., "Quy định chung về quản lý dự án"
  article_no: string;      // e.g., "Điều 14"
  article_order?: number;  // Số thứ tự Điều dùng để sắp xếp chính xác (VD: 14)
  article_title: string;   // e.g., "Điều kiện khởi công xây dựng công trình"
  content: string;         // Toàn văn nội dung điều khoản
  is_active: boolean;      // Trạng thái hiệu lực của riêng điều khoản
  keywords: string[];
  amendment_note?: string;
  is_amended?: boolean;    // Cờ cảnh báo Điều khoản đã bị sửa đổi, bổ sung
  is_annulled?: boolean;   // Cờ cảnh báo Điều khoản đã bị bãi bỏ
  amendment_info?: ArticleAmendmentInfo; // Chi tiết phả hệ sửa đổi của Điều khoản
  clause_count?: number;   // Số lượng Khoản trong Điều (VD: 19 khoản)
  total_clauses_in_official_article?: number; // Tổng số khoản thực tế của Điều này trong bản Công báo
  point_count?: number;    // Số lượng Điểm trong Điều
  clauses?: ClauseItem[];  // Danh sách từng Khoản chi tiết phục vụ In-place Diff Viewer
  temporal_versions?: ProvisionTemporalVersion[]; // Lịch sử hiệu lực cấp Điều
  is_ai_draft?: boolean;   // Cờ đánh dấu bản nháp AI (CẤM đưa vào VERIFIED_SSOT)
}

// Alias chuẩn cho Article theo đặc tả phả hệ văn bản
export type Article = LegalArticle;

export type DocumentStatusFilterType =
  | 'all'
  | 'DANG_HIEU_LUC'
  | 'SAP_HET_HIEU_LUC'
  | 'VAN_BAN_HOP_NHAT'
  | 'SUA_DOI_BO_SUNG'
  | 'HET_HIEU_LUC';

export interface LegalDocument {
  id: string;                      // UUID / PK (documents.id)
  doc_type: LegalDocType;          // Luật, Nghị định, Thông tư, Quyết định, Tài liệu...
  issuing_body: string;            // Quốc hội, Chính phủ, Bộ Xây dựng, Bộ Công an...
  doc_number: string;              // Số hiệu duy nhất: VD: 135/2025/QH15, 91/2025/QH15
  title: string;                   // Trích yếu nội dung chính
  short_title: string;             // Tên rút gọn hiển thị trên nút đồ thị
  issue_date: string;              // YYYY-MM-DD
  effective_date: string;          // YYYY-MM-DD
  expiration_date: string | null;  // YYYY-MM-DD hoặc null nếu còn hiệu lực
  status: LegalDocumentStatus;     // CON_HIEU_LUC, HET_HIEU_LUC, SUA_DOI_BO_SUNG, DANG_DU_THAO
  field: LegalField;               // Lĩnh vực chuyên ngành
  project_stage: ProjectLifecycleStage; // Giai đoạn vòng đời dự án (WBS)
  signer: string;
  summary: string;
  source_url?: string;
  national_database_url?: string;  // Liên kết CSDL Quốc gia về văn bản pháp luật (VD: https://vbpl.vn)
  total_clauses_count?: number;    // Tổng số Khoản/Điểm toàn văn bản (VD: 509)
  total_articles_count?: number;   // Tổng số Điều của văn bản gốc theo Công báo (VD: 73)
  authenticity_tier?: AuthenticityTier; // Phân tầng xác thực SSoT
  consolidation_nature?: DocumentConsolidationNature; // Phân loại bản chất hợp nhất
  official_provenance?: OfficialSourceProvenance; // Nguồn gốc xuất xứ & mã băm SHA-256 thực tế
  completeness?: DocumentCompletenessMeta; // Thông tin độ phủ theo LEGAL_DOMAIN_DATA_MODEL.md
  completeness_meta?: CompletenessMetadata; // Thông tin tỷ lệ nạp điều khoản (X/Y Điều)
  transitional_rules?: TransitionalProvisionRule[]; // Quy tắc chuyển tiếp giải quyết thời điểm áp dụng
  quarantine_info?: {
    uploaded_at: string;
    uploaded_by: string;
    ocr_engine_used: string;
    review_status: 'PENDING_HUMAN_REVIEW' | 'REJECTED' | 'APPROVED_TO_SSOT';
    missing_fields: string[];
  };
  sha256_hash?: string;            // Mã băm SHA-256 của tệp gốc hoặc nội dung xác thực
  official_gazette_ref?: string;   // Tham chiếu Công báo / Nguồn chính thức
  is_sample_ref?: boolean;         // Từ danh mục tham chiếu VBPL
  replaced_by_doc_id?: string;     // Dùng cho sơ đồ cây Văn bản hết hiệu lực -> Văn bản thay thế
  replaced_by_label?: string;
  amended_count?: number;          // Số lần văn bản đã qua sửa đổi, bổ sung (hiển thị badge 🧬 {amended_count})
  amendment_history?: AmendmentHistoryItem[]; // Danh sách lịch sử phả hệ sửa đổi xếp theo thời gian
  is_amending_document?: boolean;  // Cờ đánh dấu đây là văn bản sửa đổi, bổ sung (hiển thị badge "SĐ")
  amends_doc_ids?: string[];       // Danh sách ID các văn bản gốc mà văn bản này sửa đổi
  is_consolidated?: boolean;       // Cờ đánh dấu Văn bản hợp nhất chính thức (VBHN do cơ quan nhà nước ký xác thực)
  consolidated_doc_number?: string;// Số hiệu Văn bản hợp nhất chính thức (VD: "13/VBHN-BCT")
  is_expiring_soon?: boolean;      // Cờ đánh dấu Văn bản sắp hết hiệu lực (đang trong giai đoạn chuyển tiếp trước ngày hết hiệu lực)
  compliance_stats?: {
    total_sections: number;
    very_high_count: number;
    high_count: number;
    medium_count?: number;
  };
  is_new_daily_update?: boolean;
  daily_update_note?: string;
  legacy_doc_id?: string;          // Mã định danh REG_Master (VD: DOC-011, DOC-038-PL1)
  parent_doc_id?: string;          // Mã Doc_ID cha cho các Phụ lục / Phần đính kèm
  is_blocked_p0?: boolean;         // Cờ cách ly P0: CẤM DÙNG CHO LEGAL_AI / SSoT
  reg_master_meta?: RegMasterMetadata; // Siêu dữ liệu 33 cột từ REG_Master Google Sheet
  articles: LegalArticle[];
}

export interface LegalCrossReference {
  id: string;                        // UUID / PK (cross_references.id)
  source_doc_id: string;
  source_article_id: string;         // FK -> document_articles.id
  target_doc_id: string;
  target_article_id: string;         // FK -> document_articles.id
  sourceArticleId?: string;          // Optional camelCase alias for hook compatibility
  targetArticleId?: string;          // Optional camelCase alias for hook compatibility
  relation_type: CrossRefRelationType; // HUONG_DAN_THI_HANH, SUA_DOI_BO_SUNG, THAY_THE, DAN_CHIEU
  title: string;
  description: string;               // Diễn giải chi tiết nội dung tác động chéo giữa 2 điều khoản
  comparison_highlight: {
    source_excerpt: string;
    target_excerpt: string;
    legal_impact: string;            // Hệ quả pháp lý đối với Ban QLDA / Chủ đầu tư / HĐQT
  };
}

export interface ContractRedlineIssue {
  id: string;
  riskLevel: 'Rất cao' | 'Cao' | 'Trung bình';
  clauseLocation: string; // e.g., "Điểm 2 · Điều 4"
  originalExcerpt: string;
  problemAnalysis: string;
  legalBasis: string;
  legalBasisDocId?: string;
  legalBasisArticleId?: string;
  editRecommendation: string;
  suggestedReplacement: string;
}

export interface ContractTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  updatedAt: string;
  fullText: string;
  issues: ContractRedlineIssue[];
}

export interface SavedDocumentItem {
  docId: string;
  folder: string;
  savedAt: string;
  personalNote: string;
}

export interface SavedClauseItem {
  id: string;
  docId: string;
  articleId: string;
  folder: string;
  note: string;
  savedAt: string;
}

export interface DailyLegalUpdateAlert {
  id: string;
  date: string;
  docId: string;
  code: string;
  title: string;
  category: LegalField;
  projectStage: ProjectLifecycleStage;
  changeType: 'Ban hành mới' | 'Sắp có hiệu lực' | 'Sửa đổi, bổ sung' | 'Đính chính / Hướng dẫn';
  summary: string;
  impactedDocIds: string[];
  isRead: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  browserPermission: NotificationPermission | 'unsupported';
  dailyTime: string;
  subscribedCategories: LegalField[];
  subscribedStages: ProjectLifecycleStage[];
  notifyOnSavedDocAmended: boolean;
  lastDigestDate: string;
}

export interface ReaderSettings {
  theme: 'light' | 'dark';
  fontFamily: 'sans' | 'serif';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  fontSizePx?: number;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  action: string;
  documentId: string | null;
  detail?: string;
}

export type McpRiskCategory =
  | 'Hồ sơ bắt buộc'
  | 'Rủi ro xuất toán / Chế tài'
  | 'Khuyến nghị hành động';

export interface McpRiskChecklistItem {
  id: string;
  category: McpRiskCategory;
  riskLevel: 'Rất cao' | 'Cao' | 'Trung bình';
  text: string;
  checked: boolean;
}

export interface McpSessionAuditRecord {
  id: string; // `${docId}:${articleId}`
  docId: string;
  docNumber: string;
  docTitle: string;
  field: LegalField;
  projectStage: ProjectLifecycleStage;
  articleId: string;
  articleNo: string;
  articleTitle: string;
  auditedAt: string;
  customPrompt?: string;
  rawAnalysis: string;
  checklistItems: McpRiskChecklistItem[];
}

export type KnowledgeGraphEdgeType =
  | 'AMENDS'                  // Sửa đổi, bổ sung một phần
  | 'ANNULS_PARTIALLY'        // Bãi bỏ một số điều/khoản
  | 'REPLACES_WHOLLY'         // Thay thế toàn bộ văn bản cũ
  | 'GUIDES_IMPLEMENTATION'   // Nghị định/Thông tư quy định chi tiết và hướng dẫn thi hành Luật
  | 'CROSS_REFERENCES'        // Dẫn chiếu áp dụng trực tiếp
  | 'PREREQUISITE_GATE'       // Điều kiện tiên quyết giữa 2 thủ tục pháp lý (Stage-Gate)
  | 'CONFLICT_WATCH';         // Giao thoa thẩm quyền hoặc điểm nghẽn dễ xung đột hồ sơ

export interface LegalKnowledgeEdge {
  id: string;
  edge_type: KnowledgeGraphEdgeType;
  source_doc_id: string;
  source_article_id: string;
  source_clause_id?: string;
  target_doc_id: string;
  target_article_id: string;
  target_clause_id?: string;
  effective_from: string;     // Ngày mối quan hệ này bắt đầu phát sinh hiệu lực (YYYY-MM-DD)
  effective_to: string | null;// Ngày mối quan hệ này chấm dứt (YYYY-MM-DD) hoặc null
  title: string;
  description: string;
  comparison_highlight: {
    source_excerpt: string;
    target_excerpt: string;
    legal_impact: string;
  };
  is_verified_in_ssot: boolean;
}

export type LegalReasoningMode =
  | 'JUDICIAL_ADJUDICATION' // Góc nhìn Thẩm phán / Trọng tài viên
  | 'LEGAL_COUNSEL'         // Góc nhìn Luật sư Tư vấn / Pháp chế Chủ đầu tư
  | 'COMPLIANCE_AUDITOR'    // Góc nhìn Kiểm toán Nhà nước / Thanh tra Xây dựng - Tài chính
  | 'JUDICIAL_ANALYSIS'     // Alias tương thích ngược
  | 'LEGAL_AUDIT';          // Alias tương thích ngược

export type EpistemicConclusionStatus =
  | 'VERIFIED_DETERMINISTIC'  // Kết luận dựa 100% trên điều khoản nguyên văn có trong SSoT
  | 'CONDITIONAL_ON_EXCERPT'  // Kết luận dựa trên văn bản trích lược (cần kiểm tra thêm các điều chưa nạp)
  | 'ABSTAINED_MISSING_DATA'; // TỪ CHỐI KẾT LUẬN: Không đủ dữ liệu xác thực trong SSoT hoặc lỗi kết nối AI

export interface LegalReasoningTrace {
  trace_id: string;
  created_at: string;
  reasoning_mode: LegalReasoningMode;
  as_of_date: string;             // Thời điểm pháp lý được dùng để xét hiệu lực (YYYY-MM-DD)
  epistemic_status: EpistemicConclusionStatus;
  step_1_legal_issues: string[];  // 1. Vấn đề pháp lý cốt lõi (Legal Issues)
  step_2_applicable_provisions: { // 2. Quy phạm pháp luật áp dụng (đã qua Point-in-Time & CitationVerifier)
    doc_number: string;
    clause_ref: string;
    verbatim_quote: string;
    point_in_time_status: 'ACTIVE_AT_DATE' | 'AMENDED_AT_DATE' | 'TRANSITIONAL_APPLIED' | 'EXPIRED_AT_DATE';
    verification: CitationVerificationResult;
  }[];
  step_3_statutory_interpretation: string; // 3. Giải thích điều kiện áp dụng quy phạm
  step_4_fact_application: {      // 4. Áp dụng vào tình tiết hồ sơ vụ việc thực tế
    fact_summary: string;
    evidence_file_name?: string;
    evidence_sha256?: string;
    compliance_match: 'COMPLIANT' | 'NON_COMPLIANT' | 'INSUFFICIENT_EVIDENCE';
    analysis: string;
  }[];
  step_5_counter_arguments_and_exceptions: string[]; // 5. Ngoại lệ, tình tiết giảm nhẹ hoặc điều khoản chuyển tiếp
  step_6_actionable_conclusion: { // 6. Kết luận & Khuyến nghị hành động
    verdict_summary: string;
    deduction_or_invalidity_risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    mandatory_remediation_steps: string[];
    abstention_reason?: string;   // Bắt buộc có nếu epistemic_status === 'ABSTAINED_MISSING_DATA'
  };
}

export interface CaseFactMilestone {
  id: string;
  event_date: string;             // Ngày diễn ra sự kiện trên thực tế (YYYY-MM-DD)
  event_type: 'PROJECT_APPROVAL' | 'BIDDING_INVITATION' | 'CONTRACT_SIGNING' | 'CONSTRUCTION_START' | 'VARIATION_ORDER' | 'PAYMENT_SETTLEMENT';
  description: string;
  evidence_document_ref?: string; // Số hiệu văn bản/tờ trình thực tế của dự án
  evidence_sha256?: string;       // Mã băm SHA-256 thực của tệp hồ sơ đính kèm
}

export interface EvidenceBasedReportSnapshot {
  report_id: string;
  project_id: string;
  project_name: string;
  generated_at: string;
  generated_by: string;
  as_of_legal_date: string;
  case_facts: CaseFactMilestone[];
  verified_citations: CitationVerificationResult[];
  reasoning_traces: LegalReasoningTrace[];
  unverified_or_missing_warnings: string[]; // Mục công khai giới hạn dữ liệu (Epistemic Humility Section)
  report_integrity_sha256: string;          // Mã băm SHA-256 của toàn bộ nội dung báo cáo xuất ra
}

export interface RegMasterMetadata {
  stt: number;
  doc_id: string;                            // DOC-001 .. DOC-180, DOC-038-PL1..7, DOC-040-P1..4
  nhom_vb: string;                           // PL
  du_an: string;
  goi_thau: string;
  loai_vb: string;
  co_quan_ban_hanh: string;
  so_hieu: string;
  ngay_ban_hanh: string;
  ngay_hieu_luc: string;
  tinh_trang_hieu_luc: string;
  linh_vuc_chuyen_mon: string;               // XD, DD, DTH, DTU, MT, PCCC, TC
  tru_cot_phap_ly: string;                   // Xây dựng, Đất đai, Đấu thầu, Đầu tư, Nhà ở & BĐS, PCCC & CNCH, Quy hoạch
  cap_bac: string;                           // L1 - Luật .. L5 - Biểu mẫu
  ten_file_chuan_hoa_v1: string;
  duong_dan_drive: string;
  trich_yeu_noi_dung: string;
  ghi_chu: string;
  loai_ban_ghi_qa: 'VĂN BẢN' | 'PHỤ LỤC / PHẦN';
  parent_doc_id_qa: string;
  so_hieu_van_ban_goc_qa: string;
  kiem_tra_duong_dan_qa: string;
  kiem_tra_dinh_danh_qa: string;             // HỢP LỆ TRONG SHEET | BLOCKED_P0 — CẤM DÙNG CHO LEGAL_AI
  kiem_tra_phan_loai_qa: string;
  xac_minh_nguon_phap_ly_qa: string;
  ghi_chu_can_ra_soat_qa: string;
  don_vi_ap_dung_rbac: string;
  loai_quan_he_phap_ly: string;
  chi_tiet_thay_the_sua_doi: string;
  quy_tac_chuyen_tiep_01_07_2026: string;
  fk_bang_qlhd: string;
  fk_thu_vien_kt821: string;
  ma_gem_va_trang_thai_ai: string;           // VD: GEM-01 • ACTIVE
  matched_local_drive_path?: string;         // Đường dẫn file thực tế khớp trong Data_Legal (nếu có)
  is_blocked_p0: boolean;
}

export interface NamingConventionRule {
  stt: string;
  category: string;
  code_rule: string;
  meaning: string;
  example: string;
  application_note: string;
}



