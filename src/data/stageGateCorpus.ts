import {
  AuditPhase,
  ComplianceGate,
  ComplianceGateCode,
  MasterComplianceStep,
  MicroAgentVerdict,
  ProjectStepRecord,
  RiskFlagMetadata,
  StandardizedRiskFlagCode,
} from '../types/compliance';

export const STAGE_GATE_SCALE_STATS = {
  totalPhases: 3,
  totalGates: 17,
  totalDossierGroups: 32,
  totalMasterSteps: 316,
  mandatoryDossiers: 282,
  conditionalDossiers: 81,
  totalRiskFlags: 18,
};

export const AUDIT_PHASES: AuditPhase[] = [
  {
    phase_code: 'PHASE_I',
    name: 'Giai đoạn I · Chuẩn bị dự án',
    short_name: 'PHASE I · Chuẩn bị ĐT',
    order_index: 1,
    summary:
      'Quy hoạch, Chủ trương đầu tư, Thẩm định nguồn vốn, Dự toán chuẩn bị, ĐTM & PCCC, Khảo sát - TKCS & Quyết định đầu tư (G0 → G5)',
    accentColor: '#1E3A8A',
    bgClass: 'bg-blue-50/80 dark:bg-blue-950/30',
    borderClass: 'border-blue-300 dark:border-blue-800',
  },
  {
    phase_code: 'PHASE_II',
    name: 'Giai đoạn II · Thực hiện dự án',
    short_name: 'PHASE II · Thực hiện DA',
    order_index: 2,
    summary:
      'Bố trí vốn, Kế hoạch LCNT, GPMB, Thiết kế BVTC - Dự toán, Đấu thầu, Hợp đồng & Phát sinh, Thi công QA/QC, Nghiệm thu - Thanh toán (G6 → G13)',
    accentColor: '#B45309',
    bgClass: 'bg-amber-50/80 dark:bg-amber-950/30',
    borderClass: 'border-amber-300 dark:border-amber-800',
  },
  {
    phase_code: 'PHASE_III',
    name: 'Giai đoạn III · Kết thúc xây dựng & Quyết toán',
    short_name: 'PHASE III · Kết thúc & QT',
    order_index: 3,
    summary:
      'Nghiệm thu bàn giao đưa vào sử dụng, Kiểm toán độc lập/Nhà nước, Quyết toán vốn đầu tư hoàn thành, Vận hành - Bảo hành - Bảo trì (G14 → G16)',
    accentColor: '#047857',
    bgClass: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-300 dark:border-emerald-800',
  },
];

export const COMPLIANCE_GATES: ComplianceGate[] = [
  {
    gate_code: 'G0',
    phase_code: 'PHASE_I',
    name: 'G0 · Xác định nền quy hoạch & Sự phù hợp',
    icon: 'Compass',
    description:
      'Đối chiếu quy hoạch tỉnh, quy hoạch phân khu 1/2000, quy hoạch chi tiết 1/500 và chỉ giới đường đỏ trước khi lập đề xuất dự án.',
    order_index: 0,
    prerequisite_gates: [],
    total_master_steps: 16,
  },
  {
    gate_code: 'G1',
    phase_code: 'PHASE_I',
    name: 'G1 · Phê duyệt Chủ trương đầu tư',
    icon: 'Landmark',
    description:
      'Lập, thẩm định Báo cáo nghiên cứu tiền khả thi / Báo cáo đề xuất chủ trương đầu tư theo Điều 18 Luật Đầu tư công 58/2024/QH15.',
    order_index: 1,
    prerequisite_gates: ['G0'],
    total_master_steps: 22,
  },
  {
    gate_code: 'G2',
    phase_code: 'PHASE_I',
    name: 'G2 · Thẩm định nguồn vốn & Khả năng cân đối vốn',
    icon: 'Wallet',
    description:
      'Thẩm định nguồn vốn đầu tư công trung hạn và hằng năm theo Điều 36 Luật Đầu tư công 58/2024/QH15; chốt cơ cấu vốn ngân sách.',
    order_index: 2,
    prerequisite_gates: ['G0', 'G1'],
    total_master_steps: 14,
  },
  {
    gate_code: 'G3',
    phase_code: 'PHASE_I',
    name: 'G3 · Dự toán chuẩn bị đầu tư & Thủ tục ĐTM / PCCC',
    icon: 'Flame',
    description:
      'Phê duyệt dự toán nhiệm vụ chuẩn bị đầu tư, thẩm định Báo cáo ĐTM / Giấy phép môi trường và góp ý giải pháp PCCC cơ sở.',
    order_index: 3,
    prerequisite_gates: ['G1', 'G2'],
    total_master_steps: 20,
  },
  {
    gate_code: 'G4',
    phase_code: 'PHASE_I',
    name: 'G4 · Khảo sát xây dựng & Thẩm định BCNCKT (TKCS)',
    icon: 'Ruler',
    description:
      'Nghiệm thu khảo sát địa chất - địa hình, lập mô hình BIM LOD 200 và thẩm định Báo cáo nghiên cứu khả thi tại cơ quan chuyên môn về xây dựng.',
    order_index: 4,
    prerequisite_gates: ['G1', 'G2', 'G3'],
    total_master_steps: 24,
  },
  {
    gate_code: 'G5',
    phase_code: 'PHASE_I',
    name: 'G5 · Quyết định đầu tư dự án',
    icon: 'Stamp',
    description:
      'Ban hành Quyết định phê duyệt dự án đầu tư xây dựng và Tổng mức đầu tư. Gatekeeper khóa cứng nếu G1 hoặc G2 chưa PASSED.',
    order_index: 5,
    prerequisite_gates: ['G1', 'G2', 'G4'],
    total_master_steps: 18,
  },
  {
    gate_code: 'G6',
    phase_code: 'PHASE_II',
    name: 'G6 · Giao kế hoạch vốn đầu tư công trung hạn & hằng năm',
    icon: 'Coins',
    description:
      'Phân bổ và giao kế hoạch vốn đầu tư công sau khi có Quyết định đầu tư (G5); mở mã số dự án tại Kho bạc Nhà nước.',
    order_index: 6,
    prerequisite_gates: ['G1', 'G2', 'G5'],
    total_master_steps: 15,
  },
  {
    gate_code: 'G7',
    phase_code: 'PHASE_II',
    name: 'G7 · Phê duyệt Kế hoạch lựa chọn nhà thầu (KHLCNT) tổng thể',
    icon: 'ClipboardList',
    description:
      'Lập, thẩm định và phê duyệt KHLCNT theo Luật Đấu thầu 22/2023/QH15; phân chia gói thầu, giá gói thầu và hình thức LCNT.',
    order_index: 7,
    prerequisite_gates: ['G5', 'G6'],
    total_master_steps: 19,
  },
  {
    gate_code: 'G8',
    phase_code: 'PHASE_II',
    name: 'G8 · Bồi thường, Hỗ trợ, Tái định cư & Bàn giao GPMB',
    icon: 'MapPin',
    description:
      'Kiểm đếm, phê duyệt phương án BTHT&TĐC, chi trả tiền bồi thường và lập Biên bản bàn giao mặt bằng sạch theo Luật Đất đai 31/2024/QH15.',
    order_index: 8,
    prerequisite_gates: ['G5'],
    total_master_steps: 21,
  },
  {
    gate_code: 'G9',
    phase_code: 'PHASE_II',
    name: 'G9 · Thẩm định, Phê duyệt Thiết kế BVTC & Dự toán xây dựng',
    icon: 'FileSpreadsheet',
    description:
      'Thẩm duyệt thiết kế PCCC, thẩm định và phê duyệt Thiết kế bản vẽ thi công - Dự toán gói thầu, cấp Giấy phép xây dựng (Điều 89 Luật XD 2025).',
    order_index: 9,
    prerequisite_gates: ['G5', 'G8'],
    total_master_steps: 25,
  },
  {
    gate_code: 'G10',
    phase_code: 'PHASE_II',
    name: 'G10 · Tổ chức Đấu thầu qua mạng (E-Bidding) & Phê duyệt KQLCNT',
    icon: 'Gavel',
    description:
      'Phát hành E-HSMT, đánh giá E-HSDT, thương thảo và phê duyệt Kết quả lựa chọn nhà thầu. Gatekeeper khóa cứng nếu G1/G2/G5 chưa PASSED.',
    order_index: 10,
    prerequisite_gates: ['G1', 'G2', 'G5', 'G7', 'G9'],
    total_master_steps: 22,
  },
  {
    gate_code: 'G11',
    phase_code: 'PHASE_II',
    name: 'G11 · Ký kết Hợp đồng, Bảo lãnh & Kiểm soát Phụ lục phát sinh',
    icon: 'FileSignature',
    description:
      'Ký hợp đồng thi công/EPC, nộp bảo lãnh thực hiện hợp đồng & tạm ứng; AuditDeductionAgent kiểm soát chặt khối lượng phát sinh và phụ lục.',
    order_index: 11,
    prerequisite_gates: ['G10'],
    total_master_steps: 20,
  },
  {
    gate_code: 'G12',
    phase_code: 'PHASE_II',
    name: 'G12 · Phát lệnh Khởi công & Quản lý Thi công - QA/QC - ATLD',
    icon: 'HardHat',
    description:
      'Kiểm tra 6 điều kiện khởi công (Điều 14 Luật XD 2025), kiểm soát chứng chỉ xuất xưởng vật liệu (CO/CQ), thí nghiệm đối chứng và nhật ký thi công số.',
    order_index: 12,
    prerequisite_gates: ['G8', 'G9', 'G11'],
    total_master_steps: 26,
  },
  {
    gate_code: 'G13',
    phase_code: 'PHASE_II',
    name: 'G13 · Nghiệm thu khối lượng hoàn thành & Giải ngân thanh toán KBNN',
    icon: 'BadgeCheck',
    description:
      'Nghiệm thu công việc/giai đoạn xây dựng, lập Bảng xác định giá trị khối lượng hoàn thành (Phụ lục 03a/04) và giải ngân tại Kho bạc Nhà nước.',
    order_index: 13,
    prerequisite_gates: ['G11', 'G12'],
    total_master_steps: 18,
  },
  {
    gate_code: 'G14',
    phase_code: 'PHASE_III',
    name: 'G14 · Kiểm tra công tác nghiệm thu hoàn thành & Bàn giao công trình',
    icon: 'Building2',
    description:
      'Văn bản nghiệm thu PCCC, Văn bản chấp thuận kết quả nghiệm thu của Hội đồng/Cơ quan chuyên môn về XD (Điều 123 Luật XD 2025) và bàn giao sử dụng.',
    order_index: 14,
    prerequisite_gates: ['G12', 'G13'],
    total_master_steps: 14,
  },
  {
    gate_code: 'G15',
    phase_code: 'PHASE_III',
    name: 'G15 · Kiểm toán độc lập / KTNN & Phê duyệt Quyết toán vốn hoàn thành',
    icon: 'Scale',
    description:
      'Lập báo cáo quyết toán dự án hoàn thành trong thời hạn luật định (9/6/4 tháng), kiểm toán chi phí đầu tư và phê duyệt quyết toán vốn.',
    order_index: 15,
    prerequisite_gates: ['G13', 'G14'],
    total_master_steps: 12,
  },
  {
    gate_code: 'G16',
    phase_code: 'PHASE_III',
    name: 'G16 · Vận hành khai thác, Bảo hành & Bảo trì công trình',
    icon: 'ShieldCheck',
    description:
      'Thực hiện nghĩa vụ bảo hành (12–24 tháng), tất toán bảo lãnh bảo hành, bàn giao quy trình bảo trì và hồ sơ hoàn công BIM As-Built.',
    order_index: 16,
    prerequisite_gates: ['G14', 'G15'],
    total_master_steps: 10,
  },
];

export const STANDARDIZED_RISK_FLAGS: Record<StandardizedRiskFlagCode, RiskFlagMetadata> = {
  RISK_PLANNING: {
    code: 'RISK_PLANNING',
    index: 1,
    label: 'Sai nền quy hoạch',
    severity: 'CRITICAL',
    description:
      'Dự án không phù hợp với quy hoạch cấp trên, quy hoạch phân khu 1/2000 hoặc quy hoạch chi tiết 1/500 được duyệt.',
    auditConsequence:
      'Đình chỉ lập/thẩm định dự án, không đủ điều kiện quyết định đầu tư (Điều 43 Luật Đầu tư công 2024) và không cấp được GPXD.',
    legalBasisSummary: 'Điều 43 Luật Đầu tư công 58/2024/QH15; Điều 89 Luật Xây dựng 135/2025/QH15',
  },
  RISK_AUTHORITY_CAPITAL: {
    code: 'RISK_AUTHORITY_CAPITAL',
    index: 2,
    label: 'Sai thẩm quyền / Chưa rõ nguồn vốn',
    severity: 'CRITICAL',
    description:
      'Văn bản phê duyệt chủ trương đầu tư hoặc quyết định đầu tư ký không đúng cấp thẩm quyền hoặc chưa xác định rõ cơ cấu nguồn vốn.',
    auditConsequence:
      'Quyết định hành chính bị vô hiệu; Kho bạc Nhà nước từ chối mở mã dự án và kiểm soát chi.',
    legalBasisSummary: 'Điều 18, Điều 36 Luật Đầu tư công 58/2024/QH15',
  },
  RISK_CAPITAL_PLAN: {
    code: 'RISK_CAPITAL_PLAN',
    index: 3,
    label: 'Thiếu kế hoạch vốn',
    severity: 'CRITICAL',
    description:
      'Tổ chức đấu thầu hoặc ký kết hợp đồng khi dự án chưa được giao kế hoạch vốn đầu tư công trung hạn/hằng năm.',
    auditConsequence:
      'Vi phạm hành vi bị nghiêm cấm trong đầu tư công và đấu thầu (nợ đọng xây dựng cơ bản).',
    legalBasisSummary: 'Điều 16 Luật Đầu tư công 58/2024/QH15; Điều 16 Luật Đấu thầu 22/2023/QH15',
  },
  RISK_ENV_PROCEDURE: {
    code: 'RISK_ENV_PROCEDURE',
    index: 4,
    label: 'Thiếu thủ tục môi trường (ĐTM/GPMT)',
    severity: 'HIGH',
    description:
      'Chưa có Quyết định phê duyệt kết quả thẩm định báo cáo ĐTM hoặc Giấy phép môi trường trước khi phê duyệt dự án / vận hành thử nghiệm.',
    auditConsequence:
      'Cơ quan chuyên môn về xây dựng dừng thẩm định BCNCKT; xử phạt hành chính về bảo vệ môi trường.',
    legalBasisSummary: 'Luật Bảo vệ môi trường 2020; Nghị định 15/2021/NĐ-CP',
  },
  RISK_FIRE_SAFETY: {
    code: 'RISK_FIRE_SAFETY',
    index: 5,
    label: 'Thiếu thẩm định / Nghiệm thu PCCC',
    severity: 'CRITICAL',
    description:
      'Thi công khi chưa có Giấy chứng nhận thẩm duyệt thiết kế PCCC hoặc đưa công trình vào sử dụng khi chưa có Văn bản chấp thuận nghiệm thu PCCC.',
    auditConsequence:
      'Đình chỉ thi công/hoạt động bắt buộc; không thể nghiệm thu hoàn thành công trình (Điều 123 Luật Xây dựng 2025).',
    legalBasisSummary: 'Điều 15 Luật PCCC 2024; Điều 89, Điều 123 Luật Xây dựng 135/2025/QH15',
  },
  RISK_SURVEY_BASE: {
    code: 'RISK_SURVEY_BASE',
    index: 6,
    label: 'Khảo sát thiếu cơ sở',
    severity: 'HIGH',
    description:
      'Nhiệm vụ khảo sát, phương án kỹ thuật khảo sát địa chất/địa hình không được phê duyệt hoặc biên bản nghiệm thu khảo sát thiếu chữ ký chủ nhiệm.',
    auditConsequence:
      'Sai lệch phương án móng công trình, phát sinh điều chỉnh thiết kế lớn dẫn đến vượt tổng mức đầu tư.',
    legalBasisSummary: 'Nghị định 15/2021/NĐ-CP về quản lý dự án đầu tư xây dựng',
  },
  RISK_DESIGN_ESTIMATE_ADJUST: {
    code: 'RISK_DESIGN_ESTIMATE_ADJUST',
    index: 7,
    label: 'Thiết kế / Dự toán phải điều chỉnh',
    severity: 'HIGH',
    description:
      'Thay đổi giải pháp thiết kế bản vẽ thi công hoặc tổng dự toán vượt tổng mức đầu tư đã duyệt nhưng chưa trình thẩm định lại.',
    auditConsequence:
      'Xuất toán toàn bộ phần chi phí chênh lệch do điều chỉnh thiết kế không đúng quy trình thẩm định.',
    legalBasisSummary: 'Điều 46 Luật Đầu tư công 58/2024/QH15; Nghị định 10/2021/NĐ-CP',
  },
  RISK_VOLUME_UNIT_PRICE: {
    code: 'RISK_VOLUME_UNIT_PRICE',
    index: 8,
    label: 'Sai khối lượng / Đơn giá',
    severity: 'HIGH',
    description:
      'Bóc tách tiên lượng mời thầu sai lệch so với bản vẽ thi công hoặc áp dụng sai định mức, đơn giá vật liệu/nhân công địa phương.',
    auditConsequence:
      'Kiểm toán Nhà nước / Thanh tra giảm trừ trực tiếp giá trị dự toán và giá trị quyết toán gói thầu.',
    legalBasisSummary: 'Nghị định 10/2021/NĐ-CP về quản lý chi phí đầu tư xây dựng',
  },
  RISK_BIDDING_PROCEDURE: {
    code: 'RISK_BIDDING_PROCEDURE',
    index: 9,
    label: 'Sai quy trình lựa chọn nhà thầu',
    severity: 'CRITICAL',
    description:
      'Cài cắm tiêu chí hạn chế nhà thầu trong E-HSMT, chia nhỏ gói thầu trái luật hoặc phê duyệt KQLCNT khi chưa đủ điều kiện.',
    auditConsequence:
      'Hủy thầu, không công nhận kết quả lựa chọn nhà thầu và xử lý trách nhiệm cá nhân người có thẩm quyền (Điều 16 Luật Đấu thầu 2023).',
    legalBasisSummary: 'Điều 16, Điều 43 Luật Đấu thầu 22/2023/QH15',
  },
  RISK_CONTRACT_OVERRUN: {
    code: 'RISK_CONTRACT_OVERRUN',
    index: 10,
    label: 'Phát sinh vượt phạm vi hợp đồng',
    severity: 'CRITICAL',
    description:
      'Khối lượng thực tế phát sinh ngoài phạm vi hợp đồng hoặc vượt giá gói thầu được duyệt trong KHLCNT mà chưa có quyết định của Người quyết định đầu tư.',
    auditConsequence:
      'Kho bạc Nhà nước từ chối thanh toán; Kiểm toán xuất toán phần giá trị vượt hợp đồng.',
    legalBasisSummary: 'Nghị định 37/2015/NĐ-CP (sửa đổi bởi NĐ 50/2021/NĐ-CP); Luật Đấu thầu 2023',
  },
  RISK_NO_CONTRACT_ADDENDUM: {
    code: 'RISK_NO_CONTRACT_ADDENDUM',
    index: 11,
    label: 'Phát sinh khối lượng không có phụ lục',
    severity: 'CRITICAL',
    description:
      'Nhà thầu thi công hạng mục phát sinh hoặc điều chỉnh đơn giá nhưng chưa ký Phụ lục hợp đồng hợp lệ trước khi nghiệm thu thanh toán.',
    auditConsequence:
      'AuditDeductionAgent khóa hồ sơ thanh toán; không có cơ sở pháp lý để nghiệm thu và quyết toán.',
    legalBasisSummary: 'Nghị định 37/2015/NĐ-CP về hợp đồng xây dựng',
  },
  RISK_SAFETY_QUALITY_PROGRESS: {
    code: 'RISK_SAFETY_QUALITY_PROGRESS',
    index: 12,
    label: 'Rủi ro an toàn / Chất lượng / Tiến độ',
    severity: 'HIGH',
    description:
      'Thiếu biện pháp thi công đảm bảo an toàn lao động, vi phạm quy chuẩn kỹ thuật QCVN hoặc chậm tiến độ đường găng dự án.',
    auditConsequence:
      'Tạm dừng thi công công trình; phạt vi phạm tiến độ hợp đồng và truy cứu trách nhiệm chất lượng.',
    legalBasisSummary: 'Điều 14 Luật Xây dựng 135/2025/QH15; Nghị định 06/2021/NĐ-CP',
  },
  RISK_MATERIAL_CERT: {
    code: 'RISK_MATERIAL_CERT',
    index: 13,
    label: 'Vật liệu thiếu chứng chỉ',
    severity: 'HIGH',
    description:
      'Vật tư, thiết bị đưa vào công trình thiếu chứng chỉ xuất xưởng (CO/CQ), chứng nhận hợp quy hoặc chưa có kết quả thí nghiệm kiểm định độc lập.',
    auditConsequence:
      'Không được phép nghiệm thu công việc xây dựng; buộc tháo dỡ/đưa vật liệu không đạt chuẩn ra khỏi công trường.',
    legalBasisSummary: 'Nghị định 06/2021/NĐ-CP về quản lý chất lượng công trình xây dựng',
  },
  RISK_ACCEPTANCE_BASE: {
    code: 'RISK_ACCEPTANCE_BASE',
    index: 14,
    label: 'Nghiệm thu thiếu căn cứ',
    severity: 'CRITICAL',
    description:
      'Biên bản nghiệm thu công việc/hạng mục thiếu bản vẽ hoàn công, phiếu kết quả thí nghiệm hoặc chưa có văn bản chấp thuận nghiệm thu của cơ quan chuyên môn.',
    auditConsequence:
      'Hồ sơ nghiệm thu vô hiệu; xuất toán toàn bộ khối lượng nghiệm thu khống hoặc thiếu căn cứ.',
    legalBasisSummary: 'Điều 123 Luật Xây dựng 135/2025/QH15; Nghị định 06/2021/NĐ-CP',
  },
  RISK_PAYMENT_DOCS: {
    code: 'RISK_PAYMENT_DOCS',
    index: 15,
    label: 'Thanh toán thiếu hồ sơ',
    severity: 'HIGH',
    description:
      'Hồ sơ đề nghị thanh toán vốn đầu tư tại KBNN thiếu bảo lãnh tạm ứng, bảng xác định giá trị khối lượng hoàn thành (Phụ lục 03a) hoặc hóa đơn hợp lệ.',
    auditConsequence:
      'Kho bạc Nhà nước trả hồ sơ giải ngân; ảnh hưởng tỷ lệ giải ngân vốn đầu tư công của Chủ đầu tư.',
    legalBasisSummary: 'Nghị định 99/2021/NĐ-CP về quản lý, thanh toán, quyết toán dự án vốn ĐTC',
  },
  RISK_SITE_HANDOVER_DELAY: {
    code: 'RISK_SITE_HANDOVER_DELAY',
    index: 16,
    label: 'Trễ hạn bàn giao mặt bằng',
    severity: 'HIGH',
    description:
      'Chậm phê duyệt phương án bồi thường GPMB hoặc bàn giao mặt bằng "xôi đỗ" không đúng tiến độ cam kết trong hợp đồng thi công.',
    auditConsequence:
      'Phải gia hạn thời gian thực hiện dự án; phát sinh khiếu nại đền bù chi phí chờ đợi máy móc nhân công của nhà thầu.',
    legalBasisSummary: 'Điều 14 Luật Xây dựng 135/2025/QH15; Luật Đất đai 31/2024/QH15',
  },
  RISK_SETTLEMENT_DOCS: {
    code: 'RISK_SETTLEMENT_DOCS',
    index: 17,
    label: 'Thiếu hồ sơ quyết toán',
    severity: 'CRITICAL',
    description:
      'Nộp hồ sơ quyết toán vốn đầu tư dự án hoàn thành quá thời hạn quy định (9 tháng nhóm A / 6 tháng nhóm B / 4 tháng nhóm C) hoặc thiếu báo cáo kiểm toán.',
    auditConsequence:
      'Xử phạt vi phạm hành chính về chậm quyết toán; đưa Chủ đầu tư vào danh sách công khai vi phạm kỷ luật vốn ĐTC.',
    legalBasisSummary: 'Điều 47 Nghị định 99/2021/NĐ-CP; Luật Đầu tư công 58/2024/QH15',
  },
  RISK_MISSING_DOCS_ORDER: {
    code: 'RISK_MISSING_DOCS_ORDER',
    index: 18,
    label: 'Thiếu thành phần hồ sơ hoặc sai trình tự',
    severity: 'MEDIUM',
    description:
      'Trình tự ngày tháng giữa các biên bản/tờ trình bị đảo ngược (ký nghiệm thu trước khi phê duyệt thiết kế) hoặc thiếu biểu mẫu số bắt buộc.',
    auditConsequence:
      'Cơ quan thanh tra/kiểm toán kết luận hợp thức hóa hồ sơ hồi tố trái quy định pháp luật.',
    legalBasisSummary: 'Nghị định 15/2021/NĐ-CP; Nghị định 06/2021/NĐ-CP',
  },
};

export const DOSSIER_GROUPS_32: string[] = [
  '01. Hồ sơ Quy hoạch & Chỉ giới đường đỏ',
  '02. Hồ sơ Đề xuất Chủ trương đầu tư / BCNC Tiền khả thi',
  '03. Hồ sơ Thẩm định nguồn vốn & Cân đối vốn',
  '04. Hồ sơ Nhiệm vụ & Dự toán chuẩn bị đầu tư',
  '05. Hồ sơ Đánh giá tác động môi trường (ĐTM / GPMT)',
  '06. Hồ sơ Góp ý & Thẩm duyệt PCCC',
  '07. Hồ sơ Khảo sát địa chất, địa hình & Hiện trạng',
  '08. Hồ sơ Lập & Thẩm định BCNCKT (Thiết kế cơ sở & BIM LOD 200)',
  '09. Hồ sơ Phê duyệt Dự án & Quyết định đầu tư',
  '10. Hồ sơ Giao kế hoạch vốn ĐTC trung hạn & hằng năm',
  '11. Hồ sơ Kế hoạch lựa chọn nhà thầu (KHLCNT)',
  '12. Hồ sơ Đo đạc, Kiểm đếm & Phương án Bồi thường GPMB',
  '13. Hồ sơ Bàn giao mặt bằng sạch & Rà phá bom mìn',
  '14. Hồ sơ Thiết kế bản vẽ thi công (BVTC) & Mô hình BIM LOD 300',
  '15. Hồ sơ Thẩm định & Phê duyệt Dự toán xây dựng công trình',
  '16. Hồ sơ Cấp Giấy phép xây dựng & Thỏa thuận đấu nối hạ tầng',
  '17. Hồ sơ Mời thầu điện tử (E-HSMT) & Tổ chuyên gia đấu thầu',
  '18. Hồ sơ Đánh giá E-HSDT, Thương thảo & Phê duyệt KQLCNT',
  '19. Hồ sơ Hợp đồng xây dựng / EPC & Bảo lãnh thực hiện HĐ',
  '20. Hồ sơ Điều chỉnh Hợp đồng, Phát sinh khối lượng & Phụ lục HĐ',
  '21. Hồ sơ Kiểm tra 6 điều kiện Khởi công & Thông báo khởi công',
  '22. Hồ sơ Hệ thống Quản lý chất lượng, Biện pháp thi công & ATLD',
  '23. Hồ sơ Chứng chỉ vật liệu (CO/CQ) & Thí nghiệm kiểm định đầu vào',
  '24. Hồ sơ Nhật ký thi công điện tử & Biên bản nghiệm thu công việc',
  '25. Hồ sơ Nghiệm thu giai đoạn / Bộ phận công trình xây dựng',
  '26. Hồ sơ Tạm ứng, Thanh toán khối lượng hoàn thành (Phụ lục 03a/04)',
  '27. Hồ sơ Bản vẽ hoàn công & Mô hình số BIM As-Built (LOD 400)',
  '28. Hồ sơ Nghiệm thu PCCC & Kiểm tra công tác nghiệm thu Nhà nước',
  '29. Hồ sơ Nghiệm thu hoàn thành bàn giao đưa công trình vào sử dụng',
  '30. Hồ sơ Kiểm toán độc lập / Kiểm toán Nhà nước báo cáo quyết toán',
  '31. Hồ sơ Thẩm tra & Phê duyệt Quyết toán vốn đầu tư dự án hoàn thành',
  '32. Hồ sơ Bảo hành, Tất toán bảo lãnh & Quy trình bảo trì công trình',
];

export const MASTER_COMPLIANCE_STEPS: MasterComplianceStep[] = [
  // ======================== PHASE I (G0 -> G5) ========================
  {
    step_code: 'I.0.1',
    gate_code: 'G0',
    phase_code: 'PHASE_I',
    dossier_group: '01. Hồ sơ Quy hoạch & Chỉ giới đường đỏ',
    step_name:
      'Trích lục bản đồ quy hoạch phân khu 1/2000, quy hoạch chi tiết 1/500 và văn bản cung cấp thông tin quy hoạch kiến trúc',
    is_mandatory: true,
    governing_body: 'Ban QLDA / Cơ quan chuẩn bị dự án',
    inspection_body: 'Sở Quy hoạch - Kiến trúc / Sở Xây dựng',
    deliverables: ['Hồ sơ số', 'GIS', 'Quyết định'],
    risk_flags: ['RISK_PLANNING', 'RISK_MISSING_DOCS_ORDER'],
    legal_references: [
      {
        law: 'Luật Đầu tư công 2024',
        docNumber: '58/2024/QH15',
        article: 'Điều 43',
        excerpt:
          'Căn cứ lập, thẩm định, quyết định đầu tư dự án phải phù hợp với quy hoạch có liên quan đã được cấp có thẩm quyền quyết định hoặc phê duyệt.',
        docId: 'doc-ldtc-58-2024',
        articleId: 'art-ldtc-d43',
      },
      {
        law: 'Luật Xây dựng sửa đổi 2025',
        docNumber: '135/2025/QH15',
        article: 'Điều 89',
        excerpt:
          'Phù hợp với quy hoạch phân khu, quy hoạch chi tiết xây dựng tỉ lệ 1/500 đã được cơ quan nhà nước có thẩm quyền phê duyệt.',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d89',
      },
    ],
    digital_checklist_template: [
      'Quyết định phê duyệt Quy hoạch phân khu 1/2000 hoặc Quy hoạch chi tiết 1/500 còn hiệu lực',
      'Bản vẽ chỉ giới đường đỏ và chỉ giới xây dựng tỷ lệ 1/500 có tọa độ VN-2000 (GIS)',
      'Biên bản đối chiếu sự phù hợp mục đích sử dụng đất theo Luật Đất đai 31/2024/QH15',
    ],
  },
  {
    step_code: 'I.1.1',
    gate_code: 'G1',
    phase_code: 'PHASE_I',
    dossier_group: '02. Hồ sơ Đề xuất Chủ trương đầu tư / BCNC Tiền khả thi',
    step_name:
      'Lập, trình thẩm định và ban hành Nghị quyết / Quyết định phê duyệt Chủ trương đầu tư dự án đầu tư công',
    is_mandatory: true,
    governing_body: 'Chủ đầu tư / Cơ quan được giao chuẩn bị dự án',
    inspection_body: 'Hội đồng thẩm định / HĐND cấp tỉnh / Thủ tướng Chính phủ',
    deliverables: ['Tờ trình', 'Báo cáo thẩm định', 'Quyết định', 'Hồ sơ số'],
    risk_flags: ['RISK_AUTHORITY_CAPITAL', 'RISK_PLANNING'],
    legal_references: [
      {
        law: 'Luật Đầu tư công 2024',
        docNumber: '58/2024/QH15',
        article: 'Điều 18',
        excerpt:
          'Phân định rõ thẩm quyền quyết định chủ trương đầu tư của Quốc hội, Thủ tướng Chính phủ, Bộ trưởng và HĐND/UBND các cấp.',
        docId: 'doc-ldtc-58-2024',
        articleId: 'art-ldtc-d18',
      },
    ],
    digital_checklist_template: [
      'Tờ trình đề nghị thẩm định Báo cáo đề xuất chủ trương đầu tư / BCNC tiền khả thi',
      'Báo cáo kết quả thẩm định của Hội đồng thẩm định hoặc Sở Kế hoạch & Đầu tư',
      'Nghị quyết / Quyết định phê duyệt chủ trương đầu tư đúng cấp thẩm quyền tại Điều 18 Luật ĐTC 2024',
    ],
  },
  {
    step_code: 'I.2.1',
    gate_code: 'G2',
    phase_code: 'PHASE_I',
    dossier_group: '03. Hồ sơ Thẩm định nguồn vốn & Cân đối vốn',
    step_name:
      'Thẩm định nguồn vốn và khả năng cân đối vốn đầu tư công trung hạn và hằng năm cho dự án',
    is_mandatory: true,
    governing_body: 'Cơ quan chủ quản / Ban QLDA',
    inspection_body: 'Sở Kế hoạch & Đầu tư / Sở Tài chính / Bộ KH&ĐT',
    deliverables: ['Báo cáo thẩm định', 'Hồ sơ số'],
    risk_flags: ['RISK_AUTHORITY_CAPITAL', 'RISK_CAPITAL_PLAN'],
    legal_references: [
      {
        law: 'Luật Đầu tư công 2024',
        docNumber: '58/2024/QH15',
        article: 'Điều 36',
        excerpt:
          'Không được trình cấp có thẩm quyền quyết định chủ trương đầu tư hoặc quyết định đầu tư dự án khi chưa có báo cáo thẩm định nguồn vốn và khả năng cân đối vốn.',
        docId: 'doc-ldtc-58-2024',
        articleId: 'art-ldtc-d36',
      },
    ],
    digital_checklist_template: [
      'Văn bản đề nghị thẩm định nguồn vốn và khả năng cân đối vốn kèm thuyết minh phân kỳ đầu tư',
      'Báo cáo thẩm định nguồn vốn xác nhận dự án nằm trong hạn mức kế hoạch đầu tư công trung hạn',
      'Bảng đối chiếu tổng mức đầu tư sơ bộ với hạn mức vốn ngân sách được thông báo',
    ],
  },
  {
    step_code: 'I.3.1',
    gate_code: 'G3',
    phase_code: 'PHASE_I',
    dossier_group: '05. Hồ sơ Đánh giá tác động môi trường (ĐTM / GPMT)',
    step_name:
      'Thẩm định, phê duyệt kết quả Báo cáo đánh giá tác động môi trường (ĐTM) và văn bản góp ý giải pháp PCCC thiết kế cơ sở',
    is_mandatory: false,
    governing_body: 'Chủ đầu tư / Tư vấn môi trường & PCCC',
    inspection_body: 'Bộ TN&MT / UBND cấp tỉnh / Cục Cảnh sát PCCC & CNCH',
    deliverables: ['Quyết định', 'Báo cáo thẩm định', 'Hồ sơ số'],
    risk_flags: ['RISK_ENV_PROCEDURE', 'RISK_FIRE_SAFETY'],
    legal_references: [
      {
        law: 'Luật PCCC và CNCH 2024',
        docNumber: '55/2024/QH15',
        article: 'Điều 18',
        excerpt:
          'Dự án, công trình thuộc danh mục phải thẩm định thiết kế về PCCC phải được thẩm định giải pháp PCCC đối với thiết kế cơ sở và thiết kế triển khai sau thiết kế cơ sở.',
        docId: 'doc-lpccc-55-2024',
        articleId: 'art-lpccc-d18',
      },
    ],
    digital_checklist_template: [
      'Quyết định phê duyệt kết quả thẩm định Báo cáo ĐTM hoặc Giấy phép môi trường',
      'Văn bản góp ý về giải pháp phòng cháy và chữa cháy đối với hồ sơ thiết kế cơ sở',
      'Biên bản tham vấn cộng đồng dân cư chịu tác động trực tiếp bởi dự án',
    ],
  },
  {
    step_code: 'I.4.1',
    gate_code: 'G4',
    phase_code: 'PHASE_I',
    dossier_group: '08. Hồ sơ Lập & Thẩm định BCNCKT (Thiết kế cơ sở & BIM LOD 200)',
    step_name:
      'Thẩm định Báo cáo nghiên cứu khả thi (Thiết kế cơ sở) và kiểm tra mô hình thông tin công trình BIM LOD 200 bắt buộc',
    is_mandatory: true,
    governing_body: 'Ban QLDA / Nhà thầu Tư vấn thiết kế',
    inspection_body: 'Cơ quan chuyên môn về xây dựng (Bộ XD / Sở XD)',
    deliverables: ['Báo cáo thẩm định', 'BIM/CDE', 'Hồ sơ số'],
    risk_flags: ['RISK_SURVEY_BASE', 'RISK_DESIGN_ESTIMATE_ADJUST', 'RISK_FIRE_SAFETY'],
    legal_references: [
      {
        law: 'Nghị định 15/2021/NĐ-CP',
        docNumber: '15/2021/NĐ-CP',
        article: 'Điều 12',
        excerpt:
          'Hồ sơ trình thẩm định Báo cáo nghiên cứu khả thi đầu tư xây dựng bao gồm thuyết minh, thiết kế cơ sở, kết quả khảo sát và các văn bản pháp lý liên quan.',
        docId: 'doc-nd-15-2023',
        articleId: 'art-nd15-d12',
      },
      {
        law: 'Nghị định 217/2026/NĐ-CP',
        docNumber: '217/2026/NĐ-CP',
        article: 'Điều 18',
        excerpt:
          'Áp dụng bắt buộc mô hình thông tin công trình (BIM) tối thiểu đạt mức độ phát triển thông tin LOD 200 trong giai đoạn chuẩn bị dự án đối với công trình từ cấp I, cấp đặc biệt.',
        docId: 'doc-nd-217-2026',
        articleId: 'art-nd217-d18',
      },
    ],
    digital_checklist_template: [
      'Biên bản nghiệm thu kết quả khảo sát địa chất, địa hình xây dựng công trình',
      'Mô hình số BIM đạt chuẩn LOD 200 định dạng mở .IFC đã kiểm tra xung đột trên môi trường CDE',
      'Thông báo kết quả thẩm định Báo cáo nghiên cứu khả thi của Cơ quan chuyên môn về xây dựng',
    ],
  },
  {
    step_code: 'I.5.1',
    gate_code: 'G5',
    phase_code: 'PHASE_I',
    dossier_group: '09. Hồ sơ Phê duyệt Dự án & Quyết định đầu tư',
    step_name:
      'Phê duyệt Dự án đầu tư xây dựng và Tổng mức đầu tư (Quyết định đầu tư dự án)',
    is_mandatory: true,
    governing_body: 'Cơ quan chủ trì thẩm định / Chủ đầu tư',
    inspection_body: 'Người quyết định đầu tư (Bộ trưởng / Chủ tịch UBND các cấp)',
    deliverables: ['Quyết định', 'Tờ trình', 'Hồ sơ số'],
    risk_flags: ['RISK_AUTHORITY_CAPITAL', 'RISK_DESIGN_ESTIMATE_ADJUST'],
    legal_references: [
      {
        law: 'Luật Đầu tư công 2024',
        docNumber: '58/2024/QH15',
        article: 'Điều 43',
        excerpt:
          'Quyết định đầu tư dự án chỉ được ban hành sau khi đã có Quyết định chủ trương đầu tư (G1), Thẩm định nguồn vốn (G2) và Kết quả thẩm định BCNCKT (G4).',
        docId: 'doc-ldtc-58-2024',
        articleId: 'art-ldtc-d43',
      },
    ],
    digital_checklist_template: [
      'Kiểm tra Gatekeeper: Gate G1 (Chủ trương ĐT) và Gate G2 (Thẩm định vốn) bắt buộc đã đạt PASSED',
      'Đối chiếu Tổng mức đầu tư phê duyệt tại G5 không vượt Tổng mức đầu tư sơ bộ tại G1',
      'Quyết định phê duyệt dự án đầu tư xây dựng ký đúng thẩm quyền của Người quyết định đầu tư',
    ],
  },

  // ======================== PHASE II (G6 -> G13) ========================
  {
    step_code: 'II.6.1',
    gate_code: 'G6',
    phase_code: 'PHASE_II',
    dossier_group: '10. Hồ sơ Giao kế hoạch vốn ĐTC trung hạn & hằng năm',
    step_name:
      'Quyết định giao kế hoạch vốn đầu tư công hằng năm và đăng ký mã số đơn vị quan hệ ngân sách tại Kho bạc Nhà nước',
    is_mandatory: true,
    governing_body: 'Cơ quan tài chính / Kế hoạch và Đầu tư',
    inspection_body: 'UBND cấp tỉnh / Bộ chủ quản & Kho bạc Nhà nước',
    deliverables: ['Quyết định', 'Hồ sơ số'],
    risk_flags: ['RISK_CAPITAL_PLAN', 'RISK_PAYMENT_DOCS'],
    legal_references: [
      {
        law: 'Luật Đầu tư công 2024',
        docNumber: '58/2024/QH15',
        article: 'Điều 36',
        excerpt:
          'Dự án chỉ được bố trí vốn kế hoạch hằng năm sau khi đã có Quyết định đầu tư được cấp có thẩm quyền phê duyệt theo đúng quy định.',
        docId: 'doc-ldtc-58-2024',
        articleId: 'art-ldtc-d36',
      },
    ],
    digital_checklist_template: [
      'Quyết định giao chi tiết kế hoạch vốn đầu tư công năm ngân sách hiện hành',
      'Giấy chứng nhận mã số dự án đầu tư và cam kết chi tại Kho bạc Nhà nước',
    ],
  },
  {
    step_code: 'II.7.1',
    gate_code: 'G7',
    phase_code: 'PHASE_II',
    dossier_group: '11. Hồ sơ Kế hoạch lựa chọn nhà thầu (KHLCNT)',
    step_name:
      'Lập, thẩm định và phê duyệt Kế hoạch lựa chọn nhà thầu (KHLCNT) tổng thể và đăng tải trên Hệ thống mạng đấu thầu quốc gia',
    is_mandatory: true,
    governing_body: 'Chủ đầu tư / Ban QLDA',
    inspection_body: 'Người có thẩm quyền (Sở KH&ĐT thẩm định)',
    deliverables: ['Tờ trình', 'Báo cáo thẩm định', 'Quyết định'],
    risk_flags: ['RISK_BIDDING_PROCEDURE', 'RISK_CAPITAL_PLAN'],
    legal_references: [
      {
        law: 'Luật Đấu thầu 2023',
        docNumber: '22/2023/QH15',
        article: 'Điều 12',
        excerpt:
          'Phê duyệt kế hoạch lựa chọn nhà thầu phải căn cứ vào quyết định phê duyệt dự án và văn bản giao kế hoạch vốn đầu tư công.',
        docId: 'doc-ldt-22-2023',
        articleId: 'art-ldt-d12',
      },
    ],
    digital_checklist_template: [
      'Báo cáo thẩm định Kế hoạch lựa chọn nhà thầu của đơn vị thẩm định độc lập',
      'Quyết định phê duyệt KHLCNT ghi rõ tên gói thầu, giá gói thầu, hình thức & phương thức LCNT',
      'Xác nhận đăng tải KHLCNT trên Hệ thống mạng đấu thầu quốc gia trong thời hạn 05 ngày làm việc',
    ],
  },
  {
    step_code: 'II.8.1',
    gate_code: 'G8',
    phase_code: 'PHASE_II',
    dossier_group: '13. Hồ sơ Bàn giao mặt bằng sạch & Rà phá bom mìn',
    step_name:
      'Phê duyệt phương án bồi thường, hỗ trợ, tái định cư và lập Biên bản bàn giao mặt bằng sạch trên thực địa',
    is_mandatory: true,
    governing_body: 'Hội đồng BTHT&TĐC / Trung tâm Phát triển quỹ đất',
    inspection_body: 'UBND cấp tỉnh / cấp huyện & Chủ đầu tư',
    deliverables: ['Quyết định', 'GIS', 'Biên bản nghiệm thu'],
    risk_flags: ['RISK_SITE_HANDOVER_DELAY', 'RISK_PLANNING'],
    legal_references: [
      {
        law: 'Luật Đất đai 2024',
        docNumber: '31/2024/QH15',
        article: 'Điều 45',
        excerpt:
          'Chủ đầu tư chỉ được nhận bàn giao đất trên thực địa và khởi công khi đã có Quyết định giao đất, cho thuê đất và hoàn thành phương án bồi thường, hỗ trợ, tái định cư.',
        docId: 'doc-ldd-31-2024',
        articleId: 'art-ldd-d45',
      },
      {
        law: 'Luật Xây dựng sửa đổi 2025',
        docNumber: '135/2025/QH15',
        article: 'Điều 14',
        excerpt:
          'Có mặt bằng xây dựng để bàn giao toàn bộ hoặc từng phần theo tiến độ xây dựng do Chủ đầu tư và Nhà thầu thỏa thuận.',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d14',
      },
    ],
    digital_checklist_template: [
      'Quyết định phê duyệt phương án bồi thường, hỗ trợ, tái định cư và chứng từ chi trả tiền bồi thường',
      'Biên bản bàn giao mặt bằng sạch trên thực địa kèm bình đồ ranh giới tọa độ số (GIS)',
      'Biên bản nghiệm thu hoàn thành công tác rà phá bom mìn, vật nổ trước khi thi công',
    ],
  },
  {
    step_code: 'II.9.1',
    gate_code: 'G9',
    phase_code: 'PHASE_II',
    dossier_group: '14. Hồ sơ Thiết kế bản vẽ thi công (BVTC) & Mô hình BIM LOD 300',
    step_name:
      'Thẩm duyệt PCCC, thẩm định và phê duyệt Thiết kế bản vẽ thi công - Dự toán xây dựng và cấp Giấy phép xây dựng',
    is_mandatory: true,
    governing_body: 'Chủ đầu tư / Ban QLDA',
    inspection_body: 'Cơ quan chuyên môn về XD & Phòng Cảnh sát PCCC',
    deliverables: ['Quyết định', 'BIM/CDE', 'Báo cáo thẩm định'],
    risk_flags: ['RISK_FIRE_SAFETY', 'RISK_VOLUME_UNIT_PRICE', 'RISK_DESIGN_ESTIMATE_ADJUST'],
    legal_references: [
      {
        law: 'Luật Xây dựng sửa đổi 2025',
        docNumber: '135/2025/QH15',
        article: 'Điều 89',
        excerpt:
          'Đã có văn bản thẩm định thiết kế về PCCC và thiết kế xây dựng triển khai sau thiết kế cơ sở đã được cơ quan chuyên môn thẩm định, chủ đầu tư phê duyệt.',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d89',
      },
    ],
    digital_checklist_template: [
      'Giấy chứng nhận thẩm duyệt thiết kế về phòng cháy và chữa cháy (PCCC)',
      'Báo cáo kết quả thẩm tra và Quyết định phê duyệt Thiết kế bản vẽ thi công - Dự toán gói thầu',
      'Giấy phép xây dựng công trình được cấp bởi Sở Xây dựng / UBND có thẩm quyền',
    ],
  },
  {
    step_code: 'II.10.1',
    gate_code: 'G10',
    phase_code: 'PHASE_II',
    dossier_group: '18. Hồ sơ Đánh giá E-HSDT, Thương thảo & Phê duyệt KQLCNT',
    step_name:
      'Tổ chức lựa chọn nhà thầu qua mạng (E-Bidding), đánh giá E-HSDT và phê duyệt Kết quả lựa chọn nhà thầu (KQLCNT)',
    is_mandatory: true,
    governing_body: 'Bên mời thầu / Tổ chuyên gia đấu thầu',
    inspection_body: 'Chủ đầu tư (Đơn vị thẩm định đấu thầu kiểm tra)',
    deliverables: ['Báo cáo thẩm định', 'Quyết định', 'Hồ sơ số'],
    risk_flags: ['RISK_BIDDING_PROCEDURE', 'RISK_AUTHORITY_CAPITAL'],
    legal_references: [
      {
        law: 'Luật Đấu thầu 2023',
        docNumber: '22/2023/QH15',
        article: 'Điều 12',
        excerpt:
          'Nghiêm cấm chia nhỏ dự án thành các gói thầu trái quy định nhằm mục đích chỉ định thầu hoặc hạn chế sự tham gia của các nhà thầu.',
        docId: 'doc-ldt-22-2023',
        articleId: 'art-ldt-d12',
      },
    ],
    digital_checklist_template: [
      'Kiểm tra Gatekeeper: Bắt buộc G1, G2, G5, G7, G9 đã PASSED trước khi mở trạng thái PASSED cho G10',
      'Báo cáo đánh giá E-HSDT của Tổ chuyên gia và Biên bản thương thảo hợp đồng trên Hệ thống mạng ĐTQG',
      'Báo cáo thẩm định và Quyết định phê duyệt Kết quả lựa chọn nhà thầu của Chủ đầu tư',
    ],
  },
  {
    step_code: 'II.11.1',
    gate_code: 'G11',
    phase_code: 'PHASE_II',
    dossier_group: '20. Hồ sơ Điều chỉnh Hợp đồng, Phát sinh khối lượng & Phụ lục HĐ',
    step_name:
      'Ký kết Hợp đồng thi công / EPC, kiểm tra Bảo lãnh thực hiện hợp đồng và rà soát Phụ lục điều chỉnh khối lượng phát sinh',
    is_mandatory: true,
    governing_body: 'Ban QLDA & Nhà thầu trúng thầu',
    inspection_body: 'Chủ đầu tư / Người quyết định đầu tư (nếu vượt giá gói thầu)',
    deliverables: ['Hồ sơ số', 'Phụ lục hợp đồng', 'Quyết định'],
    risk_flags: ['RISK_CONTRACT_OVERRUN', 'RISK_NO_CONTRACT_ADDENDUM', 'RISK_VOLUME_UNIT_PRICE'],
    legal_references: [
      {
        law: 'Luật Xây dựng sửa đổi 2025',
        docNumber: '135/2025/QH15',
        article: 'Điều 14',
        excerpt:
          'Chủ đầu tư đã ký kết hợp đồng thi công xây dựng với nhà thầu được lựa chọn theo quy định của Luật Đấu thầu và bố trí đủ vốn theo tiến độ.',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d14',
      },
    ],
    digital_checklist_template: [
      'Hợp đồng thi công xây dựng / EPC kèm Bảo lãnh thực hiện hợp đồng và Bảo lãnh tiền tạm ứng ngân hàng',
      'Kiểm toán AuditDeductionAgent: Mọi khối lượng phát sinh ngoài phạm vi hợp đồng bắt buộc phải có Văn bản chấp thuận chủ trương của Người quyết định đầu tư',
      'Phụ lục hợp đồng ký kết hợp lệ kèm dự toán phát sinh đã thẩm tra trước khi thi công hạng mục phát sinh',
    ],
  },
  {
    step_code: 'II.12.1',
    gate_code: 'G12',
    phase_code: 'PHASE_II',
    dossier_group: '23. Hồ sơ Chứng chỉ vật liệu (CO/CQ) & Thí nghiệm kiểm định đầu vào',
    step_name:
      'Kiểm tra 6 điều kiện khởi công, phê duyệt vật liệu đầu vào (CO/CQ, thí nghiệm kiểm định) và giám sát chất lượng thi công (QA/QC)',
    is_mandatory: true,
    governing_body: 'Nhà thầu thi công & Tư vấn giám sát trưởng',
    inspection_body: 'Ban QLDA / Chủ đầu tư & Sở Xây dựng',
    deliverables: ['Biên bản nghiệm thu', 'Hồ sơ số', 'BIM/CDE'],
    risk_flags: ['RISK_MATERIAL_CERT', 'RISK_SAFETY_QUALITY_PROGRESS', 'RISK_MISSING_DOCS_ORDER'],
    legal_references: [
      {
        law: 'Luật Xây dựng sửa đổi 2025',
        docNumber: '135/2025/QH15',
        article: 'Điều 14',
        excerpt:
          'Việc khởi công xây dựng công trình phải bảo đảm đủ 5 nhóm điều kiện về mặt bằng, giấy phép xây dựng, thiết kế BVTC, hợp đồng và biện pháp ATLD - PCCC.',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d14',
      },
    ],
    digital_checklist_template: [
      'Biên bản kiểm tra đủ 6 điều kiện khởi công xây dựng công trình theo Điều 14 Luật Xây dựng 135/2025/QH15',
      'Hồ sơ chứng chỉ xuất xưởng (CO/CQ), chứng nhận hợp quy và biên bản lấy mẫu thí nghiệm vật liệu tại hiện trường',
      'Nhật ký thi công xây dựng điện tử và biên bản nghiệm thu công việc xây dựng theo trình tự thời gian thực',
    ],
  },
  {
    step_code: 'II.13.1',
    gate_code: 'G13',
    phase_code: 'PHASE_II',
    dossier_group: '26. Hồ sơ Tạm ứng, Thanh toán khối lượng hoàn thành (Phụ lục 03a/04)',
    step_name:
      'Nghiệm thu khối lượng hoàn thành giai đoạn và kiểm soát hồ sơ thanh toán, thu hồi tạm ứng tại Kho bạc Nhà nước',
    is_mandatory: true,
    governing_body: 'Ban QLDA & Nhà thầu thi công',
    inspection_body: 'Kho bạc Nhà nước (KBNN) & Chủ đầu tư',
    deliverables: ['Biên bản nghiệm thu', 'Hồ sơ số'],
    risk_flags: ['RISK_PAYMENT_DOCS', 'RISK_ACCEPTANCE_BASE', 'RISK_NO_CONTRACT_ADDENDUM'],
    legal_references: [
      {
        law: 'Luật Xây dựng sửa đổi 2025',
        docNumber: '135/2025/QH15',
        article: 'Điều 123',
        excerpt:
          'Nghiệm thu giai đoạn thi công xây dựng hoặc bộ phận công trình xây dựng là cơ sở lập bảng xác định giá trị khối lượng công việc hoàn thành đề nghị thanh toán.',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d123',
      },
    ],
    digital_checklist_template: [
      'Biên bản nghiệm thu khối lượng hoàn thành giai đoạn có đầy đủ chữ ký Tư vấn giám sát, Nhà thầu và Chủ đầu tư',
      'Bảng xác định giá trị khối lượng công việc hoàn thành theo hợp đồng (Phụ lục 03a) và khối lượng phát sinh (Phụ lục 04)',
      'Giấy đề nghị thanh toán vốn đầu tư và bảng đối chiếu thu hồi vốn tạm ứng tại Kho bạc Nhà nước',
    ],
  },

  // ======================== PHASE III (G14 -> G16) ========================
  {
    step_code: 'III.14.1',
    gate_code: 'G14',
    phase_code: 'PHASE_III',
    dossier_group: '28. Hồ sơ Nghiệm thu PCCC & Kiểm tra công tác nghiệm thu Nhà nước',
    step_name:
      'Nghiệm thu PCCC, Kiểm tra công tác nghiệm thu của cơ quan chuyên môn về xây dựng và Bàn giao công trình đưa vào sử dụng',
    is_mandatory: true,
    governing_body: 'Chủ đầu tư / Ban QLDA',
    inspection_body: 'Cục/Phòng Cảnh sát PCCC & Cơ quan chuyên môn về xây dựng',
    deliverables: ['Biên bản nghiệm thu', 'Quyết định', 'BIM/CDE'],
    risk_flags: ['RISK_FIRE_SAFETY', 'RISK_ACCEPTANCE_BASE'],
    legal_references: [
      {
        law: 'Luật Xây dựng sửa đổi 2025',
        docNumber: '135/2025/QH15',
        article: 'Điều 123',
        excerpt:
          'Chủ đầu tư chỉ được tổ chức nghiệm thu hoàn thành sau khi có văn bản chấp thuận kết quả nghiệm thu về PCCC và văn bản chấp thuận kết quả nghiệm thu của cơ quan chuyên môn về xây dựng.',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d123',
      },
    ],
    digital_checklist_template: [
      'Văn bản chấp thuận kết quả nghiệm thu về phòng cháy và chữa cháy của Cơ quan Cảnh sát PCCC',
      'Văn bản chấp thuận kết quả nghiệm thu hoàn thành công trình của Cơ quan chuyên môn về xây dựng',
      'Biên bản nghiệm thu hoàn thành công trình đưa vào khai thác, sử dụng và Hồ sơ hoàn công BIM As-Built',
    ],
  },
  {
    step_code: 'III.15.1',
    gate_code: 'G15',
    phase_code: 'PHASE_III',
    dossier_group: '31. Hồ sơ Thẩm tra & Phê duyệt Quyết toán vốn đầu tư dự án hoàn thành',
    step_name:
      'Kiểm toán độc lập báo cáo quyết toán, thẩm tra và ban hành Quyết định phê duyệt quyết toán vốn đầu tư dự án hoàn thành',
    is_mandatory: true,
    governing_body: 'Chủ đầu tư / Ban QLDA & Đơn vị kiểm toán độc lập',
    inspection_body: 'Sở Tài chính / Bộ Tài chính & Người quyết định đầu tư',
    deliverables: ['Báo cáo thẩm định', 'Quyết định', 'Hồ sơ số'],
    risk_flags: ['RISK_SETTLEMENT_DOCS', 'RISK_VOLUME_UNIT_PRICE', 'RISK_CONTRACT_OVERRUN'],
    legal_references: [
      {
        law: 'Luật Xây dựng sửa đổi 2025',
        docNumber: '135/2025/QH15',
        article: 'Điều 123',
        excerpt:
          'Ngày ký Biên bản nghiệm thu hoàn thành công trình là mốc tính thời hạn lập hồ sơ quyết toán vốn đầu tư dự án hoàn thành (09 tháng nhóm A / 06 tháng nhóm B / 04 tháng nhóm C).',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d123',
      },
    ],
    digital_checklist_template: [
      'Báo cáo kiểm toán quyết toán dự án hoàn thành của Đơn vị kiểm toán độc lập hoặc Kiểm toán Nhà nước',
      'Bảng đối chiếu số liệu thanh toán vốn đầu tư công lũy kế với Kho bạc Nhà nước (Mẫu 07/QTDA)',
      'Quyết định phê duyệt quyết toán vốn đầu tư dự án hoàn thành của Người có thẩm quyền',
    ],
  },
  {
    step_code: 'III.16.1',
    gate_code: 'G16',
    phase_code: 'PHASE_III',
    dossier_group: '32. Hồ sơ Bảo hành, Tất toán bảo lãnh & Quy trình bảo trì công trình',
    step_name:
      'Giám sát nghĩa vụ bảo hành công trình, bàn giao Quy trình bảo trì và xác nhận hoàn thành nghĩa vụ bảo hành để tất toán dự án',
    is_mandatory: false,
    governing_body: 'Đơn vị quản lý sử dụng & Nhà thầu thi công',
    inspection_body: 'Chủ đầu tư / Ban QLDA',
    deliverables: ['Biên bản nghiệm thu', 'BIM/CDE', 'Hồ sơ số'],
    risk_flags: ['RISK_SAFETY_QUALITY_PROGRESS', 'RISK_MISSING_DOCS_ORDER'],
    legal_references: [
      {
        law: 'Luật Xây dựng sửa đổi 2025',
        docNumber: '135/2025/QH15',
        article: 'Điều 123',
        excerpt:
          'Nhà thầu thi công xây dựng, cung ứng thiết bị có trách nhiệm bảo hành công trình, bảo hành thiết bị theo đúng thời hạn quy định và bàn giao quy trình bảo trì.',
        docId: 'doc-lxd-135-2025',
        articleId: 'art-lxd-d123',
      },
    ],
    digital_checklist_template: [
      'Quy trình bảo trì công trình xây dựng đã được Chủ đầu tư phê duyệt bàn giao cho Đơn vị vận hành',
      'Biên bản kiểm tra xác nhận hoàn thành nghĩa vụ bảo hành công trình (sau 12 hoặc 24 tháng)',
      'Văn bản giải tỏa bảo lãnh tiền bảo hành công trình xây dựng và đóng mã dự án',
    ],
  },
];

export const INITIAL_PROJECT_STEP_RECORDS: Record<string, ProjectStepRecord> = {
  'I.0.1': {
    id: 'psr-i-0-1',
    project_id: 'proj-daison-2026-01',
    step_code: 'I.0.1',
    status: 'PASSED',
    attached_files: [
      {
        filename: 'QD_Phe_duyet_QH_1_500_Khu_Do_Thi_So_DaiSon.pdf',
        url: '#qh-1-500',
        hash: 'sha256:9f84c2b10e4a',
        uploaded_at: '2026-10-12 09:00',
        extracted_authority: 'Sở Quy hoạch - Kiến trúc',
        extracted_doc_no: '412/QĐ-SQHKT',
      },
    ],
    active_risk_flags: [],
    completed_deliverables: [
      'Quyết định phê duyệt Quy hoạch phân khu 1/2000 hoặc Quy hoạch chi tiết 1/500 còn hiệu lực',
      'Bản vẽ chỉ giới đường đỏ và chỉ giới xây dựng tỷ lệ 1/500 có tọa độ VN-2000 (GIS)',
      'Biên bản đối chiếu sự phù hợp mục đích sử dụng đất theo Luật Đất đai 31/2024/QH15',
    ],
    ai_audit_verdict: null,
    audited_by: 'Ban Pháp chế & QLDA ĐẠI SƠN',
    notes: 'Đã đối khớp tọa độ ranh giới VN-2000 và chỉ giới đường đỏ tỷ lệ 1/500.',
    updated_at: '2026-10-12 09:30',
  },
  'I.1.1': {
    id: 'psr-i-1-1',
    project_id: 'proj-daison-2026-01',
    step_code: 'I.1.1',
    status: 'PASSED',
    attached_files: [
      {
        filename: 'NQ_Chu_truong_dau_tu_Du_an_Nhom_B_DaiSon.pdf',
        url: '#nq-ctdt',
        hash: 'sha256:7a31d88019cc',
        uploaded_at: '2026-10-18 14:20',
        extracted_authority: 'HĐND cấp tỉnh',
        extracted_doc_no: '68/NQ-HĐND',
      },
    ],
    active_risk_flags: [],
    completed_deliverables: [
      'Tờ trình đề nghị thẩm định Báo cáo đề xuất chủ trương đầu tư / BCNC tiền khả thi',
      'Báo cáo kết quả thẩm định của Hội đồng thẩm định hoặc Sở Kế hoạch & Đầu tư',
      'Nghị quyết / Quyết định phê duyệt chủ trương đầu tư đúng cấp thẩm quyền tại Điều 18 Luật ĐTC 2024',
    ],
    ai_audit_verdict: null,
    audited_by: 'Hội đồng thẩm định ĐẠI SƠN',
    notes: 'Nghị quyết HĐND đã thông qua chủ trương đầu tư đúng thẩm quyền Điều 18 Luật ĐTC 2024.',
    updated_at: '2026-10-18 15:00',
  },
  'I.2.1': {
    id: 'psr-i-2-1',
    project_id: 'proj-daison-2026-01',
    step_code: 'I.2.1',
    status: 'FLAGGED',
    attached_files: [
      {
        filename: 'BC_Tham_dinh_nguon_von_So_KHDT_Tam_thoi.pdf',
        url: '#bc-tdnv',
        hash: 'sha256:3e92f1045b21',
        uploaded_at: '2026-10-25 10:15',
        extracted_authority: 'Phòng Tài chính cấp huyện (Chưa đúng thẩm quyền dự án Nhóm B cấp tỉnh)',
        extracted_doc_no: '119/BC-TCKH',
      },
    ],
    active_risk_flags: ['RISK_AUTHORITY_CAPITAL', 'RISK_CAPITAL_PLAN'],
    completed_deliverables: [
      'Văn bản đề nghị thẩm định nguồn vốn và khả năng cân đối vốn kèm thuyết minh phân kỳ đầu tư',
    ],
    ai_audit_verdict: null,
    audited_by: 'LegalCrossCheckAgent',
    notes:
      'Cảnh báo: Văn bản thẩm định nguồn vốn đang ký bởi cấp huyện trong khi dự án thuộc thẩm quyền cấp tỉnh (Điều 36 Luật ĐTC 2024). Gatekeeper đang chặn Gate G5 và G10!',
    updated_at: '2026-10-25 10:40',
  },
  'I.5.1': {
    id: 'psr-i-5-1',
    project_id: 'proj-daison-2026-01',
    step_code: 'I.5.1',
    status: 'BLOCKED',
    attached_files: [],
    active_risk_flags: ['RISK_AUTHORITY_CAPITAL'],
    completed_deliverables: [],
    ai_audit_verdict: null,
    audited_by: 'GatekeeperAgent',
    notes:
      'GatekeeperAgent khóa trạng thái PASSED: Dự án chưa hoàn thành Gate tiên quyết G2 (Thẩm định nguồn vốn) và G4 (Thẩm định BCNCKT).',
    updated_at: '2026-11-01 08:00',
  },
  'II.11.1': {
    id: 'psr-ii-11-1',
    project_id: 'proj-daison-2026-01',
    step_code: 'II.11.1',
    status: 'FLAGGED',
    attached_files: [
      {
        filename: 'Bien_ban_nghiem_thu_khoi_luong_phat_sinh_Dot_2.pdf',
        url: '#bb-ps-dot2',
        hash: 'sha256:5c81a904f2e1',
        uploaded_at: '2026-11-06 16:45',
        extracted_authority: 'Ban QLDA ĐẠI SƠN',
        extracted_doc_no: '29/BB-QLDA',
        has_variation_overrun: true,
        has_approved_addendum: false,
      },
    ],
    active_risk_flags: ['RISK_CONTRACT_OVERRUN', 'RISK_NO_CONTRACT_ADDENDUM'],
    completed_deliverables: [
      'Hợp đồng thi công xây dựng / EPC kèm Bảo lãnh thực hiện hợp đồng và Bảo lãnh tiền tạm ứng ngân hàng',
    ],
    ai_audit_verdict: null,
    audited_by: 'AuditDeductionAgent',
    notes:
      'AuditDeductionAgent phát hiện khối lượng phát sinh cọc khoan nhồi vượt 14.5% phạm vi hợp đồng nhưng chưa có Văn bản chấp thuận của Người quyết định đầu tư và chưa ký Phụ lục hợp đồng.',
    updated_at: '2026-11-06 17:00',
  },
};

/**
 * Deterministic + Multi-Agent Evaluation Engine (GatekeeperAgent, LegalCrossCheckAgent, AuditDeductionAgent)
 */
export function evaluateMultiAgentCompliance(
  step: MasterComplianceStep,
  currentRecord: ProjectStepRecord,
  allRecords: Record<string, ProjectStepRecord>,
  allSteps: MasterComplianceStep[]
): MicroAgentVerdict {
  const gateObj = COMPLIANCE_GATES.find((g) => g.gate_code === step.gate_code);
  const prereqGates = gateObj?.prerequisite_gates || [];

  // 1. GATEKEEPER AGENT: Check prerequisite gates (especially G1 & G2 before G5 or G10)
  const blockedByGates: ComplianceGateCode[] = [];
  prereqGates.forEach((prereqGateCode) => {
    const stepsInPrereqGate = allSteps.filter((s) => s.gate_code === prereqGateCode);
    const allPrereqPassed =
      stepsInPrereqGate.length > 0 &&
      stepsInPrereqGate.every((s) => {
        const rec = allRecords[s.step_code];
        return rec && (rec.status === 'PASSED' || rec.status === 'WAIVED');
      });
    if (!allPrereqPassed) {
      blockedByGates.push(prereqGateCode);
    }
  });

  // Explicit rule from specification: G5 and G10 strictly require G1 and G2 to be PASSED
  if (step.gate_code === 'G5' || step.gate_code === 'G10') {
    (['G1', 'G2'] as ComplianceGateCode[]).forEach((criticalGate) => {
      const critSteps = allSteps.filter((s) => s.gate_code === criticalGate);
      const isCritPassed =
        critSteps.length > 0 &&
        critSteps.every((s) => allRecords[s.step_code]?.status === 'PASSED');
      if (!isCritPassed && !blockedByGates.includes(criticalGate)) {
        blockedByGates.push(criticalGate);
      }
    });
  }

  const gatekeeperPassed = blockedByGates.length === 0;
  const gatekeeperMessage = gatekeeperPassed
    ? `GatekeeperAgent XÁC NHẬN: Toàn bộ Gate tiên quyết (${
        prereqGates.length > 0 ? prereqGates.join(', ') : 'Không yêu cầu'
      }) đã hoàn tất hợp lệ. Cho phép mở khóa phê duyệt tại ${step.gate_code}.`
    : `GatekeeperAgent CHẶN KHÓA (${step.gate_code}): Chưa vượt qua Gate tiên quyết bắt buộc [${blockedByGates.join(
        ', '
      )}]. Tuyệt đối không cho phép chuyển trạng thái sang PASSED!`;

  // 2. LEGAL CROSS-CHECK AGENT: Verify issuing/approving authority vs Luật Đầu tư công 2024 & Luật Xây dựng 2025
  const latestFile = currentRecord.attached_files[0];
  const detectedAuthority =
    latestFile?.extracted_authority || 'Chưa tải lên văn bản / Chưa trích xuất OCR';
  const expectedAuthority = step.inspection_body;

  const isAuthorityMismatch =
    !latestFile ||
    detectedAuthority.toLowerCase().includes('chưa đúng') ||
    detectedAuthority.toLowerCase().includes('sai thẩm quyền') ||
    detectedAuthority.toLowerCase().includes('cấp huyện');

  const legalTriggeredFlags: StandardizedRiskFlagCode[] = [];
  if (isAuthorityMismatch) {
    legalTriggeredFlags.push('RISK_AUTHORITY_CAPITAL');
  }
  if (currentRecord.attached_files.length === 0 && step.is_mandatory) {
    legalTriggeredFlags.push('RISK_MISSING_DOCS_ORDER');
  }

  const legalCrossCheckMessage = !isAuthorityMismatch
    ? `LegalCrossCheckAgent ĐẠT: Cơ quan phê duyệt trích xuất từ hồ sơ (“${detectedAuthority}”) khớp đúng thẩm quyền quy định tại ${
        step.legal_references[0]?.article || 'Điều 18'
      } (${step.legal_references[0]?.docNumber || '58/2024/QH15'}).`
    : `LegalCrossCheckAgent CẢNH BÁO ĐỎ [RISK_AUTHORITY_CAPITAL]: Cơ quan ký duyệt (“${detectedAuthority}”) không khớp với thẩm quyền bắt buộc (“${expectedAuthority}”) theo Luật Đầu tư công 58/2024/QH15 & Luật Xây dựng 135/2025/QH15.`;

  // 3. AUDIT DEDUCTION AGENT: Check contract variations, volume overrun, and addendum status
  const overrunDetected = Boolean(
    latestFile?.has_variation_overrun ||
      currentRecord.active_risk_flags.includes('RISK_CONTRACT_OVERRUN')
  );
  const addendumVerified = Boolean(
    latestFile?.has_approved_addendum &&
      !currentRecord.active_risk_flags.includes('RISK_NO_CONTRACT_ADDENDUM')
  );

  const deductionTriggeredFlags: StandardizedRiskFlagCode[] = [];
  if (overrunDetected && !addendumVerified) {
    deductionTriggeredFlags.push('RISK_CONTRACT_OVERRUN', 'RISK_NO_CONTRACT_ADDENDUM');
  }

  const auditDeductionMessage =
    overrunDetected && !addendumVerified
      ? 'AuditDeductionAgent XUẤT TOÁN TỨC THỜI: Phát hiện phát sinh khối lượng ngoài phạm vi hợp đồng nhưng chưa có Văn bản chấp thuận của Người quyết định đầu tư và Phụ lục hợp đồng hợp lệ. Tự động bật cờ RISK_CONTRACT_OVERRUN & RISK_NO_CONTRACT_ADDENDUM!'
      : 'AuditDeductionAgent AN TOÀN: Khối lượng nghiệm thu/dự toán nằm trong hạn mức hợp đồng và dự toán được duyệt; không phát hiện nguy cơ xuất toán.';

  return {
    gatekeeper: {
      passed: gatekeeperPassed,
      blockedByGates,
      message: gatekeeperMessage,
    },
    legalCrossCheck: {
      passed: !isAuthorityMismatch,
      detectedAuthority,
      expectedAuthority,
      triggeredFlags: legalTriggeredFlags,
      message: legalCrossCheckMessage,
    },
    auditDeduction: {
      passed: !(overrunDetected && !addendumVerified),
      overrunDetected,
      addendumVerified,
      triggeredFlags: deductionTriggeredFlags,
      message: auditDeductionMessage,
    },
    evaluatedAt: new Date().toLocaleString('vi-VN'),
  };
}

export const STAGE_GATE_POSTGRES_DDL_TEXT = `-- 1. Bảng danh mục Giai đoạn
CREATE TABLE IF NOT EXISTS audit_phases (
    phase_code VARCHAR(20) PRIMARY KEY, -- 'PHASE_I', 'PHASE_II', 'PHASE_III'
    name VARCHAR(255) NOT NULL,
    order_index INT NOT NULL
);

-- 2. Bảng 17 Gates (G0 - G16)
CREATE TABLE IF NOT EXISTS compliance_gates (
    gate_code VARCHAR(10) PRIMARY KEY, -- 'G0' -> 'G16'
    phase_code VARCHAR(20) REFERENCES audit_phases(phase_code),
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    order_index INT NOT NULL
);

-- 3. Bảng Master 316 bước hồ sơ
CREATE TABLE IF NOT EXISTS master_compliance_steps (
    step_code VARCHAR(30) PRIMARY KEY, -- 'I.1', 'I.2.1', 'II.6.3.1',...
    gate_code VARCHAR(10) REFERENCES compliance_gates(gate_code),
    dossier_group VARCHAR(200) NOT NULL,
    step_name TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    governing_body TEXT NOT NULL,       -- Cơ quan lập/trình
    inspection_body TEXT,              -- Cơ quan thẩm định/kiểm tra/phê duyệt
    deliverables TEXT[] DEFAULT '{}',  -- ['Hồ sơ số', 'BIM/CDE', 'GIS', 'Quyết định']
    risk_flags TEXT[] DEFAULT '{}',    -- Danh sách mã cảnh báo rủi ro liên quan
    legal_references JSONB DEFAULT '[]' -- Liên kết điều luật trong LexViet [{ law: "Luật Đầu tư công 2024", article: "Điều 18" }]
);

-- 4. Bảng Tiến độ tuân thủ theo Dự án cụ thể (Project Instance)
CREATE TABLE IF NOT EXISTS project_step_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    step_code VARCHAR(30) REFERENCES master_compliance_steps(step_code),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'PASSED', 'FLAGGED', 'BLOCKED', 'WAIVED')),
    attached_files JSONB DEFAULT '[]', -- [{ filename, url, hash, uploaded_at }]
    active_risk_flags TEXT[] DEFAULT '{}',
    ai_audit_verdict JSONB,            -- Kết quả thẩm định từ Gemini Agent
    audited_by VARCHAR(100),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_project_step UNIQUE (project_id, step_code)
);

-- 5. Bảng Audit Log bất biến (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS compliance_audit_trails (
    id BIGSERIAL PRIMARY KEY,
    project_id UUID NOT NULL,
    step_code VARCHAR(30) NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chỉ mục tối ưu truy vấn & RLS
CREATE INDEX idx_project_step_lookup ON project_step_records(project_id, step_code);
CREATE INDEX idx_master_gate ON master_compliance_steps(gate_code);
ALTER TABLE project_step_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_trails ENABLE ROW LEVEL SECURITY;`;
