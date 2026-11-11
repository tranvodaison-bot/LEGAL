import {
  LegalDocument,
  LegalCrossReference,
  DailyLegalUpdateAlert,
  LegalField,
  ProjectLifecycleStage,
  LegalDocumentStatus,
  CrossRefRelationType,
  ComplianceRequirementNode,
  ContractTemplate,
} from '../types/legal';

export const LEGAL_FIELDS: LegalField[] = [
  'Xây dựng',
  'Đấu thầu',
  'Hợp đồng xây dựng',
  'Đất đai',
  'Môi trường',
  'PCCC',
  'Tài chính',
  'Đầu tư & QLDA',
  'Doanh nghiệp & HĐQT',
  'Lao động & An toàn',
  'Dữ liệu cá nhân & An ninh mạng',
  'Thương mại điện tử',
  'Chuyển đổi số',
  'Kế toán · Kiểm toán',
  'Thuế · Phí',
  'Hóa đơn · Chứng từ',
  'Hải quan · XNK',
  'Thanh tra',
  'Thủ tục hành chính',
  'Hướng dẫn sử dụng',
];

export const LEGAL_CATEGORIES = LEGAL_FIELDS;

// Hierarchical Category Groups merging LexViet SSoT + LegalFlow + Thư viện VBPL (zero duplication)
export const VBPL_CATEGORY_GROUPS: Array<{
  groupName: string;
  fields: LegalField[];
}> = [
  {
    groupName: 'Xây dựng · Đấu thầu & QLDA',
    fields: ['Xây dựng', 'Đấu thầu', 'Hợp đồng xây dựng', 'Đầu tư & QLDA'],
  },
  {
    groupName: 'Đất đai · PCCC & Môi trường',
    fields: ['Đất đai', 'PCCC', 'Môi trường'],
  },
  {
    groupName: 'Dữ liệu cá nhân & An ninh mạng',
    fields: ['Dữ liệu cá nhân & An ninh mạng', 'Chuyển đổi số'],
  },
  {
    groupName: 'Thương mại điện tử & Giao dịch số',
    fields: ['Thương mại điện tử'],
  },
  {
    groupName: 'Tài chính · Kế toán · Kiểm toán',
    fields: ['Tài chính', 'Kế toán · Kiểm toán', 'Thanh tra'],
  },
  {
    groupName: 'Thuế · Phí & Hóa đơn chứng từ',
    fields: ['Thuế · Phí', 'Hóa đơn · Chứng từ', 'Hải quan · XNK'],
  },
  {
    groupName: 'Doanh nghiệp · Lao động & Hành chính',
    fields: ['Doanh nghiệp & HĐQT', 'Lao động & An toàn', 'Thủ tục hành chính'],
  },
  {
    groupName: 'Tham khảo & Hướng dẫn',
    fields: ['Hướng dẫn sử dụng'],
  },
];

export const POPULAR_SEARCH_KEYWORDS: string[] = [
  'Dữ liệu cá nhân',
  'Điều kiện khởi công',
  'Thương mại điện tử',
  'Đồng ý hợp lệ',
  'Mặt bằng sạch',
  'Hợp đồng xây dựng',
  'BIM LOD 200',
  'Nghiệm thu PCCC',
];

export const PROJECT_LIFECYCLE_STAGES: ProjectLifecycleStage[] = [
  'Quy hoạch',
  'Chuẩn bị đầu tư',
  'Thực thi',
  'Quyết toán',
];

export const WBS_STAGE_LABELS: Record<ProjectLifecycleStage, string> = {
  'Quy hoạch': '1. Quy hoạch & Khảo sát',
  'Chuẩn bị đầu tư': '2. Chuẩn bị đầu tư',
  'Thực thi': '3. Thi công xây dựng',
  'Quyết toán': '4. Nghiệm thu & Quyết toán',
};

export const STATUS_META: Record<
  LegalDocumentStatus,
  { label: string; code: LegalDocumentStatus; colorClass: string; badgeClass: string }
> = {
  CON_HIEU_LUC: {
    label: 'Còn hiệu lực',
    code: 'CON_HIEU_LUC',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
  },
  SUA_DOI_BO_SUNG: {
    label: 'Sửa đổi một phần',
    code: 'SUA_DOI_BO_SUNG',
    colorClass: 'text-amber-700 dark:text-amber-400',
    badgeClass:
      'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
  },
  DANG_DU_THAO: {
    label: 'Đang dự thảo',
    code: 'DANG_DU_THAO',
    colorClass: 'text-[#1E3A8A] dark:text-[#60A5FA]',
    badgeClass:
      'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
  },
  HET_HIEU_LUC: {
    label: 'Đã hết hiệu lực',
    code: 'HET_HIEU_LUC',
    colorClass: 'text-stone-500 dark:text-stone-400',
    badgeClass:
      'bg-stone-100 text-stone-700 border border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
  },
};

export const RELATION_META: Record<
  CrossRefRelationType,
  { label: string; code: CrossRefRelationType; stroke: string; textClass: string; boxClass: string }
> = {
  HUONG_DAN_THI_HANH: {
    label: 'Hướng dẫn thi hành',
    code: 'HUONG_DAN_THI_HANH',
    stroke: '#1E3A8A',
    textClass: 'text-[#1E3A8A] dark:text-[#60A5FA]',
    boxClass:
      'bg-blue-50/70 border-blue-200 text-blue-950 dark:bg-blue-950/30 dark:border-blue-800/60 dark:text-blue-200',
  },
  SUA_DOI_BO_SUNG: {
    label: 'Sửa đổi, bổ sung',
    code: 'SUA_DOI_BO_SUNG',
    stroke: '#DC2626',
    textClass: 'text-red-700 dark:text-red-400',
    boxClass:
      'bg-red-50/70 border-red-200 text-red-950 dark:bg-red-950/30 dark:border-red-800/60 dark:text-red-200',
  },
  THAY_THE: {
    label: 'Thay thế / Bãi bỏ',
    code: 'THAY_THE',
    stroke: '#7C3AED',
    textClass: 'text-purple-700 dark:text-purple-400',
    boxClass:
      'bg-purple-50/70 border-purple-200 text-purple-950 dark:bg-purple-950/30 dark:border-purple-800/60 dark:text-purple-200',
  },
  DAN_CHIEU: {
    label: 'Dẫn chiếu liên ngành',
    code: 'DAN_CHIEU',
    stroke: '#D97706',
    textClass: 'text-amber-700 dark:text-amber-400',
    boxClass:
      'bg-amber-50/70 border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-200',
  },
};

export const INITIAL_LEGAL_DOCUMENTS: LegalDocument[] = [
  // ============================================================================
  // PHẦN 1: CỤM XÂY DỰNG, ĐẤU THẦU, ĐẤT ĐAI, PCCC & QLDA (SSoT + VBPL HỢP NHẤT)
  // ============================================================================
  {
    id: 'doc-ldtc-58-2024',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '58/2024/QH15',
    title:
      'Luật Đầu tư công số 58/2024/QH15: Quy định về quyết định chủ trương đầu tư, quyết định đầu tư chương trình, dự án đầu tư công và kế hoạch vốn trung hạn, hằng năm',
    short_title: 'Luật Đầu tư công 58/2024/QH15',
    issue_date: '2024-11-29',
    effective_date: '2025-01-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Đầu tư & QLDA',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Trần Thanh Mẫn',
    is_new_daily_update: true,
    compliance_stats: { total_sections: 54, very_high_count: 14, high_count: 28, medium_count: 12 },
    daily_update_note:
      'Căn cứ pháp lý nền tảng cho 17 Stage-Gates (AIPM OS): Phân cấp thẩm quyền quyết định chủ trương đầu tư (Điều 18), thẩm định nguồn vốn và khả năng cân đối vốn (Điều 36) và điều chỉnh dự án (Điều 46).',
    summary:
      'Quy định việc quản lý và sử dụng vốn đầu tư công; thẩm quyền, trình tự, thủ tục quyết định chủ trương đầu tư (G1), thẩm định nguồn vốn (G2), quyết định đầu tư dự án (G5) và bố trí kế hoạch vốn đầu tư công (G6).',
    articles: [
      {
        id: 'art-ldtc-d18',
        document_id: 'doc-ldtc-58-2024',
        chapter_no: 'Chương II',
        chapter_title: 'Chủ trương đầu tư và Quyết định đầu tư chương trình, dự án',
        article_no: 'Điều 18',
        article_title: 'Thẩm quyền quyết định chủ trương đầu tư chương trình, dự án (Stage-Gate G1)',
        content: `1. Quốc hội quyết định chủ trương đầu tư chương trình mục tiêu quốc gia, dự án quan trọng quốc gia.
2. Thủ tướng Chính phủ quyết định chủ trương đầu tư dự án nhóm A sử dụng vốn ngân sách trung ương do bộ, cơ quan trung ương quản lý; dự án nhóm A sử dụng vốn vay ODA và vốn vay ưu đãi của các nhà tài trợ nước ngoài.
3. Người đứng đầu bộ, cơ quan trung ương quyết định chủ trương đầu tư dự án nhóm B, nhóm C sử dụng vốn đầu tư công do cơ quan, tổ chức mình quản lý.
4. Hội đồng nhân dân các cấp quyết định chủ trương đầu tư dự án nhóm A, nhóm B, nhóm C sử dụng vốn ngân sách địa phương; trường hợp cần thiết, HĐND giao UBND cùng cấp quyết định chủ trương đầu tư dự án nhóm B, nhóm C thuộc cấp mình quản lý.`,
        is_active: true,
        keywords: ['chủ trương đầu tư', 'thẩm quyền phê duyệt', 'dự án nhóm A', 'G1'],
        amendment_note:
          'Gợi ý kiểm toán Gatekeeper & LegalCrossCheck Agent: Nếu Tờ trình/Nghị quyết chủ trương đầu tư ký sai cấp thẩm quyền tại Điều 18, hệ thống tự động bật cờ đỏ RISK_AUTHORITY_CAPITAL và khóa Gate G5.',
      },
      {
        id: 'art-ldtc-d36',
        document_id: 'doc-ldtc-58-2024',
        chapter_no: 'Chương II',
        chapter_title: 'Chủ trương đầu tư và Quyết định đầu tư chương trình, dự án',
        article_no: 'Điều 36',
        article_title: 'Thẩm định nguồn vốn và khả năng cân đối vốn (Stage-Gate G2)',
        content: `1. Thẩm định nguồn vốn và khả năng cân đối vốn là nội dung bắt buộc trong quá trình thẩm định báo cáo đề xuất chủ trương đầu tư chương trình, dự án đầu tư công.
2. Không được trình cấp có thẩm quyền quyết định chủ trương đầu tư hoặc quyết định đầu tư dự án khi chưa có báo cáo thẩm định nguồn vốn và khả năng cân đối vốn của cơ quan tài chính, kế hoạch và đầu tư có thẩm quyền.`,
        is_active: true,
        keywords: ['thẩm định nguồn vốn', 'cân đối vốn', 'kế hoạch vốn', 'G2'],
        amendment_note:
          'Gợi ý kiểm toán GatekeeperAgent: Chưa vượt qua G1 (Chủ trương đầu tư - Điều 18) và G2 (Thẩm định nguồn vốn - Điều 36) thì tuyệt đối không cho phép mở trạng thái PASSED ở G5 (Quyết định đầu tư) hoặc G10 (Kế hoạch LCNT).',
      },
      {
        id: 'art-ldtc-d43',
        document_id: 'doc-ldtc-58-2024',
        chapter_no: 'Chương II',
        chapter_title: 'Chủ trương đầu tư và Quyết định đầu tư chương trình, dự án',
        article_no: 'Điều 43',
        article_title: 'Căn cứ lập, thẩm định, quyết định đầu tư chương trình, dự án (Stage-Gate G5)',
        content: `1. Căn cứ lập, thẩm định, quyết định đầu tư dự án bao gồm:
a) Quy hoạch có liên quan đã được cấp có thẩm quyền quyết định hoặc phê duyệt theo quy định của pháp luật về quy hoạch (Gate G0);
b) Chủ trương đầu tư đã được cơ quan có thẩm quyền quyết định (Gate G1) và khả năng cân đối nguồn vốn đầu tư công (Gate G2);
c) Kết quả thẩm định Báo cáo nghiên cứu khả thi của cơ quan chuyên môn về xây dựng và thủ tục môi trường, phòng cháy chữa cháy (Gate G3, G4).`,
        is_active: true,
        keywords: ['quyết định đầu tư', 'báo cáo nghiên cứu khả thi', 'G5'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Tổng mức đầu tư tại Quyết định đầu tư (G5) không được vượt tổng mức đầu tư sơ bộ tại Nghị quyết chủ trương đầu tư (G1); nếu vượt phải thực hiện thủ tục điều chỉnh chủ trương đầu tư trước.',
      },
    ],
  },
  {
    id: 'doc-lxd-135-2025',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '135/2025/QH15',
    title:
      'Luật Xây dựng số 135/2025/QH15: Sửa đổi, bổ sung điều kiện khởi công, cấp phép xây dựng và quản lý chi phí đầu tư xây dựng',
    short_title: 'Luật Xây dựng 135/2025/QH15',
    issue_date: '2025-12-10',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Thực thi',
    signer: 'Trần Thanh Mẫn',
    is_new_daily_update: true,
    compliance_stats: { total_sections: 42, very_high_count: 8, high_count: 24, medium_count: 10 },
    daily_update_note:
      'Chuẩn hóa điều kiện bàn giao mặt bằng sạch trước khi khởi công (Điều 14), cấp phép xây dựng tích hợp PCCC (Điều 89) và nghiệm thu hoàn thành công trình (Điều 123).',
    summary:
      'Quy định về điều kiện khởi công xây dựng công trình, thẩm định Báo cáo nghiên cứu khả thi, cấp giấy phép xây dựng, quản lý chi phí đầu tư xây dựng và nghiệm thu đưa công trình vào khai thác sử dụng.',
    articles: [
      {
        id: 'art-lxd-d14',
        document_id: 'doc-lxd-135-2025',
        chapter_no: 'Chương III',
        chapter_title: 'Điều kiện khởi công và Quản lý thi công xây dựng',
        article_no: 'Điều 14',
        article_title: 'Điều kiện khởi công xây dựng công trình',
        content: `1. Việc khởi công xây dựng công trình phải bảo đảm các điều kiện sau đây:
a) Có mặt bằng xây dựng để bàn giao toàn bộ hoặc từng phần theo tiến độ xây dựng do Chủ đầu tư và Nhà thầu thỏa thuận phù hợp với quy định của Luật Đất đai (xem thêm Điều 89 và Điều 123);
b) Có giấy phép xây dựng đối với công trình theo quy định phải có giấy phép xây dựng theo Điều 89 của Luật này;
c) Có thiết kế bản vẽ thi công của hạng mục công trình, công trình khởi công đã được phê duyệt và được chủ đầu tư kiểm tra, xác nhận trên bản vẽ;
d) Chủ đầu tư đã ký kết hợp đồng thi công xây dựng với nhà thầu được lựa chọn theo quy định của Luật Đấu thầu và đã bố trí đủ vốn theo tiến độ thanh toán của hợp đồng;
đ) Có biện pháp bảo đảm an toàn, bảo vệ môi trường và phòng chống cháy nổ trong quá trình thi công xây dựng.
2. Hồ sơ nghiệm thu giai đoạn cần bổ sung biên bản kiểm tra điều kiện mặt bằng sạch theo điểm a khoản 1 Điều này để tránh rủi ro xuất toán khi quyết toán vốn đầu tư.`,
        is_active: true,
        keywords: ['điều kiện khởi công', 'mặt bằng sạch', 'giấy phép xây dựng', 'thiết kế bản vẽ thi công'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Hồ sơ nghiệm thu cần bổ sung biên bản kiểm tra điều kiện mặt bằng sạch theo điểm a khoản 1 điều này để tránh rủi ro xuất toán khi quyết toán vốn.',
      },
      {
        id: 'art-lxd-d89',
        document_id: 'doc-lxd-135-2025',
        chapter_no: 'Chương V',
        chapter_title: 'Giấy phép xây dựng và Quản lý trật tự xây dựng',
        article_no: 'Điều 89',
        article_title: 'Điều kiện cấp giấy phép xây dựng đối với công trình thuộc dự án đầu tư xây dựng',
        content: `1. Công trình thuộc dự án đầu tư xây dựng được cấp giấy phép xây dựng khi đáp ứng đầy đủ các điều kiện sau đây:
a) Phù hợp với quy hoạch phân khu, quy hoạch chi tiết xây dựng tỉ lệ 1/500 đã được cơ quan nhà nước có thẩm quyền phê duyệt;
b) Phù hợp với mục đích sử dụng đất theo quyết định giao đất, cho thuê đất hoặc chuyển mục đích sử dụng đất theo quy định của pháp luật về đất đai;
c) Đã có văn bản thẩm định thiết kế về phòng cháy và chữa cháy theo quy định của Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ;
d) Thiết kế xây dựng triển khai sau thiết kế cơ sở đã được cơ quan chuyên môn về xây dựng thẩm định và chủ đầu tư phê duyệt theo đúng quy định.`,
        is_active: true,
        keywords: ['giấy phép xây dựng', 'thẩm duyệt PCCC', 'quy hoạch 1/500', 'mục đích sử dụng đất'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Đối soát kỹ ranh giới đất trên Giấy phép xây dựng với Quyết định giao đất của UBND cấp tỉnh trước khi đóng cọc đại trà.',
      },
      {
        id: 'art-lxd-d123',
        document_id: 'doc-lxd-135-2025',
        chapter_no: 'Chương VII',
        chapter_title: 'Nghiệm thu, bàn giao và bảo hành công trình xây dựng',
        article_no: 'Điều 123',
        article_title: 'Nghiệm thu hoàn thành hạng mục công trình, công trình xây dựng đưa vào sử dụng',
        content: `1. Công trình xây dựng chỉ được phép đưa vào khai thác, sử dụng sau khi đã được chủ đầu tư tổ chức nghiệm thu hoàn thành theo quy định.
2. Đối với các công trình thuộc đối tượng phải được cơ quan nhà nước có thẩm quyền kiểm tra công tác nghiệm thu trong quá trình thi công và khi hoàn thành thi công xây dựng công trình, chủ đầu tư chỉ được tổ chức nghiệm thu hoàn thành sau khi có văn bản chấp thuận kết quả nghiệm thu về PCCC và văn bản chấp thuận kết quả nghiệm thu của cơ quan chuyên môn về xây dựng.`,
        is_active: true,
        keywords: ['nghiệm thu hoàn thành', 'đưa vào sử dụng', 'văn bản chấp thuận nghiệm thu', 'bàn giao công trình'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Ngày ký Biên bản nghiệm thu hoàn thành tại Điều 123 là mốc khởi đầu tính thời hạn 09 tháng (nhóm A) / 06 tháng (nhóm B) phải nộp hồ sơ quyết toán theo Điều 47 Nghị định 99/2021/NĐ-CP.',
      },
    ],
  },
  {
    id: 'doc-nd-15-2023',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '15/2021/NĐ-CP',
    title: 'Nghị định số 15/2021/NĐ-CP: Quy định chi tiết một số nội dung về quản lý dự án đầu tư xây dựng',
    short_title: 'Nghị định 15/2021/NĐ-CP',
    issue_date: '2021-03-03',
    effective_date: '2021-03-03',
    expiration_date: null,
    status: 'SUA_DOI_BO_SUNG',
    field: 'Xây dựng',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Phạm Minh Chính',
    is_consolidated: false,
    consolidated_doc_number: '06/VBHN-BXD',
    amended_count: 1,
    amendment_history: [
      {
        amending_doc_id: 'doc-nd-217-2026',
        amending_doc_number: '217/2026/NĐ-CP',
        amending_doc_title:
          'Nghị định 217/2026/NĐ-CP quy định chi tiết về quản lý hoạt động xây dựng, BIM và điều chỉnh chi phí đầu tư xây dựng',
        promulgation_date: '2026-06-15',
        effective_date: '2026-08-01',
        scopes: ['Điều 12', 'Điều 18', 'Điều 38'],
        action_type: 'SUA_DOI_BO_SUNG',
        summary:
          'Sửa đổi, bổ sung trình tự thẩm định Báo cáo nghiên cứu khả thi tích hợp mô hình BIM tối thiểu LOD 200 và cơ chế liên thông PCCC – Đất đai.',
      },
    ],
    compliance_stats: { total_sections: 28, very_high_count: 4, high_count: 16, medium_count: 8 },
    summary:
      'Quy định chi tiết về lập, thẩm định, phê duyệt dự án đầu tư xây dựng; khảo sát xây dựng; thiết kế xây dựng triển khai sau thiết kế cơ sở và mô hình tổ chức Ban Quản lý dự án đầu tư xây dựng.',
    articles: [
      {
        id: 'art-nd15-d12',
        document_id: 'doc-nd-15-2023',
        chapter_no: 'Chương II',
        chapter_title: 'Lập, thẩm định và phê duyệt dự án đầu tư xây dựng',
        article_no: 'Điều 12',
        article_title: 'Trình tự lập, thẩm định Báo cáo nghiên cứu khả thi đầu tư xây dựng',
        content: `1. Chủ đầu tư tổ chức lập Báo cáo nghiên cứu khả thi đầu tư xây dựng trên cơ sở Quyết định hoặc Chấp thuận chủ trương đầu tư của cấp có thẩm quyền.
2. Thiết kế cơ sở trong Báo cáo nghiên cứu khả thi phải thể hiện được giải pháp thiết kế chủ yếu, bảo đảm sự đồng bộ với quy hoạch chi tiết tỉ lệ 1/500 hoặc quy hoạch tổng mặt bằng và đáp ứng chỉ tiêu mật độ xây dựng, hệ số sử dụng đất.`,
        is_active: true,
        is_amended: true,
        amendment_info: {
          amending_doc_id: 'doc-nd-217-2026',
          amending_doc_number: '217/2026/NĐ-CP',
          amending_doc_title: 'Nghị định số 217/2026/NĐ-CP',
          promulgation_date: '2026-06-15',
          effective_date: '2026-08-01',
          action_type: 'SUA_DOI_BO_SUNG',
          scopes: ['Khoản 1', 'Khoản 2'],
          summary:
            'Bổ sung yêu cầu nộp kèm tệp dữ liệu mô hình BIM tối thiểu LOD 200 đối với dự án công trình cấp I, cấp đặc biệt khi trình thẩm định Báo cáo nghiên cứu khả thi.',
          previous_excerpt:
            'Điều 12 cũ (2021): Hồ sơ trình thẩm định Báo cáo nghiên cứu khả thi gồm tờ trình, thuyết minh BCNCKT, thiết kế cơ sở bản vẽ 2D và các văn bản pháp lý có liên quan (chưa bắt buộc nộp kèm tệp mô hình BIM LOD 200).',
        },
        keywords: ['báo cáo nghiên cứu khả thi', 'thiết kế cơ sở', 'chủ trương đầu tư', 'mật độ xây dựng'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Một số điều khoản về ứng dụng BIM và phân cấp thẩm định đã được cập nhật bổ sung bởi Nghị định 217/2026/NĐ-CP.',
      },
      {
        id: 'art-nd15-d21',
        document_id: 'doc-nd-15-2023',
        chapter_no: 'Chương III',
        chapter_title: 'Hình thức tổ chức quản lý dự án đầu tư xây dựng',
        article_no: 'Điều 21',
        article_title: 'Trách nhiệm và quyền hạn của Ban Quản lý dự án chuyên ngành, khu vực và Ban QLDA một dự án',
        content: `1. Chủ đầu tư thành lập Ban quản lý dự án một dự án hoặc thuê tổ chức tư vấn quản lý dự án có đủ điều kiện năng lực hoạt động xây dựng để trực tiếp quản lý thực hiện dự án nhóm A, nhóm B.
2. Giám đốc quản lý dự án phải có chứng chỉ hành nghề quản lý dự án hạng tương ứng với cấp công trình và chịu trách nhiệm trước pháp luật, trước Chủ đầu tư về tiến độ, chất lượng, chi phí và an toàn lao động trên công trường.`,
        is_active: true,
        keywords: ['ban quản lý dự án', 'giám đốc quản lý dự án', 'chứng chỉ hành nghề', 'tư vấn QLDA'],
      },
    ],
  },
  {
    id: 'doc-nd-217-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '217/2026/NĐ-CP',
    title:
      'Nghị định số 217/2026/NĐ-CP: Quy định chi tiết về quản lý hoạt động xây dựng, BIM và điều chỉnh chi phí đầu tư xây dựng',
    short_title: 'Nghị định 217/2026/NĐ-CP',
    issue_date: '2026-06-19',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    is_amending_document: true,
    amends_doc_ids: ['doc-nd-15-2023'],
    is_new_daily_update: true,
    compliance_stats: { total_sections: 35, very_high_count: 6, high_count: 19, medium_count: 10 },
    daily_update_note:
      'Quy định chi tiết cơ chế điều chỉnh đơn giá hợp đồng xây dựng khi biến động vật tư vượt ±5% và bắt buộc áp dụng BIM LOD 200.',
    summary:
      'Hướng dẫn thi hành Luật Xây dựng 135/2025/QH15 và kế thừa, sửa đổi quy định của Nghị định 15/2021/NĐ-CP về thẩm định số hóa BIM, quản lý hoạt động xây dựng và điều chỉnh dự toán.',
    articles: [
      {
        id: 'art-nd217-d18',
        document_id: 'doc-nd-217-2026',
        chapter_no: 'Chương II',
        chapter_title: 'Lập, thẩm định dự án và thiết kế xây dựng số hóa BIM',
        article_no: 'Điều 18',
        article_title: 'Hồ sơ thẩm định Báo cáo nghiên cứu khả thi tích hợp mô hình BIM và liên thông một cửa',
        content: `1. Chủ đầu tư hoặc Ban Quản lý dự án được ủy quyền trình hồ sơ thẩm định Báo cáo nghiên cứu khả thi (kèm tệp dữ liệu mô hình BIM tối thiểu đạt mức độ phát triển LOD 200 đối với công trình cấp I, cấp đặc biệt) thông qua Hệ thống thông tin công trình quốc gia.
2. Trong thời hạn 05 ngày làm việc kể từ ngày tiếp nhận hồ sơ, cơ quan chuyên môn về xây dựng có trách nhiệm rà soát tính đầy đủ, hợp lệ và gửi văn bản lấy ý kiến phối hợp liên ngành với cơ quan quản lý về PCCC và cơ quan quản lý đất đai.`,
        is_active: true,
        keywords: ['hồ sơ thẩm định FS', 'mô hình BIM LOD 200', 'liên thông PCCC đất đai', 'Ban QLDA'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Chi phí lập và quản lý mô hình BIM được tính trong chi phí tư vấn đầu tư xây dựng thuộc Tổng mức đầu tư dự án.',
      },
      {
        id: 'art-nd217-d38',
        document_id: 'doc-nd-217-2026',
        chapter_no: 'Chương IV',
        chapter_title: 'Quản lý hợp đồng xây dựng và điều chỉnh giá',
        article_no: 'Điều 38',
        article_title: 'Điều chỉnh đơn giá và khối lượng trong hợp đồng thi công xây dựng',
        content: `1. Việc điều chỉnh đơn giá hợp đồng xây dựng chỉ áp dụng đối với hợp đồng theo đơn giá điều chỉnh và hợp đồng theo thời gian khi biến động giá vật liệu xây dựng chính (thép, xi măng, cát, đá, nhựa đường) vượt quá ±5% so với giá trong hợp đồng tại thời điểm 28 ngày trước ngày đóng thầu.
2. Đối với khối lượng phát sinh ngoài phạm vi thiết kế bản vẽ thi công đã được phê duyệt nhưng không làm vượt tổng mức đầu tư đã duyệt, Chủ đầu tư và Ban QLDA được quyền thẩm định, phê duyệt dự toán phát sinh và ký phụ lục hợp đồng.`,
        is_active: true,
        keywords: ['điều chỉnh đơn giá hợp đồng', 'biến động giá vật liệu 5%', 'khối lượng phát sinh', 'phụ lục hợp đồng'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Khi ký phụ lục điều chỉnh giá theo Điều 38, Ban QLDA bắt buộc phải có chứng thư thông báo giá hoặc chỉ số giá xây dựng của Sở Xây dựng địa phương tại thời điểm nghiệm thu.',
      },
    ],
  },
  // Các Nghị định & Thông tư chuyên ngành Xây dựng từ Thư viện VBPL (đã bổ sung điều khoản tra cứu)
  {
    id: 'doc-nd-206-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '206/2026/NĐ-CP',
    title: 'Nghị định số 206/2026/NĐ-CP: Quản lý chi phí đầu tư xây dựng',
    short_title: 'NĐ 206/2026/NĐ-CP · Chi phí ĐTXD',
    issue_date: '2026-06-15',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Phạm Minh Chính',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    compliance_stats: { total_sections: 24, very_high_count: 5, high_count: 14, medium_count: 5 },
    summary:
      'Quy định về sơ bộ tổng mức đầu tư, tổng mức đầu tư xây dựng, dự toán xây dựng, giá gói thầu xây dựng, định mức và chỉ số giá xây dựng.',
    articles: [
      {
        id: 'art-nd206-d8',
        document_id: 'doc-nd-206-2026',
        chapter_no: 'Chương II',
        chapter_title: 'Tổng mức đầu tư và Dự toán xây dựng',
        article_no: 'Điều 8',
        article_title: 'Nội dung và nguyên tắc lập Tổng mức đầu tư xây dựng',
        content: `1. Tổng mức đầu tư xây dựng là toàn bộ chi phí dự tính để thực hiện dự án đầu tư xây dựng, gồm: chi phí bồi thường, hỗ trợ và tái định cư; chi phí xây dựng; chi phí thiết bị; chi phí quản lý dự án; chi phí tư vấn đầu tư xây dựng; chi phí khác và chi phí dự phòng.
2. Chi phí dự phòng cho yếu tố khối lượng phát sinh và trượt giá phải được tính toán phù hợp với độ dài thời gian thực hiện dự án và chỉ số giá xây dựng bình quân 3 năm liền kề.`,
        is_active: true,
        keywords: ['tổng mức đầu tư', 'chi phí dự phòng', 'dự toán xây dựng', 'quản lý chi phí'],
      },
    ],
  },
  {
    id: 'doc-nd-207-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '207/2026/NĐ-CP',
    title: 'Nghị định số 207/2026/NĐ-CP: Quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng',
    short_title: 'NĐ 207/2026/NĐ-CP · Chất lượng CTXD',
    issue_date: '2026-06-15',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    compliance_stats: { total_sections: 31, very_high_count: 7, high_count: 18, medium_count: 6 },
    summary:
      'Quy định về quản lý chất lượng khảo sát, thiết kế, thi công xây dựng công trình, thí nghiệm chuyên ngành xây dựng, nghiệm thu giai đoạn và bảo hành, bảo trì công trình.',
    articles: [
      {
        id: 'art-nd207-d21',
        document_id: 'doc-nd-207-2026',
        chapter_no: 'Chương III',
        chapter_title: 'Quản lý chất lượng thi công xây dựng',
        article_no: 'Điều 21',
        article_title: 'Nghiệm thu công việc xây dựng và nhật ký thi công điện tử',
        content: `1. Tư vấn giám sát trưởng và Chỉ huy trưởng công trường có trách nhiệm nghiệm thu công việc xây dựng (đặc biệt là các kết cấu ẩn khuất, cốt thép trước khi đổ bê tông) trong thời hạn không quá 24 giờ kể từ khi nhận được phiếu yêu cầu nghiệm thu.
2. Khuyến khích sử dụng Nhật ký thi công điện tử có chữ ký số của Chủ đầu tư, Tư vấn giám sát và Nhà thầu thi công làm căn cứ pháp lý đối chiếu hồ sơ hoàn công.`,
        is_active: true,
        keywords: ['nghiệm thu công việc xây dựng', 'nhật ký thi công', 'tư vấn giám sát', 'hồ sơ hoàn công'],
      },
    ],
  },
  {
    id: 'doc-nd-209-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '209/2026/NĐ-CP',
    title: 'Nghị định số 209/2026/NĐ-CP: Quy định về quản lý vật liệu xây dựng',
    short_title: 'NĐ 209/2026/NĐ-CP · Vật liệu xây dựng',
    issue_date: '2026-06-15',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    summary: 'Quy định về quy hoạch, sản xuất, chứng nhận hợp chuẩn, hợp quy, truy xuất nguồn gốc và quản lý chất lượng vật liệu xây dựng đưa vào công trình.',
    articles: [
      {
        id: 'art-nd209-d5',
        document_id: 'doc-nd-209-2026',
        chapter_no: 'Chương I',
        chapter_title: 'Quản lý chất lượng vật liệu xây dựng sử dụng vào công trình',
        article_no: 'Điều 5',
        article_title: 'Yêu cầu về chứng nhận hợp quy và thí nghiệm kiểm tra chất lượng vật liệu xây dựng trước khi đưa vào thi công',
        content: `1. Vật liệu xây dựng, cấu kiện xây dựng đưa vào công trình phải có đầy đủ chứng nhận xuất xứ (CO), chứng nhận chất lượng (CQ), chứng nhận hợp quy theo quy chuẩn kỹ thuật quốc gia (QCVN) và biên bản lấy mẫu thí nghiệm kiểm tra có xác nhận của Tư vấn giám sát.`,
        is_active: true,
        keywords: ['vật liệu xây dựng', 'chứng nhận hợp quy', 'CO CQ', '209/2026/NĐ-CP'],
      },
    ],
  },
  {
    id: 'doc-nd-210-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '210/2026/NĐ-CP',
    title: 'Nghị định số 210/2026/NĐ-CP: Quy định chi tiết về Hợp đồng xây dựng (EPC, Thiết kế - Thi công, Trọn gói)',
    short_title: 'NĐ 210/2026/NĐ-CP · Hợp đồng xây dựng',
    issue_date: '2026-06-15',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Hợp đồng xây dựng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    compliance_stats: { total_sections: 29, very_high_count: 6, high_count: 15, medium_count: 8 },
    summary:
      'Quy định về mẫu hợp đồng xây dựng, bảo đảm thực hiện hợp đồng, tạm ứng, thanh toán, phạt vi phạm hợp đồng và giải quyết tranh chấp hợp đồng xây dựng.',
    articles: [
      {
        id: 'art-nd210-d16',
        document_id: 'doc-nd-210-2026',
        chapter_no: 'Chương II',
        chapter_title: 'Bảo đảm thực hiện, Tạm ứng và Thanh toán hợp đồng xây dựng',
        article_no: 'Điều 16',
        article_title: 'Mức bảo đảm thực hiện hợp đồng và giới hạn mức tạm ứng hợp đồng xây dựng',
        content: `1. Bảo đảm thực hiện hợp đồng xây dựng phải được nộp cho bên giao thầu trước thời điểm hợp đồng có hiệu lực với giá trị từ 2% đến 10% giá hợp đồng.
2. Mức tạm ứng tối thiểu bằng 10% đến 20% giá hợp đồng nhưng tổng mức tạm ứng không được vượt quá 30% giá trị hợp đồng tại thời điểm ký kết và phải có bảo lãnh tiền tạm ứng tương đương.`,
        is_active: true,
        keywords: ['bảo đảm thực hiện hợp đồng', 'tạm ứng hợp đồng xây dựng', 'bảo lãnh tạm ứng', 'hợp đồng EPC'],
      },
    ],
  },
  {
    id: 'doc-nd-212-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '212/2026/NĐ-CP',
    title: 'Nghị định số 212/2026/NĐ-CP: Điều kiện năng lực hoạt động xây dựng của tổ chức và chứng chỉ hành nghề cá nhân',
    short_title: 'NĐ 212/2026/NĐ-CP · Năng lực hoạt động XD',
    issue_date: '2026-06-17',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Phạm Minh Chính',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    summary: 'Quy định điều kiện cấp chứng chỉ năng lực hạng I, II, III cho tổ chức tư vấn, nhà thầu thi công và chứng chỉ hành nghề cá nhân.',
    articles: [
      {
        id: 'art-nd212-d10',
        document_id: 'doc-nd-212-2026',
        chapter_no: 'Chương II',
        chapter_title: 'Chứng chỉ hành nghề và Chứng chỉ năng lực hoạt động xây dựng',
        article_no: 'Điều 10',
        article_title: 'Các chức danh bắt buộc phải có chứng chỉ hành nghề hoạt động xây dựng',
        content: `1. Các chức danh cá nhân bắt buộc phải có chứng chỉ hành nghề bao gồm: Giám đốc quản lý dự án; Chủ nhiệm, chủ trì lập thiết kế quy hoạch xây dựng; Chủ nhiệm khảo sát xây dựng; Chủ nhiệm, chủ trì thiết kế, thẩm tra thiết kế xây dựng; Tư vấn giám sát trưởng; Chỉ huy trưởng công trường.`,
        is_active: true,
        keywords: ['chứng chỉ hành nghề', 'chứng chỉ năng lực', 'chỉ huy trưởng', 'giám đốc quản lý dự án'],
      },
    ],
  },
  // Các Thông tư Bộ Xây dựng từ Thư viện VBPL
  {
    id: 'doc-tt-33-2026',
    doc_type: 'Thông tư',
    issuing_body: 'Bộ Xây dựng',
    doc_number: '33/2026/TT-BXD',
    title: 'Thông tư số 33/2026/TT-BXD: Quy định chi tiết về đánh giá an toàn công trình trong quá trình khai thác, sử dụng',
    short_title: 'TT 33/2026/TT-BXD · Đánh giá an toàn công trình',
    issue_date: '2026-06-25',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Quyết toán',
    signer: 'Bộ trưởng Bộ Xây dựng',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    summary: 'Quy định quy trình kiểm định, quan trắc và đánh giá định kỳ an toàn chịu lực, an toàn vận hành công trình trong quá trình khai thác, sử dụng theo Nghị định 207/2026/NĐ-CP.',
    articles: [
      {
        id: 'art-tt33-d4',
        document_id: 'doc-tt-33-2026',
        chapter_no: 'Chương I',
        chapter_title: 'Đánh giá an toàn công trình và lưu trữ hồ sơ bảo trì',
        article_no: 'Điều 4',
        article_title: 'Trình tự đánh giá an toàn công trình và lập hồ sơ kiểm định chất lượng',
        content: `1. Chủ sở hữu hoặc người quản lý, sử dụng công trình phải tổ chức đánh giá định kỳ an toàn công trình và lưu trữ đầy đủ hồ sơ hoàn thành công trình, bản vẽ hoàn công, nhật ký bảo trì và kết quả quan trắc biến dạng công trình.`,
        is_active: true,
        keywords: ['đánh giá an toàn công trình', 'hồ sơ hoàn công', 'bảo trì công trình', '33/2026/TT-BXD'],
      },
    ],
  },
  {
    id: 'doc-tt-34-2026',
    doc_type: 'Thông tư',
    issuing_body: 'Bộ Xây dựng',
    doc_number: '34/2026/TT-BXD',
    title: 'Thông tư số 34/2026/TT-BXD: Quy định về phân loại, phân cấp công trình xây dựng và hướng dẫn áp dụng trong quản lý hoạt động ĐTXD',
    short_title: 'TT 34/2026/TT-BXD · Cấp công trình xây dựng',
    issue_date: '2026-06-26',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Bộ trưởng Bộ Xây dựng',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    summary: 'Quy định tiêu chí xác định cấp công trình (Cấp đặc biệt, Cấp I, Cấp II, Cấp III, Cấp IV) theo mức độ quan trọng và quy mô kết cấu.',
    articles: [
      {
        id: 'art-tt34-d2',
        document_id: 'doc-tt-34-2026',
        chapter_no: 'Chương I',
        chapter_title: 'Nguyên tắc xác định cấp công trình xây dựng',
        article_no: 'Điều 2',
        article_title: 'Xác định cấp công trình theo quy mô công suất và quy mô kết cấu',
        content: `1. Cấp công trình của một công trình độc lập là cấp cao nhất được xác định theo Phụ lục I (mức độ quan trọng, quy mô công suất) và Phụ lục II (quy mô kết cấu, chiều cao, số tầng, nhịp kết cấu) của Thông tư này.`,
        is_active: true,
        keywords: ['cấp công trình xây dựng', 'cấp đặc biệt', 'cấp I', 'quy mô kết cấu'],
      },
    ],
  },
  {
    id: 'doc-tt-36-2026',
    doc_type: 'Thông tư',
    issuing_body: 'Bộ Xây dựng',
    doc_number: '36/2026/TT-BXD',
    title: 'Thông tư số 36/2026/TT-BXD: Hướng dẫn một số nội dung xác định và quản lý chi phí đầu tư xây dựng',
    short_title: 'TT 36/2026/TT-BXD · Chi phí ĐTXD',
    issue_date: '2026-06-25',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Bộ trưởng Bộ Xây dựng',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    summary: 'Hướng dẫn phương pháp lập tổng mức đầu tư, dự toán xây dựng công trình, định mức chi phí chung và thu nhập chịu thuế tính trước.',
    articles: [
      {
        id: 'art-tt36-d6',
        document_id: 'doc-tt-36-2026',
        chapter_no: 'Chương II',
        chapter_title: 'Phương pháp xác định dự toán xây dựng công trình',
        article_no: 'Điều 6',
        article_title: 'Cấu trúc chi phí trực tiếp, chi phí gián tiếp và thu nhập chịu thuế tính trước',
        content: `1. Chi phí xây dựng trong dự toán công trình gồm: Chi phí trực tiếp (vật liệu, nhân công, máy và thiết bị thi công), Chi phí gián tiếp (chi phí chung, chi phí nhà tạm tại hiện trường để ở và điều hành thi công, chi phí một số công việc không xác định được khối lượng từ thiết kế), Thu nhập chịu thuế tính trước và Thuế giá trị gia tăng.`,
        is_active: true,
        keywords: ['chi phí đầu tư xây dựng', 'chi phí chung', 'thu nhập chịu thuế tính trước', 'dự toán công trình'],
      },
    ],
  },
  {
    id: 'doc-tt-37-2026',
    doc_type: 'Thông tư',
    issuing_body: 'Bộ Xây dựng',
    doc_number: '37/2026/TT-BXD',
    title: 'Thông tư số 37/2026/TT-BXD: Hướng dẫn phương pháp xác định và quản lý định mức xây dựng',
    short_title: 'TT 37/2026/TT-BXD · Phương pháp xác định định mức',
    issue_date: '2026-06-26',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Xây dựng',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Bộ trưởng Bộ Xây dựng',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    summary: 'Hướng dẫn phương pháp lập định mức dự toán mới, điều chỉnh định mức và rà soát, cập nhật hệ thống định mức xây dựng theo Nghị định 206/2026/NĐ-CP.',
    articles: [
      {
        id: 'art-tt37-d1',
        document_id: 'doc-tt-37-2026',
        chapter_no: 'Chương I',
        chapter_title: 'Phương pháp lập và điều chỉnh định mức dự toán xây dựng',
        article_no: 'Điều 1',
        article_title: 'Nguyên tắc xác định định mức mới và điều chỉnh định mức dự toán gói thầu',
        content: `1. Đối với các công tác xây dựng mới chưa có trong hệ thống định mức do Bộ Xây dựng ban hành hoặc áp dụng công nghệ thi công mới, chủ đầu tư tổ chức xác định định mức dự toán mới hoặc định mức điều chỉnh theo phương pháp quy định tại Thông tư này làm cơ sở lập và thẩm tra dự toán gói thầu.`,
        is_active: true,
        keywords: ['xác định định mức xây dựng', 'định mức mới', 'thẩm tra dự toán', '37/2026/TT-BXD'],
      },
    ],
  },
  {
    id: 'doc-tt-38-2026',
    doc_type: 'Thông tư',
    issuing_body: 'Bộ Xây dựng',
    doc_number: '38/2026/TT-BXD',
    title: 'Thông tư số 38/2026/TT-BXD: Ban hành định mức xây dựng (Định mức dự toán và định mức chi phí quản lý dự án, tư vấn ĐTXD)',
    short_title: 'TT 38/2026/TT-BXD · Ban hành định mức xây dựng',
    issue_date: '2026-06-30',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Đầu tư & QLDA',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Bộ trưởng Bộ Xây dựng',
    source_url: 'https://thuvien-vbpl-26.web.app/',
    summary: 'Ban hành hệ thống định mức dự toán xây dựng công trình và định mức tỷ lệ phần trăm (%) chi phí quản lý dự án, tư vấn đầu tư xây dựng.',
    articles: [
      {
        id: 'art-tt38-d3',
        document_id: 'doc-tt-38-2026',
        chapter_no: 'Chương I',
        chapter_title: 'Hệ thống định mức xây dựng và định mức chi phí QLDA, tư vấn',
        article_no: 'Điều 3',
        article_title: 'Áp dụng định mức dự toán và định mức chi phí quản lý dự án, tư vấn khi áp dụng BIM',
        content: `1. Chi phí quản lý dự án được xác định theo định mức tỷ lệ phần trăm (%) nhân với chi phí xây dựng và chi phí thiết bị (chưa có thuế GTGT) trong tổng mức đầu tư được duyệt. Trường hợp dự án áp dụng mô hình thông tin công trình (BIM), chi phí tư vấn áp dụng BIM được tính bổ sung tối đa không quá 15% chi phí thiết kế xây dựng.`,
        is_active: true,
        keywords: ['ban hành định mức xây dựng', 'định mức quản lý dự án', 'chi phí tư vấn thiết kế', '38/2026/TT-BXD'],
      },
    ],
  },
  {
    id: 'doc-ldd-31-2024',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '31/2024/QH15',
    title: 'Luật Đất đai số 31/2024/QH15: Quy định về quy hoạch, thu hồi đất, bàn giao mặt bằng sạch và giao đất thực hiện dự án',
    short_title: 'Luật Đất đai 31/2024/QH15',
    issue_date: '2024-01-18',
    effective_date: '2024-08-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Đất đai',
    project_stage: 'Quy hoạch',
    signer: 'Vương Đình Huệ',
    is_new_daily_update: true,
    compliance_stats: { total_sections: 38, very_high_count: 9, high_count: 20, medium_count: 9 },
    summary:
      'Luật khung điều chỉnh quy hoạch sử dụng đất, thu hồi đất, bồi thường giải phóng mặt bằng, bàn giao mặt bằng sạch, giao đất, cho thuê đất và định giá đất thực hiện dự án đầu tư xây dựng.',
    articles: [
      {
        id: 'art-ldd-d45',
        document_id: 'doc-ldd-31-2024',
        chapter_no: 'Chương III',
        chapter_title: 'Quyền và nghĩa vụ của người sử dụng đất và Bàn giao mặt bằng dự án',
        article_no: 'Điều 45',
        article_title: 'Điều kiện thực hiện các quyền của người sử dụng đất và bàn giao mặt bằng sạch để khởi công dự án',
        content: `1. Chủ đầu tư thực hiện dự án đầu tư xây dựng chỉ được nhận bàn giao đất trên thực địa và triển khai khởi công xây dựng khi đã có Quyết định giao đất, cho thuê đất hoặc cho phép chuyển mục đích sử dụng đất của cơ quan nhà nước có thẩm quyền và đã hoàn thành phương án bồi thường, hỗ trợ, tái định cư được phê duyệt.
2. Trường hợp dự án nhóm A hoặc dự án có phân kỳ đầu tư theo giai đoạn, việc bàn giao mặt bằng sạch trên thực địa được thực hiện theo từng phân kỳ tương ứng với tiến độ được phê duyệt trong Quyết định chủ trương đầu tư và bảo đảm điều kiện khởi công tại Điều 14 Luật Xây dựng.`,
        is_active: true,
        keywords: ['bàn giao mặt bằng sạch', 'quyết định giao đất', 'bồi thường giải phóng mặt bằng', 'dự án nhóm A'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Biên bản bàn giao mốc giới và mặt bằng sạch trên thực địa của Sở Tài nguyên & Môi trường là chứng từ bắt buộc trước khi phát lệnh khởi công.',
      },
      {
        id: 'art-ldd-d126',
        document_id: 'doc-ldd-31-2024',
        chapter_no: 'Chương IX',
        chapter_title: 'Giao đất, cho thuê đất, chuyển mục đích sử dụng đất',
        article_no: 'Điều 126',
        article_title: 'Giao đất, cho thuê đất thông qua đấu thầu lựa chọn nhà đầu tư thực hiện dự án có sử dụng đất',
        content: `1. Nhà nước giao đất có thu tiền sử dụng đất, cho thuê đất thông qua đấu thầu lựa chọn nhà đầu tư thực hiện dự án đầu tư có sử dụng đất đối với dự án đầu tư xây dựng khu đô thị có công năng phục vụ hỗn hợp, đồng bộ hệ thống hạ tầng kỹ thuật, hạ tầng xã hội với nhà ở.
2. Điều kiện để đấu thầu lựa chọn nhà đầu tư thực hiện dự án có sử dụng đất: Thuộc danh mục các khu đất thực hiện đấu thầu dự án được HĐND cấp tỉnh thông qua; đã có quy hoạch chi tiết hoặc quy hoạch phân khu tỷ lệ 1/2000 được cơ quan có thẩm quyền phê duyệt.`,
        is_active: true,
        keywords: ['đấu thầu dự án có sử dụng đất', 'khu đô thị hỗn hợp', 'quy hoạch phân khu 1/2000', 'HĐND cấp tỉnh'],
      },
      {
        id: 'art-ldd-d159',
        document_id: 'doc-ldd-31-2024',
        chapter_no: 'Chương XI',
        chapter_title: 'Tài chính về đất đai, giá đất',
        article_no: 'Điều 159',
        article_title: 'Bảng giá đất hàng năm và định giá đất cụ thể tính tiền sử dụng đất dự án',
        content: `1. Bảng giá đất được xây dựng theo khu vực, vị trí và công bố áp dụng hằng năm từ ngày 01 tháng 01 để làm căn cứ tính tiền thuê đất trả tiền hằng năm, thuế sử dụng đất, phí và lệ phí.
2. Đối với trường hợp Nhà nước giao đất có thu tiền sử dụng đất để thực hiện dự án đầu tư xây dựng kinh doanh nhà ở, khu đô thị thì áp dụng Giá đất cụ thể do UBND cấp tỉnh quyết định.`,
        is_active: true,
        keywords: ['bảng giá đất hàng năm', 'giá đất cụ thể', 'tiền sử dụng đất dự án'],
      },
    ],
  },
  {
    id: 'doc-ldt-22-2023',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '22/2023/QH15',
    title: 'Luật Đấu thầu số 22/2023/QH15: Quy định về kế hoạch lựa chọn nhà thầu, đấu thầu gói thầu xây lắp và hợp đồng',
    short_title: 'Luật Đấu thầu 22/2023/QH15',
    issue_date: '2023-06-23',
    effective_date: '2024-01-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Đấu thầu',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Vương Đình Huệ',
    compliance_stats: { total_sections: 34, very_high_count: 8, high_count: 18, medium_count: 8 },
    summary:
      'Quy định về Kế hoạch lựa chọn nhà thầu (KHLCNT), điều kiện phát hành Hồ sơ mời thầu gói thầu xây lắp – tư vấn – EPC, các hình thức lựa chọn nhà thầu và nguyên tắc thực hiện hợp đồng.',
    articles: [
      {
        id: 'art-ldt-d12',
        document_id: 'doc-ldt-22-2023',
        chapter_no: 'Chương I',
        chapter_title: 'Quy định chung và Điều kiện tổ chức đấu thầu',
        article_no: 'Điều 12',
        article_title: 'Điều kiện đồng bộ giữa gói thầu xây lắp, quyết định đầu tư và phát hành Hồ sơ mời thầu',
        content: `1. Hồ sơ mời thầu, hồ sơ yêu cầu của gói thầu xây lắp chỉ được phát hành để lựa chọn nhà thầu khi đáp ứng đồng bộ các điều kiện sau đây:
a) Kế hoạch lựa chọn nhà thầu đã được Người có thẩm quyền hoặc Chủ đầu tư phê duyệt trên cơ sở Quyết định phê duyệt dự án đầu tư;
b) Thiết kế xây dựng triển khai sau thiết kế cơ sở và dự toán gói thầu xây dựng đã được thẩm định, phê duyệt hợp lệ;
c) Đã xác định rõ nguồn vốn bố trí cho gói thầu theo tiến độ thực hiện và kế hoạch bàn giao mặt bằng thi công phù hợp với Điều 14 Luật Xây dựng.
2. Nghiêm cấm việc chia nhỏ dự án thành các gói thầu trái quy định nhằm mục đích chỉ định thầu hoặc hạn chế sự tham gia của các nhà thầu.`,
        is_active: true,
        keywords: ['điều kiện phát hành HSMT', 'đồng bộ gói thầu xây lắp', 'kế hoạch lựa chọn nhà thầu', 'chia nhỏ gói thầu'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Kiểm tra tính thống nhất giữa Giá gói thầu trong KHLCNT và Dự toán gói thầu được duyệt trong vòng 28 ngày trước ngày mở thầu.',
      },
      {
        id: 'art-ldt-d23',
        document_id: 'doc-ldt-22-2023',
        chapter_no: 'Chương II',
        chapter_title: 'Hình thức, phương thức lựa chọn nhà thầu',
        article_no: 'Điều 23',
        article_title: 'Chỉ định thầu đối với gói thầu đầu tư xây dựng và tư vấn',
        content: `1. Chỉ định thầu được áp dụng đối với gói thầu cấp bách cần thực hiện ngay để khắc phục sự cố công trình xây dựng, thiên tai, hỏa hoạn; hoặc gói thầu thuộc dự án đầu tư có giá gói thầu trong hạn mức: không quá 500 triệu đồng đối với gói thầu dịch vụ tư vấn, không quá 01 tỷ đồng đối với gói thầu phi tư vấn, hàng hóa, xây lắp, hỗn hợp.
2. Thời gian thực hiện quy trình chỉ định thầu thông thường không quá 45 ngày; đối với quy trình chỉ định thầu rút gọn không quá 15 ngày kể từ ngày phê duyệt hồ sơ yêu cầu đến ngày ký kết hợp đồng.`,
        is_active: true,
        keywords: ['chỉ định thầu', 'hạn mức 500 triệu tư vấn', 'hạn mức 1 tỷ xây lắp', 'chỉ định thầu rút gọn'],
      },
      {
        id: 'art-ldt-d64',
        document_id: 'doc-ldt-22-2023',
        chapter_no: 'Chương VI',
        chapter_title: 'Hợp đồng với nhà thầu',
        article_no: 'Điều 64',
        article_title: 'Các loại hợp đồng trong đấu thầu và nguyên tắc điều chỉnh hợp đồng',
        content: `1. Các loại hợp đồng bao gồm: Hợp đồng trọn gói, Hợp đồng theo đơn giá cố định, Hợp đồng theo đơn giá điều chỉnh, Hợp đồng theo thời gian, Hợp đồng theo chi phí cộng phí.
2. Hợp đồng theo đơn giá điều chỉnh được áp dụng đối với gói thầu mà tại thời điểm lựa chọn nhà thầu không thể lường trước được biến động giá các yếu tố đầu vào và có thời gian thực hiện hợp đồng dài.`,
        is_active: true,
        keywords: ['hợp đồng trọn gói', 'hợp đồng theo đơn giá điều chỉnh', 'công thức điều chỉnh giá'],
      },
    ],
  },
  {
    id: 'doc-lpccc-55-2024',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '55/2024/QH15',
    title: 'Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ số 55/2024/QH15',
    short_title: 'Luật PCCC & CNCH 55/2024/QH15',
    issue_date: '2024-11-29',
    effective_date: '2025-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'PCCC',
    project_stage: 'Thực thi',
    signer: 'Trần Thanh Mẫn',
    is_new_daily_update: true,
    compliance_stats: { total_sections: 27, very_high_count: 9, high_count: 14, medium_count: 4 },
    summary:
      'Quy định về yêu cầu PCCC trong lập quy hoạch đô thị, thẩm định thiết kế xây dựng, thi công lắp đặt thiết bị PCCC và kiểm tra kết quả nghiệm thu trước khi đưa công trình vào sử dụng.',
    articles: [
      {
        id: 'art-lpccc-d18',
        document_id: 'doc-lpccc-55-2024',
        chapter_no: 'Chương II',
        chapter_title: 'Phòng cháy trong đầu tư xây dựng công trình',
        article_no: 'Điều 18',
        article_title: 'Thẩm định thiết kế và kiểm tra công tác nghiệm thu về phòng cháy và chữa cháy',
        content: `1. Cơ quan chuyên môn về xây dựng thẩm định các nội dung về khoảng cách an toàn PCCC, giải pháp thoát nạn, bậc chịu lửa và chống cháy lan đồng thời trong quá trình thẩm định Báo cáo nghiên cứu khả thi và thiết kế xây dựng triển khai sau thiết kế cơ sở.
2. Cơ quan Công an có thẩm quyền thẩm định chuyên sâu về hệ thống thiết bị báo cháy, chữa cháy, phương tiện PCCC cơ giới và kiểm tra kết quả nghiệm thu về phòng cháy, chữa cháy của Chủ đầu tư trước khi công trình được phép nghiệm thu hoàn thành đưa vào sử dụng theo Điều 123 Luật Xây dựng.`,
        is_active: true,
        keywords: ['thẩm định thiết kế PCCC', 'nghiệm thu PCCC', 'bậc chịu lửa', 'giải pháp thoát nạn'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Mọi thay đổi về vách ngăn cháy, hành lang thoát nạn trong quá trình thi công đều phải được thẩm định lại trước khi mời Cảnh sát PCCC kiểm tra nghiệm thu.',
      },
    ],
  },
  {
    id: 'doc-nd-99-2021',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '99/2021/NĐ-CP',
    title: 'Nghị định số 99/2021/NĐ-CP: Quy định về quản lý, thanh toán, quyết toán dự án sử dụng vốn đầu tư',
    short_title: 'Nghị định 99/2021/NĐ-CP',
    issue_date: '2021-11-11',
    effective_date: '2022-01-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Tài chính',
    project_stage: 'Quyết toán',
    signer: 'Lê Minh Khái',
    compliance_stats: { total_sections: 22, very_high_count: 5, high_count: 12, medium_count: 5 },
    summary:
      'Quy định chi tiết việc quản lý, tạm ứng, thanh toán khối lượng hoàn thành và thẩm tra, phê duyệt quyết toán vốn đầu tư dự án hoàn thành đối với các dự án đầu tư xây dựng công trình.',
    articles: [
      {
        id: 'art-nd99-d31',
        document_id: 'doc-nd-99-2021',
        chapter_no: 'Chương III',
        chapter_title: 'Quyết toán vốn đầu tư dự án hoàn thành',
        article_no: 'Điều 31',
        article_title: 'Hồ sơ và nguyên tắc thẩm tra quyết toán vốn đầu tư dự án hoàn thành',
        content: `1. Vốn đầu tư được quyết toán là toàn bộ chi phí hợp pháp thực hiện trong quá trình đầu tư để đưa dự án vào khai thác, sử dụng. Chi phí hợp pháp là chi phí được thực hiện trong phạm vi dự án, thiết kế, dự toán được duyệt và đúng các quy định của hợp đồng đã ký kết phù hợp với quy định của pháp luật về xây dựng và đấu thầu.
2. Giá trị đề nghị quyết toán của các gói thầu xây lắp phải căn cứ vào Biên bản nghiệm thu hoàn thành công trình đưa vào sử dụng (theo Điều 123 Luật Xây dựng) và bảng xác định giá trị khối lượng công việc hoàn thành theo hợp đồng.`,
        is_active: true,
        keywords: ['quyết toán dự án hoàn thành', 'chi phí hợp pháp', 'biên bản nghiệm thu hoàn thành', 'thẩm tra quyết toán'],
        amendment_note:
          'Gợi ý kiểm toán ĐẠI SƠN: Rà soát chặt chẽ các biên bản nghiệm thu công việc xây dựng ẩn khuất và nhật ký thi công trước khi trình phê duyệt quyết toán vốn đầu tư.',
      },
      {
        id: 'art-nd99-d47',
        document_id: 'doc-nd-99-2021',
        chapter_no: 'Chương III',
        chapter_title: 'Quyết toán vốn đầu tư dự án hoàn thành',
        article_no: 'Điều 47',
        article_title: 'Thời gian lập hồ sơ, thẩm tra và phê duyệt quyết toán vốn đầu tư dự án hoàn thành',
        content: `1. Thời gian lập hồ sơ quyết toán vốn đầu tư dự án hoàn thành (tính từ ngày ký biên bản nghiệm thu hoàn thành công trình của dự án để đưa vào khai thác, sử dụng):
a) Dự án quan trọng quốc gia và dự án nhóm A: Tối đa 09 tháng;
b) Dự án nhóm B: Tối đa 06 tháng;
c) Dự án nhóm C: Tối đa 04 tháng.`,
        is_active: true,
        keywords: ['thời hạn quyết toán 09 tháng', 'dự án nhóm A B C', 'chậm quyết toán dự án'],
      },
    ],
  },

  // ============================================================================
  // PHẦN 1B: CỤM PHẢ HỆ LUẬT KẾ TOÁN 88/2015/QH13 & 3 LẦN SỬA ĐỔI (38/2019, 56/2024, 108/2025)
  // ============================================================================
  {
    id: 'doc-lkt-88-2015',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XIII',
    doc_number: '88/2015/QH13',
    title:
      'Luật Kế toán số 88/2015/QH13: Quy định về nội dung công tác kế toán, tổ chức bộ máy kế toán, người làm kế toán, hoạt động kinh doanh dịch vụ kế toán và quản lý nhà nước về kế toán',
    short_title: 'Luật Kế toán · 88/2015/QH13',
    issue_date: '2015-11-20',
    effective_date: '2017-01-01',
    expiration_date: null,
    status: 'SUA_DOI_BO_SUNG',
    field: 'Kế toán · Kiểm toán',
    project_stage: 'Quyết toán',
    signer: 'Nguyễn Sinh Hùng',
    national_database_url: 'https://vbpl.vn',
    total_clauses_count: 509,
    total_articles_count: 74,
    authenticity_tier: 'VERIFIED_EXCERPT',
    is_consolidated: false,
    consolidated_doc_number: 'THNB-LKT-88-2015',
    amended_count: 3,
    amendment_history: [
      {
        amending_doc_id: 'doc-lqlthue-38-2019',
        amending_doc_number: '38/2019/QH14',
        amending_doc_title:
          'Luật Quản lý thuế số 38/2019/QH14 (Sửa đổi, bổ sung quy định liên thông chứng từ điện tử, hóa đơn điện tử và lưu trữ dữ liệu kế toán thuế)',
        promulgation_date: '2019-06-13',
        effective_date: '2020-07-01',
        scopes: ['Điều 17', 'Điều 18', 'Điều 24'],
        action_type: 'SUA_DOI_BO_SUNG',
        summary:
          'Chuẩn hóa giá trị pháp lý của chứng từ điện tử và đồng bộ hóa đơn điện tử theo Luật Quản lý thuế với chứng từ kế toán.',
      },
      {
        amending_doc_id: 'doc-lsd9luat-56-2024',
        amending_doc_number: '56/2024/QH15',
        amending_doc_title:
          'Luật số 56/2024/QH15 sửa đổi, bổ sung một số điều của Luật Chứng khoán, Luật Kế toán, Luật Kiểm toán độc lập, Luật Ngân sách nhà nước, Luật Quản lý, sử dụng tài sản công, Luật Quản lý thuế, Luật Thuế TNCN, Luật Dự trữ quốc gia, Luật XLVPHC',
        promulgation_date: '2024-11-29',
        effective_date: '2025-01-01',
        scopes: ['Điều 3', 'Điều 11', 'Điều 16', 'Điều 20', 'Điều 28', 'Điều 29', 'Điều 41', 'Điều 52'],
        action_type: 'SUA_DOI_BO_SUNG',
        summary:
          'Rút ngắn thủ tục chữ viết/ngoại tệ trong kế toán, nới thời hạn kỳ kế toán đầu tiên tối đa 15 tháng, chuẩn hóa khuôn khổ công bố chuẩn mực kế toán quốc tế và Báo cáo tài chính nhà nước.',
      },
      {
        amending_doc_id: 'doc-lsdlkt-108-2025',
        amending_doc_number: '108/2025/QH15',
        amending_doc_title:
          'Luật Quản lý thuế số 108/2025/QH15 (Đồng bộ dữ liệu chứng từ kế toán điện tử, hóa đơn điện tử và định danh chữ ký số thuế)',
        promulgation_date: '2025-12-10',
        effective_date: '2026-07-01',
        scopes: ['Điều 17', 'Điều 18', 'Điều 39'],
        action_type: 'SUA_DOI_BO_SUNG',
        summary:
          'Đồng bộ quy định quản lý chứng từ kế toán điện tử, hóa đơn điện tử khởi tạo từ hệ thống số hóa và đối chiếu dữ liệu thuế thời gian thực.',
      },
    ],
    compliance_stats: { total_sections: 74, very_high_count: 12, high_count: 38, medium_count: 24 },
    summary:
      'Luật khung điều chỉnh toàn bộ công tác lập chứng từ kế toán, ghi sổ kế toán, lập và trình bày Báo cáo tài chính, kiểm tra kế toán và quyết toán vốn đầu tư tại doanh nghiệp, Ban Quản lý dự án và đơn vị sự nghiệp.',
    articles: [
      {
        id: 'art-lkt88-d3',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương I',
        chapter_title: 'Những quy định chung',
        article_no: 'Điều 3',
        article_title: 'Giải thích từ ngữ',
        clause_count: 19,
        point_count: 4,
        content: `Trong Luật này, các từ ngữ dưới đây được hiểu như sau:
1. Báo cáo tài chính là hệ thống thông tin kinh tế, tài chính của đơn vị kế toán được trình bày theo biểu mẫu quy định tại chuẩn mực kế toán và chế độ kế toán.
2. Chế độ kế toán là những quy định và hướng dẫn về kế toán trong một lĩnh vực hoặc một số công việc cụ thể do Bộ Tài chính hoặc cơ quan quản lý nhà nước có thẩm quyền ban hành theo chuẩn mực kế toán Việt Nam và chuẩn mực báo cáo tài chính quốc tế (IFRS).
3. Chứng từ kế toán là những giấy tờ và vật mang tin phản ánh nghiệp vụ kinh tế, tài chính phát sinh và đã hoàn thành, làm căn cứ ghi sổ kế toán.
4. Đơn vị kế toán là cơ quan, tổ chức, đơn vị quy định tại các khoản 1, 2, 3, 4 và 5 Điều 2 của Luật này có lập báo cáo tài chính.
8. Kế toán là việc thu thập, xử lý, kiểm tra, phân tích và cung cấp thông tin kinh tế, tài chính dưới hình thức giá trị, hiện vật và thời gian lao động.
12. Giá trị hợp lý là giá trị được xác định phù hợp với giá thị trường, có thể nhận được khi bán một tài sản hoặc chuyển nhượng một khoản nợ phải trả tại thời điểm xác định giá trị.
19. Phương tiện điện tử là phương tiện hoạt động dựa trên công nghệ điện, điện tử, kỹ thuật số, từ tính, truyền dẫn không dây, quang học, điện từ hoặc công nghệ tương tự.`,
        clauses: [
          {
            id: 'art-lkt88-d3-k1',
            clause_no: 'Khoản 1',
            text: '1. Báo cáo tài chính là hệ thống thông tin kinh tế, tài chính của đơn vị kế toán được trình bày theo biểu mẫu quy định tại chuẩn mực kế toán và chế độ kế toán.',
            is_amended: false,
          },
          {
            id: 'art-lkt88-d3-k2',
            clause_no: 'Khoản 2',
            text: '2. Chế độ kế toán là những quy định và hướng dẫn về kế toán trong một lĩnh vực hoặc một số công việc cụ thể do Bộ Tài chính hoặc cơ quan quản lý nhà nước có thẩm quyền ban hành theo chuẩn mực kế toán Việt Nam và chuẩn mực báo cáo tài chính quốc tế (IFRS).',
            is_amended: true,
            diff_data: {
              original_text:
                '2. Chế độ kế toán là những quy định và hướng dẫn về kế toán trong một lĩnh vực hoặc một số công việc cụ thể do cơ quan quản lý nhà nước về kế toán hoặc tổ chức được cơ quan quản lý nhà nước về kế toán ủy quyền ban hành.',
              replaced_text:
                '2. Chế độ kế toán là những quy định và hướng dẫn về kế toán trong một lĩnh vực hoặc một số công việc cụ thể do Bộ Tài chính hoặc cơ quan quản lý nhà nước có thẩm quyền ban hành theo chuẩn mực kế toán Việt Nam và chuẩn mực báo cáo tài chính quốc tế (IFRS).',
              amending_doc_id: 'doc-lsd9luat-56-2024',
              amending_doc_number: '56/2024/QH15',
              amending_doc_title:
                'Luật số 56/2024/QH15 sửa đổi, bổ sung một số điều của 09 Luật lĩnh vực Tài chính - Ngân sách',
              effective_date: '2025-01-01',
              change_summary:
                'Bãi bỏ cơ chế "ủy quyền cho tổ chức khác ban hành chế độ kế toán" và bổ sung căn cứ Chuẩn mực báo cáo tài chính quốc tế (IFRS) do Bộ Tài chính trực tiếp ban hành.',
            },
          },
          {
            id: 'art-lkt88-d3-k3',
            clause_no: 'Khoản 3',
            text: '3. Chứng từ kế toán là những giấy tờ và vật mang tin phản ánh nghiệp vụ kinh tế, tài chính phát sinh và đã hoàn thành, làm căn cứ ghi sổ kế toán.',
            is_amended: false,
          },
          {
            id: 'art-lkt88-d3-k4',
            clause_no: 'Khoản 4',
            text: '4. Đơn vị kế toán là cơ quan, tổ chức, đơn vị quy định tại các khoản 1, 2, 3, 4 và 5 Điều 2 của Luật này có lập báo cáo tài chính.',
            is_amended: false,
          },
          {
            id: 'art-lkt88-d3-k8',
            clause_no: 'Khoản 8',
            text: '8. Kế toán là việc thu thập, xử lý, kiểm tra, phân tích và cung cấp thông tin kinh tế, tài chính dưới hình thức giá trị, hiện vật và thời gian lao động.',
            is_amended: false,
          },
          {
            id: 'art-lkt88-d3-k12',
            clause_no: 'Khoản 12',
            text: '12. Giá trị hợp lý là giá trị được xác định phù hợp với giá thị trường, có thể nhận được khi bán một tài sản hoặc chuyển nhượng một khoản nợ phải trả tại thời điểm xác định giá trị theo chuẩn mực kế toán.',
            is_amended: true,
            diff_data: {
              original_text:
                '12. Giá trị hợp lý là giá trị được xác định phù hợp với giá thị trường, có thể nhận được khi bán một tài sản hoặc chuyển nhượng một khoản nợ phải trả tại thời điểm xác định giá trị.',
              replaced_text:
                '12. Giá trị hợp lý là giá trị được xác định phù hợp với giá thị trường, có thể nhận được khi bán một tài sản hoặc chuyển nhượng một khoản nợ phải trả tại thời điểm xác định giá trị theo chuẩn mực kế toán.',
              amending_doc_id: 'doc-lsd9luat-56-2024',
              amending_doc_number: '56/2024/QH15',
              amending_doc_title:
                'Luật số 56/2024/QH15 sửa đổi, bổ sung một số điều của 09 Luật lĩnh vực Tài chính - Ngân sách',
              effective_date: '2025-01-01',
              change_summary:
                'Chuẩn hóa khái niệm Giá trị hợp lý (Fair Value) gắn liền với khung tham chiếu Chuẩn mực kế toán & IFRS 13.',
            },
          },
          {
            id: 'art-lkt88-d3-k19',
            clause_no: 'Khoản 19',
            text: '19. Phương tiện điện tử là phương tiện hoạt động dựa trên công nghệ điện, điện tử, kỹ thuật số, từ tính, truyền dẫn không dây, quang học, điện từ hoặc công nghệ tương tự.',
            is_amended: false,
          },
        ],
        is_active: true,
        is_amended: true,
        amendment_info: {
          amending_doc_id: 'doc-lsd9luat-56-2024',
          amending_doc_number: '56/2024/QH15',
          amending_doc_title: 'Luật số 56/2024/QH15 sửa đổi, bổ sung 09 Luật lĩnh vực Tài chính - Ngân sách',
          promulgation_date: '2024-11-29',
          effective_date: '2025-01-01',
          action_type: 'SUA_DOI_BO_SUNG',
          scopes: ['Khoản 2', 'Khoản 12 Điều 3'],
          summary:
            'Sửa đổi Khoản 2 và Khoản 12 Điều 3 tại Luật số 56/2024/QH15: Bổ sung khuôn khổ Chuẩn mực báo cáo tài chính quốc tế (IFRS) và chuẩn hóa khái niệm Giá trị hợp lý.',
          previous_excerpt:
            'Khoản 2 cũ (2015): Chế độ kế toán là những quy định và hướng dẫn về kế toán trong một lĩnh vực hoặc một số công việc cụ thể do cơ quan quản lý nhà nước về kế toán hoặc tổ chức được cơ quan quản lý nhà nước về kế toán ủy quyền ban hành.',
        },
        keywords: ['giải thích từ ngữ', 'chế độ kế toán', 'chứng từ kế toán', 'giá trị hợp lý', '56/2024/QH15'],
        amendment_note:
          'Phả hệ sửa đổi: Điều 3 (19 khoản) đã được sửa đổi, bổ sung tại Khoản 2 và Khoản 12 bởi Luật số 56/2024/QH15.',
      },
      {
        id: 'art-lkt88-d5',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương I',
        chapter_title: 'Những quy định chung',
        article_no: 'Điều 5',
        article_title: 'Yêu cầu kế toán và nguyên tắc trung thực, khách quan',
        clause_count: 6,
        point_count: 0,
        content: `1. Phản ánh đầy đủ nghiệp vụ kinh tế, tài chính phát sinh vào chứng từ kế toán, sổ kế toán và báo cáo tài chính.
2. Phản ánh kịp thời, đúng thời gian quy định thông tin, số liệu kế toán.
3. Phản ánh rõ ràng, dễ hiểu và chính xác thông tin, số liệu kế toán.
4. Phản ánh trung thực, khách quan hiện trạng, bản chất sự việc, nội dung và giá trị của nghiệp vụ kinh tế, tài chính.
5. Thông tin, số liệu kế toán phải được phản ánh liên tục từ khi phát sinh đến khi kết thúc hoạt động kinh tế, tài chính, từ khi thành lập đến khi chấm dứt hoạt động của đơn vị kế toán; số liệu kế toán kỳ này phải kế tiếp số liệu kế toán của kỳ trước.`,
        is_active: true,
        is_amended: false,
        keywords: ['yêu cầu kế toán', 'trung thực khách quan', 'nghiệp vụ kinh tế tài chính'],
      },
      {
        id: 'art-lkt88-d6',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương I',
        chapter_title: 'Những quy định chung',
        article_no: 'Điều 6',
        article_title: 'Chuẩn mực kế toán, Chuẩn mực báo cáo tài chính quốc tế (IFRS) và chuẩn mực đạo đức nghề nghiệp',
        clause_count: 4,
        point_count: 2,
        content: `1. Chuẩn mực kế toán gồm những quy định và phương pháp kế toán cơ bản để lập báo cáo tài chính.
2. Bộ Tài chính quy định chuẩn mực kế toán Việt Nam (VAS) và lộ trình, đối tượng áp dụng Chuẩn mực báo cáo tài chính quốc tế (IFRS) tại Việt Nam trên cơ sở chuẩn mực quốc tế về kế toán phù hợp với điều kiện cụ thể của Việt Nam sau khi báo cáo Chính phủ.
3. Đối với các doanh nghiệp niêm yết, công ty đại chúng quy mô lớn và Ban Quản lý dự án có sử dụng vốn vay quốc tế ODA, được phép và khuyến khích lập Báo cáo tài chính hợp nhất theo IFRS từ kỳ kế toán năm 2026.`,
        clauses: [
          {
            id: 'art-lkt88-d6-k1',
            clause_no: 'Khoản 1',
            text: '1. Chuẩn mực kế toán gồm những quy định và phương pháp kế toán cơ bản để lập báo cáo tài chính.',
            is_amended: false,
          },
          {
            id: 'art-lkt88-d6-k2',
            clause_no: 'Khoản 2',
            text: '2. Bộ Tài chính quy định chuẩn mực kế toán Việt Nam (VAS) và hướng dẫn áp dụng chuẩn mực báo cáo tài chính quốc tế (IFRS) trên cơ sở chuẩn mực quốc tế về kế toán phù hợp với điều kiện cụ thể của Việt Nam.',
            is_amended: true,
            diff_data: {
              original_text:
                '2. Bộ Tài chính quy định chuẩn mực kế toán trên cơ sở chuẩn mực quốc tế về kế toán phù hợp với điều kiện cụ thể của Việt Nam.',
              replaced_text:
                '2. Bộ Tài chính quy định chuẩn mực kế toán Việt Nam (VAS) và hướng dẫn áp dụng chuẩn mực báo cáo tài chính quốc tế (IFRS) trên cơ sở chuẩn mực quốc tế về kế toán phù hợp với điều kiện cụ thể của Việt Nam.',
              amending_doc_id: 'doc-lsd9luat-56-2024',
              amending_doc_number: '56/2024/QH15',
              amending_doc_title:
                'Luật số 56/2024/QH15 sửa đổi, bổ sung một số điều của 09 Luật lĩnh vực Tài chính - Ngân sách',
              effective_date: '2025-01-01',
              change_summary:
                'Bổ sung thẩm quyền của Bộ Tài chính hướng dẫn áp dụng Chuẩn mực báo cáo tài chính quốc tế (IFRS) song hành cùng chuẩn mực kế toán Việt Nam (VAS) theo Luật số 56/2024/QH15.',
            },
          },
          {
            id: 'art-lkt88-d6-k3',
            clause_no: 'Khoản 3',
            text: '3. Bộ Tài chính quy định chuẩn mực đạo đức nghề nghiệp kế toán trên cơ sở chuẩn mực quốc tế về đạo đức nghề nghiệp kế toán phù hợp với điều kiện cụ thể của Việt Nam.',
            is_amended: false,
          },
        ],
        is_active: true,
        is_amended: true,
        amendment_info: {
          amending_doc_id: 'doc-lsd9luat-56-2024',
          amending_doc_number: '56/2024/QH15',
          amending_doc_title:
            'Luật số 56/2024/QH15 sửa đổi, bổ sung một số điều của 09 Luật lĩnh vực Tài chính - Ngân sách',
          promulgation_date: '2024-11-29',
          effective_date: '2025-01-01',
          action_type: 'SUA_DOI_BO_SUNG',
          scopes: ['Khoản 2 Điều 6'],
          summary:
            'Bổ sung cơ chế pháp lý áp dụng Chuẩn mực Báo cáo tài chính quốc tế (IFRS) tại Khoản 2 Điều 6 theo Luật số 56/2024/QH15.',
          previous_excerpt:
            'Khoản 2 cũ (2015): Bộ Tài chính quy định chuẩn mực kế toán trên cơ sở chuẩn mực quốc tế về kế toán phù hợp với điều kiện cụ thể của Việt Nam.',
        },
        keywords: ['chuẩn mực kế toán', 'IFRS', 'VAS', 'báo cáo tài chính quốc tế', '56/2024/QH15'],
        amendment_note:
          'Phả hệ sửa đổi: Đã được sửa đổi, bổ sung bởi Luật số 56/2024/QH15 về cơ chế công bố, áp dụng chuẩn mực kế toán quốc tế.',
      },
      {
        id: 'art-lkt88-d8',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương I',
        chapter_title: 'Những quy định chung',
        article_no: 'Điều 8',
        article_title: 'Những hành vi bị nghiêm cấm trong công tác kế toán',
        clause_count: 23,
        point_count: 6,
        content: `1. Giả mạo, khai man hoặc thỏa thuận, ép buộc người khác giả mạo, khai man, tẩy xóa chứng từ kế toán hoặc tài liệu kế toán khác.
2. Cố ý, thỏa thuận hoặc ép buộc người khác cung cấp, xác nhận thông tin, số liệu kế toán sai sự thật.
3. Để ngoài sổ kế toán tài sản, nợ phải trả của đơn vị kế toán hoặc có liên quan đến đơn vị kế toán.
4. Hủy bỏ hoặc cố ý làm hư hỏng tài liệu kế toán trước khi kết thúc thời hạn lưu trữ quy định tại Điều 41 của Luật này.
5. Ban hành, công bố chuẩn mực kế toán, chế độ kế toán không đúng thẩm quyền.
6. Mua chuộc, đe dọa, trù dập, cưỡng ép người làm kế toán thực hiện công việc kế toán không đúng với quy định của Luật này.
7. Người có trách nhiệm quản lý, điều hành đơn vị kế toán kiêm làm kế toán, thủ kho, thủ quỹ, trừ doanh nghiệp tư nhân và công ty trách nhiệm hữu hạn do một cá nhân làm chủ sở hữu.
8. Lập hai hệ thống sổ kế toán tài chính trở lên hoặc cung cấp, công bố các báo cáo tài chính có số liệu không đồng nhất trong cùng một kỳ kế toán.`,
        is_active: true,
        is_amended: false,
        keywords: ['hành vi bị nghiêm cấm', 'giả mạo chứng từ', 'ngoài sổ kế toán', 'hai hệ thống sổ kế toán'],
      },
      {
        id: 'art-lkt88-d11',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương I',
        chapter_title: 'Những quy định chung',
        article_no: 'Điều 11',
        article_title: 'Chữ viết và chữ số sử dụng trong kế toán',
        clause_count: 2,
        point_count: 0,
        content: `1. Chữ viết sử dụng trong kế toán là tiếng Việt. Trường hợp phải sử dụng tiếng nước ngoài trên chứng từ kế toán, trên sổ kế toán và báo cáo tài chính ở Việt Nam thì phải sử dụng đồng thời tiếng Việt và tiếng nước ngoài. Đối với chứng từ kế toán phát sinh ở ngoài lãnh thổ Việt Nam hoặc chứng từ hóa đơn quốc tế phục vụ gói thầu EPC/nhập khẩu thiết bị, đơn vị kế toán chỉ cần dịch các nội dung chủ yếu theo quy định của Bộ Tài chính.
2. Chữ số sử dụng trong kế toán là chữ số Ả-rập; sau chữ số hàng nghìn, hàng triệu, hàng tỷ phải đặt dấu chấm (.); khi còn ghi chữ số sau chữ số hàng đơn vị thì sau chữ số hàng đơn vị phải đặt dấu phẩy (,).`,
        clauses: [
          {
            id: 'art-lkt88-d11-k1',
            clause_no: 'Khoản 1',
            text: '1. Chữ viết sử dụng trong kế toán là tiếng Việt. Trường hợp phải sử dụng tiếng nước ngoài trên chứng từ kế toán, trên sổ kế toán và báo cáo tài chính ở Việt Nam thì phải sử dụng đồng thời tiếng Việt và tiếng nước ngoài. Đối với chứng từ kế toán phát sinh ở ngoài lãnh thổ Việt Nam hoặc chứng từ hóa đơn quốc tế phục vụ gói thầu EPC/nhập khẩu thiết bị, đơn vị kế toán chỉ cần dịch các nội dung chủ yếu theo quy định của Bộ Tài chính.',
            is_amended: true,
            diff_data: {
              original_text:
                '1. Chữ viết sử dụng trong kế toán là tiếng Việt. Trường hợp phải sử dụng tiếng nước ngoài trên chứng từ kế toán, trên sổ kế toán và báo cáo tài chính ở Việt Nam thì phải sử dụng đồng thời tiếng Việt và tiếng nước ngoài.',
              replaced_text:
                '1. Chữ viết sử dụng trong kế toán là tiếng Việt. Trường hợp phải sử dụng tiếng nước ngoài trên chứng từ kế toán, trên sổ kế toán và báo cáo tài chính ở Việt Nam thì phải sử dụng đồng thời tiếng Việt và tiếng nước ngoài. Đối với chứng từ kế toán phát sinh ở ngoài lãnh thổ Việt Nam hoặc chứng từ hóa đơn quốc tế phục vụ gói thầu EPC/nhập khẩu thiết bị, đơn vị kế toán chỉ cần dịch các nội dung chủ yếu theo quy định của Bộ Tài chính.',
              amending_doc_id: 'doc-lsd9luat-56-2024',
              amending_doc_number: '56/2024/QH15',
              amending_doc_title:
                'Luật số 56/2024/QH15 sửa đổi, bổ sung 09 Luật lĩnh vực Tài chính - Ngân sách',
              effective_date: '2025-01-01',
              change_summary:
                'Chỉ yêu cầu dịch các nội dung chủ yếu trên chứng từ kế toán bằng tiếng nước ngoài thay vì dịch toàn bộ tài liệu đính kèm.',
            },
          },
          {
            id: 'art-lkt88-d11-k2',
            clause_no: 'Khoản 2',
            text: '2. Chữ số sử dụng trong kế toán là chữ số Ả-rập; sau chữ số hàng nghìn, hàng triệu, hàng tỷ phải đặt dấu chấm (.); khi còn ghi chữ số sau chữ số hàng đơn vị thì sau chữ số hàng đơn vị phải đặt dấu phẩy (,).',
            is_amended: false,
          },
        ],
        is_active: true,
        is_amended: true,
        amendment_info: {
          amending_doc_id: 'doc-lsd9luat-56-2024',
          amending_doc_number: '56/2024/QH15',
          amending_doc_title: 'Luật số 56/2024/QH15 sửa đổi, bổ sung 09 Luật lĩnh vực Tài chính - Ngân sách',
          promulgation_date: '2024-11-29',
          effective_date: '2025-01-01',
          action_type: 'SUA_DOI_BO_SUNG',
          scopes: ['Khoản 1 Điều 11'],
          summary:
            'Giản lược thủ tục dịch thuật chứng từ kế toán bằng tiếng nước ngoài: Chỉ bắt buộc dịch các yếu tố cốt lõi phục vụ hạch toán và kiểm toán thay vì dịch toàn bộ từng trang đính kèm.',
          previous_excerpt:
            'Khoản 1 cũ (2015): Chữ viết sử dụng trong kế toán là tiếng Việt. Trường hợp phải sử dụng tiếng nước ngoài trên chứng từ kế toán, trên sổ kế toán và báo cáo tài chính ở Việt Nam thì phải sử dụng đồng thời tiếng Việt và tiếng nước ngoài.',
        },
        keywords: ['chữ viết kế toán', 'tiếng nước ngoài', 'chứng từ quốc tế', '56/2024/QH15'],
        amendment_note:
          'Phả hệ sửa đổi: Sửa đổi Khoản 1 Điều 11 theo Luật số 56/2024/QH15 nhằm cắt giảm chi phí dịch thuật chứng từ ngoại thương và hồ sơ thanh toán nhà thầu nước ngoài.',
      },
      {
        id: 'art-lkt88-d16',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương II',
        chapter_title: 'Chứng từ kế toán và Sổ kế toán',
        article_no: 'Điều 16',
        article_title: 'Nội dung chứng từ kế toán',
        clause_count: 12,
        point_count: 7,
        content: `1. Chứng từ kế toán phải có các nội dung chủ yếu sau đây:
a) Tên và số hiệu của chứng từ kế toán;
b) Ngày, tháng, năm lập chứng từ kế toán;
c) Tên, địa chỉ của cơ quan, tổ chức, đơn vị hoặc cá nhân lập chứng từ kế toán;
d) Tên, địa chỉ của cơ quan, tổ chức, đơn vị hoặc cá nhân nhận chứng từ kế toán;
đ) Nội dung nghiệp vụ kinh tế, tài chính phát sinh;
e) Số lượng, đơn giá và số tiền của nghiệp vụ kinh tế, tài chính ghi bằng số; tổng số tiền của chứng từ kế toán dùng để thu, chi tiền ghi bằng số và bằng chữ;
g) Chữ ký, họ và tên của người lập, người duyệt và những người có liên quan đến chứng từ kế toán.
2. Ngoài những nội dung chủ yếu của chứng từ kế toán quy định tại khoản 1 Điều này, chứng từ kế toán có thể có thêm những nội dung khác theo từng loại chứng từ và quy định của Bộ Tài chính.`,
        is_active: true,
        is_amended: true,
        amendment_info: {
          amending_doc_id: 'doc-lsd9luat-56-2024',
          amending_doc_number: '56/2024/QH15',
          amending_doc_title: 'Luật số 56/2024/QH15 sửa đổi, bổ sung một số điều của Luật Kế toán',
          promulgation_date: '2024-11-29',
          effective_date: '2025-01-01',
          action_type: 'SUA_DOI_BO_SUNG',
          scopes: ['Khoản 1', 'Khoản 2 Điều 16'],
          summary:
            'Chuẩn hóa các yếu tố bắt buộc trên chứng từ kế toán điện tử và cho phép lược giản chữ ký tay khi đã tích hợp chữ ký số tổ chức.',
          previous_excerpt:
            'Điều 16 cũ (2015): Chứng từ kế toán phải có đầy đủ 07 nội dung chủ yếu và chữ ký trực tiếp của người lập, người duyệt và những người có liên quan trên từng liên chứng từ.',
        },
        keywords: ['nội dung chứng từ kế toán', 'số hiệu chứng từ', '56/2024/QH15'],
        amendment_note:
          'Phả hệ sửa đổi: Điều 16 (12 khoản) đã được sửa đổi, bổ sung tại Luật số 56/2024/QH15.',
      },
      {
        id: 'art-lkt88-d18',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương II',
        chapter_title: 'Chứng từ kế toán và Sổ kế toán',
        article_no: 'Điều 18',
        article_title: 'Chứng từ điện tử và chữ ký số trên chứng từ kế toán',
        clause_count: 5,
        point_count: 2,
        content: `1. Chứng từ điện tử được coi là chứng từ kế toán khi có các nội dung quy định tại Điều 16 của Luật này và được thể hiện dưới dạng dữ liệu điện tử, được mã hóa bảo đảm không bị thay đổi trong quá trình truyền qua mạng máy tính, mạng viễn thông hoặc trên vật mang tin.
2. Chứng từ điện tử dùng trong hạch toán kế toán, thanh toán vốn đầu tư và kê khai thuế phải có chữ ký số hợp pháp theo quy định của pháp luật về giao dịch điện tử và kết nối đồng bộ với hệ thống hóa đơn điện tử của cơ quan thuế.`,
        is_active: true,
        is_amended: true,
        amendment_info: {
          amending_doc_id: 'doc-lsdlkt-108-2025',
          amending_doc_number: '38/2019/QH14, 108/2025/QH15',
          amending_doc_title:
            'Luật Quản lý thuế 38/2019/QH14 & Luật Quản lý thuế 108/2025/QH15',
          promulgation_date: '2025-12-10',
          effective_date: '2026-07-01',
          action_type: 'SUA_DOI_BO_SUNG',
          scopes: ['Khoản 1', 'Khoản 2 Điều 18'],
          summary:
            'Đồng bộ hóa đơn điện tử có mã của cơ quan thuế (Luật Quản lý thuế 38/2019/QH14 & 108/2025/QH15) và chữ ký số hợp pháp trên chứng từ kế toán điện tử.',
          previous_excerpt:
            'Điều 18 cũ (Luật Kế toán 88/2015/QH13 ban hành 2015, áp dụng trước 01/07/2026): 1. Chứng từ điện tử được coi là chứng từ kế toán khi có các nội dung quy định tại Điều 16 của Luật này và được thể hiện dưới dạng dữ liệu điện tử, được mã hóa bảo đảm không bị thay đổi trong quá trình truyền qua mạng máy tính, mạng viễn thông hoặc trên vật mang tin. 2. Chứng từ điện tử phải bảo đảm tính bảo mật và bảo toàn dữ liệu, thông tin trong quá trình sử dụng và lưu trữ; có chữ ký điện tử theo quy định của pháp luật về giao dịch điện tử.',
        },
        keywords: ['chứng từ điện tử', 'chữ ký số', 'hóa đơn điện tử', '38/2019/QH14', '108/2025/QH15'],
        amendment_note:
          'Phả hệ sửa đổi: Được dẫn chiếu đồng bộ bởi Luật Quản lý thuế 38/2019/QH14 và Luật Quản lý thuế 108/2025/QH15 (về hóa đơn, chứng từ điện tử kết nối cơ quan thuế).',
      },
      {
        id: 'art-lkt88-d20',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương II',
        chapter_title: 'Chứng từ kế toán và Sổ kế toán',
        article_no: 'Điều 20',
        article_title: 'Kỳ kế toán của đơn vị kế toán mới thành lập hoặc giải thể, sáp nhập',
        clause_count: 4,
        point_count: 2,
        content: `1. Kỳ kế toán gồm kỳ kế toán năm, kỳ kế toán quý, kỳ kế toán tháng. Kỳ kế toán năm là 12 tháng, tính từ đầu ngày 01 tháng 01 đến hết ngày 31 tháng 12 năm dương lịch.
2. Trường hợp kỳ kế toán năm đầu tiên hoặc kỳ kế toán năm cuối cùng có thời gian ngắn hơn 03 tháng thì được phép cộng với kỳ kế toán năm tiếp theo hoặc cộng với kỳ kế toán năm trước đó để tính thành một kỳ kế toán năm; thời gian kỳ kế toán năm đầu tiên hoặc kỳ kế toán năm cuối cùng phải ngắn hơn 15 tháng.`,
        is_active: true,
        is_amended: true,
        amendment_info: {
          amending_doc_id: 'doc-lsd9luat-56-2024',
          amending_doc_number: '56/2024/QH15',
          amending_doc_title: 'Luật số 56/2024/QH15 sửa đổi, bổ sung một số điều của Luật Kế toán',
          promulgation_date: '2024-11-29',
          effective_date: '2025-01-01',
          action_type: 'SUA_DOI_BO_SUNG',
          scopes: ['Khoản 4 Điều 20'],
          summary:
            'Tăng ngưỡng gộp kỳ kế toán đầu tiên / cuối cùng từ không quá 90 ngày lên dưới 03 tháng tròn lịch để thống nhất cách tính kỳ tính thuế TNDN.',
          previous_excerpt:
            'Khoản 4 Điều 20 cũ (2015): Trường hợp kỳ kế toán năm đầu tiên hoặc kỳ kế toán năm cuối cùng có thời gian ngắn hơn 90 ngày thì được phép cộng với kỳ kế toán năm tiếp theo hoặc cộng với kỳ kế toán năm trước đó để tính thành một kỳ kế toán năm.',
        },
        keywords: ['kỳ kế toán', 'kỳ kế toán năm đầu tiên', '15 tháng', '56/2024/QH15'],
      },
      {
        id: 'art-lkt88-d29',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương III',
        chapter_title: 'Báo cáo tài chính',
        article_no: 'Điều 29',
        article_title: 'Báo cáo tài chính của đơn vị kế toán và thời hạn công khai báo cáo tài chính',
        clause_count: 4,
        point_count: 5,
        content: `1. Báo cáo tài chính của đơn vị kế toán dùng để tổng hợp và thuyết minh về tình hình tài chính và kết quả hoạt động của đơn vị kế toán. Báo cáo tài chính của đơn vị kế toán gồm:
a) Báo cáo tình hình tài chính (Bảng cân đối kế toán);
b) Báo cáo kết quả hoạt động;
c) Báo cáo lưu chuyển tiền tệ;
d) Bản thuyết minh báo cáo tài chính;
đ) Báo cáo khác theo quy định của pháp luật và Chuẩn mực báo cáo tài chính quốc tế (IFRS).
2. Việc lập báo cáo tài chính của đơn vị kế toán phải căn cứ vào số liệu sau khi khóa sổ kế toán; bảo đảm khớp đúng giữa sổ kế toán tổng hợp với sổ kế toán chi tiết và biên bản đối chiếu công nợ, biên bản nghiệm thu khối lượng hoàn thành.`,
        is_active: true,
        is_amended: true,
        amendment_info: {
          amending_doc_id: 'doc-lsd9luat-56-2024',
          amending_doc_number: '56/2024/QH15',
          amending_doc_title: 'Luật số 56/2024/QH15 sửa đổi, bổ sung một số điều của Luật Kế toán',
          promulgation_date: '2024-11-29',
          effective_date: '2025-01-01',
          action_type: 'SUA_DOI_BO_SUNG',
          scopes: ['Khoản 1', 'Khoản 3 Điều 29'],
          summary:
            'Sửa đổi danh mục cấu phần Báo cáo tài chính tương thích chuẩn IFRS (Báo cáo tình hình tài chính, Báo cáo kết quả hoạt động) theo Luật số 56/2024/QH15.',
          previous_excerpt:
            'Khoản 1 Điều 29 cũ (2015): Báo cáo tài chính của đơn vị kế toán gồm: a) Báo cáo tình hình tài chính; b) Báo cáo kết quả hoạt động; c) Báo cáo lưu chuyển tiền tệ; d) Bản thuyết minh báo cáo tài chính; đ) Báo cáo khác theo quy định của pháp luật.',
        },
        keywords: ['báo cáo tài chính', 'bảng cân đối kế toán', 'khóa sổ kế toán', '56/2024/QH15'],
        amendment_note:
          'Phả hệ sửa đổi: Đã được sửa đổi, bổ sung bởi Luật số 56/2024/QH15 về hệ thống Báo cáo tài chính và khuôn khổ áp dụng IFRS.',
      },
      {
        id: 'art-lkt88-d60',
        document_id: 'doc-lkt-88-2015',
        chapter_no: 'Chương IV',
        chapter_title: 'Hoạt động kinh doanh dịch vụ kế toán',
        article_no: 'Điều 60',
        article_title: 'Doanh nghiệp kinh doanh dịch vụ kế toán và kiểm soát chất lượng dịch vụ kế toán',
        clause_count: 19,
        point_count: 5,
        content: `1. Doanh nghiệp kinh doanh dịch vụ kế toán được thành lập và hoạt động theo các loại hình: Công ty trách nhiệm hữu hạn hai thành viên trở lên, Công ty hợp danh, Doanh nghiệp tư nhân.
2. Doanh nghiệp chỉ được kinh doanh dịch vụ kế toán khi bảo đảm các điều kiện kinh doanh theo quy định của Luật này và được Bộ Tài chính cấp Giấy chứng nhận đủ điều kiện kinh doanh dịch vụ kế toán.
3. Doanh nghiệp kinh doanh dịch vụ kế toán không được góp vốn để thành lập doanh nghiệp kinh doanh dịch vụ kế toán khác, trừ trường hợp góp vốn với doanh nghiệp kinh doanh dịch vụ kế toán nước ngoài để thành lập doanh nghiệp kinh doanh dịch vụ kế toán tại Việt Nam.
4. Hàng năm, doanh nghiệp kinh doanh dịch vụ kế toán phải báo cáo Bộ Tài chính về tình hình hoạt động, danh sách kế toán viên hành nghề và chịu sự kiểm soát chất lượng dịch vụ kế toán định kỳ.`,
        is_active: true,
        is_amended: false,
        keywords: ['dịch vụ kế toán', 'kiểm soát chất lượng', 'kế toán viên hành nghề', 'Bộ Tài chính'],
      },
    ],
  },
  {
    id: 'doc-lqlthue-38-2019',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XIV',
    doc_number: '38/2019/QH14',
    title:
      'Luật Quản lý thuế số 38/2019/QH14: Quy định về quản lý các loại thuế, hóa đơn điện tử, chứng từ điện tử và sửa đổi, bổ sung các quy định liên quan về chứng từ kế toán thuế',
    short_title: 'Luật Quản lý thuế · 38/2019/QH14',
    issue_date: '2019-06-13',
    effective_date: '2020-07-01',
    expiration_date: null,
    status: 'SUA_DOI_BO_SUNG',
    field: 'Thuế · Phí',
    project_stage: 'Quyết toán',
    signer: 'Nguyễn Thị Kim Ngân',
    is_amending_document: true,
    amends_doc_ids: ['doc-lkt-88-2015'],
    summary:
      'Quy định việc quản lý các loại thuế, các khoản thu khác thuộc ngân sách nhà nước; bắt buộc áp dụng hóa đơn điện tử, chứng từ điện tử đồng bộ với Luật Kế toán 88/2015/QH13.',
    articles: [
      {
        id: 'art-lqlthue38-d91',
        document_id: 'doc-lqlthue-38-2019',
        chapter_no: 'Chương X',
        chapter_title: 'Áp dụng hóa đơn, chứng từ điện tử',
        article_no: 'Điều 91',
        article_title: 'Áp dụng hóa đơn điện tử khi bán hàng hóa, cung cấp dịch vụ và nghiệm thu xây lắp',
        content: `1. Doanh nghiệp, tổ chức kinh tế sử dụng hóa đơn điện tử có mã hoặc không có mã của cơ quan thuế khi bán hàng hóa, cung cấp dịch vụ, không phân biệt giá trị từng lần bán hàng hóa, cung cấp dịch vụ.
2. Dữ liệu hóa đơn điện tử là căn cứ hợp pháp để ghi nhận chứng từ kế toán điện tử theo Điều 17, Điều 18 Luật Kế toán số 88/2015/QH13 và kê khai khấu trừ thuế GTGT, quyết toán vốn đầu tư.`,
        is_active: true,
        keywords: ['hóa đơn điện tử', 'chứng từ điện tử', 'Luật Kế toán 88/2015/QH13', '38/2019/QH14'],
      },
    ],
  },
  {
    id: 'doc-lsd9luat-56-2024',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '56/2024/QH15',
    title:
      'Luật số 56/2024/QH15: Sửa đổi, bổ sung một số điều của Luật Chứng khoán, Luật Kế toán, Luật Kiểm toán độc lập, Luật Ngân sách nhà nước, Luật Quản lý, sử dụng tài sản công, Luật Quản lý thuế, Luật Thuế TNCN, Luật Dự trữ quốc gia, Luật XLVPHC',
    short_title: 'Luật sửa đổi 09 Luật Tài chính · 56/2024/QH15',
    issue_date: '2024-11-29',
    effective_date: '2025-01-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Kế toán · Kiểm toán',
    project_stage: 'Quyết toán',
    signer: 'Trần Thanh Mẫn',
    is_amending_document: true,
    amends_doc_ids: ['doc-lkt-88-2015'],
    is_new_daily_update: true,
    summary:
      'Luật sửa đổi 09 Luật thuộc lĩnh vực Tài chính – Ngân sách (1 Luật sửa 9 Luật), trong đó Điều 2 sửa đổi, bổ sung trực tiếp hàng loạt điều khoản của Luật Kế toán số 88/2015/QH13 (Điều 3, Điều 11, Điều 20, Điều 28, Điều 29, Điều 41, Điều 52).',
    articles: [
      {
        id: 'art-lsd56-d2',
        document_id: 'doc-lsd9luat-56-2024',
        chapter_no: 'Chương I',
        chapter_title: 'Sửa đổi, bổ sung một số điều của các Luật thuộc lĩnh vực Tài chính',
        article_no: 'Điều 2',
        article_title: 'Sửa đổi, bổ sung một số điều của Luật Kế toán số 88/2015/QH13',
        content: `1. Sửa đổi, bổ sung khoản 1 Điều 11 về chữ viết sử dụng trong kế toán: Đơn vị kế toán chỉ phải dịch sang tiếng Việt các nội dung chủ yếu của chứng từ phát sinh bằng tiếng nước ngoài theo quy định của Bộ Tài chính.
2. Sửa đổi, bổ sung khoản 4 Điều 20 về kỳ kế toán đầu tiên và kỳ kế toán cuối cùng của đơn vị kế toán mới thành lập, chia, tách, hợp nhất, sáp nhập, giải thể.
3. Sửa đổi, bổ sung Điều 28 và Điều 29 về lập Báo cáo tài chính và Báo cáo tài chính nhà nước; phân cấp thẩm quyền hướng dẫn chế độ kế toán doanh nghiệp siêu nhỏ và hộ kinh doanh.`,
        is_active: true,
        keywords: ['sửa đổi Luật Kế toán', '56/2024/QH15', '88/2015/QH13', '1 luật sửa 9 luật'],
      },
    ],
  },
  {
    id: 'doc-lsdlkt-108-2025',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '108/2025/QH15',
    title:
      'Luật Quản lý thuế số 108/2025/QH15: Quy định về quản lý thuế, hóa đơn điện tử, chứng từ điện tử kết nối dữ liệu kế toán và định danh số',
    short_title: 'Luật Quản lý thuế · 108/2025/QH15',
    issue_date: '2025-12-10',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Thuế · Phí',
    project_stage: 'Quyết toán',
    signer: 'Trần Thanh Mẫn',
    is_amending_document: true,
    amends_doc_ids: ['doc-lkt-88-2015'],
    is_new_daily_update: true,
    summary:
      'Luật Quản lý thuế số 108/2025/QH15 (thông qua tại Kỳ họp thứ 10 Quốc hội khóa XV ngày 10/12/2025, hiệu lực từ 01/07/2026): Chuẩn hóa quản lý thuế trên nền tảng số, đồng bộ hóa đơn điện tử và chứng từ kế toán điện tử theo Luật Kế toán 88/2015/QH13.',
    articles: [
      {
        id: 'art-lsd108-d1',
        document_id: 'doc-lsdlkt-108-2025',
        chapter_no: 'Chương I',
        chapter_title: 'Đồng bộ chứng từ kế toán điện tử và quản lý thuế số hóa',
        article_no: 'Điều 1',
        article_title: 'Phạm vi điều chỉnh và nguyên tắc kết nối dữ liệu chứng từ kế toán – hóa đơn điện tử',
        content: `1. Luật này quy định việc quản lý các loại thuế, các khoản thu khác thuộc ngân sách nhà nước; trách nhiệm kết nối dữ liệu chứng từ kế toán điện tử, hóa đơn điện tử có mã của cơ quan thuế đối với doanh nghiệp, Ban Quản lý dự án và nhà thầu nước ngoài.
2. Chứng từ điện tử dùng trong hạch toán kế toán, thanh toán vốn đầu tư và quyết toán thuế phải tích hợp chữ ký số hợp pháp theo quy định tại Điều 17, Điều 18 Luật Kế toán số 88/2015/QH13.`,
        is_active: true,
        keywords: ['108/2025/QH15', 'Luật Quản lý thuế', 'hóa đơn điện tử', '88/2015/QH13', 'chữ ký số kế toán'],
      },
    ],
  },
  {
    id: 'doc-vbhn-18-vpqh',
    doc_type: 'Luật',
    issuing_body: 'Bản tổng hợp nội bộ Đại Sơn Legal',
    doc_number: 'THNB-LKT-88-2015',
    title:
      'Bản Tổng hợp Nội bộ Luật Kế toán: Hợp nhất phục vụ tra cứu Luật số 88/2015/QH13 và các nội dung sửa đổi bởi Luật 56/2024/QH15, đồng bộ Luật Quản lý thuế 38/2019/QH14 & 108/2025/QH15',
    short_title: 'Bản Tổng hợp Nội bộ · Luật Kế toán 88/2015',
    issue_date: '2025-12-15',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Kế toán · Kiểm toán',
    project_stage: 'Quyết toán',
    signer: 'Hệ thống Đối soát Đại Sơn Legal',
    authenticity_tier: 'INTERNAL_SYNTHESIS',
    is_consolidated: false,
    amended_count: 3,
    summary:
      'BẢN TỔNG HỢP NỘI BỘ PHỤC VỤ TRA CỨU (INTERNAL WORKING SYNTHESIS): Tích hợp các điều khoản còn hiệu lực của Luật Kế toán số 88/2015/QH13 và các điều khoản sửa đổi bởi Luật số 56/2024/QH15. Khi lập hồ sơ pháp lý chính thức, bắt buộc trích dẫn trực tiếp Luật gốc 88/2015/QH13 và Luật sửa đổi 56/2024/QH15.',
    articles: [
      {
        id: 'art-vbhn18-d1',
        document_id: 'doc-vbhn-18-vpqh',
        chapter_no: 'Chương I',
        chapter_title: 'Phạm vi tổng hợp nội bộ và hướng dẫn trích dẫn',
        article_no: 'Điều 1',
        article_title: 'Nguyên tắc sử dụng Bản tổng hợp nội bộ Luật Kế toán',
        content: `1. Tài liệu này là Bản tổng hợp nội bộ phục vụ tra cứu nhanh các điều khoản của Luật Kế toán số 88/2015/QH13 đã được sửa đổi, bổ sung bởi Luật số 56/2024/QH15 (Điều 3, Điều 6, Điều 11, Điều 16, Điều 20, Điều 28, Điều 29, Điều 41, Điều 52) và đồng bộ chứng từ điện tử với Luật Quản lý thuế.
2. Lưu ý pháp lý: Không sử dụng số hiệu tổng hợp nội bộ trong văn bản hành chính chính thức; luôn viện dẫn trực tiếp số hiệu Luật gốc 88/2015/QH13 và Luật sửa đổi, bổ sung số 56/2024/QH15.`,
        is_active: true,
        keywords: ['bản tổng hợp nội bộ', 'Luật Kế toán 88/2015/QH13', '56/2024/QH15'],
      },
    ],
  },
  {
    id: 'doc-tt-200-2014',
    doc_type: 'Thông tư',
    issuing_body: 'Bộ Tài chính',
    doc_number: '200/2014/TT-BTC',
    title:
      'Thông tư số 200/2014/TT-BTC: Hướng dẫn Chế độ kế toán Doanh nghiệp (Sắp hết hiệu lực vào 31/12/2026 khi chuyển sang Chế độ kế toán mới tương thích IFRS)',
    short_title: 'Thông tư 200/2014/TT-BTC · Chế độ kế toán DN',
    issue_date: '2014-12-22',
    effective_date: '2015-01-01',
    expiration_date: '2026-12-31',
    status: 'CON_HIEU_LUC',
    field: 'Kế toán · Kiểm toán',
    project_stage: 'Quyết toán',
    signer: 'Trần Xuân Hà',
    is_expiring_soon: true,
    replaced_by_doc_id: 'doc-lsd9luat-56-2024',
    replaced_by_label: 'Thông tư số 99/2025/TT-BTC & Luật sửa đổi Luật Kế toán 56/2024/QH15 (từ 01/01/2026)',
    summary:
      'Hướng dẫn việc ghi sổ kế toán, hệ thống tài khoản kế toán, lập và trình bày Báo cáo tài chính đối với các doanh nghiệp. Lưu ý: Văn bản đang trong giai đoạn chuyển tiếp và sẽ hết hiệu lực vào ngày 31/12/2026.',
    articles: [
      {
        id: 'art-tt200-d11',
        document_id: 'doc-tt-200-2014',
        chapter_no: 'Chương II',
        chapter_title: 'Hệ thống Tài khoản kế toán và Hạch toán chi phí ĐTXD',
        article_no: 'Điều 46',
        article_title: 'Tài khoản 241 - Xây dựng cơ bản dở dang và kết chuyển tài sản hoàn thành',
        content: `1. Tài khoản 241 phản ánh chi phí thực hiện các dự án đầu tư xây dựng cơ bản (khảo sát, thiết kế, thi công xây lắp, mua sắm thiết bị) và tình hình quyết toán dự án đầu tư xây dựng cơ bản hoàn thành bàn giao đưa vào sử dụng.
2. Lưu ý chuyển tiếp: Kể từ kỳ kế toán năm 2027 (sau ngày 31/12/2026), việc phân loại bất động sản đầu tư, tài sản cố định hữu hình và chi phí đi vay vốn hóa thực hiện theo Thông tư thay thế Thông tư 200/2014/TT-BTC phù hợp chuẩn IFRS.`,
        is_active: true,
        keywords: ['200/2014/TT-BTC', 'sắp hết hiệu lực', 'tài khoản 241', 'xây dựng cơ bản dở dang'],
      },
    ],
  },
  {
    id: 'doc-nd-85-2021-tmdt',
    doc_type: 'Nghị định',
    issuing_body: 'Bộ Công Thương (Xác thực hợp nhất Nghị định Chính phủ)',
    doc_number: '13/VBHN-BCT',
    title:
      'Văn bản hợp nhất số 13/VBHN-BCT: Hợp nhất Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP về Thương mại điện tử',
    short_title: 'VBHN 13/VBHN-BCT · NĐ 52 & NĐ 85 TMĐT',
    issue_date: '2022-02-18',
    effective_date: '2022-02-18',
    expiration_date: '2026-07-01',
    status: 'CON_HIEU_LUC',
    field: 'Thương mại điện tử',
    project_stage: 'Thực thi',
    signer: 'Nguyễn Hồng Diên',
    authenticity_tier: 'OFFICIAL_VBHN',
    is_consolidated: true,
    consolidated_doc_number: '13/VBHN-BCT',
    is_expiring_soon: true,
    replaced_by_doc_id: 'doc-nd-248-2026',
    replaced_by_label: 'Nghị định 248/2026/NĐ-CP & Luật TMĐT 122/2025/QH15',
    summary:
      'Văn bản hợp nhất chính thức của Bộ Công Thương hợp nhất Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP về thương mại điện tử.',
    articles: [
      {
        id: 'art-vbhn09-d27',
        document_id: 'doc-nd-85-2021-tmdt',
        chapter_no: 'Chương III',
        chapter_title: 'Hoạt động website thương mại điện tử bán hàng',
        article_no: 'Điều 27',
        article_title: 'Trách nhiệm của thương nhân, tổ chức sở hữu website thương mại điện tử bán hàng',
        content: `1. Thông báo với Bộ Công Thương về việc thiết lập website thương mại điện tử bán hàng và công bố đầy đủ thông tin về người sở hữu, điều kiện giao dịch chung, chính sách vận chuyển và bảo vệ thông tin cá nhân.`,
        is_active: true,
        keywords: ['13/VBHN-BCT', '52/2013/NĐ-CP', '85/2021/NĐ-CP', 'sắp hết hiệu lực', 'văn bản hợp nhất'],
      },
    ],
  },

  // ============================================================================
  // PHẦN 2: CỤM DỮ LIỆU CÁ NHÂN, AN NINH MẠNG & THƯƠNG MẠI ĐIỆN TỬ (LEGALFLOW)
  // ============================================================================
  {
    id: 'doc-bvdlcn-91-2025',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '91/2025/QH15',
    title: 'Luật số 91/2025/QH15: Luật Bảo vệ dữ liệu cá nhân (13 nhóm, 69 yêu cầu tuân thủ)',
    short_title: 'Luật BVDLCN · 91/2025/QH15',
    issue_date: '2025-06-26',
    effective_date: '2026-01-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Trần Thanh Mẫn',
    is_new_daily_update: true,
    compliance_stats: { total_sections: 69, very_high_count: 10, high_count: 54, medium_count: 5 },
    daily_update_note:
      'Có hiệu lực từ 01/01/2026: Quy định chặt chẽ điều kiện sự đồng ý hợp lệ của chủ thể dữ liệu (Điều 9, Điều 11) và nghiêm cấm mua bán dữ liệu cá nhân (Điều 7).',
    summary:
      'Quy định về nguyên tắc bảo vệ dữ liệu cá nhân, các hành vi bị nghiêm cấm, điều kiện xin sự đồng ý hợp lệ của chủ thể dữ liệu, quyền và nghĩa vụ của Bên Kiểm soát và Bên Xử lý dữ liệu cá nhân.',
    articles: [
      {
        id: 'art-bvdlcn-d3',
        document_id: 'doc-bvdlcn-91-2025',
        chapter_no: 'Chương I',
        chapter_title: 'L1 · Nguyên tắc chung và hành vi bị cấm',
        article_no: 'Điều 3',
        article_title: 'Nguyên tắc bảo vệ và xử lý dữ liệu cá nhân (L1.1)',
        content: `1. Dữ liệu cá nhân chỉ được thu thập, xử lý đúng phạm vi, mục đích cụ thể, rõ ràng đã đăng ký và được chủ thể dữ liệu đồng ý.
2. Bảo đảm tính chính xác của dữ liệu cá nhân; lưu trữ trong khoảng thời gian phù hợp với mục đích xử lý dữ liệu và phải áp dụng đồng bộ các biện pháp thể chế, kỹ thuật, con người để bảo vệ dữ liệu cá nhân.`,
        is_active: true,
        keywords: ['dữ liệu cá nhân', 'nguyên tắc xử lý dữ liệu', 'bên kiểm soát dữ liệu', 'L1.1'],
      },
      {
        id: 'art-bvdlcn-d7',
        document_id: 'doc-bvdlcn-91-2025',
        chapter_no: 'Chương I',
        chapter_title: 'L1 · Nguyên tắc chung và hành vi bị cấm',
        article_no: 'Điều 7',
        article_title: 'Các hành vi bị nghiêm cấm về dữ liệu cá nhân (L1.2)',
        content: `1. Xử lý dữ liệu cá nhân trái quy định của pháp luật hoặc không có sự đồng ý của chủ thể dữ liệu.
2. Cản trở hoạt động bảo vệ dữ liệu cá nhân của cơ quan có thẩm quyền.
3. Mua, bán dữ liệu cá nhân dưới mọi hình thức; chiếm đoạt, cố ý làm lộ hoặc làm mất dữ liệu cá nhân đã thu thập.`,
        is_active: true,
        keywords: ['hành vi bị nghiêm cấm', 'mua bán dữ liệu cá nhân', 'làm lộ dữ liệu', 'L1.2'],
        amendment_note:
          'Mức độ rủi ro RẤT CAO: Vi phạm Điều 7 có thể bị xử phạt hành chính theo doanh thu hoặc truy cứu trách nhiệm hình sự.',
      },
      {
        id: 'art-bvdlcn-d9',
        document_id: 'doc-bvdlcn-91-2025',
        chapter_no: 'Chương II',
        chapter_title: 'L2 · Sự đồng ý của chủ thể dữ liệu cá nhân',
        article_no: 'Điều 9',
        article_title: 'Điều kiện hợp lệ của sự đồng ý (L2.1, L2.2, L2.3)',
        content: `1. (L2.1 - Khoản 2 Điều 9) Sự đồng ý của chủ thể dữ liệu chỉ hợp lệ khi dựa trên sự tự nguyện và biết rõ các thông tin sau: loại dữ liệu cá nhân được xử lý; mục đích xử lý dữ liệu cá nhân; tổ chức, cá nhân được phép xử lý dữ liệu cá nhân (Bên kiểm soát, Bên xử lý); quyền và nghĩa vụ của chủ thể dữ liệu.
2. (L2.2 - Khoản 3 Điều 9) Sự đồng ý của chủ thể dữ liệu phải được thể hiện rõ ràng, cụ thể bằng văn bản, giọng nói, đánh dấu vào ô đồng ý, cú pháp tin nhắn, hoặc hành động cụ thể khác có thể in, sao chép bằng văn bản, bao gồm cả dưới dạng điện tử hoặc định dạng kiểm chứng được.
3. (L2.3 - Khoản 4 Điều 9) Không được gộp nhiều mục đích xử lý trong một lần xin sự đồng ý mà không cho phép chủ thể dữ liệu lựa chọn từng mục đích; không được kèm điều kiện bắt buộc phải đồng ý xử lý dữ liệu cho các mục đích khác ngoài mục đích cung cấp dịch vụ cốt lõi. Sự im lặng hoặc không phản hồi của chủ thể dữ liệu không được coi là sự đồng ý.`,
        is_active: true,
        keywords: ['đồng ý', 'sự đồng ý hợp lệ', 'im lặng không phải là đồng ý', 'L2.1', 'L2.2', 'L2.3'],
        amendment_note:
          'Trợ lý AQUA lưu ý: Tuyệt đối không được thiết lập checkbox mặc định đánh dấu sẵn (pre-checked box) trên website/ứng dụng.',
      },
      {
        id: 'art-bvdlcn-d11',
        document_id: 'doc-bvdlcn-91-2025',
        chapter_no: 'Chương II',
        chapter_title: 'L2 · Thời điểm đồng ý, phân tích dữ liệu và Quyền của chủ thể (L2.4, L2.5, L3.1)',
        article_no: 'Điều 11',
        article_title: 'Thời điểm xin sự đồng ý, tổng hợp dữ liệu và Quyền của chủ thể dữ liệu',
        content: `1. (L2.4 - Khoản 1 Điều 11) Phải có sự đồng ý của chủ thể dữ liệu trước khi tiến hành thu thập, xử lý dữ liệu cá nhân, trừ trường hợp luật có quy định khác.
2. (L2.5 - Khoản 3 Điều 11) Doanh nghiệp chỉ được phân tích, tổng hợp dữ liệu cá nhân từ các nguồn dữ liệu đã được phép thu thập và xử lý hợp pháp.
3. (L3.1) Chủ thể dữ liệu có quyền: được biết, đồng ý hoặc rút lại sự đồng ý, xem, chỉnh sửa, yêu cầu cung cấp bản sao dữ liệu, yêu cầu xóa dữ liệu, hạn chế xử lý dữ liệu và yêu cầu bồi thường thiệt hại khi có vi phạm.`,
        is_active: true,
        keywords: ['đồng ý trước khi thu thập', 'rút lại sự đồng ý', 'xóa dữ liệu cá nhân', 'L2.4', 'L2.5', 'L3.1'],
      },
    ],
  },
  {
    id: 'doc-nd-356-2025',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '356/2025/NĐ-CP',
    title: 'Nghị định số 356/2025/NĐ-CP: Quy định chi tiết một số điều và biện pháp thi hành Luật Bảo vệ dữ liệu cá nhân',
    short_title: 'NĐ 356 · 356/2025/NĐ-CP',
    issue_date: '2025-12-31',
    effective_date: '2026-01-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    compliance_stats: { total_sections: 53, very_high_count: 6, high_count: 41, medium_count: 6 },
    summary:
      'Quy định chi tiết về thiết lập kỹ thuật xin sự đồng ý trên trang thông tin điện tử, ứng dụng di động; lập Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân (DPIA) và chuyển dữ liệu cá nhân ra nước ngoài.',
    articles: [
      {
        id: 'art-nd356-d6',
        document_id: 'doc-nd-356-2025',
        chapter_no: 'Chương II',
        chapter_title: 'Thiết lập kỹ thuật thu thập sự đồng ý và Lưu trữ nhật ký',
        article_no: 'Điều 6',
        article_title: 'Phương thức thực hiện xin sự đồng ý trên trang thông tin điện tử, nền tảng, ứng dụng',
        content: `1. (Khoản 1 Điều 6) Xin sự đồng ý trên trang thông tin điện tử, nền tảng số, ứng dụng di động phải có thiết lập kỹ thuật xin sự đồng ý rõ ràng (hoặc qua văn bản, email, cuộc gọi ghi âm, tin nhắn), bảo đảm khả năng kiểm chứng về chủ thể, thời điểm và nội dung được đồng ý.
2. Bên Kiểm soát dữ liệu và Bên Xử lý dữ liệu phải ghi nhận và lưu trữ nhật ký hệ thống (log) về sự đồng ý của chủ thể dữ liệu tối thiểu trong suốt thời gian lưu trữ dữ liệu; nghiêm cấm tạo chỉ dẫn mập mờ hoặc thiết lập mặc định đồng ý.`,
        is_active: true,
        keywords: ['đồng ý', 'thiết lập kỹ thuật xin sự đồng ý', 'lưu trữ nhật ký', 'trang thông tin điện tử'],
      },
    ],
  },
  {
    id: 'doc-lanm-116-2025',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '116/2025/QH15',
    title: 'Luật số 116/2025/QH15: Luật An ninh mạng (Hợp nhất bảo vệ an ninh mạng và an toàn thông tin mạng)',
    short_title: 'Luật ANM · 116/2025/QH15',
    issue_date: '2025-12-10',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Trần Thanh Mẫn',
    compliance_stats: { total_sections: 44, very_high_count: 27, high_count: 12, medium_count: 5 },
    summary:
      'Quy định về bảo vệ an ninh mạng đối với hệ thống thông tin quan trọng về an ninh quốc gia, phòng ngừa và xử lý hành vi xâm phạm an ninh mạng, lưu trữ dữ liệu tại Việt Nam.',
    articles: [
      {
        id: 'art-lanm-d26',
        document_id: 'doc-lanm-116-2025',
        chapter_no: 'Chương III',
        chapter_title: 'Bảo đảm an ninh thông tin trên không gian mạng',
        article_no: 'Điều 26',
        article_title: 'Bảo đảm an ninh dữ liệu và lưu trữ dữ liệu tại Việt Nam',
        content: `1. Doanh nghiệp trong nước và ngoài nước cung cấp dịch vụ trên mạng viễn thông, mạng Internet và các dịch vụ gia tăng trên không gian mạng tại Việt Nam có hoạt động thu thập, khai thác, phân tích, xử lý dữ liệu về thông tin cá nhân, dữ liệu về mối quan hệ của người sử dụng dịch vụ phải lưu trữ dữ liệu này tại Việt Nam trong thời gian theo quy định của Chính phủ.`,
        is_active: true,
        keywords: ['lưu trữ dữ liệu tại Việt Nam', 'an ninh mạng', 'hosting, lưu trữ', 'hệ thống thông tin'],
      },
    ],
  },
  {
    id: 'doc-nd-333-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '333/2026/NĐ-CP',
    title: 'Nghị định số 333/2026/NĐ-CP: Quy định chi tiết một số điều và biện pháp thi hành Luật An ninh mạng',
    short_title: 'NĐ 333 · 333/2026/NĐ-CP',
    issue_date: '2026-08-19',
    effective_date: '2026-08-19',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    compliance_stats: { total_sections: 30, very_high_count: 26, high_count: 4, medium_count: 0 },
    summary:
      'Thay thế Nghị định 53/2022/NĐ-CP; quy định trình tự kiểm tra an ninh mạng, yêu cầu lưu trữ dữ liệu trong nước và phối hợp ứng cứu sự cố an ninh mạng.',
    articles: [
      {
        id: 'art-nd333-d12',
        document_id: 'doc-nd-333-2026',
        chapter_no: 'Chương II',
        chapter_title: 'Lưu trữ dữ liệu và kiểm tra an ninh mạng',
        article_no: 'Điều 12',
        article_title: 'Thời hạn và danh mục dữ liệu bắt buộc lưu trữ tại Việt Nam',
        content: `1. Dữ liệu tài khoản người dùng, nhật ký truy cập, thông tin thanh toán và dữ liệu cá nhân phát sinh tại Việt Nam phải được lưu trữ trên hệ thống máy chủ đặt tại Việt Nam tối thiểu 24 tháng kể từ thời điểm người dùng kết thúc sử dụng dịch vụ.`,
        is_active: true,
        keywords: ['lưu trữ 24 tháng', 'máy chủ tại Việt Nam', 'kiểm tra an ninh mạng'],
      },
    ],
  },
  {
    id: 'doc-nd-331-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '331/2026/NĐ-CP',
    title: 'Nghị định số 331/2026/NĐ-CP: Bảo vệ an ninh mạng đối với hệ thống thông tin theo cấp độ',
    short_title: 'NĐ 331 · 331/2026/NĐ-CP',
    issue_date: '2026-08-19',
    effective_date: '2026-08-19',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    compliance_stats: { total_sections: 34, very_high_count: 6, high_count: 15, medium_count: 13 },
    summary:
      'Thay thế Nghị định 85/2016/NĐ-CP; quy định phân loại 5 cấp độ an toàn hệ thống thông tin, thẩm định hồ sơ đề xuất cấp độ và kiểm tra định kỳ.',
    articles: [
      {
        id: 'art-nd331-d9',
        document_id: 'doc-nd-331-2026',
        chapter_no: 'Chương II',
        chapter_title: 'Xác định và phê duyệt Hồ sơ đề xuất cấp độ an ninh hệ thống thông tin',
        article_no: 'Điều 9',
        article_title: 'Phân loại 5 cấp độ hệ thống thông tin và trách nhiệm phê duyệt trước khi vận hành',
        content: `1. Chủ quản hệ thống thông tin phải hoàn thành lập, thẩm định và phê duyệt Hồ sơ đề xuất cấp độ an toàn hệ thống thông tin (từ Cấp độ 1 đến Cấp độ 5) trước khi đưa hệ thống vào vận hành khai thác chính thức.`,
        is_active: true,
        keywords: ['cấp độ an toàn hệ thống thông tin', 'hồ sơ đề xuất cấp độ', 'vận hành hệ thống'],
      },
    ],
  },
  {
    id: 'doc-nd-330-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '330/2026/NĐ-CP',
    title:
      'Nghị định số 330/2026/NĐ-CP: Xử phạt vi phạm hành chính trong lĩnh vực an ninh mạng và bảo vệ dữ liệu cá nhân',
    short_title: 'NĐ 330 · 330/2026/NĐ-CP',
    issue_date: '2026-08-19',
    effective_date: '2026-08-19',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    compliance_stats: { total_sections: 164, very_high_count: 55, high_count: 99, medium_count: 10 },
    summary:
      'Quy định mức phạt tiền từ 100 triệu đồng hoặc tính theo tỷ lệ % doanh thu đối với hành vi thu thập, chuyển giao, mua bán trái phép dữ liệu cá nhân và vi phạm quy định về xin sự đồng ý.',
    articles: [
      {
        id: 'art-nd330-d43',
        document_id: 'doc-nd-330-2026',
        chapter_no: 'Chương III',
        chapter_title: 'Hành vi vi phạm quy định về bảo vệ dữ liệu cá nhân và mức chế tài',
        article_no: 'Điều 43',
        article_title: 'Vi phạm quy định về sự đồng ý của chủ thể dữ liệu và chia sẻ dữ liệu trái phép',
        content: `1. (Khoản 1 Điều 43) Phạt tiền từ 80.000.000 đồng đến 140.000.000 đồng đối với tổ chức có một trong các hành vi: Không thiết lập phương thức rõ ràng để chủ thể dữ liệu thể hiện sự đồng ý; tự ý coi sự im lặng hoặc không phản hồi của chủ thể dữ liệu là sự đồng ý; không lưu trữ nhật ký kiểm chứng sự đồng ý.
2. (Khoản 2 Điều 43) Phạt tiền từ 200.000.000 đồng đến 5% tổng doanh thu năm liền kề tại Việt Nam đối với hành vi chia sẻ, chuyển giao hoặc bán dữ liệu cá nhân của khách hàng cho bên thứ ba phục vụ mục đích tiếp thị, thương mại mà không có sự đồng ý tách biệt, rõ ràng của chủ thể dữ liệu.`,
        is_active: true,
        keywords: ['đồng ý', 'xử phạt vi phạm dữ liệu cá nhân', '5% doanh thu', 'chia sẻ dữ liệu bên thứ ba'],
      },
    ],
  },
  {
    id: 'doc-ldl-60-2024',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '60/2024/QH15',
    title: 'Luật số 60/2024/QH15: Luật Dữ liệu',
    short_title: 'Luật Dữ liệu · 60/2024/QH15',
    issue_date: '2024-11-30',
    effective_date: '2025-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Trần Thanh Mẫn',
    compliance_stats: { total_sections: 17, very_high_count: 17, high_count: 0, medium_count: 0 },
    summary: 'Quy định về xây dựng, phát triển, bảo vệ, quản trị, xử lý, sử dụng dữ liệu số; Cơ sở dữ liệu tổng hợp quốc gia và sàn dữ liệu.',
    articles: [
      {
        id: 'art-ldl-d14',
        document_id: 'doc-ldl-60-2024',
        chapter_no: 'Chương II',
        chapter_title: 'Quản trị, phân loại và chia sẻ dữ liệu',
        article_no: 'Điều 14',
        article_title: 'Phân loại dữ liệu quan trọng và dữ liệu cốt lõi',
        content: `1. Tổ chức, doanh nghiệp quản lý dữ liệu phải thực hiện phân loại dữ liệu theo mức độ quan trọng (dữ liệu cốt lõi, dữ liệu quan trọng, dữ liệu khác) và tuân thủ quy định đánh giá rủi ro trước khi chuyển dữ liệu cốt lõi, dữ liệu quan trọng qua biên giới.`,
        is_active: true,
        keywords: ['luật dữ liệu', 'dữ liệu cốt lõi', 'dữ liệu quan trọng', 'chuyển dữ liệu qua biên giới'],
      },
    ],
  },
  {
    id: 'doc-nd-165-2025',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '165/2025/NĐ-CP',
    title: 'Nghị định số 165/2025/NĐ-CP: Quy định chi tiết thi hành Luật Dữ liệu',
    short_title: 'NĐ 165 · 165/2025/NĐ-CP',
    issue_date: '2025-06-30',
    effective_date: '2025-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    compliance_stats: { total_sections: 23, very_high_count: 23, high_count: 0, medium_count: 0 },
    summary: 'Hướng dẫn tiêu chí xác định dữ liệu cốt lõi, dữ liệu quan trọng và điều kiện kinh doanh sản phẩm, dịch vụ trung gian dữ liệu.',
    articles: [
      {
        id: 'art-nd165-d5',
        document_id: 'doc-nd-165-2025',
        chapter_no: 'Chương I',
        chapter_title: 'Danh mục dữ liệu quan trọng và sản phẩm trung gian dữ liệu',
        article_no: 'Điều 5',
        article_title: 'Trách nhiệm đăng ký và bảo đảm an toàn đối với dịch vụ phân tích, tổng hợp dữ liệu',
        content: `1. Doanh nghiệp cung cấp dịch vụ trung gian dữ liệu, phân tích dữ liệu phải thiết lập quy trình khử nhận dạng dữ liệu cá nhân và bảo đảm khả năng truy vết nguồn gốc dữ liệu.`,
        is_active: true,
        keywords: ['trung gian dữ liệu', 'khử nhận dạng', 'luật dữ liệu'],
      },
    ],
  },
  {
    id: 'doc-llt-33-2024',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '33/2024/QH15',
    title: 'Luật số 33/2024/QH15: Luật Lưu trữ (Lưu trữ tài liệu điện tử và hồ sơ dự án)',
    short_title: 'Luật Lưu trữ · 33/2024/QH15',
    issue_date: '2024-06-21',
    effective_date: '2025-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Quyết toán',
    signer: 'Trần Thanh Mẫn',
    compliance_stats: { total_sections: 15, very_high_count: 0, high_count: 15, medium_count: 0 },
    summary: 'Quy định về quản lý tài liệu lưu trữ, tài liệu lưu trữ điện tử, thời hạn bảo quản hồ sơ công trình và hoạt động dịch vụ lưu trữ số.',
    articles: [
      {
        id: 'art-llt-d22',
        document_id: 'doc-llt-33-2024',
        chapter_no: 'Chương III',
        chapter_title: 'Lưu trữ tài liệu điện tử',
        article_no: 'Điều 22',
        article_title: 'Giá trị pháp lý và yêu cầu kỹ thuật của tài liệu lưu trữ số',
        content: `1. Tài liệu lưu trữ số được ký số hợp lệ và bảo quản trong Hệ thống quản lý tài liệu lưu trữ số đáp ứng tiêu chuẩn kỹ thuật có giá trị pháp lý như bản gốc tài liệu giấy trong công tác thanh tra, kiểm toán và quyết toán.`,
        is_active: true,
        keywords: ['luật lưu trữ', 'lưu trữ điện tử', 'chữ ký số', 'hồ sơ lưu trữ'],
      },
    ],
  },
  {
    id: 'doc-lbvbmnn-117-2025',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '117/2025/QH15',
    title: 'Luật số 117/2025/QH15: Luật Bảo vệ bí mật nhà nước',
    short_title: 'Luật BVBMNN · 117/2025/QH15',
    issue_date: '2025-12-10',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Trần Thanh Mẫn',
    compliance_stats: { total_sections: 14, very_high_count: 3, high_count: 11, medium_count: 0 },
    summary: 'Thay thế Luật Bảo vệ bí mật nhà nước 2018; quy định phân loại độ mật, bảo vệ bí mật nhà nước trên môi trường số và dự án trọng điểm.',
    articles: [
      {
        id: 'art-lbvbmnn-d8',
        document_id: 'doc-lbvbmnn-117-2025',
        chapter_no: 'Chương II',
        chapter_title: 'Phạm vi và phân loại bí mật nhà nước',
        article_no: 'Điều 8',
        article_title: 'Nghiêm cấm soạn thảo, lưu trữ tài liệu chứa bí mật nhà nước trên máy tính kết nối Internet',
        content: `1. Nghiêm cấm soạn thảo, lưu trữ, truyền đưa tài liệu, dữ liệu có nội dung bí mật nhà nước trên máy tính hoặc thiết bị kết nối mạng Internet, mạng công cộng hoặc sử dụng các công cụ AI đám mây công cộng chưa được mã hóa cơ yếu.`,
        is_active: true,
        keywords: ['bí mật nhà nước', 'mã hóa cơ yếu', 'kết nối Internet'],
      },
    ],
  },
  // 5 Văn bản ĐÃ HẾT HIỆU LỰC trong sơ đồ cây LegalFlow (dùng để đối soát lịch sử & thay thế)
  {
    id: 'doc-exp-nd13-2023',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '13/2023/NĐ-CP',
    title: 'Nghị định số 13/2023/NĐ-CP: Bảo vệ dữ liệu cá nhân (Đã hết hiệu lực từ 01/01/2026)',
    short_title: 'NĐ 13 · 13/2023/NĐ-CP',
    issue_date: '2023-04-17',
    effective_date: '2023-07-01',
    expiration_date: '2026-01-01',
    status: 'HET_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    replaced_by_doc_id: 'doc-nd-356-2025',
    replaced_by_label: 'NĐ 356/2025/NĐ-CP & Luật 91/2025/QH15',
    summary: 'Văn bản tiền nhiệm về bảo vệ dữ liệu cá nhân, đã hết hiệu lực từ 01/01/2026 và được nâng cấp lên Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 cùng Nghị định 356/2025/NĐ-CP.',
    articles: [
      {
        id: 'art-nd13-d11',
        document_id: 'doc-exp-nd13-2023',
        chapter_no: 'Chương II',
        chapter_title: 'Quy định cũ về sự đồng ý của chủ thể dữ liệu',
        article_no: 'Điều 11',
        article_title: 'Sự đồng ý của chủ thể dữ liệu (Đã được thay thế bởi Điều 9 Luật 91/2025/QH15)',
        content: `1. Sự đồng ý của chủ thể dữ liệu được áp dụng đối với tất cả các hoạt động trong quy trình xử lý dữ liệu cá nhân. Sự im lặng hoặc không phản hồi của chủ thể dữ liệu không được coi là sự đồng ý. (Lưu ý: Hiện nay áp dụng theo Điều 9 Luật 91/2025/QH15 và Điều 6 Nghị định 356/2025/NĐ-CP).`,
        is_active: false,
        keywords: ['nghị định 13/2023/NĐ-CP', 'bảo vệ dữ liệu cá nhân', 'hết hiệu lực'],
      },
    ],
  },
  {
    id: 'doc-exp-latttm-86-2015',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XIII',
    doc_number: '86/2015/QH13',
    title: 'Luật An toàn thông tin mạng 2015 (Hết hiệu lực từ 01/07/2026)',
    short_title: 'Luật ATTTM · 86/2015/QH13',
    issue_date: '2015-11-19',
    effective_date: '2016-07-01',
    expiration_date: '2026-07-01',
    status: 'HET_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Nguyễn Sinh Hùng',
    replaced_by_doc_id: 'doc-lanm-116-2025',
    replaced_by_label: 'Luật An ninh mạng 116/2025/QH15',
    summary: 'Đã hết hiệu lực từ 01/07/2026; toàn bộ quy định về bảo đảm an toàn hệ thống thông tin đã được hợp nhất vào Luật An ninh mạng 116/2025/QH15.',
    articles: [
      {
        id: 'art-latttm-d1',
        document_id: 'doc-exp-latttm-86-2015',
        chapter_no: 'Chương I',
        chapter_title: 'Quy định chung (Hết hiệu lực)',
        article_no: 'Điều 1',
        article_title: 'Phạm vi điều chỉnh đã chuyển sang Luật An ninh mạng 116/2025/QH15',
        content: `Văn bản đã hết hiệu lực từ 01/07/2026. Mời đối chiếu sang Luật An ninh mạng số 116/2025/QH15.`,
        is_active: false,
        keywords: ['an toàn thông tin mạng', '86/2015/QH13', 'hết hiệu lực'],
      },
    ],
  },
  {
    id: 'doc-exp-lbvbmnn-29-2018',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XIV',
    doc_number: '29/2018/QH14',
    title: 'Luật Bảo vệ bí mật nhà nước 2018 (Hết hiệu lực từ 01/07/2026)',
    short_title: 'Luật BVBMNN 2018 · 29/2018/QH14',
    issue_date: '2018-11-15',
    effective_date: '2020-07-01',
    expiration_date: '2026-07-01',
    status: 'HET_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Nguyễn Thị Kim Ngân',
    replaced_by_doc_id: 'doc-lbvbmnn-117-2025',
    replaced_by_label: 'Luật Bảo vệ bí mật nhà nước 117/2025/QH15',
    summary: 'Đã hết hiệu lực từ 01/07/2026; thay thế bởi Luật Bảo vệ bí mật nhà nước số 117/2025/QH15.',
    articles: [
      {
        id: 'art-exp-29-d1',
        document_id: 'doc-exp-lbvbmnn-29-2018',
        chapter_no: 'Chương I',
        chapter_title: 'Quy định cũ',
        article_no: 'Điều 1',
        article_title: 'Đã thay thế bởi Luật 117/2025/QH15',
        content: `Văn bản đã hết hiệu lực từ 01/07/2026. Mời tra cứu Luật Bảo vệ bí mật nhà nước số 117/2025/QH15.`,
        is_active: false,
        keywords: ['29/2018/QH14', 'bí mật nhà nước', 'hết hiệu lực'],
      },
    ],
  },
  {
    id: 'doc-exp-nd85-2016',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '85/2016/NĐ-CP',
    title: 'Nghị định số 85/2016/NĐ-CP: Bảo đảm an toàn hệ thống thông tin theo cấp độ (Hết hiệu lực từ 01/07/2026)',
    short_title: 'NĐ 85 · 85/2016/NĐ-CP',
    issue_date: '2016-07-01',
    effective_date: '2016-07-01',
    expiration_date: '2026-07-01',
    status: 'HET_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Nguyễn Xuân Phúc',
    replaced_by_doc_id: 'doc-nd-331-2026',
    replaced_by_label: 'Nội dung nay quy định tại NĐ 331/2026/NĐ-CP',
    summary: 'Hết hiệu lực từ 01/07/2026 do luật gốc hết hiệu lực; nội dung nay được quy định tại Nghị định 331/2026/NĐ-CP.',
    articles: [
      {
        id: 'art-exp-nd85-d1',
        document_id: 'doc-exp-nd85-2016',
        chapter_no: 'Chương I',
        chapter_title: 'Quy định cũ',
        article_no: 'Điều 1',
        article_title: 'Đã chuyển sang Nghị định 331/2026/NĐ-CP',
        content: `Hết hiệu lực từ 01/07/2026. Nội dung bảo vệ hệ thống thông tin theo 5 cấp độ nay quy định tại Nghị định 331/2026/NĐ-CP.`,
        is_active: false,
        keywords: ['85/2016/NĐ-CP', 'cấp độ an toàn thông tin', 'hết hiệu lực'],
      },
    ],
  },
  {
    id: 'doc-exp-nd53-2022',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '53/2022/NĐ-CP',
    title: 'Nghị định số 53/2022/NĐ-CP: Quy định chi tiết một số điều của Luật An ninh mạng 2018 (Hết hiệu lực từ 01/07/2026)',
    short_title: 'NĐ 53 · 53/2022/NĐ-CP',
    issue_date: '2022-08-15',
    effective_date: '2022-10-01',
    expiration_date: '2026-07-01',
    status: 'HET_HIEU_LUC',
    field: 'Dữ liệu cá nhân & An ninh mạng',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    replaced_by_doc_id: 'doc-nd-333-2026',
    replaced_by_label: 'Nội dung nay quy định tại NĐ 333/2026/NĐ-CP',
    summary: 'Hết hiệu lực từ 01/07/2026; nội dung hướng dẫn Luật An ninh mạng mới được quy định tại Nghị định 333/2026/NĐ-CP.',
    articles: [
      {
        id: 'art-exp-nd53-d1',
        document_id: 'doc-exp-nd53-2022',
        chapter_no: 'Chương I',
        chapter_title: 'Quy định cũ',
        article_no: 'Điều 1',
        article_title: 'Đã thay thế bởi Nghị định 333/2026/NĐ-CP',
        content: `Hết hiệu lực từ 01/07/2026. Mời đối chiếu sang Nghị định 333/2026/NĐ-CP.`,
        is_active: false,
        keywords: ['53/2022/NĐ-CP', 'luật an ninh mạng', 'hết hiệu lực'],
      },
    ],
  },

  // Cụm Thương mại điện tử & Giao dịch trực tuyến (từ LegalFlow Screenshot 2)
  {
    id: 'doc-ltmdt-122-2025',
    doc_type: 'Luật',
    issuing_body: 'Quốc hội khóa XV',
    doc_number: '122/2025/QH15',
    title: 'Luật số 122/2025/QH15: Luật Thương mại điện tử và Giao dịch nền tảng số',
    short_title: 'Luật Thương mại điện tử · 122/2025/QH15',
    issue_date: '2025-12-10',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Thương mại điện tử',
    project_stage: 'Thực thi',
    signer: 'Trần Thanh Mẫn',
    compliance_stats: { total_sections: 36, very_high_count: 8, high_count: 20, medium_count: 8 },
    summary:
      'Quy định về thiết lập và vận hành website, ứng dụng thương mại điện tử bán hàng, sàn giao dịch TMĐT, trách nhiệm định danh người bán và bảo vệ người tiêu dùng trực tuyến.',
    articles: [
      {
        id: 'art-ltmdt-d15',
        document_id: 'doc-ltmdt-122-2025',
        chapter_no: 'Chương II',
        chapter_title: 'Trách nhiệm của chủ sở hữu website, ứng dụng thương mại điện tử',
        article_no: 'Điều 15',
        article_title: 'Thông báo, đăng ký website thương mại điện tử và minh bạch điều khoản giao dịch',
        content: `1. Thương nhân, tổ chức thiết lập website thương mại điện tử bán hàng phải thực hiện thông báo trực tuyến với Bộ Công Thương trước khi chính thức bán hàng hóa, cung ứng dịch vụ đến người tiêu dùng.
2. Phải công bố công khai trên trang chủ website đầy đủ thông tin về chủ sở hữu, điều kiện giao dịch chung, chính sách vận chuyển, hoàn tiền và chính sách bảo vệ dữ liệu cá nhân theo Luật số 91/2025/QH15.`,
        is_active: true,
        keywords: ['thương mại điện tử', 'website', 'đăng ký bộ công thương', 'giao dịch trực tuyến'],
      },
    ],
  },
  {
    id: 'doc-nd-248-2026',
    doc_type: 'Nghị định',
    issuing_body: 'Chính phủ',
    doc_number: '248/2026/NĐ-CP',
    title: 'Nghị định số 248/2026/NĐ-CP: Quy định chi tiết thi hành Luật Thương mại điện tử',
    short_title: 'NĐ 248/2026/NĐ-CP · Hướng dẫn Luật TMĐT',
    issue_date: '2026-06-30',
    effective_date: '2026-07-01',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Thương mại điện tử',
    project_stage: 'Thực thi',
    signer: 'Phạm Minh Chính',
    compliance_stats: { total_sections: 28, very_high_count: 5, high_count: 17, medium_count: 6 },
    summary:
      'Hướng dẫn chi tiết thủ tục thông báo/đăng ký sàn giao dịch TMĐT, trách nhiệm khấu trừ thuế và quản lý hoạt động livestream thương mại điện tử.',
    articles: [
      {
        id: 'art-nd248-d9',
        document_id: 'doc-nd-248-2026',
        chapter_no: 'Chương II',
        chapter_title: 'Hoạt động vận hành website và nền tảng số TMĐT',
        article_no: 'Điều 9',
        article_title: 'Cơ chế giao kết hợp đồng trực tuyến và xác nhận đơn hàng',
        content: `1. Chức năng đặt hàng trực tuyến trên website thương mại điện tử phải cho phép khách hàng rà soát toàn bộ thông tin đơn hàng, chi phí tổng cộng và xác nhận đồng ý trước khi hoàn tất giao kết hợp đồng.`,
        is_active: true,
        keywords: ['thương mại điện tử', 'đặt hàng trực tuyến', '248/2026/NĐ-CP'],
      },
    ],
  },

  // ============================================================================
  // PHẦN 3: TÀI LIỆU HƯỚNG DẪN SỬ DỤNG THƯ VIỆN ĐẠI SƠN (TỪ VBPL HTML)
  // ============================================================================
  {
    id: 'huong-dan',
    doc_type: 'Tài liệu',
    issuing_body: 'Hệ sinh thái Pháp lý ĐẠI SƠN',
    doc_number: 'HƯỚNG DẪN',
    title: 'Tài liệu Hướng dẫn sử dụng Hệ thống Thư viện VBPL, Kiểm tra Pháp lý & Đối soát Chéo ĐẠI SƠN',
    short_title: 'HƯỚNG DẪN SỬ DỤNG ĐẠI SƠN',
    issue_date: '2026-11-08',
    effective_date: '2026-11-08',
    expiration_date: null,
    status: 'CON_HIEU_LUC',
    field: 'Hướng dẫn sử dụng',
    project_stage: 'Chuẩn bị đầu tư',
    signer: 'Ban Quản trị Hệ thống ĐẠI SƠN',
    is_sample_ref: true,
    summary:
      'Hướng dẫn tra cứu văn bản 3 cột, sử dụng phím tắt (Ctrl+K, M, D), sơ đồ cây Kiểm tra pháp lý, Rà soát hợp đồng, Trợ lý AQUA và sao lưu/khôi phục JSON hoặc xuất HTML độc lập.',
    articles: [
      {
        id: 'art-hd-d1',
        document_id: 'huong-dan',
        chapter_no: 'Chương I',
        chapter_title: 'Bắt đầu sử dụng Không gian Tra cứu 3 Cột',
        article_no: 'Điều 1',
        article_title: 'Tra cứu văn bản và Tìm kiếm không dấu / khớp dấu tiếng Việt',
        content: `1. Chọn lĩnh vực chuyên ngành hoặc giai đoạn dự án (WBS) ở cột trái, sau đó chọn văn bản ở cột giữa. Nhập từ khóa hoặc số hiệu vào ô tìm kiếm (phím tắt Ctrl + K) để tìm trong toàn bộ tài liệu đã có trong trình duyệt.
2. Tìm kiếm mặc định hỗ trợ không phân biệt dấu tiếng Việt. Bật tùy chọn “Khớp dấu tiếng Việt” ở cột giữa để thu hẹp kết quả chính xác theo dấu. Bộ lọc loại văn bản và trạng thái nội dung được áp dụng đồng thời.`,
        is_active: true,
        keywords: ['hướng dẫn tra cứu', 'khớp dấu tiếng việt', 'phím tắt Ctrl K'],
      },
      {
        id: 'art-hd-d2',
        document_id: 'huong-dan',
        chapter_no: 'Chương I',
        chapter_title: 'Bắt đầu sử dụng Không gian Tra cứu 3 Cột',
        article_no: 'Điều 2',
        article_title: 'Mục lục tự động (M), Đánh dấu (D), Ghi chú và Đối soát chéo',
        content: `1. Mục lục được dựng tự động từ các dòng bắt đầu bằng Phần, Chương, Mục hoặc Điều. Nhấn vào mục lục (hoặc phím M) để cuộn nhanh đến điều khoản tương ứng.
2. Nhấn biểu tượng lá cờ (hoặc phím D) để đánh dấu văn bản quan trọng. Ghi chú ở cuối văn bản hoặc theo từng điều khoản được lưu trực tiếp khi bấm “Lưu ghi chú”. Xem thêm Điều 4 để sao lưu dữ liệu.`,
        is_active: true,
        keywords: ['mục lục tự động', 'đánh dấu văn bản', 'lưu ghi chú'],
      },
      {
        id: 'art-hd-d3',
        document_id: 'huong-dan',
        chapter_no: 'Chương II',
        chapter_title: 'Quản lý dữ liệu, Nạp tệp và Sao lưu độc lập',
        article_no: 'Điều 3',
        article_title: 'Nạp tài liệu từ tệp TXT, MD, HTML hoặc dán nội dung thô',
        content: `1. Bấm nút “＋ Nạp văn bản” trên thanh công cụ. Bạn có thể chọn tệp TXT, MD hoặc HTML từ máy tính hoặc dán trực tiếp nội dung văn bản.
2. Tệp HTML được tự động làm sạch và chuyển thành cấu trúc Chương/Điều chuẩn SSoT để phục vụ tìm kiếm toàn văn, tạo mục lục tự động và liên kết đối soát chéo.`,
        is_active: true,
        keywords: ['nạp văn bản', 'TXT MD HTML', 'bóc tách tự động'],
      },
      {
        id: 'art-hd-d4',
        document_id: 'huong-dan',
        chapter_no: 'Chương II',
        chapter_title: 'Quản lý dữ liệu, Nạp tệp và Sao lưu độc lập',
        article_no: 'Điều 4',
        article_title: 'Sao lưu JSON, Khôi phục chống trùng lặp và Xuất HTML độc lập',
        content: `1. Dùng chức năng “↥ Xuất & Sao lưu” để tải bản JSON gồm toàn bộ văn bản, điều khoản, liên kết chéo, đánh dấu, ghi chú và lịch sử thao tác, hoặc tải “Bản HTML độc lập có dữ liệu” mở được trên mọi máy tính không cần internet.
2. Khi nhập bản sao lưu JSON, hệ thống sẽ tự động kiểm tra và chỉ bổ sung các văn bản chưa có ID/số hiệu, giữ nguyên các văn bản và ghi chú đang lưu trên máy mà không gây trùng lặp hay xung đột.`,
        is_active: true,
        keywords: ['sao lưu JSON', 'xuất HTML độc lập', 'khôi phục dữ liệu'],
      },
      {
        id: 'art-hd-d5',
        document_id: 'huong-dan',
        chapter_no: 'Chương III',
        chapter_title: 'Kiểm tra Pháp lý, Rà soát Hợp đồng và Trợ lý AQUA',
        article_no: 'Điều 5',
        article_title: 'Khai thác Sơ đồ cây Hiệu lực, Rà soát Hợp đồng và Trợ lý AQUA',
        content: `1. Phân hệ “Kiểm tra pháp lý” cung cấp sơ đồ cây trực quan phân tách rõ nhóm văn bản Đã hết hiệu lực (bên trái) và Đang có hiệu lực (ở giữa) kèm mức độ ưu tiên tuân thủ (Rất cao, Cao).
2. Phân hệ “Soạn thảo & Rà soát hợp đồng” tự động chỉ rõ Trích đoạn gốc, Vấn đề pháp lý, Căn cứ pháp lý, Đề xuất chỉnh sửa và Câu thay thế gợi ý.
3. Nút nổi “Hỏi nhanh cùng AQUA” ở góc phải màn hình hỗ trợ tra cứu tức thời điều khoản kèm trích dẫn nguồn nguyên văn.`,
        is_active: true,
        keywords: ['kiểm tra pháp lý', 'rà soát hợp đồng', 'trợ lý AQUA'],
      },
    ],
  },
];

// ============================================================================
// BẢNG ĐỐI SOÁT CHÉO LIÊN NGÀNH (CROSS-REFERENCES)
// ============================================================================
export const INITIAL_CROSS_REFERENCES: LegalCrossReference[] = [
  {
    id: 'xref-ldd45-lxd14',
    source_doc_id: 'doc-ldd-31-2024',
    source_article_id: 'art-ldd-d45',
    target_doc_id: 'doc-lxd-135-2025',
    target_article_id: 'art-lxd-d14',
    relation_type: 'DAN_CHIEU',
    title: 'Liên quan: Điều 45 - Luật Đất Đai (Ràng buộc về bàn giao mặt bằng sạch trước khi khởi công dự án nhóm A)',
    description:
      'Ràng buộc về bàn giao mặt bằng sạch trên thực địa và hoàn thành phương án bồi thường giải phóng mặt bằng theo Điều 45 Luật Đất đai 31/2024/QH15 trước khi phát lệnh khởi công dự án theo Điều 14 Luật Xây dựng 135/2025/QH15.',
    comparison_highlight: {
      source_excerpt:
        'Điều 45 Luật Đất đai 31/2024/QH15: Chỉ được nhận bàn giao đất trên thực địa và khởi công khi đã có Quyết định giao đất, cho thuê đất và hoàn thành bồi thường GPMB theo phân kỳ.',
      target_excerpt:
        'Điều 14 Luật Xây dựng 135/2025/QH15: Việc khởi công xây dựng công trình phải bảo đảm có mặt bằng xây dựng để bàn giao toàn bộ hoặc từng phần theo tiến độ xây dựng.',
      legal_impact:
        'Hồ sơ nghiệm thu và khởi công cần bổ sung biên bản kiểm tra điều kiện mặt bằng sạch theo điểm a khoản 1 Điều 14 để tránh rủi ro xuất toán hoặc bị nhà thầu khiếu nại phạt chậm bàn giao mặt bằng.',
    },
  },
  {
    id: 'xref-ldt12-lxd14',
    source_doc_id: 'doc-ldt-22-2023',
    source_article_id: 'art-ldt-d12',
    target_doc_id: 'doc-lxd-135-2025',
    target_article_id: 'art-lxd-d14',
    relation_type: 'DAN_CHIEU',
    title: 'Liên quan: Điều 12 - Luật Đấu Thầu (Điều kiện đồng bộ giữa gói thầu xây lắp và quyết định đầu tư)',
    description:
      'Điều kiện đồng bộ giữa kế hoạch lựa chọn nhà thầu, dự toán gói thầu xây lắp đã duyệt tại Điều 12 Luật Đấu thầu 22/2023/QH15 và hợp đồng thi công trước khi khởi công theo Điều 14 Luật Xây dựng 135/2025/QH15.',
    comparison_highlight: {
      source_excerpt:
        'Điều 12 Luật Đấu thầu 22/2023/QH15: Chỉ phát hành HSMT gói thầu xây lắp khi có KHLCNT được duyệt, thiết kế sau thiết kế cơ sở, dự toán được duyệt và kế hoạch bàn giao mặt bằng.',
      target_excerpt:
        'Điều 14 Luật Xây dựng 135/2025/QH15: Chủ đầu tư đã ký kết hợp đồng thi công xây dựng với nhà thầu được lựa chọn và bố trí đủ vốn theo tiến độ thanh toán.',
      legal_impact:
        'Đảm bảo Ban QLDA không tổ chức đấu thầu hoặc ký hợp đồng khởi công khi chưa phê duyệt thiết kế bản vẽ thi công và dự toán gói thầu.',
    },
  },
  {
    id: 'xref-nd15-lxd14',
    source_doc_id: 'doc-nd-15-2023',
    source_article_id: 'art-nd15-d12',
    target_doc_id: 'doc-lxd-135-2025',
    target_article_id: 'art-lxd-d14',
    relation_type: 'HUONG_DAN_THI_HANH',
    title: 'Liên quan: Điều 12 - Nghị định 15/2021/NĐ-CP (Hướng dẫn thẩm định Báo cáo nghiên cứu khả thi & Thiết kế cơ sở)',
    description:
      'Điều 12 Nghị định 15/2021/NĐ-CP quy định trình tự lập, thẩm định Báo cáo nghiên cứu khả thi làm cơ sở phê duyệt thiết kế bản vẽ thi công và khởi công tại Điều 14 Luật Xây dựng.',
    comparison_highlight: {
      source_excerpt:
        'Điều 12 NĐ 15/2021/NĐ-CP: Thiết kế cơ sở trong Báo cáo nghiên cứu khả thi phải đồng bộ quy hoạch 1/500 và chỉ tiêu mật độ xây dựng, hệ số sử dụng đất.',
      target_excerpt:
        'Điều 14 Luật Xây dựng 135/2025/QH15: Có thiết kế bản vẽ thi công của hạng mục công trình, công trình khởi công đã được phê duyệt hợp lệ.',
      legal_impact:
        'Thiết kế bản vẽ thi công không được làm thay đổi các chỉ tiêu quy hoạch – kiến trúc cốt lõi đã được thẩm định ở bước Thiết kế cơ sở.',
    },
  },
  {
    id: 'xref-nd217-nd15',
    source_doc_id: 'doc-nd-217-2026',
    source_article_id: 'art-nd217-d18',
    target_doc_id: 'doc-nd-15-2023',
    target_article_id: 'art-nd15-d12',
    relation_type: 'SUA_DOI_BO_SUNG',
    title: 'Liên quan: Điều 18 - Nghị định 217/2026/NĐ-CP (Bổ sung bắt buộc mô hình BIM LOD 200 khi trình thẩm định FS)',
    description:
      'Điều 18 Nghị định 217/2026/NĐ-CP sửa đổi, bổ sung quy trình thẩm định Báo cáo nghiên cứu khả thi tại Điều 12 Nghị định 15/2021/NĐ-CP: Bắt buộc nộp tệp BIM LOD 200 và liên thông một cửa PCCC – Đất đai trong 05 ngày.',
    comparison_highlight: {
      source_excerpt:
        'Điều 18 NĐ 217/2026/NĐ-CP: Nộp hồ sơ FS kèm mô hình BIM tối thiểu LOD 200; cơ quan xây dựng lấy ý kiến liên thông PCCC và Đất đai trong 05 ngày làm việc.',
      target_excerpt:
        'Điều 12 NĐ 15/2021/NĐ-CP: Hồ sơ trình thẩm định Báo cáo nghiên cứu khả thi theo bản vẽ 2D truyền thống.',
      legal_impact:
        'Ban QLDA đối với dự án công trình cấp I, cấp đặc biệt bắt buộc bổ sung điều khoản yêu cầu Tư vấn thiết kế bàn giao mô hình BIM LOD 200.',
    },
  },
  {
    id: 'xref-lpccc-lxd-d89',
    source_doc_id: 'doc-lpccc-55-2024',
    source_article_id: 'art-lpccc-d18',
    target_doc_id: 'doc-lxd-135-2025',
    target_article_id: 'art-lxd-d89',
    relation_type: 'DAN_CHIEU',
    title: 'Liên quan: Điều 18 - Luật PCCC 55/2024/QH15 (Điều kiện thẩm định PCCC để cấp Giấy phép xây dựng)',
    description:
      'Điều 18 Luật PCCC & CNCH 55/2024/QH15 phân định rõ thẩm quyền thẩm định thiết kế PCCC làm điều kiện tiên quyết để cấp Giấy phép xây dựng theo điểm c khoản 1 Điều 89 Luật Xây dựng 135/2025/QH15.',
    comparison_highlight: {
      source_excerpt:
        'Điều 18 Luật PCCC 55/2024/QH15: Cơ quan xây dựng thẩm định khoảng cách an toàn, thoát nạn, bậc chịu lửa; Cơ quan Công an thẩm định hệ thống báo cháy, chữa cháy.',
      target_excerpt:
        'Điều 89 Luật Xây dựng 135/2025/QH15: Điều kiện cấp giấy phép xây dựng bắt buộc đã có văn bản thẩm định thiết kế về PCCC và thiết kế sau thiết kế cơ sở được duyệt.',
      legal_impact:
        'Giúp Ban QLDA tránh nộp trùng lặp thuyết minh kiến trúc – kết cấu sang Cục/Phòng Cảnh sát PCCC; rút ngắn 15–20 ngày chuẩn bị hồ sơ xin Giấy phép xây dựng.',
    },
  },
  {
    id: 'xref-nd217-ldt-d64',
    source_doc_id: 'doc-nd-217-2026',
    source_article_id: 'art-nd217-d38',
    target_doc_id: 'doc-ldt-22-2023',
    target_article_id: 'art-ldt-d64',
    relation_type: 'SUA_DOI_BO_SUNG',
    title: 'Liên quan: Điều 38 - Nghị định 217/2026/NĐ-CP (Ngưỡng ±5% điều chỉnh đơn giá hợp đồng xây lắp)',
    description:
      'Điều 38 Nghị định 217/2026/NĐ-CP cụ thể hóa ngưỡng định lượng (±5% biến động giá vật liệu xây dựng chính) cho nguyên tắc hợp đồng theo đơn giá điều chỉnh tại Điều 64 Luật Đấu thầu 22/2023/QH15.',
    comparison_highlight: {
      source_excerpt:
        'Điều 38 NĐ 217/2026/NĐ-CP: Điều chỉnh đơn giá khi giá vật liệu chính biến động vượt quá ±5% so với thời điểm 28 ngày trước ngày đóng thầu.',
      target_excerpt:
        'Điều 64 Luật Đấu thầu 2023: Hợp đồng theo đơn giá điều chỉnh áp dụng khi không lường trước được biến động giá đầu vào; phải quy định công thức điều chỉnh trong hợp đồng.',
      legal_impact:
        'Ban QLDA khi soạn thảo Điều khoản cụ thể của hợp đồng (PCC) bắt buộc phải đưa ngưỡng ±5% và danh mục chỉ số giá vật liệu Sở Xây dựng công bố vào công thức trượt giá.',
    },
  },
  {
    id: 'xref-nd99-lxd-d123',
    source_doc_id: 'doc-nd-99-2021',
    source_article_id: 'art-nd99-d31',
    target_doc_id: 'doc-lxd-135-2025',
    target_article_id: 'art-lxd-d123',
    relation_type: 'DAN_CHIEU',
    title: 'Liên quan: Điều 31 - Nghị định 99/2021/NĐ-CP (Nghiệm thu hoàn thành sang Quyết toán vốn đầu tư)',
    description:
      'Điều 31 Nghị định 99/2021/NĐ-CP dẫn chiếu trực tiếp tới văn bản chấp thuận nghiệm thu hoàn thành công trình tại Điều 123 Luật Xây dựng 135/2025/QH15 làm căn cứ pháp lý bắt buộc để thẩm tra, phê duyệt quyết toán vốn đầu tư dự án hoàn thành.',
    comparison_highlight: {
      source_excerpt:
        'Điều 31 NĐ 99/2021/NĐ-CP: Giá trị đề nghị quyết toán phải căn cứ Biên bản nghiệm thu hoàn thành đưa vào sử dụng và khối lượng thực hiện theo hợp đồng hợp pháp.',
      target_excerpt:
        'Điều 123 Luật Xây dựng 135/2025/QH15: Chủ đầu tư chỉ được nghiệm thu hoàn thành sau khi có văn bản chấp thuận nghiệm thu PCCC và văn bản chấp thuận của cơ quan chuyên môn về xây dựng.',
      legal_impact:
        'Kho bạc Nhà nước / Ban Kiểm toán nội bộ HĐQT sẽ xuất toán hoặc từ chối phê duyệt quyết toán cuối cùng nếu thiếu văn bản chấp thuận kết quả nghiệm thu của Cục/Sở Xây dựng và PCCC.',
    },
  },
  {
    id: 'xref-nd356-bvdlcn-d9',
    source_doc_id: 'doc-nd-356-2025',
    source_article_id: 'art-nd356-d6',
    target_doc_id: 'doc-bvdlcn-91-2025',
    target_article_id: 'art-bvdlcn-d9',
    relation_type: 'HUONG_DAN_THI_HANH',
    title: 'Liên quan: Khoản 1 Điều 6 NĐ 356/2025/NĐ-CP (Thiết lập kỹ thuật xin sự đồng ý trên website/ứng dụng)',
    description:
      'Khoản 1 Điều 6 Nghị định 356/2025/NĐ-CP quy định chi tiết phương thức kỹ thuật để thực hiện điều kiện sự đồng ý hợp lệ tại Điều 9 Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.',
    comparison_highlight: {
      source_excerpt:
        'Khoản 1 Điều 6 NĐ 356/2025/NĐ-CP: Xin sự đồng ý trên website, ứng dụng phải có thiết lập kỹ thuật rõ ràng, lưu trữ nhật ký (log) kiểm chứng được chủ thể, thời điểm và nội dung đồng ý.',
      target_excerpt:
        'Khoản 2, 3, 4 Điều 9 Luật 91/2025/QH15: Đồng ý phải rõ ràng, cụ thể, không gộp mục đích, im lặng hoặc không phản hồi không phải là đồng ý.',
      legal_impact:
        'Doanh nghiệp vận hành website/ứng dụng hoặc cổng thông tin dự án bất động sản phải lưu log sự đồng ý và tách riêng từng mục đích thu thập dữ liệu.',
    },
  },
  {
    id: 'xref-nd330-bvdlcn-d9',
    source_doc_id: 'doc-nd-330-2026',
    source_article_id: 'art-nd330-d43',
    target_doc_id: 'doc-bvdlcn-91-2025',
    target_article_id: 'art-bvdlcn-d9',
    relation_type: 'DAN_CHIEU',
    title: 'Liên quan: Điều 43 NĐ 330/2026/NĐ-CP (Chế tài xử phạt đến 5% doanh thu khi vi phạm quy định về sự đồng ý)',
    description:
      'Điều 43 Nghị định 330/2026/NĐ-CP quy định mức phạt hành chính từ 80 triệu đồng đến 5% doanh thu đối với hành vi vi phạm Điều 9 Luật Bảo vệ dữ liệu cá nhân.',
    comparison_highlight: {
      source_excerpt:
        'Điều 43 NĐ 330/2026/NĐ-CP: Phạt 80–140 triệu đồng nếu tự ý coi im lặng là đồng ý; phạt đến 5% doanh thu nếu chia sẻ dữ liệu khách hàng cho bên thứ ba trái phép.',
      target_excerpt:
        'Điều 9 Luật 91/2025/QH15: Chủ thể dữ liệu phải tự nguyện đồng ý theo từng mục đích cụ thể; nghiêm cấm ép buộc hoặc mặc định đồng ý.',
      legal_impact:
        'Cần rà soát ngay toàn bộ Hợp đồng phát triển phần mềm/website và Chính sách bảo mật để loại bỏ điều khoản cho phép nhà thầu tự ý sử dụng dữ liệu khách hàng.',
    },
  },
  {
    id: 'xref-lqlthue38-lkt88',
    source_doc_id: 'doc-lqlthue-38-2019',
    source_article_id: 'art-lqlthue38-d91',
    target_doc_id: 'doc-lkt-88-2015',
    target_article_id: 'art-lkt88-d18',
    relation_type: 'SUA_DOI_BO_SUNG',
    title: 'Phả hệ Lần 1 (2019): Luật Quản lý thuế 38/2019/QH14 → Điều 18 Luật Kế toán 88/2015/QH13',
    description:
      'Đồng bộ hóa đơn điện tử có mã của cơ quan thuế tại Điều 91 Luật Quản lý thuế 38/2019/QH14 với chứng từ điện tử tại Điều 17, Điều 18 Luật Kế toán 88/2015/QH13.',
    comparison_highlight: {
      source_excerpt:
        'Điều 91 Luật 38/2019/QH14: Bắt buộc sử dụng hóa đơn điện tử khi bán hàng hóa, cung cấp dịch vụ và nghiệm thu khối lượng hoàn thành.',
      target_excerpt:
        'Điều 18 Luật Kế toán 88/2015/QH13: Chứng từ điện tử phải bảo đảm tính toàn vẹn dữ liệu và có chữ ký điện tử hợp pháp.',
      legal_impact:
        'Mọi hồ sơ thanh toán, quyết toán không kèm hóa đơn điện tử hợp lệ đều bị từ chối ghi nhận chi phí hợp pháp.',
    },
  },
  {
    id: 'xref-lsd56-lkt88',
    source_doc_id: 'doc-lsd9luat-56-2024',
    source_article_id: 'art-lsd56-d2',
    target_doc_id: 'doc-lkt-88-2015',
    target_article_id: 'art-lkt88-d11',
    relation_type: 'SUA_DOI_BO_SUNG',
    title: 'Phả hệ Lần 2 (2024): Luật 56/2024/QH15 (1 Luật sửa 9 Luật) → Điều 11, 20, 29 Luật Kế toán 88/2015/QH13',
    description:
      'Điều 2 Luật số 56/2024/QH15 sửa đổi, bổ sung trực tiếp Điều 3, 11, 20, 28, 29, 41, 52 của Luật Kế toán 88/2015/QH13 (có hiệu lực từ 01/01/2025).',
    comparison_highlight: {
      source_excerpt:
        'Điều 2 Luật 56/2024/QH15: Chỉ bắt buộc dịch sang tiếng Việt các nội dung chủ yếu của chứng từ ngoại tệ/quốc tế; chuẩn hóa kỳ kế toán đầu tiên tối đa dưới 15 tháng.',
      target_excerpt:
        'Điều 11 & Điều 20 Luật Kế toán 88/2015/QH13: Quy định về chữ viết sử dụng trong kế toán và cách tính kỳ kế toán năm đầu tiên.',
      legal_impact:
        'Giúp Ban QLDA và doanh nghiệp giảm tải thủ tục dịch thuật toàn bộ hồ sơ thầu quốc tế/chứng từ nhập khẩu thiết bị.',
    },
  },
  {
    id: 'xref-lsd108-lkt88',
    source_doc_id: 'doc-lsdlkt-108-2025',
    source_article_id: 'art-lsd108-d1',
    target_doc_id: 'doc-lkt-88-2015',
    target_article_id: 'art-lkt88-d18',
    relation_type: 'DAN_CHIEU',
    title: 'Phả hệ Lần 3 (2025): Luật Quản lý thuế 108/2025/QH15 → Điều 18 Luật Kế toán 88/2015/QH13 (Đồng bộ hóa đơn điện tử & chứng từ số)',
    description:
      'Điều 1 Luật Quản lý thuế số 108/2025/QH15 dẫn chiếu đồng bộ chứng từ kế toán điện tử và hóa đơn điện tử có mã của cơ quan thuế tại Điều 17, Điều 18 Luật Kế toán 88/2015/QH13.',
    comparison_highlight: {
      source_excerpt:
        'Điều 1 Luật Quản lý thuế 108/2025/QH15: Kết nối dữ liệu chứng từ kế toán điện tử, hóa đơn điện tử có mã của cơ quan thuế và tích hợp chữ ký số hợp pháp.',
      target_excerpt:
        'Điều 18 Luật Kế toán 88/2015/QH13: Chứng từ điện tử dùng trong hạch toán kế toán và kê khai thuế phải có chữ ký số hợp pháp theo quy định.',
      legal_impact:
        'Doanh nghiệp và Ban QLDA cần đồng bộ phần mềm kế toán với cổng hóa đơn điện tử của cơ quan thuế từ ngày 01/07/2026.',
    },
  },
];

// ============================================================================
// CÁC NÚT YÊU CẦU TUÂN THỦ PHÁP LÝ (LEGALFLOW COMPLIANCE NODES - SCREENSHOT 4 & 5)
// ============================================================================
export const COMPLIANCE_REQUIREMENT_NODES: ComplianceRequirementNode[] = [
  {
    id: 'req-l1-1',
    code: 'L1.1',
    groupCode: 'L1',
    groupTitle: 'L1 · Nguyên tắc chung và hành vi bị cấm',
    title:
      'Luật BVDLCN · L1.1 Thu thập, xử lý đúng phạm vi, mục đích; dữ liệu chính xác; lưu trong thời gian phù hợp; có biện pháp thể chế, kỹ thuật, con người',
    priority: 'Cao',
    citation: 'Điều 3 Luật 91/2025/QH15',
    docId: 'doc-bvdlcn-91-2025',
    articleId: 'art-bvdlcn-d3',
    penaltyNote: 'Phạt từ 50–100 triệu đồng nếu thu thập vượt quá phạm vi mục đích đã thông báo.',
  },
  {
    id: 'req-l1-2',
    code: 'L1.2',
    groupCode: 'L1',
    groupTitle: 'L1 · Nguyên tắc chung và hành vi bị cấm',
    title:
      'Luật BVDLCN · L1.2 Các hành vi bị nghiêm cấm: xử lý trái luật, cản trở BVDL, mua bán DLCN, chiếm đoạt hoặc cố ý làm lộ, mất dữ liệu',
    priority: 'Rất cao',
    citation: 'Điều 7 Luật 91/2025/QH15',
    docId: 'doc-bvdlcn-91-2025',
    articleId: 'art-bvdlcn-d7',
    penaltyNote: 'Cơ chế tài phạt từ 100 triệu (tổ chức) hoặc tính theo 5% doanh thu/khoản thu; có thể truy cứu trách nhiệm hình sự.',
  },
  {
    id: 'req-l2-1',
    code: 'L2.1',
    groupCode: 'L2',
    groupTitle: 'L2 · Điều kiện hợp lệ của sự đồng ý (Đồng ý)',
    title:
      'Luật BVDLCN · L2.1 Đồng ý chỉ hợp lệ khi tự nguyện và biết rõ loại dữ liệu, mục đích, bên kiểm soát, quyền và nghĩa vụ',
    priority: 'Cao',
    citation: 'Khoản 2 Điều 9 Luật 91/2025/QH15',
    docId: 'doc-bvdlcn-91-2025',
    articleId: 'art-bvdlcn-d9',
    penaltyNote: 'Sự đồng ý bị coi là vô hiệu nếu không thông báo rõ danh tính Bên kiểm soát và Bên xử lý dữ liệu.',
  },
  {
    id: 'req-l2-2',
    code: 'L2.2',
    groupCode: 'L2',
    groupTitle: 'L2 · Điều kiện hợp lệ của sự đồng ý (Đồng ý)',
    title:
      'Luật BVDLCN · L2.2 Đồng ý phải rõ ràng, cụ thể, in hoặc sao chép được, kể cả dạng điện tử kiểm chứng được',
    priority: 'Cao',
    citation: 'Khoản 3 Điều 9 Luật 91/2025/QH15 & Khoản 1 Điều 6 NĐ 356/2025/NĐ-CP',
    docId: 'doc-bvdlcn-91-2025',
    articleId: 'art-bvdlcn-d9',
    penaltyNote: 'Phải lưu trữ log kỹ thuật chứng minh thời điểm và nội dung chủ thể dữ liệu đã nhấn đồng ý.',
  },
  {
    id: 'req-l2-3',
    code: 'L2.3',
    groupCode: 'L2',
    groupTitle: 'L2 · Điều kiện hợp lệ của sự đồng ý (Đồng ý)',
    title:
      'Luật BVDLCN · L2.3 Không gộp mục đích, không ép đồng ý mục đích khác; im lặng hoặc không phản hồi không phải là đồng ý',
    priority: 'Cao',
    citation: 'Khoản 4 Điều 9 Luật 91/2025/QH15 & Khoản 1 Điều 43 NĐ 330/2026/NĐ-CP',
    docId: 'doc-bvdlcn-91-2025',
    articleId: 'art-bvdlcn-d9',
    penaltyNote: 'Phạt tiền từ 80–140 triệu đồng nếu thiết lập mặc định đồng ý (pre-ticked checkbox) hoặc gộp mục đích.',
  },
  {
    id: 'req-l2-4',
    code: 'L2.4',
    groupCode: 'L2',
    groupTitle: 'L2 · Điều kiện hợp lệ của sự đồng ý (Đồng ý)',
    title:
      'Luật BVDLCN · L2.4 Phải có đồng ý trước khi thu thập dữ liệu, trừ trường hợp luật quy định khác',
    priority: 'Cao',
    citation: 'Khoản 1 Điều 11 Luật 91/2025/QH15',
    docId: 'doc-bvdlcn-91-2025',
    articleId: 'art-bvdlcn-d11',
  },
  {
    id: 'req-l2-5',
    code: 'L2.5',
    groupCode: 'L2',
    groupTitle: 'L2 · Điều kiện hợp lệ của sự đồng ý (Đồng ý)',
    title:
      'Luật BVDLCN · L2.5 Doanh nghiệp chỉ phân tích, tổng hợp DLCN từ nguồn được phép xử lý',
    priority: 'Cao',
    citation: 'Khoản 3 Điều 11 Luật 91/2025/QH15',
    docId: 'doc-bvdlcn-91-2025',
    articleId: 'art-bvdlcn-d11',
  },
  {
    id: 'req-l3-1',
    code: 'L3.1',
    groupCode: 'L3',
    groupTitle: 'L3 · Quyền của chủ thể dữ liệu cá nhân',
    title:
      'Luật BVDLCN · L3.1 Chủ thể có quyền: được biết, đồng ý hoặc rút đồng ý, xem, sửa, yêu cầu cung cấp, xóa, hạn chế, phản đối xử lý',
    priority: 'Cao',
    citation: 'Điều 11 Luật 91/2025/QH15',
    docId: 'doc-bvdlcn-91-2025',
    articleId: 'art-bvdlcn-d11',
  },
  // Yêu cầu tuân thủ nhóm Xây dựng & Đấu thầu
  {
    id: 'req-xd-1',
    code: 'XD1.1',
    groupCode: 'XD1',
    groupTitle: 'XD1 · Điều kiện khởi công và Bàn giao mặt bằng sạch',
    title:
      'Luật Xây dựng · XD1.1 Bắt buộc có biên bản bàn giao mặt bằng sạch toàn bộ hoặc từng phần và Giấy phép xây dựng trước khi phát lệnh khởi công',
    priority: 'Rất cao',
    citation: 'Khoản 1 Điều 14 Luật Xây dựng 135/2025/QH15 & Điều 45 Luật Đất đai 31/2024/QH15',
    docId: 'doc-lxd-135-2025',
    articleId: 'art-lxd-d14',
    penaltyNote: 'Rủi ro đình chỉ thi công và xuất toán chi phí phát sinh do chờ mặt bằng khi quyết toán vốn đầu tư.',
  },
  {
    id: 'req-xd-2',
    code: 'XD1.2',
    groupCode: 'XD1',
    groupTitle: 'XD1 · Điều kiện khởi công và Bàn giao mặt bằng sạch',
    title:
      'Luật Xây dựng · XD1.2 Chỉ được nghiệm thu hoàn thành đưa công trình vào sử dụng sau khi có văn bản chấp thuận nghiệm thu PCCC và cơ quan chuyên môn về xây dựng',
    priority: 'Rất cao',
    citation: 'Khoản 2 Điều 123 Luật Xây dựng 135/2025/QH15 & Điều 18 Luật PCCC 55/2024/QH15',
    docId: 'doc-lxd-135-2025',
    articleId: 'art-lxd-d123',
  },
  {
    id: 'req-dt-1',
    code: 'DT1.1',
    groupCode: 'DT1',
    groupTitle: 'DT1 · Điều kiện phát hành HSMT và Quản lý hợp đồng xây lắp',
    title:
      'Luật Đấu thầu · DT1.1 Nghiêm cấm phát hành HSMT gói thầu xây lắp khi chưa phê duyệt KHLCNT, thiết kế triển khai sau thiết kế cơ sở và dự toán gói thầu',
    priority: 'Rất cao',
    citation: 'Khoản 1 Điều 12 Luật Đấu thầu 22/2023/QH15',
    docId: 'doc-ldt-22-2023',
    articleId: 'art-ldt-d12',
  },
  {
    id: 'req-dt-2',
    code: 'DT1.2',
    groupCode: 'DT1',
    groupTitle: 'DT1 · Điều kiện phát hành HSMT và Quản lý hợp đồng xây lắp',
    title:
      'NĐ 217/2026/NĐ-CP · DT1.2 Điều chỉnh đơn giá hợp đồng xây dựng khi biến động giá vật liệu chính vượt quá ±5% so với thời điểm 28 ngày trước ngày đóng thầu',
    priority: 'Cao',
    citation: 'Khoản 1 Điều 38 Nghị định 217/2026/NĐ-CP & Điều 64 Luật Đấu thầu',
    docId: 'doc-nd-217-2026',
    articleId: 'art-nd217-d38',
  },
];

// ============================================================================
// MẪU HỢP ĐỒNG & KẾT QUẢ RÀ SOÁT ĐIỀU KHOẢN (LEGALFLOW SCREENSHOT 3)
// ============================================================================
export const CONTRACT_REVIEW_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tpl-website-data-2026',
    title: 'Hợp đồng Thiết kế, Phát triển Website Thương mại điện tử & Xử lý Dữ liệu Khách hàng',
    category: 'Dữ liệu cá nhân & Thương mại điện tử',
    description:
      'Mẫu hợp đồng dịch vụ phát triển website/ứng dụng có thu thập dữ liệu khách hàng — Đã được rà soát theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, Nghị định 356/2025/NĐ-CP và Bộ luật Dân sự.',
    updatedAt: '2026-11-08',
    fullText: `HỢP ĐỒNG THIẾT KẾ VÀ PHÁT TRIỂN WEBSITE THƯƠNG MẠI ĐIỆN TỬ
Số: 108/2026/HĐDV-ĐS

Điều 3. Giá trị hợp đồng và Phương thức thanh toán
Điểm 1. Bên A thanh toán cho Bên B 100% giá trị hợp đồng ngay sau khi ký kết hợp đồng để Bên B triển khai nhân sự thực hiện dự án.

Điều 4. Quyền sở hữu mã nguồn và Dữ liệu khách hàng
Điểm 2. Bên B được toàn quyền lưu trữ, sử dụng và chia sẻ dữ liệu khách hàng thu thập qua website cho các đối tác của Bên B nhằm mục đích tiếp thị.

Điều 6. Trách nhiệm do vi phạm hợp đồng và Bảo hành
Điểm 3. Trong mọi trường hợp, tổng mức bồi thường thiệt hại của Bên B (bao gồm cả trường hợp làm lộ lọt dữ liệu cá nhân hoặc gián đoạn hệ thống) không vượt quá 10% giá trị hợp đồng.`,
    issues: [
      {
        id: 'issue-web-1',
        riskLevel: 'Cao',
        clauseLocation: 'Điểm 1 · Điều 3 (Tiến độ thanh toán & Nghiệm thu)',
        originalExcerpt:
          'Bên A thanh toán cho Bên B 100% giá trị hợp đồng ngay sau khi ký kết hợp đồng để Bên B triển khai nhân sự thực hiện dự án.',
        problemAnalysis:
          'Thanh toán 100% ngay khi ký hợp đồng đẩy toàn bộ rủi ro thực hiện hợp đồng về phía Bên A (Chủ đầu tư), không có cơ chế ràng buộc trách nhiệm của Bên B với các mốc bàn giao giao diện (UI/UX), mã nguồn (Source code) và kiểm thử an toàn thông tin.',
        legalBasis: 'Điều 410, Điều 519 Bộ luật Dân sự 2015 & Luật Thương mại 2005',
        legalBasisDocId: 'doc-ltmdt-122-2025',
        legalBasisArticleId: 'art-ltmdt-d15',
        editRecommendation:
          'Quy định tiến độ thanh toán chia làm nhiều đợt gắn với mốc nghiệm thu (đặt cọc, nghiệm thu thiết kế, nghiệm thu bàn giao) và quy định cơ chế hoàn tiền nếu Bên B vi phạm nghĩa vụ.',
        suggestedReplacement:
          'Bên A thanh toán theo tiến độ: Đợt 1 thanh toán 30% giá trị hợp đồng trong vòng 03 ngày làm việc kể từ ngày ký hợp đồng; Đợt 2 thanh toán 40% sau khi hoàn thành nghiệm thu giao diện; Đợt 3 thanh toán 30% còn lại sau khi bàn giao, nghiệm thu website hoàn chỉnh. Trường hợp hợp đồng chấm dứt do lỗi của Bên B, Bên B có nghĩa vụ hoàn lại toàn bộ số tiền Bên A đã thanh toán cho phần dịch vụ chưa được hoàn thành.',
      },
      {
        id: 'issue-web-2',
        riskLevel: 'Rất cao',
        clauseLocation: 'Điểm 2 · Điều 4 (Bảo vệ dữ liệu cá nhân)',
        originalExcerpt:
          'Bên B được toàn quyền lưu trữ, sử dụng và chia sẻ dữ liệu khách hàng thu thập qua website cho các đối tác của Bên B nhằm mục đích tiếp thị.',
        problemAnalysis:
          'Vi phạm nghiêm trọng pháp luật về bảo vệ dữ liệu cá nhân. Bên A là Bên kiểm soát dữ liệu/thu thập dữ liệu khách hàng sẽ bị liên đới chịu trách nhiệm pháp lý (phạt đến 5% doanh thu theo Điều 43 NĐ 330/2026/NĐ-CP) khi Bên B tự ý khai thác và chia sẻ thông tin cá nhân của người tiêu dùng cho bên thứ ba.',
        legalBasis:
          'Điều 7, Điều 9 Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15; Nghị định 356/2025/NĐ-CP & Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân',
        legalBasisDocId: 'doc-bvdlcn-91-2025',
        legalBasisArticleId: 'art-bvdlcn-d9',
        editRecommendation:
          'Quy định rõ Bên B chỉ là Bên xử lý dữ liệu cá nhân theo ủy quyền của Bên A; Bên B không được lưu trữ riêng, chia sẻ hay sử dụng dữ liệu khách hàng cho mục đích thương mại riêng.',
        suggestedReplacement:
          'Bên B chỉ được lưu trữ và xử lý dữ liệu khách hàng trong phạm vi phục vụ việc vận hành website theo hợp đồng này và hướng dẫn của Bên A. Bên B không được phép sử dụng, tiết lộ hoặc chia sẻ dữ liệu khách hàng cho bất kỳ bên thứ ba nào nếu không được sự đồng ý bằng văn bản của Bên A và chủ thể dữ liệu.',
      },
      {
        id: 'issue-web-3',
        riskLevel: 'Cao',
        clauseLocation: 'Điểm 3 · Điều 6 (Giới hạn trách nhiệm bồi thường)',
        originalExcerpt:
          'Trong mọi trường hợp, tổng mức bồi thường thiệt hại của Bên B (bao gồm cả trường hợp làm lộ lọt dữ liệu cá nhân hoặc gián đoạn hệ thống) không vượt quá 10% giá trị hợp đồng.',
        problemAnalysis:
          'Giới hạn mức bồi thường tối đa 10% giá trị hợp đồng ngay cả khi Bên B có lỗi cố ý hoặc làm rò rỉ dữ liệu cá nhân khiến Bên A không thể thu hồi khoản tiền phạt hành chính (lên tới hàng trăm triệu đồng) từ lỗi kỹ thuật của Bên B.',
        legalBasis: 'Điều 360 Bộ luật Dân sự 2015 & Điều 43 Nghị định 330/2026/NĐ-CP',
        legalBasisDocId: 'doc-nd-330-2026',
        legalBasisArticleId: 'art-nd330-d43',
        editRecommendation:
          'Loại trừ giới hạn trách nhiệm đối với các hành vi vi phạm nghĩa vụ bảo mật dữ liệu cá nhân, xâm phạm quyền sở hữu trí tuệ hoặc lỗi cố ý của Bên B.',
        suggestedReplacement:
          'Bên B có nghĩa vụ bồi thường toàn bộ thiệt hại thực tế phát sinh cho Bên A. Giới hạn trách nhiệm không áp dụng đối với trường hợp Bên B vi phạm nghĩa vụ bảo mật, làm lộ lọt dữ liệu cá nhân của khách hàng hoặc vi phạm quy định về an ninh mạng do lỗi của Bên B.',
      },
    ],
  },
  {
    id: 'tpl-epc-construction-2026',
    title: 'Hợp đồng Thi công Xây dựng Công trình & Cung cấp Thiết bị (Gói thầu Xây lắp / EPC)',
    category: 'Xây dựng · Đấu thầu & QLDA',
    description:
      'Mẫu hợp đồng thi công xây dựng công trình rà soát theo Luật Xây dựng 135/2025/QH15, Luật Đấu thầu 22/2023/QH15, Nghị định 210/2026/NĐ-CP và Nghị định 217/2026/NĐ-CP.',
    updatedAt: '2026-11-08',
    fullText: `HỢP ĐỒNG THI CÔNG XÂY DỰNG CÔNG TRÌNH
Số: 217/2026/HĐTC-QLDA

Điều 4. Bàn giao mặt bằng và Khởi công xây dựng
Điểm 1. Nhà thầu phải tự liên hệ với chính quyền địa phương để giải phóng mặt bằng và triển khai khởi công ngay trong vòng 05 ngày kể từ ngày ký hợp đồng, kể cả khi chưa có Giấy phép xây dựng.

Điều 8. Tạm ứng và Điều chỉnh đơn giá hợp đồng
Điểm 2. Chủ đầu tư tạm ứng 50% giá trị hợp đồng ngay sau khi ký hợp đồng mà không cần bảo lãnh tiền tạm ứng. Đơn giá hợp đồng được điều chỉnh bất cứ khi nào giá thị trường thay đổi.

Điều 14. Nghiệm thu hoàn thành và Quyết toán hợp đồng
Điểm 3. Công trình được coi là nghiệm thu hoàn thành đưa vào sử dụng ngay khi Nhà thầu thi công xong phần xây lắp, văn bản nghiệm thu PCCC sẽ được bổ sung sau khi đưa công trình vào vận hành.`,
    issues: [
      {
        id: 'issue-epc-1',
        riskLevel: 'Rất cao',
        clauseLocation: 'Điểm 1 · Điều 4 (Điều kiện khởi công & Mặt bằng sạch)',
        originalExcerpt:
          'Nhà thầu phải tự liên hệ với chính quyền địa phương để giải phóng mặt bằng và triển khai khởi công ngay trong vòng 05 ngày kể từ ngày ký hợp đồng, kể cả khi chưa có Giấy phép xây dựng.',
        problemAnalysis:
          'Vi phạm điều kiện khởi công bắt buộc tại Điều 14 Luật Xây dựng 135/2025/QH15 và Điều 45 Luật Đất đai 31/2024/QH15. Khởi công khi chưa có mặt bằng sạch và Giấy phép xây dựng sẽ bị đình chỉ thi công, xử phạt hành chính và không được quyết toán chi phí.',
        legalBasis: 'Khoản 1 Điều 14 Luật Xây dựng 135/2025/QH15 & Điều 45 Luật Đất đai 31/2024/QH15',
        legalBasisDocId: 'doc-lxd-135-2025',
        legalBasisArticleId: 'art-lxd-d14',
        editRecommendation:
          'Quy định rõ trách nhiệm của Chủ đầu tư bàn giao mặt bằng sạch (toàn bộ hoặc từng phân kỳ) có biên bản xác nhận và chỉ phát lệnh khởi công khi đã có Giấy phép xây dựng, thiết kế bản vẽ thi công được duyệt.',
        suggestedReplacement:
          'Chủ đầu tư có trách nhiệm bàn giao mặt bằng xây dựng sạch (toàn bộ hoặc từng phần theo tiến độ thỏa thuận) kèm Biên bản bàn giao mốc giới trên thực địa và Giấy phép xây dựng hợp lệ theo Điều 14 Luật Xây dựng số 135/2025/QH15 trước khi phát lệnh khởi công.',
      },
      {
        id: 'issue-epc-2',
        riskLevel: 'Cao',
        clauseLocation: 'Điểm 2 · Điều 8 (Giới hạn tạm ứng & Ngưỡng trượt giá ±5%)',
        originalExcerpt:
          'Chủ đầu tư tạm ứng 50% giá trị hợp đồng ngay sau khi ký hợp đồng mà không cần bảo lãnh tiền tạm ứng. Đơn giá hợp đồng được điều chỉnh bất cứ khi nào giá thị trường thay đổi.',
        problemAnalysis:
          'Vượt trần tạm ứng tối đa 30% giá trị hợp đồng theo Điều 16 Nghị định 210/2026/NĐ-CP và thiếu điều kiện ngưỡng biến động giá vật liệu chính vượt ±5% theo Điều 38 Nghị định 217/2026/NĐ-CP, dẫn tới Kho bạc Nhà nước / Kiểm toán từ chối thanh toán.',
        legalBasis: 'Điều 16 Nghị định 210/2026/NĐ-CP & Điều 38 Nghị định 217/2026/NĐ-CP',
        legalBasisDocId: 'doc-nd-217-2026',
        legalBasisArticleId: 'art-nd217-d38',
        editRecommendation:
          'Giới hạn mức tạm ứng không quá 30% giá trị hợp đồng kèm Bảo lãnh tiền tạm ứng ngân hàng; quy định chỉ điều chỉnh đơn giá khi giá vật liệu chính biến động vượt quá ±5% so với thời điểm 28 ngày trước ngày đóng thầu.',
        suggestedReplacement:
          'Chủ đầu tư tạm ứng 20% giá trị hợp đồng sau khi nhận được Bảo lãnh thực hiện hợp đồng và Bảo lãnh tiền tạm ứng có giá trị tương đương từ ngân hàng hợp pháp. Việc điều chỉnh đơn giá chỉ áp dụng đối với khối lượng thi công theo tiến độ khi giá vật liệu xây dựng chính biến động vượt quá ±5% so với giá tại thời điểm 28 ngày trước ngày đóng thầu theo công bố của Sở Xây dựng địa phương.',
      },
      {
        id: 'issue-epc-3',
        riskLevel: 'Rất cao',
        clauseLocation: 'Điểm 3 · Điều 14 (Nghiệm thu PCCC & Quyết toán vốn)',
        originalExcerpt:
          'Công trình được coi là nghiệm thu hoàn thành đưa vào sử dụng ngay khi Nhà thầu thi công xong phần xây lắp, văn bản nghiệm thu PCCC sẽ được bổ sung sau khi đưa công trình vào vận hành.',
        problemAnalysis:
          'Trái với Khoản 2 Điều 123 Luật Xây dựng 135/2025/QH15 và Điều 18 Luật PCCC 55/2024/QH15. Đưa công trình vào sử dụng khi chưa có văn bản chấp thuận kết quả nghiệm thu PCCC là hành vi bị nghiêm cấm và không đủ hồ sơ pháp lý để quyết toán theo Điều 31 Nghị định 99/2021/NĐ-CP.',
        legalBasis: 'Điều 123 Luật Xây dựng 135/2025/QH15, Điều 18 Luật PCCC 55/2024/QH15 & Điều 31 NĐ 99/2021/NĐ-CP',
        legalBasisDocId: 'doc-lxd-135-2025',
        legalBasisArticleId: 'art-lxd-d123',
        editRecommendation:
          'Bắt buộc hoàn tất kiểm tra, có văn bản chấp thuận nghiệm thu về PCCC của Cơ quan Công an và văn bản chấp thuận nghiệm thu của cơ quan chuyên môn về xây dựng trước khi ký Biên bản nghiệm thu hoàn thành công trình đưa vào sử dụng.',
        suggestedReplacement:
          'Chủ đầu tư chỉ tổ chức ký Biên bản nghiệm thu hoàn thành công trình để đưa vào khai thác, sử dụng sau khi Nhà thầu đã hoàn thành toàn bộ nghĩa vụ theo thiết kế được duyệt và đã có Văn bản chấp thuận kết quả nghiệm thu về phòng cháy và chữa cháy cùng Văn bản chấp thuận kết quả nghiệm thu của cơ quan chuyên môn về xây dựng theo quy định tại Điều 123 Luật Xây dựng.',
      },
    ],
  },
];

export const INITIAL_DAILY_ALERTS: DailyLegalUpdateAlert[] = [
  {
    id: 'alert-pmu-01',
    date: '2026-11-08',
    docId: 'doc-lxd-135-2025',
    code: '135/2025/QH15',
    title: 'Kiểm soát điều kiện khởi công theo Điều 14 Luật Xây dựng 135/2025/QH15 và Điều 45 Luật Đất đai',
    category: 'Xây dựng',
    projectStage: 'Thực thi',
    changeType: 'Ban hành mới',
    summary:
      'Chủ đầu tư và Ban QLDA cần lập Biên bản kiểm tra điều kiện mặt bằng sạch theo từng phân kỳ đầu tư trước khi phát lệnh khởi công nhằm phòng ngừa rủi ro xuất toán khi quyết toán vốn đầu tư.',
    impactedDocIds: ['doc-lxd-135-2025', 'doc-ldd-31-2024', 'doc-ldt-22-2023'],
    isRead: false,
  },
  {
    id: 'alert-pmu-02',
    date: '2026-11-08',
    docId: 'doc-bvdlcn-91-2025',
    code: '91/2025/QH15',
    title: 'Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & NĐ 356/2025/NĐ-CP: Rà soát điều kiện xin sự đồng ý hợp lệ',
    category: 'Dữ liệu cá nhân & An ninh mạng',
    projectStage: 'Thực thi',
    changeType: 'Ban hành mới',
    summary:
      'Doanh nghiệp cần rà soát toàn bộ website, ứng dụng và hợp đồng xử lý dữ liệu: Không gộp mục đích xin sự đồng ý, không coi sự im lặng là đồng ý và phải lưu nhật ký (log) kiểm chứng được.',
    impactedDocIds: ['doc-bvdlcn-91-2025', 'doc-nd-356-2025', 'doc-nd-330-2026'],
    isRead: false,
  },
  {
    id: 'alert-pmu-03',
    date: '2026-11-08',
    docId: 'doc-nd-217-2026',
    code: '217/2026/NĐ-CP',
    title: 'Hướng dẫn Nghị định 217/2026/NĐ-CP: Bắt buộc áp dụng BIM LOD 200 và ngưỡng điều chỉnh giá hợp đồng ±5%',
    category: 'Xây dựng',
    projectStage: 'Thực thi',
    changeType: 'Sửa đổi, bổ sung',
    summary:
      'Sửa đổi, bổ sung một số quy định của Nghị định 15/2021/NĐ-CP về trình thẩm định Báo cáo nghiên cứu khả thi tích hợp mô hình BIM và cơ chế điều chỉnh đơn giá hợp đồng xây lắp.',
    impactedDocIds: ['doc-nd-217-2026', 'doc-nd-15-2023', 'doc-ldt-22-2023'],
    isRead: false,
  },
  {
    id: 'alert-pmu-04',
    date: '2026-11-07',
    docId: 'doc-lpccc-55-2024',
    code: '55/2024/QH15',
    title: 'Đối soát liên ngành Xây dựng – PCCC: Phân tách thẩm quyền thẩm định thoát nạn, bậc chịu lửa và thiết bị PCCC',
    category: 'PCCC',
    projectStage: 'Thực thi',
    changeType: 'Đính chính / Hướng dẫn',
    summary:
      'Điều 18 Luật PCCC & CNCH 55/2024/QH15 giao Cơ quan chuyên môn về xây dựng thẩm định giải pháp thoát nạn, bậc chịu lửa, khoảng cách an toàn; Cơ quan Công an thẩm định hệ thống thiết bị báo cháy, chữa cháy tự động.',
    impactedDocIds: ['doc-lpccc-55-2024', 'doc-lxd-135-2025'],
    isRead: false,
  },
];
