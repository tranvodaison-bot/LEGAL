import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  COMPLIANCE_REQUIREMENT_NODES,
  INITIAL_CROSS_REFERENCES,
  INITIAL_DAILY_ALERTS,
  INITIAL_LEGAL_DOCUMENTS,
} from '../src/data/legalCorpus';
import { MASTER_COMPLIANCE_STEPS } from '../src/data/stageGateCorpus';
import {
  computeDocumentCompleteness,
  resolveAuthenticityTier,
  validateCorpusIntegrity,
} from '../src/core/engines/corpusIntegrityValidator';
import {
  DEFAULT_TRANSITIONAL_RULES,
  resolveProvisionAtDate,
} from '../src/core/engines/pointInTimeResolver';
import { verifyCitationsBatch, verifySingleCitation } from '../src/core/engines/citationVerifier';
import { computeDeterministicDiff } from '../src/core/engines/deterministicDiffEngine';
import { computeStringSha256Sync } from '../src/infrastructure/crypto/sha256';
import { STORAGE_KEYS } from '../src/infrastructure/storage/partitionedStorage';
import {
  attachAiExpandedDraftSafely,
  ingestOcrDocumentToQuarantine,
  prepareVerifiedCorpus,
} from '../src/modules/legal-library/legalLibrary.service';
import { buildDeterministicIRACBaseline } from '../src/modules/legal-reasoning/legalReasoning.service';
import { INITIAL_CASE_WORKSPACES } from '../src/modules/case-workspace/caseWorkspace.service';
import { escapeHtml } from '../src/ui/views/LegalReasoningAndCaseView';

/**
 * BỘ KIỂM THỬ HỢP ĐỒNG & NGHIỆM THU ĐỘC LẬP TOÀN HỆ THỐNG
 * Ánh xạ trực tiếp tới 14 Test Cases gốc (`TC-P0-01` .. `TC-P2-02`) và 21 Audit Test Cases (`TC-AUDIT-01` .. `TC-AUDIT-21`).
 */

test('TC-P0-01 & TC-AUDIT-01: Chặn tuyệt đối việc nối điều khoản AI vào VERIFIED_SSOT và bắt buộc cô lập hồ sơ OCR vào QUARANTINE_OCR', () => {
  const sampleDoc = INITIAL_LEGAL_DOCUMENTS.find((d) => d.doc_number === '91/2025/QH15');
  assert.ok(sampleDoc, 'Phải tìm thấy Luật 91/2025/QH15 trong kho');
  const originalArticleCount = sampleDoc.articles.length;

  const fakeAiArticles = [
    {
      id: 'fake-ai-1',
      document_id: sampleDoc.id,
      chapter_no: 'Chương X',
      chapter_title: 'Chương do AI tự viết',
      article_no: 'Điều 999',
      article_title: 'Điều khoản do AI tự sáng tác',
      content: 'Nội dung giả định do AI sinh ra.',
      is_active: true,
      keywords: ['ai'],
    },
  ];

  const { untouchedSsotDoc, savedDraftCount } = attachAiExpandedDraftSafely(
    sampleDoc,
    fakeAiArticles
  );

  assert.equal(savedDraftCount, 1);
  assert.equal(
    untouchedSsotDoc.articles.length,
    originalArticleCount,
    'Số lượng Điều trong văn bản SSoT tuyệt đối không được thay đổi sau khi chạy AI'
  );
  assert.equal(
    untouchedSsotDoc.articles.some((a) => a.article_no === 'Điều 999'),
    false,
    'Điều khoản AI tự sinh không được phép xuất hiện trong mảng articles của SSoT'
  );

  // Kiểm chứng cô lập OCR (REM-P0-01): ingestOcrDocumentToQuarantine gán QUARANTINE_REVIEW + DANG_DU_THAO
  const ocrDoc = ingestOcrDocumentToQuarantine(
    {
      ...sampleDoc,
      id: 'doc-ocr-test-spoof',
      doc_number: '135/2025/QH15',
      title: 'Bản quét OCR giả mạo số hiệu 135/2025/QH15',
    },
    computeStringSha256Sync('ocr-payload')
  );
  assert.equal(ocrDoc.authenticity_tier, 'QUARANTINE_REVIEW');
  assert.equal(ocrDoc.status, 'DANG_DU_THAO');

  // Kiểm chứng App.tsx gọi ingestOcrDocumentToQuarantine trong handleSaveNewDocument
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
  assert.equal(
    appSource.includes('ingestOcrDocumentToQuarantine('),
    true,
    'src/App.tsx bắt buộc phải gọi ingestOcrDocumentToQuarantine khi lưu tài liệu OCR/Dự thảo'
  );
});

test('TC-P0-02 & TC-AUDIT-02: Kiểm toán toàn vẹn 43 văn bản trong INITIAL_LEGAL_DOCUMENTS — Không có văn bản trích lược 1 Điều nào bị gán sai là Toàn văn 100% hoặc VERIFIED_SSOT', () => {
  const enrichedCorpus = prepareVerifiedCorpus(INITIAL_LEGAL_DOCUMENTS);
  const auditResult = validateCorpusIntegrity(enrichedCorpus);

  assert.equal(
    auditResult.isValid,
    true,
    `Kho văn bản còn lỗi toàn vẹn: ${JSON.stringify(auditResult.findings)}`
  );

  // Kiểm chứng toàn bộ văn bản QPPL (không tính Tài liệu hướng dẫn sử dụng): Không có văn bản trích lược nào bị đánh dấu is_full_text = true hoặc VERIFIED_SSOT
  for (const doc of enrichedCorpus) {
    if (doc.doc_type === 'Tài liệu' || doc.id === 'huong-dan') {
      assert.equal(doc.authenticity_tier, 'REFERENCE_GUIDE');
      continue;
    }
    const comp = computeDocumentCompleteness(doc);
    assert.ok(
      comp.total_articles_count > comp.loaded_articles_count,
      `Văn bản trích lược ${doc.doc_number} (${comp.loaded_articles_count}/${comp.total_articles_count} Điều) không được có total_articles_count <= loaded_articles_count`
    );
    assert.equal(
      comp.is_full_text,
      false,
      `Văn bản trích lược ${doc.doc_number} không được đánh dấu is_full_text = true`
    );
    assert.notEqual(
      doc.authenticity_tier,
      'VERIFIED_SSOT',
      `Văn bản trích lược ${doc.doc_number} không được gán nhãn VERIFIED_SSOT (Toàn văn đầy đủ)`
    );
  }

  // Kiểm chứng Luật Kế toán 88/2015/QH13 có 10/74 Điều trích lược (VERIFIED_EXCERPT)
  const doc88 = enrichedCorpus.find((d) => d.doc_number === '88/2015/QH13');
  assert.ok(doc88);
  const comp88 = computeDocumentCompleteness(doc88);
  assert.equal(comp88.loaded_articles_count, 10);
  assert.equal(comp88.total_articles_count, 74);
  assert.equal(comp88.is_full_text, false);
  assert.equal(doc88.authenticity_tier, 'VERIFIED_EXCERPT');
});

test('TC-P0-03 & TC-AUDIT-03: Phân tách minh bạch Văn bản Hợp nhất Chính thức (OFFICIAL_VBHN) và Bản Tổng hợp Nội bộ / Dự phóng 2026 (INTERNAL_SYNTHESIS)', () => {
  const enrichedCorpus = prepareVerifiedCorpus(INITIAL_LEGAL_DOCUMENTS);

  // Chỉ văn bản có /VBHN- trong số hiệu mới được phân loại là OFFICIAL_VBHN
  const officialVbhnList = enrichedCorpus.filter((d) => d.authenticity_tier === 'OFFICIAL_VBHN');
  assert.equal(
    officialVbhnList.length,
    1,
    `Chỉ duy nhất 13/VBHN-BCT được phép mang nhãn OFFICIAL_VBHN, thực tế: ${officialVbhnList
      .map((d) => d.doc_number)
      .join(', ')}`
  );
  assert.equal(officialVbhnList[0].doc_number, '13/VBHN-BCT');

  // Nghị định 15/2021/NĐ-CP không được phép mang nhãn OFFICIAL_VBHN
  const doc15 = enrichedCorpus.find((d) => d.id === 'doc-nd-15-2023');
  assert.ok(doc15);
  assert.equal(doc15.doc_number, '15/2021/NĐ-CP');
  assert.equal(doc15.is_consolidated, false);
  assert.equal(resolveAuthenticityTier(doc15), 'VERIFIED_EXCERPT');

  // 15 văn bản dự phóng năm 2026 và THNB-LKT-88-2015 bắt buộc phải mang nhãn INTERNAL_SYNTHESIS
  const internalSynthesisList = enrichedCorpus.filter(
    (d) => d.authenticity_tier === 'INTERNAL_SYNTHESIS'
  );
  assert.equal(
    internalSynthesisList.length,
    16,
    `Phải có đúng 16 văn bản thuộc phân vùng INTERNAL_SYNTHESIS (15 văn bản dự phóng 2026 + 1 THNB-LKT-88-2015), thực tế: ${internalSynthesisList.length}`
  );
});

test('TC-AUDIT-04: Quét sạch toàn bộ lỗi di chứng dây chuyền (15/2023/NĐ-CP, 23/2023/QH15, và gán sai 108/2025/QH15 sửa đổi Điều 29 Luật Kế toán)', () => {
  const doc88 = INITIAL_LEGAL_DOCUMENTS.find((d) => d.id === 'doc-lkt-88-2015');
  assert.ok(doc88);
  const art29 = doc88.articles.find((a) => a.article_no === 'Điều 29');
  assert.ok(art29);
  assert.equal(art29.amendment_info?.amending_doc_id, 'doc-lsd9luat-56-2024');
  assert.equal(art29.amendment_info?.amending_doc_number, '56/2024/QH15');

  const docTt200 = INITIAL_LEGAL_DOCUMENTS.find((d) => d.id === 'doc-tt-200-2014');
  assert.ok(docTt200);
  assert.equal(docTt200.replaced_by_doc_id, 'doc-lsd9luat-56-2024');
  assert.equal(docTt200.replaced_by_label?.includes('108/2025/QH15'), false);

  const corpusSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/data/legalCorpus.ts'),
    'utf-8'
  );
  assert.equal(
    corpusSource.includes('15/2023/NĐ-CP'),
    false,
    'src/data/legalCorpus.ts không được chứa số hiệu sai 15/2023/NĐ-CP'
  );

  const stageGateSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/data/stageGateCorpus.ts'),
    'utf-8'
  );
  assert.equal(
    stageGateSource.includes('15/2023/NĐ-CP'),
    false,
    'src/data/stageGateCorpus.ts không được chứa số hiệu sai 15/2023/NĐ-CP'
  );
  assert.equal(
    stageGateSource.includes('23/2023/QH15'),
    false,
    'src/data/stageGateCorpus.ts không được chứa số hiệu sai 23/2023/QH15 (Luật Đấu thầu đúng là 22/2023/QH15)'
  );
});

test('TC-AUDIT-05: Kiểm toán toàn vẹn khóa ngoại (Referential Integrity 100%) trên toàn bộ legalCorpus.ts và stageGateCorpus.ts', () => {
  const docIds = new Set(INITIAL_LEGAL_DOCUMENTS.map((d) => d.id));
  const articleIds = new Set(
    INITIAL_LEGAL_DOCUMENTS.flatMap((d) => d.articles.map((a) => a.id))
  );

  // 1. Kiểm tra INITIAL_CROSS_REFERENCES
  for (const xref of INITIAL_CROSS_REFERENCES) {
    assert.ok(docIds.has(xref.source_doc_id), `Broken source_doc_id: ${xref.source_doc_id}`);
    assert.ok(docIds.has(xref.target_doc_id), `Broken target_doc_id: ${xref.target_doc_id}`);
    assert.ok(
      articleIds.has(xref.source_article_id),
      `Broken source_article_id: ${xref.source_article_id}`
    );
    assert.ok(
      articleIds.has(xref.target_article_id),
      `Broken target_article_id: ${xref.target_article_id}`
    );
  }

  // 2. Kiểm tra COMPLIANCE_REQUIREMENT_NODES
  for (const node of COMPLIANCE_REQUIREMENT_NODES) {
    assert.ok(docIds.has(node.docId), `Broken compliance node docId: ${node.docId}`);
    if (node.articleId) {
      assert.ok(
        articleIds.has(node.articleId),
        `Broken compliance node articleId: ${node.articleId}`
      );
    }
  }

  // 3. Kiểm tra INITIAL_DAILY_ALERTS
  for (const alert of INITIAL_DAILY_ALERTS) {
    assert.ok(docIds.has(alert.docId), `Broken alert docId: ${alert.docId}`);
    for (const impId of alert.impactedDocIds) {
      assert.ok(docIds.has(impId), `Broken alert impactedDocId: ${impId}`);
    }
  }

  // 4. Kiểm tra MASTER_COMPLIANCE_STEPS trong stageGateCorpus.ts
  for (const step of MASTER_COMPLIANCE_STEPS) {
    for (const ref of step.legal_references) {
      if (ref.docId) {
        assert.ok(
          docIds.has(ref.docId),
          `Step ${step.step_code} có docId không tồn tại: ${ref.docId}`
        );
      }
      if (ref.articleId) {
        assert.ok(
          articleIds.has(ref.articleId),
          `Step ${step.step_code} có articleId không tồn tại: ${ref.articleId}`
        );
      }
    }
  }
});

test('TC-P0-04 & TC-AUDIT-06: Kiểm thử chuẩn mật mã học NIST FIPS 180-4 SHA-256 trên 4 Test Vectors tiêu chuẩn', () => {
  // Vector 1: Chuỗi rỗng ""
  assert.equal(
    computeStringSha256Sync(''),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
  // Vector 2: "abc"
  assert.equal(
    computeStringSha256Sync('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
  // Vector 3: 448-bit multi-block message
  assert.equal(
    computeStringSha256Sync('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
    '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
  );
  // Vector 4: Chuỗi UTF-8 tiếng Việt có dấu
  assert.equal(
    computeStringSha256Sync('ĐẠI SƠN LEGAL — Điều 14 Luật Xây dựng số 135/2025/QH15'),
    '31d89824af02dc51e25f2531453a272d71010280aef44f4e483d735c7b4902b7'
  );

  // Kiểm chứng DualDrawerInspector.tsx không còn dùng Math.random() để tạo giả SHA-256
  const dualDrawerSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/DualDrawerInspector.tsx'),
    'utf-8'
  );
  assert.equal(
    dualDrawerSource.includes('Math.random()'),
    false,
    'DualDrawerInspector.tsx không được dùng Math.random() để sinh mã băm SHA-256'
  );
});

test('TC-P0-05 & TC-AUDIT-07: Xóa bỏ hoàn toàn câu trả lời AI giả định khi mất kết nối mạng trong AquaAssistantDrawer.tsx và App.tsx', () => {
  const aquaSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/AquaAssistantDrawer.tsx'),
    'utf-8'
  );
  assert.equal(aquaSource.includes('DEFAULT_AQUA_RESPONSE'), false);

  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
  assert.equal(
    appSource.includes('1. Hồ sơ bắt buộc: Chuẩn bị đầy đủ biên bản nghiệm thu & chứng từ pháp lý'),
    false,
    'src/App.tsx không được tự sinh 3 gạch đầu dòng kiểm toán giả khi API /api/legal-audit lỗi'
  );
});

test('TC-P1-01, TC-P1-02 & TC-AUDIT-08: Bộ giải hiệu lực Point-in-Time hoạt động chính xác trên mọi Điều khoản sửa đổi (bao gồm Điều 18 Luật Kế toán trước và sau sửa đổi) và Quy tắc chuyển tiếp', () => {
  // 1. Tra cứu Khoản 2 Điều 3 Luật Kế toán 88/2015/QH13 tại ngày 15/06/2024
  const beforeAmendmentD3 = resolveProvisionAtDate(
    {
      doc_id: 'doc-lkt-88-2015',
      article_no: 'Điều 3',
      clause_no: 'Khoản 2',
      reference_date: '2024-06-15',
    },
    INITIAL_LEGAL_DOCUMENTS
  );
  assert.equal(beforeAmendmentD3.temporal_state, 'EFFECTIVE_ORIGINAL');
  assert.match(
    beforeAmendmentD3.applicable_text,
    /tổ chức được cơ quan quản lý nhà nước về kế toán ủy quyền ban hành/
  );

  // 2. Tra cứu Điều 18 Luật Kế toán 88/2015/QH13 tại ngày 15/06/2024 (Trước ngày 01/07/2026) — Khắc phục REM-P0-06
  const beforeAmendmentD18 = resolveProvisionAtDate(
    {
      doc_id: 'doc-lkt-88-2015',
      article_no: 'Điều 18',
      reference_date: '2024-06-15',
    },
    INITIAL_LEGAL_DOCUMENTS
  );
  assert.equal(beforeAmendmentD18.temporal_state, 'EFFECTIVE_ORIGINAL');
  assert.match(
    beforeAmendmentD18.applicable_text,
    /Điều 18 cũ \(Luật Kế toán 88\/2015\/QH13 ban hành 2015/,
    'Tra cứu Điều 18 tại thời điểm 15/06/2024 phải trả về đúng nội dung Điều 18 cũ (previous_excerpt), tuyệt đối không trả về văn bản sau sửa đổi 2026'
  );

  // 3. Kiểm chứng mọi DEFAULT_TRANSITIONAL_RULES đều trỏ tới doc_id hợp lệ trong INITIAL_LEGAL_DOCUMENTS
  const docIdSet = new Set(INITIAL_LEGAL_DOCUMENTS.map((d) => d.id));
  for (const tr of DEFAULT_TRANSITIONAL_RULES) {
    assert.ok(
      docIdSet.has(tr.new_doc_id),
      `Transitional rule ${tr.id} có new_doc_id không tồn tại: ${tr.new_doc_id}`
    );
    assert.ok(
      docIdSet.has(tr.previous_doc_id),
      `Transitional rule ${tr.id} có previous_doc_id không tồn tại: ${tr.previous_doc_id}`
    );
  }

  // 4. Kiểm tra quy tắc chuyển tiếp (Transitional Rule) trả về cả quy định chuyển tiếp và trích đoạn văn bản tiền nhiệm
  const transitionalRes = resolveProvisionAtDate(
    {
      doc_id: 'doc-lxd-135-2025',
      article_no: 'Điều 14',
      reference_date: '2026-08-15',
      milestone_initiation_date: '2026-03-01',
    },
    INITIAL_LEGAL_DOCUMENTS
  );
  assert.equal(transitionalRes.temporal_state, 'TRANSITIONAL_APPLIED');
  assert.ok(transitionalRes.transitional_rule_applied);
  assert.match(transitionalRes.applicable_text, /\[QUY TẮC CHUYỂN TIẾP/);
  assert.match(transitionalRes.applicable_text, /\[Trích lục văn bản tiền nhiệm/);
});

test('TC-P1-03 & TC-AUDIT-09: CitationVerifier kiểm chứng sâu tới cấp Khoản (Clause) và Điểm (Point), chặn tuyệt đối Khoản 999 Điều 3 và tên viết tắt mơ hồ', () => {
  // Hợp lệ: Khoản 2 Điều 3 Luật 88/2015/QH13
  const validClause = verifySingleCitation('88/2015/QH13', 'Khoản 2 Điều 3', INITIAL_LEGAL_DOCUMENTS);
  assert.equal(validClause.verification_status, 'VERIFIED_EXCERPT_SSOT');

  // Bất hợp lệ (Ảo giác cấp Khoản — REM-P0-05): Khoản 999 Điều 3 Luật 88/2015/QH13 (Điều 3 chỉ có 19 khoản)
  const hallucinatedClause = verifySingleCitation(
    '88/2015/QH13',
    'Khoản 999 Điều 3',
    INITIAL_LEGAL_DOCUMENTS
  );
  assert.equal(
    hallucinatedClause.verification_status,
    'UNVERIFIED_EXTERNAL',
    'Khoản 999 Điều 3 không tồn tại trong Luật Kế toán 88/2015/QH13, bắt buộc phải bị gắn cờ UNVERIFIED_EXTERNAL'
  );

  // Bất hợp lệ (Ảo giác cấp Điểm — REM-P0-05): Điểm z Khoản 1 Điều 16 Luật 88/2015/QH13
  const hallucinatedPoint = verifySingleCitation(
    '88/2015/QH13',
    'Điểm z Khoản 1 Điều 16',
    INITIAL_LEGAL_DOCUMENTS
  );
  assert.equal(
    hallucinatedPoint.verification_status,
    'UNVERIFIED_EXTERNAL',
    'Điểm z Khoản 1 Điều 16 không tồn tại, bắt buộc phải bị gắn cờ UNVERIFIED_EXTERNAL'
  );

  // Bất hợp lệ: Chuỗi số hiệu quá ngắn / mơ hồ ("Luật", "15") không được phép khớp bừa bằng reverse .includes()
  const ambiguousDoc = verifySingleCitation('Luật', 'Điều 3', INITIAL_LEGAL_DOCUMENTS);
  assert.equal(ambiguousDoc.verification_status, 'UNVERIFIED_EXTERNAL');
});

test('TC-P1-04 & TC-P1-05: LegalReasoningEngine sinh đầy đủ 6 bước IRAC+ cho cả 3 chế độ (Judicial / Counsel / Audit) gắn với CaseWorkspace', () => {
  const sampleCase = INITIAL_CASE_WORKSPACES[0];
  const modes = ['JUDICIAL_ANALYSIS', 'LEGAL_COUNSEL', 'LEGAL_AUDIT'] as const;

  for (const mode of modes) {
    const result = buildDeterministicIRACBaseline({
      mode,
      referenceDate: sampleCase.primary_reference_date,
      milestoneInitiationDate: sampleCase.milestone_initiation_date,
      caseTitle: sampleCase.title,
      facts: sampleCase.facts,
      targetProvisions: [
        { doc_id: 'doc-lkt-88-2015', article_no: 'Điều 3', clause_no: 'Khoản 2' },
        { doc_id: 'doc-lxd-135-2025', article_no: 'Điều 14' },
      ],
      corpus: INITIAL_LEGAL_DOCUMENTS,
    });

    assert.equal(result.mode, mode);
    assert.ok(result.step1_issue.core_legal_question.length > 10);
    assert.equal(result.step2_rules.length, 2);
    assert.ok(result.step3_interpretation.normative_elements.length > 0);
    assert.equal(result.step4_application.fact_to_rule_mapping.length, sampleCase.facts.length);
    assert.ok(result.step5_counterargument.rebuttal_or_mitigation_conditions.length > 0);
    assert.ok(result.step6_conclusion.definitive_conclusion.length > 10);
    assert.equal(result.citation_verification_report.verified_ssot_count, 2);
  }
});

test('TC-AUDIT-10: Bảo mật chống XSS (escapeHtml), hợp nhất STORAGE_KEYS và gia cố API server.ts (Rate Limit + HTTP 400 + Magic Bytes)', () => {
  // 1. Kiểm thử hàm escapeHtml chống Stored DOM XSS (REM-P1-02)
  const maliciousPayload = `<script>window.alert("XSS")</script><img src=x onerror="evil()">`;
  const escaped = escapeHtml(maliciousPayload);
  assert.equal(escaped.includes('<script>'), false);
  assert.equal(escaped.includes('<img'), false);
  assert.match(escaped, /&lt;script&gt;/);

  // 2. Kiểm thử hợp nhất STORAGE_KEYS (REM-P1-04)
  assert.ok(STORAGE_KEYS.VERIFIED_SSOT);
  assert.ok(STORAGE_KEYS.QUARANTINE_OCR);
  assert.ok(STORAGE_KEYS.AI_DRAFTS);
  assert.ok(STORAGE_KEYS.CASE_WORKSPACES);
  assert.ok(STORAGE_KEYS.DOCS);

  // 3. Kiểm thử gia cố server.ts (REM-P1-01 & REM-P2-02)
  const serverSource = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf-8');
  assert.equal(
    serverSource.includes("app.disable('x-powered-by')"),
    true,
    'server.ts phải tắt header x-powered-by'
  );
  assert.equal(
    serverSource.includes('res.status(400)'),
    true,
    'server.ts phải kiểm tra schema đầu vào và trả về HTTP 400 khi thiếu trường bắt buộc'
  );
  assert.equal(
    serverSource.includes('hasValidDocumentMagicBytes'),
    true,
    'server.ts phải kiểm tra Magic Bytes cho tệp tải lên qua /api/ocr-dossier-extract'
  );
});

test('TC-P2-01 & TC-P2-02: Xóa bỏ câu gốc giả định trong InPlaceClauseDiffViewer và tính đúng tỷ lệ tương đồng thực tế cho đoạn dài (> 250.000 tích độ dài token)', () => {
  const inPlaceDiffSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/InPlaceClauseDiffViewer.tsx'),
    'utf-8'
  );
  assert.equal(
    inPlaceDiffSource.includes('Quy định cũ trước khi được sửa đổi, bổ sung bởi văn bản'),
    false,
    'InPlaceClauseDiffViewer.tsx tuyệt đối không được tự sinh câu gốc giả định khi thiếu previous_excerpt'
  );

  const baseSentence =
    'Chủ đầu tư có trách nhiệm kiểm tra điều kiện khởi công xây dựng công trình theo đúng quy định của Luật Xây dựng và pháp luật về đất đai.';
  const longTextA = Array.from({ length: 30 }, (_, i) => `Khoản ${i + 1}. ${baseSentence}`).join('\n');
  const longTextB = Array.from({ length: 30 }, (_, i) =>
    i === 15
      ? `Khoản ${i + 1}. Chủ đầu tư và Ban Quản lý dự án có trách nhiệm nghiệm thu mặt bằng sạch trước khi phát lệnh khởi công.`
      : `Khoản ${i + 1}. ${baseSentence}`
  ).join('\n');

  const diffResult = computeDeterministicDiff(longTextA, longTextB);
  assert.equal(diffResult.algorithmUsed, 'HIERARCHICAL_SENTENCE_WORD_LCS');
  assert.ok(
    diffResult.similarityPercent > 90,
    `Hai văn bản giống nhau 29/30 khoản phải có độ tương đồng > 90%, thực tế: ${diffResult.similarityPercent}% (không được gán cứng 45%)`
  );
});
