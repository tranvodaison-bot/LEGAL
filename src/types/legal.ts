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
  | 'Nghị định'
  | 'Thông tư'
  | 'Quyết định'
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

export interface ClauseItem {
  id: string;                     // ID định danh Khoản (VD: 'art-lkt88-d3-k1')
  clause_no: string;              // Nhãn Khoản (VD: 'Khoản 1', 'Khoản 2')
  text: string;                   // Nội dung hiện hành của Khoản
  is_amended?: boolean;           // Cờ đánh dấu Khoản đã bị sửa đổi, bổ sung
  is_annulled?: boolean;          // Cờ đánh dấu Khoản đã bị bãi bỏ
  diff_data?: ClauseDiff;         // Dữ liệu đối chiếu bản gốc và bản sửa đổi tại chỗ (In-place Diff)
  points?: string[];              // Danh sách các Điểm a), b), c) thuộc Khoản (tùy chọn)
}

export interface CrossLawMatrixItem {
  target_law_domain: string;      // VD: "Luật Xây dựng", "Luật Đất đai", "Luật Đấu thầu", "Nghị định hướng dẫn"
  target_doc_id?: string;         // ID văn bản đích trong kho SSoT nếu có
  target_doc_number: string;      // Số hiệu văn bản đích (VD: "135/2025/QH15", "22/2023/QH15")
  target_clause_ref: string;      // Điều/Khoản/Điểm đối chiếu (VD: "Khoản 3 Điều 14 & Điều 112")
  relation_nature: 'ĐỒNG BỘ BẮT BUỘC' | 'ĐIỀU KIỆN TIÊN QUYẾT' | 'GIAO THOA THẨM QUYỀN' | 'RỦI RO XUNG ĐỘT HỒ SƠ';
  cross_analysis: string;         // Phân tích ma trận đối soát chéo giữa Điều đang xem và quy định liên ngành
  audit_evidence_required: string;// Chứng từ / Hồ sơ pháp lý bắt buộc phải khớp nối
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
  | 'VERIFIED_EXCERPT'    // Văn bản QPPL có thật trên Công báo, hiện nạp trích lược các điều khoản trọng tâm
  | 'OFFICIAL_VBHN'       // Văn bản hợp nhất chính thức do VPQH hoặc Bộ/Ngành ký xác thực hợp nhất
  | 'INTERNAL_SYNTHESIS'  // Bản tổng hợp nội bộ phục vụ tra cứu nhanh (không phải VBHN chính thức)
  | 'QUARANTINE_REVIEW'   // Văn bản nạp qua OCR hoặc người dùng tải lên đang chờ kiểm duyệt SSoT
  | 'REFERENCE_GUIDE';    // Tài liệu hướng dẫn sử dụng nội bộ

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
  article_no: string;      // e.g., "Điều 14"
  article_title: string;   // e.g., "Điều kiện khởi công xây dựng công trình"
  content: string;         // Toàn văn nội dung điều khoản
  is_active: boolean;      // Trạng thái hiệu lực của riêng điều khoản
  keywords: string[];
  amendment_note?: string;
  is_amended?: boolean;    // Cờ cảnh báo Điều khoản đã bị sửa đổi, bổ sung
  is_annulled?: boolean;   // Cờ cảnh báo Điều khoản đã bị bãi bỏ
  amendment_info?: ArticleAmendmentInfo; // Chi tiết phả hệ sửa đổi của Điều khoản
  clause_count?: number;   // Số lượng Khoản trong Điều (VD: 19 khoản)
  point_count?: number;    // Số lượng Điểm trong Điều
  clauses?: ClauseItem[];  // Danh sách từng Khoản chi tiết phục vụ In-place Diff Viewer
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
  completeness_meta?: CompletenessMetadata; // Thông tin tỷ lệ nạp điều khoản (X/Y Điều)
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

