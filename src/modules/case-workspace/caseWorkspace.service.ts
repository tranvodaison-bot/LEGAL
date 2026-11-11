import type {
  CaseFactEvent,
  LegalCaseWorkspace,
  LegalReasoningMode,
} from '../../core/entities/legalDomain';
import { computeStringSha256Sync } from '../../infrastructure/crypto/sha256';
import {
  loadCaseWorkspaces as loadCaseWorkspacesFromStorage,
  saveCaseWorkspaces as saveCaseWorkspacesToStorage,
} from '../../infrastructure/storage/partitionedStorage';

/**
 * Module 5: Legal Case Workspace & Evidence-based Audit Dossier Service
 * Cung cấp các hồ sơ vụ việc mẫu bám sát thực tiễn Kiểm toán Đầu tư Xây dựng, Kế toán – Thuế và Bảo vệ Dữ liệu cá nhân.
 */
export const INITIAL_CASE_WORKSPACES: LegalCaseWorkspace[] = [
  {
    id: 'case-daison-001',
    case_code: 'HS-KT-2026-001',
    title:
      'Kiểm toán Hồ sơ Khởi công, Điều chỉnh Giá Hợp đồng EPC & Quyết toán Vốn Đầu tư Dự án Khu Đô thị Đại Sơn',
    project_name: 'Dự án Đầu tư Xây dựng Khu Đô thị & Hạ tầng Kỹ thuật Đại Sơn (Nhóm A)',
    client_or_unit: 'Ban Quản lý Dự án Đầu tư Xây dựng Đại Sơn',
    created_at: '2026-11-01T08:00:00Z',
    updated_at: '2026-11-10T04:00:00Z',
    primary_reference_date: '2024-06-15',
    milestone_initiation_date: '2024-02-10',
    facts: [
      {
        id: 'fact-01',
        event_date: '2024-06-15',
        event_title: 'Phê duyệt Chế độ kế toán và hạch toán chứng từ dự án giai đoạn 2024',
        description:
          'Đơn vị kế toán dự án lập chứng từ kế toán bằng ngoại tệ và áp dụng quy định về Chế độ kế toán tại Khoản 2 Điều 3 Luật Kế toán 88/2015/QH13 tại ngày 15/06/2024 (trước ngày Luật 56/2024/QH15 có hiệu lực 01/01/2025).',
        related_doc_number: '88/2015/QH13',
        related_article_no: 'Điều 3',
        evidence_code: 'EV-KT-2024-01',
      },
      {
        id: 'fact-02',
        event_date: '2026-08-10',
        event_title: 'Phát lệnh khởi công hạng mục Hạ tầng kỹ thuật phân khu B',
        description:
          'Chủ đầu tư kiểm tra điều kiện bàn giao mặt bằng sạch từng phần, Giấy phép xây dựng và thẩm duyệt PCCC trước khi khởi công theo Điều 14 Luật Xây dựng 135/2025/QH15 (có hiệu lực từ 01/07/2026).',
        related_doc_number: '135/2025/QH15',
        related_article_no: 'Điều 14',
        evidence_code: 'EV-XD-2026-02',
      },
      {
        id: 'fact-03',
        event_date: '2026-09-20',
        event_title: 'Đề xuất ký Phụ lục điều chỉnh đơn giá thép và xi măng vượt ±5%',
        description:
          'Nhà thầu đề nghị điều chỉnh đơn giá hợp đồng theo đơn giá điều chỉnh do giá thép biến động +8,4% so với thời điểm 28 ngày trước ngày đóng thầu theo Điều 38 Nghị định 217/2026/NĐ-CP.',
        related_doc_number: '217/2026/NĐ-CP',
        related_article_no: 'Điều 38',
        evidence_code: 'EV-HD-2026-03',
      },
    ],
    evidences: [
      {
        id: 'ev-01',
        code: 'EV-KT-2024-01',
        title:
          'Bộ chứng từ hạch toán kế toán dự án quý II/2024 & Tờ trình chế độ kế toán ngày 15/06/2024',
        issued_date: '2024-06-15',
        sha256_hash: computeStringSha256Sync('EV-KT-2024-01:2024-06-15:88/2015/QH13'),
        verification_state: 'VERIFIED_ORIGINAL',
        linked_fact_ids: ['fact-01'],
      },
      {
        id: 'ev-02',
        code: 'EV-XD-2026-02',
        title:
          'Biên bản bàn giao mặt bằng sạch thực địa & Giấy phép xây dựng số 88/GPXD-SXD ngày 05/08/2026',
        issued_date: '2026-08-05',
        sha256_hash: computeStringSha256Sync('EV-XD-2026-02:2026-08-05:135/2025/QH15'),
        verification_state: 'VERIFIED_ORIGINAL',
        linked_fact_ids: ['fact-02'],
      },
      {
        id: 'ev-03',
        code: 'EV-HD-2026-03',
        title:
          'Công bố chỉ số giá xây dựng tháng 09/2026 của Sở Xây dựng & Dự toán điều chỉnh giá gói thầu',
        issued_date: '2026-09-18',
        sha256_hash: computeStringSha256Sync('EV-HD-2026-03:2026-09-18:217/2026/NĐ-CP'),
        verification_state: 'COPY_PENDING_CHECK',
        linked_fact_ids: ['fact-03'],
      },
    ],
    reasoning_history: [],
  },
];

export function loadCaseWorkspaces(): LegalCaseWorkspace[] {
  return loadCaseWorkspacesFromStorage(INITIAL_CASE_WORKSPACES);
}

export function saveCaseWorkspaces(workspaces: LegalCaseWorkspace[]): void {
  saveCaseWorkspacesToStorage(workspaces);
}

export function createNewCaseWorkspace(params: {
  caseCode: string;
  title: string;
  clientOrProjectUnit: string;
  primaryReferenceDate: string;
  milestoneInitiationDate?: string;
  defaultMode?: LegalReasoningMode;
}): LegalCaseWorkspace {
  const now = new Date().toISOString();
  return {
    id: `case-${Date.now()}`,
    case_code: params.caseCode,
    title: params.title,
    project_name: params.title,
    client_or_unit: params.clientOrProjectUnit,
    created_at: now,
    updated_at: now,
    primary_reference_date: params.primaryReferenceDate,
    milestone_initiation_date: params.milestoneInitiationDate,
    facts: [
      {
        id: `fact-${Date.now()}-1`,
        event_date: params.primaryReferenceDate,
        event_title: 'Khởi tạo hồ sơ thẩm định pháp lý & kiểm toán tuân thủ',
        description: `Thẩm định hiệu lực quy phạm pháp luật tại ngày ${params.primaryReferenceDate} cho đơn vị ${params.clientOrProjectUnit}.`,
        related_doc_number: '88/2015/QH13',
        related_article_no: 'Điều 3',
      },
    ],
    evidences: [],
    reasoning_history: [],
  };
}

export function addFactToCase(
  workspace: LegalCaseWorkspace,
  fact: CaseFactEvent
): LegalCaseWorkspace {
  const updated: LegalCaseWorkspace = {
    ...workspace,
    updated_at: new Date().toISOString(),
    facts: [...workspace.facts, fact],
  };
  const currentList = loadCaseWorkspaces();
  const nextList = currentList.map((c) => (c.id === updated.id ? updated : c));
  saveCaseWorkspaces(nextList);
  return updated;
}
