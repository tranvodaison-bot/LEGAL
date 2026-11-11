# ĐẠI SƠN LEGAL — BÁO CÁO KIỂM TOÁN ĐỘC LẬP TOÀN HỆ THỐNG (FULL SYSTEM INDEPENDENT AUDIT REPORT)

- **Mã báo cáo:** `AUDIT-2026-11-10-FULL-INDEPENDENT`
- **Thời điểm kiểm toán:** `2026-11-10T08:26:07Z` (`2026-11-10T00:26:07-08:00`)
- **Hội đồng kiểm toán:** Principal Software Architect · Security Auditor · Legal Data Quality Auditor
- **Phạm vi kiểm toán:** Toàn bộ mã nguồn (`src/`, `server.ts`, `tests/`, `package.json`) và kho dữ liệu pháp luật (`src/data/legalCorpus.ts`, `src/data/stageGateCorpus.ts`) tại checkpoint sau đợt tái cấu trúc Clean Architecture (29 tệp).
- **Trạng thái sửa đổi mã nguồn trong đợt kiểm toán này:** **0 tệp nghiệp vụ bị chỉnh sửa** (Tuân thủ tuyệt đối nguyên tắc *"Chỉ kiểm toán, chưa sửa mã nguồn; không thay đổi hoặc xóa dữ liệu gốc"*).

---

## 1. KẾT LUẬN TỔNG QUÁT (EXECUTIVE VERDICT)

> **QUYẾT ĐỊNH NGHIỆM THU HIỆN TẠI:** **`NOT READY FOR PRODUCTION — CONDITIONAL HOLD (CHƯA ĐỦ ĐIỀU KIỆN NGHIỆM THU PRODUCTION)`**

Mặc dù bản build Production (`vite build`), kiểm tra kiểu tĩnh (`tsc --noEmit`) và 9/9 bài kiểm thử hợp đồng (`npm test` trên `tests/contract.spec.ts`) đều trả về `exit code 0`, **kiểm toán độc lập chuyên sâu chứng minh rằng 9 unit tests hiện tại mới chỉ kiểm tra bề mặt (happy-path / string-grep) và bỏ lọt 22 phát hiện kỹ thuật – pháp lý – bảo mật thực tế**, bao gồm:

- **06 Phát hiện mức P0 (Critical / Blocker — Bắt buộc đóng trước khi golive)**:
  1. `FIND-ARCH-01` (**P0**): Luồng nạp văn bản OCR trên giao diện (`CreateDocumentModal.tsx` → `App.tsx`) **bỏ qua hoàn toàn** hàm `ingestOcrDocumentToQuarantine()`, ghi thẳng văn bản OCR chưa kiểm duyệt vào mảng `documents` của kho SSoT chính (`daison_os_documents_v5`). Hàm `ingestOcrDocumentToQuarantine` và `loadQuarantineDocuments` thực chất là **dead code** chưa từng được gọi.
  2. `FIND-CORPUS-01` (**P0**): Logic `computeDocumentCompleteness()` (`corpusIntegrityValidator.ts:54-61`) tự gán `knownTotal = loadedCount` (1 Điều) cho **11 văn bản trích lược** không nằm trong `OFFICIAL_TOTAL_ARTICLES_MAP` (như Luật Quản lý thuế `38/2019/QH14` thực tế có 152 Điều nhưng chỉ nạp 1 Điều), dẫn tới hệ thống gắn nhãn sai **`VERIFIED_SSOT` (`Toàn văn đầy đủ 1/1 Điều — 100%`)** và `CitationVerifier` xác nhận sai thành `VERIFIED_FULL_SSOT`.
  3. `FIND-CORPUS-02` (**P0**): **Ô nhiễm dữ liệu dây chuyền (Cascading Misattribution)** từ các bản ghi từng sai định danh (`108/2025/QH15` và `15/2023/NĐ-CP`) vẫn còn tồn tại nguyên vẹn bên trong `amendment_info` của Điều 18, Điều 29 Luật Kế toán `88/2015/QH13`, bên trong `INITIAL_CROSS_REFERENCES` (`xref-lsd108-lkt88`, `xref-nd15-lxd14`, `xref-nd217-nd15`), `INITIAL_DAILY_ALERTS` (`alert-pmu-03`), `stageGateCorpus.ts` và prompt hệ thống trong `server.ts:365,590`.
  4. `FIND-CORPUS-03` (**P0**): **15 văn bản Nghị định/Thông tư năm 2026** (`206/2026/NĐ-CP`..`217/2026/NĐ-CP`, `33/2026/TT-BXD`..`38/2026/TT-BXD`, `330/2026/NĐ-CP`..`333/2026/NĐ-CP`, `248/2026/NĐ-CP`) chưa có nguồn Công báo xác thực (đang trỏ URL mẫu `https://thuvien-vbpl-26.web.app/`) nhưng vẫn được phân loại tự động vào `VERIFIED_SSOT` hoặc `VERIFIED_EXCERPT`. Đồng thời `doc-nd-15-2023` (`15/2021/NĐ-CP`) bị gắn cờ `is_consolidated: true`, `consolidated_doc_number: '06/VBHN-BXD'`, khiến hệ thống phân loại nhầm thành `OFFICIAL_VBHN`.
  5. `FIND-INT-01` (**P0**): `CitationVerifier` (`citationVerifier.ts:46-97`) **bỏ qua hoàn toàn việc kiểm chứng cấp Khoản (`extractedClauseNo`)** và **không hề được gọi để hậu kiểm kết quả AI trả về** trong `LegalReasoningAndCaseView.tsx:253-296`, `AquaAssistantDrawer.tsx:98-100`, hay `CrossLawAiDrawer.tsx:209`. Thử nghiệm độc lập với `"Khoản 999 Điều 3"` của Luật `88/2015/QH13` vẫn trả về `VERIFIED_EXCERPT_SSOT`!
  6. `FIND-INT-02` (**P0**): `PointInTimeResolver` (`pointInTimeResolver.ts:241-243`) khi tra cứu các điều khoản đã sửa đổi nhưng thiếu `previous_excerpt` (như `Điều 16`, `Điều 18`, `Điều 20`, `Điều 29` Luật Kế toán `88/2015/QH13` hoặc `Điều 12` NĐ `15/2021/NĐ-CP`) tại thời điểm trước ngày sửa đổi (`2024-06-15`) vẫn trả về nhãn **`EFFECTIVE_ORIGINAL`** nhưng nội dung `applicable_text` lại là **văn bản đã sửa đổi năm 2025/2026** (vi phạm nguyên tắc Honest Abstention và gây áp dụng hồi tố sai luật).

- **11 Phát hiện mức P1 (High / Major)** và **05 Phát hiện mức P2 (Medium / Minor)** về kiến trúc, hợp đồng API bị lệch (`legalApiClient.ts` vs `server.ts`), lỗi đứt gãy khóa ngoại (`stageGateCorpus.ts`), thiếu xác thực/rate-limit/input-validation trên toàn bộ 8 endpoint POST của `server.ts`, và lỗ hổng Stored DOM XSS khi xuất HTML/in báo cáo A4.

---

## 2. CHECKPOINT MÃ NGUỒN & BẢNG BĂM SHA-256 ĐỘC LẬP (IMMUTABLE AUDIT BASELINE)

Bảng băm SHA-256 dưới đây được trích xuất trực tiếp bằng lệnh `sha256sum` trên môi trường Linux tại thời điểm kiểm toán, chứng minh mã nguồn và dữ liệu gốc được giữ nguyên trạng 100%:

| Tệp mã nguồn / Dữ liệu | SHA-256 Checksum (FIPS 180-4) | Số dòng |
| :--- | :--- | :---: |
| `package.json` | `7a15d283c449b432f31a8075016bdc81f53efaffb0881776b7dbc2e75528b24a` | 45 |
| `server.ts` | `20d675eaf79a03368c9a1a1f0e7d18261755a2c4dc4ed63eabca9621b6bd9aa3` | 820 |
| `src/App.tsx` | `8d966bfaa8f3f0efcc0620b5beba9893d82a6a00f27f27565214d86723e38090` | 4828 |
| `src/types/legal.ts` | `29679ec9f4342c578262c92076e6ff412ee1d4883f6cdad44345a44410640d80` | 312 |
| `src/data/legalCorpus.ts` | `cdcc7c09ea52a0194bf7e1cdc1ba9dee74a9491ed176948cb016257f5f66ee1c` | 2912 |
| `src/core/entities/legalDomain.ts` | `a3264e8c5a259ff6210026c5c88fedc1644ef8bf4cf797221e976559b8fb0de7` | 200 |
| `src/core/engines/citationVerifier.ts` | `9932cb72b4926bc01f6872174e679cc95e48e7a813450d03989be6fab712db85` | 137 |
| `src/core/engines/corpusIntegrityValidator.ts` | `3e8c3463ba737b49979fd04d264361ab828f8de730e4942031131b477083df6b` | 182 |
| `src/core/engines/deterministicDiffEngine.ts` | `c371905ebbc93896c481ce9bde521447497887c156ee3e86cf59e62940534fd7` | 207 |
| `src/core/engines/pointInTimeResolver.ts` | `52797988cd39530037dc4615cba1b92a40819640bd9fe25cee644f784bac7126` | 286 |
| `src/infrastructure/api/legalApiClient.ts` | `36d46394f1c2c49680176150923ff1451bfe3d5586c7b833829a9bad28e0e354` | 51 |
| `src/infrastructure/crypto/sha256.ts` | `ef7a824b73188782a308947b57d3fcf03eead5bb8b7515031a724e27f3adffe1` | 111 |
| `src/infrastructure/storage/partitionedStorage.ts` | `ba7c5f5d0d1005249e2a91404a3c2a0576a2d6dc23a13461aa9ef93c6223d9f0` | 97 |
| `src/modules/case-workspace/caseWorkspace.service.ts` | `5fa8a376c27d3b7cc03b3f534c6abd17481a8e916bedc1662e5d3f37468f67fe` | 152 |
| `src/modules/legal-library/legalLibrary.service.ts` | `1f97f3eaf8aa2c78bb5c48e4ea6b9cad1cc4c5e36dce365133fe255445cf51f8` | 70 |
| `src/modules/legal-reasoning/legalReasoning.service.ts` | `1a74abfb4795c0c0a22beeb9a93e26cc3a6e0459c5ad20cc747109298bedc548` | 160 |
| `src/ui/views/LegalReasoningAndCaseView.tsx` | `7db8ad23f7cade88e07dff4522889b928029dd5f58d898e4298a79d7b16b0ff4` | 1179 |
| `src/components/AquaAssistantDrawer.tsx` | `53a3d4e2e2e6023062b41af996b23b022b88038d225729fe372f277457fbf615` | 325 |
| `src/components/BackupAndStatsModal.tsx` | `a01ea7a61d9dd2884864c54c2c5e9e40f63d929bab905f36dd67640f80da6506` | 431 |
| `src/components/ConsolidatedDocumentDrawer.tsx` | `fdec3ba6225f6a4b6fb54b4a903abf1592eb8459289cdf5829349321ba7356c0` | 1433 |
| `src/components/CreateDocumentModal.tsx` | `89c4f072515f0d45a6ad2f345dc53bc394223623ae2f3175e96e656e2ad34e8b` | 701 |
| `src/components/CrossLawAiDrawer.tsx` | `4304c43d187bd290fd64ee8b5664e56019aed926957099fb4cea9722dc4be85d` | 557 |
| `src/components/InPlaceClauseDiffViewer.tsx` | `a4e4673cf12a9d48de72bf50c599274cd5d54767110e2bb38eaa57f494b78555` | 290 |
| `src/components/SideBySideComparisonView.tsx` | `48285faacee88b894a4f7abbeb440a76b35aea84f82618d6a9ad0c8287e85839` | 1007 |
| `src/components/StageGateAuditView.tsx` | `36496e692f6f030139e2958ee3a5424800a7259d0ab8a196397f3e0ae9d70495` | 652 |
| `src/utils/ocrClient.ts` | `3191a51dccffdd649cb7fd16a676a0b0bd6f761be3b229e26f512669e8a8d5d6` | 113 |
| `tests/contract.spec.ts` | `5c9713646f745e9b482f1e8ce6425693ba9a8297867626741fd02913f4dc99d3` | 302 |

---

## 3. TỔNG HỢP 22 PHÁT HIỆN KIỂM TOÁN THEO PHÂN HỆ & MỨC ĐỘ NGHIÊM TRỌNG

| Mã phát hiện | Mức độ | Phân hệ | Tóm tắt phát hiện | Trạng thái xác minh |
| :--- | :---: | :--- | :--- | :---: |
| **`FIND-ARCH-01`** | **P0** | Architecture & SSoT | `CreateDocumentModal` + `App.tsx:2169` bỏ qua `ingestOcrDocumentToQuarantine`, ghi trực tiếp văn bản OCR vào kho `documents` SSoT; hàm Quarantine trong `legalLibrary.service.ts` là dead code. | **VERIFIED** |
| **`FIND-CORPUS-01`** | **P0** | Legal Corpus | 11 văn bản trích lược 1 Điều (gồm Luật QLT `38/2019/QH14` 152 Điều, Luật ATTTM `86/2015/QH13` 60 Điều...) bị gán sai `total_articles_count = 1`, `is_full_text = true` và phân loại nhầm thành `VERIFIED_SSOT`. | **VERIFIED** |
| **`FIND-CORPUS-02`** | **P0** | Legal Corpus | Ô nhiễm dây chuyền từ `108/2025/QH15` (gán sai là Luật sửa đổi Luật Kế toán/IFRS) và `15/2023/NĐ-CP` (gán sai là NĐ QLDA xây dựng) vẫn còn trong `amendment_info`, `INITIAL_CROSS_REFERENCES`, `INITIAL_DAILY_ALERTS`, `stageGateCorpus.ts` và `server.ts`. | **VERIFIED** |
| **`FIND-CORPUS-03`** | **P0** | Legal Corpus | 15 Nghị định/Thông tư năm 2026 chưa có nguồn Công báo chính thức vẫn được gắn nhãn `VERIFIED_SSOT`/`VERIFIED_EXCERPT`; `doc-nd-15-2023` (`15/2021/NĐ-CP`) bị gắn nhầm `OFFICIAL_VBHN` (`06/VBHN-BXD`) và chưa cập nhật trạng thái hết hiệu lực khi bị thay thế bởi `175/2024/NĐ-CP`. | **VERIFIED** |
| **`FIND-INT-01`** | **P0** | AI Safety & Verifier | `CitationVerifier` không kiểm tra sự tồn tại của cấp `Khoản` (`Khoản 999 Điều 3` vẫn báo `VERIFIED_EXCERPT_SSOT`), dùng `.includes()` dễ khớp nhầm số hiệu con, và **không được gọi** để hậu kiểm văn bản do Gemini sinh ra trên UI. | **VERIFIED** |
| **`FIND-INT-02`** | **P0** | Point-in-Time Engine | `resolveProvisionAtDate` trả về nội dung đã sửa đổi năm 2025/2026 dưới nhãn `EFFECTIVE_ORIGINAL` khi tra cứu mốc năm 2024 cho các điều khoản thiếu `previous_excerpt` (Điều 16, 18, 20, 29 Luật Kế toán). | **VERIFIED** |
| **`FIND-ARCH-02`** | **P1** | API Contract | `src/infrastructure/api/legalApiClient.ts` là dead code và lệch hoàn toàn schema request/response với `/api/legal-reasoning` trong `server.ts` (`candidateProvisions`/`data.reasoning` vs `rulesContext`/`data.aiReasoning`). | **VERIFIED** |
| **`FIND-ARCH-03`** | **P1** | Storage Layer | Phân mảnh khóa lưu trữ: `STORAGE_KEYS.VERIFIED_SSOT` (`daison_legal_ssot_v14_verified_corpus`) trong `partitionedStorage.ts` không bao giờ được sử dụng; `App.tsx` vẫn dùng `daison_os_documents_v5`. | **VERIFIED** |
| **`FIND-ARCH-04`** | **P1** | Backup & Migration | Luồng nhập sao lưu JSON (`BackupAndStatsModal.tsx` → `App.tsx:2214`) nạp thẳng vào `documents` không qua `prepareVerifiedCorpus` hay `validateCorpusIntegrity`, và tự chế ngày ban hành `new Date()` cho dữ liệu v1. | **VERIFIED** |
| **`FIND-ARCH-05`** | **P1** | UI / Runtime | `LegalReasoningAndCaseView.tsx:144,160` gọi `resolveProvisionAtDate` trong `useMemo` không có `try/catch` hay Error Boundary; nếu thiếu Điều khoản đích sẽ gây crash trắng màn hình. | **VERIFIED** |
| **`FIND-ARCH-06`** | **P1** | Honest Abstention | `App.tsx:1954-1985` (`handleRunMcpAudit`) và `StageGateAuditView.tsx:458-500` vẫn âm thầm ghi đè kết quả bằng văn bản mẫu khi API `/api/legal-audit` hoặc `/api/stage-gate-audit` lỗi mạng (vi phạm chuẩn 4-State UI & P0-05). | **VERIFIED** |
| **`FIND-CORPUS-04`** | **P1** | Legal Corpus | `computeDocumentCompleteness` lấy `compliance_stats.total_sections` (số mục kiểm tra tuân thủ) làm tổng số Điều của Luật, khiến Luật Đất đai `31/2024/QH15` bị hiển thị là `3/38 Điều` (thực tế 260 Điều), Luật Đấu thầu `3/34 Điều` (thực tế 96 Điều). | **VERIFIED** |
| **`FIND-CORPUS-05`** | **P1** | Referential Integrity | 08 lỗi đứt gãy khóa ngoại (`docId` / `articleId`) trong `MASTER_COMPLIANCE_STEPS` (`src/data/stageGateCorpus.ts:601,639,785,820,910`), bao gồm cả việc ghi sai số hiệu Luật Đấu thầu thành `23/2023/QH15` (Luật Giá). | **VERIFIED** |
| **`FIND-INT-03`** | **P1** | Point-in-Time Engine | `DEFAULT_TRANSITIONAL_RULES` (`pointInTimeResolver.ts:20,44`) trỏ tới `previous_doc_id: 'doc-lxd-2014-62-2020'` và `new_doc_id: 'doc-nd-175-2024'` không tồn tại trong kho SSoT; khi rơi vào nhánh `TRANSITIONAL_APPLIED`, hệ thống vẫn trả về nội dung của luật mới thay vì luật cũ. | **VERIFIED** |
| **`FIND-SEC-01`** | **P1** | API Security | Toàn bộ 8 endpoint POST trong `server.ts` không có cơ chế xác thực (Authentication/Authorization) và không có giới hạn tần suất (Rate Limiting), cho phép gọi cạn kiệt quota `GEMINI_API_KEY`. | **VERIFIED** |
| **`FIND-SEC-02`** | **P1** | Input Validation | Không có kiểm tra schema đầu vào (Zod/Typebox) tại `server.ts`; thử nghiệm gửi body rỗng `{}` hoặc `facts: "NOT_AN_ARRAY"` vào `/api/legal-reasoning` không trả về `HTTP 400` mà vẫn gọi thẳng LLM. | **VERIFIED** |
| **`FIND-SEC-03`** | **P1** | XSS / Export Safety | Lỗ hổng Stored DOM XSS trong `BackupAndStatsModal.tsx:164-166` (dùng `innerHTML` không escape khi xuất HTML độc lập) và `LegalReasoningAndCaseView.tsx:351-405` (nối chuỗi trực tiếp vào `doc.write` khi in báo cáo A4). | **VERIFIED** |
| **`FIND-ARCH-07`** | **P2** | God Component | `src/App.tsx` vẫn dài 4.828 dòng (215 KB), chứa trực tiếp state quản lý 11 khóa `localStorage` và các hàm gọi `fetch('/api/*')`, chưa tách triệt để theo Clean Architecture. | **VERIFIED** |
| **`FIND-INT-04`** | **P2** | AI Drafts UX | `saveAiDraftForDocument` lưu bản nháp AI vào `localStorage['daison_legal_ai_draft_notes_v1']`, nhưng `loadAiDraftForDocument` (`partitionedStorage.ts:39`) là dead code — người dùng không có nơi nào trên UI để xem lại bản nháp AI đã lưu. | **VERIFIED** |
| **`FIND-SEC-04`** | **P2** | File Upload & Prompt | `/api/ocr-dossier-extract` chỉ kiểm tra phần mở rộng `.docx` hoặc `mimeType` bề mặt, không kiểm tra magic bytes (`%PDF-`, `PK\x03\x04`) và nối trực tiếp `extractedTextFromDocxOrRaw` vào prompt không có thẻ cách ly chống Prompt Injection. | **VERIFIED** |
| **`FIND-SEC-05`** | **P2** | Error & Header Leak | `server.ts` lộ header `X-Powered-By: Express` và trả trực tiếp `error.message` nguyên bản của SDK/hệ thống xuống client trong khối `catch` (`status(500)`). | **VERIFIED** |
| **`FIND-TEST-01`** | **P2** | Test Coverage | Bộ test `tests/contract.spec.ts` mới chỉ có 9 bài unit test (tổng thời gian chạy 1,16 giây), chưa có API integration tests, UI component tests, negative security tests và golden dataset tests cho toàn bộ 43 văn bản. | **VERIFIED** |

---

## 4. DANH MỤC 8 TÀI LIỆU BÀN GIAO TRONG THƯ MỤC `/audit/`

1. `/audit/SYSTEM_AUDIT_REPORT.md` — Báo cáo tổng hợp kết quả kiểm toán độc lập toàn hệ thống (Tài liệu này).
2. `/audit/SOURCE_CODE_FINDINGS.md` — Báo cáo kiểm toán kiến trúc & mã nguồn chi tiết tới từng tệp và dòng lệnh.
3. `/audit/LEGAL_CORPUS_VALIDATION.md` — Báo cáo kiểm toán toàn bộ 43 bản ghi pháp luật, độ phủ Điều/Khoản và ảnh hưởng dây chuyền.
4. `/audit/SECURITY_AND_INTEGRITY_AUDIT.md` — Báo cáo kiểm toán tính toàn vẹn SSoT, an toàn AI, mật mã SHA-256 (NIST vectors) và bảo mật API/XSS.
5. `/audit/TEST_EXECUTION_EVIDENCE.md` — Bằng chứng thực thi kiểm thử độc lập (log lệnh, exit code, kết quả probe API thực tế).
6. `/audit/RISK_GAP_TEST_TRACEABILITY.md` — Ma trận truy vết 2 chiều giữa Yêu cầu nghiệp vụ — Rủi ro — Phát hiện kiểm toán — Test Case ID.
7. `/audit/REMEDIATION_BACKLOG.md` — Kế hoạch khắc phục chi tiết phân chia theo mức ưu tiên P0 → P1 → P2.
8. `/audit/AUDIT_ACCEPTANCE_DECISION.md` — Biên bản quyết định nghiệm thu độc lập và các điều kiện tiên quyết để mở khóa Production.
