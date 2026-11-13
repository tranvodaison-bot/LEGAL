import type {
  AuthenticityTier,
  LegalDocType,
  LegalDocument,
  LegalDocumentStatus,
  LegalField,
  ProjectLifecycleStage,
  RegMasterMetadata,
} from '../types/legal';
import {
  NAMING_CONVENTION_V1_RULES,
  REG_MASTER_RAW_RECORDS,
} from './regMasterRaw';

export { NAMING_CONVENTION_V1_RULES, REG_MASTER_RAW_RECORDS };

export interface RegMasterCatalogStats {
  total_records: number;
  parent_documents: number;
  child_annex_records: number;
  blocked_p0_count: number;
  blocked_p0_doc_ids: string[];
  drive_matched_count: number;
  active_count: number;
  amended_count: number;
  expired_count: number;
  pillars: Record<string, number>;
  gem_distribution: Record<string, number>;
}

export const BLOCKED_P0_DOC_IDS = new Set(
  REG_MASTER_RAW_RECORDS.filter((r) => r.is_blocked_p0).map((r) => r.doc_id)
);

export const REG_MASTER_STATS: RegMasterCatalogStats = (() => {
  const pillars: Record<string, number> = {};
  const gemDist: Record<string, number> = {};
  let childCount = 0;
  let blockedCount = 0;
  let driveMatched = 0;
  let activeCount = 0;
  let amendedCount = 0;
  let expiredCount = 0;
  const blockedIds: string[] = [];

  for (const r of REG_MASTER_RAW_RECORDS) {
    if (r.loai_ban_ghi_qa === 'PHỤ LỤC / PHẦN') childCount += 1;
    if (r.is_blocked_p0) {
      blockedCount += 1;
      blockedIds.push(r.doc_id);
    }
    if (r.matched_local_drive_path) driveMatched += 1;
    if (r.tinh_trang_hieu_luc === 'Còn hiệu lực') activeCount += 1;
    else if (r.tinh_trang_hieu_luc === 'Sửa đổi, bổ sung') amendedCount += 1;
    else if (r.tinh_trang_hieu_luc === 'Hết hiệu lực') expiredCount += 1;

    if (r.tru_cot_phap_ly) {
      pillars[r.tru_cot_phap_ly] = (pillars[r.tru_cot_phap_ly] ?? 0) + 1;
    }
    if (r.ma_gem_va_trang_thai_ai) {
      gemDist[r.ma_gem_va_trang_thai_ai] = (gemDist[r.ma_gem_va_trang_thai_ai] ?? 0) + 1;
    }
  }

  return {
    total_records: REG_MASTER_RAW_RECORDS.length,
    parent_documents: REG_MASTER_RAW_RECORDS.length - childCount,
    child_annex_records: childCount,
    blocked_p0_count: blockedCount,
    blocked_p0_doc_ids: blockedIds,
    drive_matched_count: driveMatched,
    active_count: activeCount,
    amended_count: amendedCount,
    expired_count: expiredCount,
    pillars,
    gem_distribution: gemDist,
  };
})();

function mapRegDocType(loaiVb: string): LegalDocType {
  const normalized = loaiVb.trim();
  const valid: LegalDocType[] = [
    'Bộ luật',
    'Luật',
    'Nghị quyết',
    'Nghị định',
    'Thông tư',
    'Thông tư liên tịch',
    'Quyết định',
    'Văn bản hợp nhất',
    'Công văn',
    'Biểu mẫu',
    'Quy chuẩn QCVN',
    'Tài liệu',
  ];
  if (valid.includes(normalized as LegalDocType)) {
    return normalized as LegalDocType;
  }
  return 'Tài liệu';
}

function mapRegStatus(statusText: string, isBlockedP0: boolean): LegalDocumentStatus {
  if (isBlockedP0) return 'DANG_DU_THAO';
  const s = statusText.trim();
  if (s === 'Hết hiệu lực') return 'HET_HIEU_LUC';
  if (s === 'Sửa đổi, bổ sung') return 'SUA_DOI_BO_SUNG';
  return 'CON_HIEU_LUC';
}

function mapRegField(pillar: string, code: string): LegalField {
  const p = pillar.trim();
  if (p === 'Xây dựng' || code === 'XD') return 'Xây dựng';
  if (p === 'Đất đai' || code === 'DD') return 'Đất đai';
  if (p === 'Đấu thầu' || code === 'DTH') return 'Đấu thầu';
  if (p === 'Đầu tư' || code === 'DTU') return 'Đầu tư & QLDA';
  if (p === 'PCCC & CNCH' || code === 'PCCC') return 'PCCC';
  if (p === 'Quy hoạch' || p === 'Nhà ở & BĐS') return 'Đầu tư & QLDA';
  if (code === 'MT') return 'Môi trường';
  if (code === 'TC') return 'Tài chính';
  return 'Xây dựng';
}

function inferProjectStage(record: RegMasterMetadata): ProjectLifecycleStage {
  const pillar = record.tru_cot_phap_ly;
  const text = `${record.trich_yeu_noi_dung} ${record.ghi_chu}`.toLowerCase();
  if (pillar === 'Quy hoạch' || pillar === 'Đất đai' || pillar === 'Đầu tư') {
    return 'Chuẩn bị đầu tư';
  }
  if (text.includes('quyết toán') || text.includes('thanh toán')) {
    return 'Quyết toán';
  }
  if (pillar === 'Đấu thầu') {
    return 'Chuẩn bị đầu tư';
  }
  return 'Thực thi';
}

function resolveCatalogTier(record: RegMasterMetadata): AuthenticityTier {
  if (record.is_blocked_p0) return 'QUARANTINE_REVIEW';
  if (
    record.xac_minh_nguon_phap_ly_qa.startsWith('CONFLICT_') ||
    record.xac_minh_nguon_phap_ly_qa.startsWith('CHƯA KIỂM CHỨNG')
  ) {
    return 'QUARANTINE_REVIEW';
  }
  return 'VERIFIED_EXCERPT';
}

function normalizeIsoDate(raw: string): string {
  const s = (raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return '2026-01-01';
}

export function regMasterRecordToLegalDocument(record: RegMasterMetadata): LegalDocument {
  const tier = resolveCatalogTier(record);
  const status = mapRegStatus(record.tinh_trang_hieu_luc, record.is_blocked_p0);
  const shortBase = record.trich_yeu_noi_dung
    ? record.trich_yeu_noi_dung.slice(0, 56) + (record.trich_yeu_noi_dung.length > 56 ? '…' : '')
    : record.so_hieu;

  return {
    id: `reg-${record.doc_id.toLowerCase()}`,
    doc_type: mapRegDocType(record.loai_vb),
    issuing_body: record.co_quan_ban_hanh || 'Chưa xác định',
    doc_number: record.so_hieu || record.doc_id,
    title: record.trich_yeu_noi_dung || `${record.loai_vb} ${record.so_hieu}`,
    short_title: `${record.doc_id} · ${shortBase}`,
    issue_date: normalizeIsoDate(record.ngay_ban_hanh),
    effective_date: normalizeIsoDate(record.ngay_hieu_luc || record.ngay_ban_hanh),
    expiration_date: status === 'HET_HIEU_LUC' ? '2026-07-01' : null,
    status,
    field: mapRegField(record.tru_cot_phap_ly, record.linh_vuc_chuyen_mon),
    project_stage: inferProjectStage(record),
    signer: record.co_quan_ban_hanh || 'Cơ quan ban hành',
    summary: [
      record.trich_yeu_noi_dung,
      record.ghi_chu ? `Ghi chú: ${record.ghi_chu}` : '',
      record.quy_tac_chuyen_tiep_01_07_2026
        ? `Chuyển tiếp 01/07/2026: ${record.quy_tac_chuyen_tiep_01_07_2026}`
        : '',
    ]
      .filter(Boolean)
      .join(' | '),
    source_url: record.duong_dan_drive || undefined,
    authenticity_tier: tier,
    is_consolidated: false,
    is_expiring_soon: record.quy_tac_chuyen_tiep_01_07_2026.toLowerCase().includes('hết hiệu lực'),
    completeness_meta: {
      total_articles_count: 1,
      loaded_articles_count: 0,
      completeness_percent: 0,
      is_full_text: false,
      note: record.is_blocked_p0
        ? 'BLOCKED_P0 — Cách ly, cấm dùng cho LEGAL_AI'
        : 'Danh mục REG_Master (chưa nạp toàn văn Điều khoản)',
    },
    quarantine_info:
      tier === 'QUARANTINE_REVIEW'
        ? {
            uploaded_at: '2026-11-13',
            uploaded_by: 'REG_Master Sheet Sync',
            ocr_engine_used: 'REG_Master QA Gate',
            review_status: record.is_blocked_p0 ? 'REJECTED' : 'PENDING_HUMAN_REVIEW',
            missing_fields: [
              record.kiem_tra_dinh_danh_qa,
              record.xac_minh_nguon_phap_ly_qa,
              record.ghi_chu_can_ra_soat_qa,
            ].filter(Boolean),
          }
        : undefined,
    legacy_doc_id: record.doc_id,
    parent_doc_id: record.parent_doc_id_qa || undefined,
    is_blocked_p0: record.is_blocked_p0,
    reg_master_meta: record,
    articles: [],
  };
}

/**
 * Đồng bộ kho văn bản gốc (INITIAL_LEGAL_DOCUMENTS với đầy đủ Điều khoản chi tiết)
 * với toàn bộ 188 bản ghi REG_Master từ Google Sheet LEGAL.
 * - Văn bản trùng số hiệu được gắn siêu dữ liệu REG_Master (Doc_ID, RBAC, GEM, QA, File chuẩn hóa v1.0)
 *   mà vẫn giữ nguyên 100% Điều khoản, authenticity_tier và thống kê SSoT gốc.
 * - Các bản ghi REG_Master còn lại (bao gồm 11 phụ lục con DOC-038-PL1..7, DOC-040-P1..4
 *   và 6 bản ghi BLOCKED_P0) được bổ sung vào danh mục có kiểm soát P0 Quarantine.
 */
export function buildSynchronizedLegalCorpus(
  baseDocs: LegalDocument[],
  regRecords: RegMasterMetadata[] = REG_MASTER_RAW_RECORDS
): LegalDocument[] {
  const regByNumber = new Map<string, RegMasterMetadata>();
  for (const r of regRecords) {
    const key = r.so_hieu.trim().toUpperCase();
    if (key && !regByNumber.has(key)) {
      regByNumber.set(key, r);
    }
  }

  const matchedRegDocIds = new Set<string>();
  const enrichedBase = baseDocs.map((doc) => {
    const codeKey = doc.doc_number.trim().toUpperCase();
    const matchedReg = regByNumber.get(codeKey);
    if (!matchedReg) return doc;

    matchedRegDocIds.add(matchedReg.doc_id);
    return {
      ...doc,
      legacy_doc_id: doc.legacy_doc_id ?? matchedReg.doc_id,
      parent_doc_id: doc.parent_doc_id ?? (matchedReg.parent_doc_id_qa || undefined),
      is_blocked_p0: doc.is_blocked_p0 ?? matchedReg.is_blocked_p0,
      reg_master_meta: doc.reg_master_meta ?? matchedReg,
      source_url: doc.source_url ?? (matchedReg.duong_dan_drive || undefined),
    };
  });

  const additionalCatalogDocs: LegalDocument[] = [];
  for (const r of regRecords) {
    if (matchedRegDocIds.has(r.doc_id)) continue;
    additionalCatalogDocs.push(regMasterRecordToLegalDocument(r));
  }

  return [...enrichedBase, ...additionalCatalogDocs];
}

/**
 * Bộ phân tích CSV 33 cột xuất từ tab REG_Master của Google Sheet LEGAL.
 * Hỗ trợ cập nhật trực tiếp từ tệp CSV mới nhất mà người dùng xuất/dán.
 */
export function parseRegMasterCsv(csvText: string): RegMasterMetadata[] {
  const rows: string[][] = [];
  let curField = '';
  let curRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    const next = csvText[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        curField += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        curField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      curRow.push(curField.trim());
      curField = '';
    } else if (ch === '\r' && next === '\n') {
      curRow.push(curField.trim());
      rows.push(curRow);
      curRow = [];
      curField = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      curRow.push(curField.trim());
      rows.push(curRow);
      curRow = [];
      curField = '';
    } else {
      curField += ch;
    }
  }
  if (curField.length > 0 || curRow.length > 0) {
    curRow.push(curField.trim());
    rows.push(curRow);
  }

  if (rows.length < 2) return [];
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== ''));

  return dataRows.map((r, idx) => {
    const col = (i: number) => (r[i] ?? '').trim();
    const qaIdCheck = col(22);
    return {
      stt: Number.parseInt(col(0), 10) || idx + 1,
      doc_id: col(1),
      nhom_vb: col(2),
      du_an: col(3),
      goi_thau: col(4),
      loai_vb: col(5),
      co_quan_ban_hanh: col(6),
      so_hieu: col(7),
      ngay_ban_hanh: col(8),
      ngay_hieu_luc: col(9),
      tinh_trang_hieu_luc: col(10),
      linh_vuc_chuyen_mon: col(11),
      tru_cot_phap_ly: col(12),
      cap_bac: col(13),
      ten_file_chuan_hoa_v1: col(14),
      duong_dan_drive: col(15),
      trich_yeu_noi_dung: col(16),
      ghi_chu: col(17),
      loai_ban_ghi_qa: col(18) === 'PHỤ LỤC / PHẦN' ? 'PHỤ LỤC / PHẦN' : 'VĂN BẢN',
      parent_doc_id_qa: col(19),
      so_hieu_van_ban_goc_qa: col(20),
      kiem_tra_duong_dan_qa: col(21),
      kiem_tra_dinh_danh_qa: qaIdCheck,
      kiem_tra_phan_loai_qa: col(23),
      xac_minh_nguon_phap_ly_qa: col(24),
      ghi_chu_can_ra_soat_qa: col(25),
      don_vi_ap_dung_rbac: col(26),
      loai_quan_he_phap_ly: col(27),
      chi_tiet_thay_the_sua_doi: col(28),
      quy_tac_chuyen_tiep_01_07_2026: col(29),
      fk_bang_qlhd: col(30),
      fk_thu_vien_kt821: col(31),
      ma_gem_va_trang_thai_ai: col(32),
      is_blocked_p0: qaIdCheck.includes('BLOCKED_P0'),
    };
  });
}
