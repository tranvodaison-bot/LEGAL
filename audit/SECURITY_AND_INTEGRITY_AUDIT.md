# ĐẠI SƠN LEGAL — KIỂM TOÁN TOÀN VẸN DỮ LIỆU, AN TOÀN AI & BẢO MẬT (SECURITY & INTEGRITY AUDIT)

Tài liệu này trình bày kết quả kiểm toán độc lập đối với Mục 4 (**Data Integrity & AI Safety Audit**) và Mục 5 (**Security Audit**), kèm kết quả thử nghiệm thực tế bằng NIST FIPS 180-4 test vectors và các gói tin thăm dò không phá hoại (non-destructive probes).

---

## PHẦN A — KIỂM TOÁN TÍNH TOÀN VẸN DỮ LIỆU & AN TOÀN AI (DATA INTEGRITY & AI SAFETY)

### 1. Bảng Đánh giá 9 Chốt chặn Toàn vẹn & An toàn AI

| Hạng mục kiểm toán | Trạng thái | Kết quả đối chứng thực tế | Mã phát hiện liên quan |
| :--- | :---: | :--- | :--- |
| **1. SSoT Immutability (Tính bất biến kho SSoT)** | **FAIL (P0)** | Luồng AI mở rộng điều khoản (`handleExpandFullDocumentWithAi`) đã tách khỏi `doc.articles`, **NHƯNG** luồng `handleSaveNewDocument` (`App.tsx:2173`) và `handleImportBackupData` (`App.tsx:2220`) vẫn cho phép ghi thẳng hoặc ghi đè văn bản trong `documents` SSoT. | `FIND-ARCH-01`, `FIND-ARCH-04` |
| **2. `AI_DRAFTS` Isolation (Cách ly bản nháp AI)** | **PARTIAL (P2)** | Bản nháp sinh từ `/api/expand-full-document` được lưu tách biệt vào `localStorage['daison_legal_ai_draft_notes_v1']` với cờ `is_ai_draft: true`. Tuy nhiên hàm `loadAiDraftForDocument` chưa được gọi trên UI. | `FIND-INT-04` |
| **3. OCR Quarantine (Cách ly văn bản OCR)** | **FAIL (P0)** | Hàm `ingestOcrDocumentToQuarantine` (`legalLibrary.service.ts:52`) là dead code; văn bản OCR từ `CreateDocumentModal.tsx` vẫn lưu thẳng vào `documents` chính. | `FIND-ARCH-01` |
| **4. SHA-256 bằng Test Vectors chuẩn NIST FIPS 180-4** | **PASS (VERIFIED)** | Khớp 100% cả 5 vector chuẩn NIST FIPS 180-4 và chuỗi UTF-8 tiếng Việt đối chiếu với `node:crypto`. Không còn `Math.random()`. | — |
| **5. `localStorage` Hydration & Migration** | **PARTIAL (P1)** | Khi khởi tạo `App.tsx:637-712`, các văn bản có trong `INITIAL_LEGAL_DOCUMENTS` được đồng bộ lại `title, doc_number, issue_date, effective_date`, nhưng các văn bản ngoại lai đã lưu trong `daison_os_documents_v5` từ phiên cũ vẫn được giữ lại. | `FIND-ARCH-03` |
| **6. `CitationVerifier` chống trích dẫn giả** | **FAIL (P0)** | Không kiểm tra sự tồn tại của cấp `Khoản` (`Khoản 999 Điều 3` vẫn báo `VERIFIED_EXCERPT_SSOT`), dùng `.includes()` dễ khớp nhầm số hiệu con, và **không được gọi** để hậu kiểm đầu ra của Gemini trong `LegalReasoningAndCaseView`, `AquaAssistantDrawer`, `CrossLawAiDrawer`. | `FIND-INT-01` |
| **7. `Point-in-Time Resolver` & Quy định chuyển tiếp** | **FAIL (P0)** | Trả về văn bản đã sửa đổi năm 2025/2026 dưới nhãn `EFFECTIVE_ORIGINAL` cho các điều khoản thiếu `previous_excerpt`; `DEFAULT_TRANSITIONAL_RULES` trỏ tới `doc-lxd-2014-62-2020` và `doc-nd-175-2024` không có trong kho. | `FIND-INT-02`, `FIND-INT-03` |
| **8. Honest Abstention khi thiếu nguồn / lỗi mạng** | **PARTIAL (P1)** | Đã áp dụng tại `AquaAssistantDrawer.tsx`, nhưng `handleRunMcpAudit` (`App.tsx:1954`) và `StageGateAuditView.tsx:458` vẫn tự điền văn bản fallback tĩnh mà không báo lỗi. | `FIND-ARCH-06` |
| **9. Không giả danh Văn bản Hợp nhất chính thức** | **PARTIAL (P0)** | `ConsolidatedDocumentDrawer.tsx` đã đổi nhãn sang `THNB-...`, nhưng bản ghi `doc-nd-15-2023` (`15/2021/NĐ-CP`) trong `legalCorpus.ts:336-337` vẫn để `is_consolidated: true`, `consolidated_doc_number: '06/VBHN-BXD'`, khiến hệ thống gắn nhãn `OFFICIAL_VBHN`. | `FIND-CORPUS-03` |

---

### 2. Bằng chứng Kiểm thử Độc lập Hàm băm SHA-256 (`src/infrastructure/crypto/sha256.ts`) với NIST FIPS 180-4 Test Vectors

Thực thi đối chiếu trực tiếp hàm `computeStringSha256Sync` (`src/infrastructure/crypto/sha256.ts`) với module chuẩn `node:crypto` của Node.js v22.23.2:

| Vector # | Đầu vào (Input) | Số byte | Kết quả `computeStringSha256Sync` | Kết quả chuẩn NIST / `node:crypto` | Trạng thái |
| :-: | :--- | :-: | :--- | :--- | :-: |
| 1 | `""` (Chuỗi rỗng) | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | **PASS** |
| 2 | `"abc"` | 3 | `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad` | `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad` | **PASS** |
| 3 | `"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"` (448-bit multi-block) | 56 | `248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1` | `248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1` | **PASS** |
| 4 | `"abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"` (896-bit) | 112 | `cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1` | `cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1` | **PASS** |
| 5 | `"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM - Độc lập - Tự do - Hạnh phúc (Nghị định 30/2020/NĐ-CP)"` (UTF-8 Tiếng Việt) | 117 | `6193121827fc3212d34c8ea48f44dd8631b8c89c6e9217546fe976581e440944` | `6193121827fc3212d34c8ea48f44dd8631b8c89c6e9217546fe976581e440944` | **PASS** |

> **Lưu ý kiểm toán nhỏ trên SHA-256 (`SUSPECTED` cho tệp > 512 MB):** Tại `src/infrastructure/crypto/sha256.ts:35`, `const bitLen = bytes.length * 8;` và `words[words.length - 1] = bitLen >>> 0;` hoạt động chính xác tuyệt đối cho mọi chuỗi và tệp `< 512 MB` (ứng dụng giới hạn tệp tải lên tối đa 15 MB và ưu tiên dùng `crypto.subtle.digest('SHA-256', buffer)` của Web Crypto API).

---

### 3. Chi tiết các Phát hiện An toàn AI & Logic Tất định (`FIND-INT-01` .. `FIND-INT-03`)

#### `FIND-INT-01` — [P0] `CitationVerifier` bỏ qua kiểm chứng cấp Khoản và không được kết nối để hậu kiểm đầu ra của AI
- **Severity:** **P0 (Critical Blocker)**
- **File / Line:**
  - `src/core/engines/citationVerifier.ts:25-31, 45-97`
  - `src/ui/views/LegalReasoningAndCaseView.tsx:253-296`
- **Evidence:**
  1. Trong `verifySingleCitation` (`citationVerifier.ts:46-48`), hệ thống tách `extractedClauseNo` (`Khoản \d+`), nhưng từ dòng 66 đến dòng 97 **không có bất kỳ câu lệnh nào kiểm tra xem `extractedClauseNo` có tồn tại trong `matchedArticle.clauses` hoặc nội dung `matchedArticle.content` hay không**.
  2. Chạy thử nghiệm thực tế:
     ```
     verifySingleCitation("88/2015/QH13", "Khoản 999 Điều 3", INITIAL_LEGAL_DOCUMENTS)
     -> verification_status: 'VERIFIED_EXCERPT_SSOT', matched_clause_no: 'Khoản 999'
     ```
  3. Tại `LegalReasoningAndCaseView.tsx:254-296`, khi nhận phản hồi `aiRes` từ `/api/legal-reasoning`, hàm `handleRunLiveAiReasoning` trộn văn bản của AI vào `deterministicReasoning` nhưng **giữ nguyên `citation_verification_report` cũ** của `deterministicReasoning` mà không quét các trích dẫn mới xuất hiện trong câu trả lời của AI.
- **Root Cause:** Thiếu bước kiểm tra sự tồn tại của `extractedClauseNo` trong `matchedArticle` và thiếu hàm trích xuất regex tự động (`extractAndVerifyCitationsFromFreeText`) sau khi nhận kết quả từ LLM.
- **Impact:** AI có thể bịa ra Khoản không tồn tại (VD: `Khoản 99 Điều 3 Luật Kế toán`) hoặc viện dẫn văn bản lạ trong phần kết luận IRAC+ mà báo cáo vẫn hiển thị `Chỉ số xác thực dẫn chiếu SSoT: 100%`.
- **Proposed Fix:**
  1. Trong `verifySingleCitation`, nếu có `extractedClauseNo`, bắt buộc kiểm tra trong `matchedArticle.clauses` hoặc regex đầu dòng `^${clauseNumber}\.` trong `matchedArticle.content`; nếu không khớp phải trả về `DOC_FOUND_ARTICLE_UNLOADED` (hoặc `CLAUSE_NOT_FOUND_IN_ARTICLE`).
  2. Xây dựng hàm `verifyFreeTextCitations(text: string, corpus: LegalDocument[])` và chạy bắt buộc trên toàn bộ văn bản AI trả về trước khi hiển thị.
- **Test Case:** `TC-AUDIT-INT-01`
- **Status:** **VERIFIED (OPEN)**

#### `FIND-INT-02` — [P0] `PointInTimeResolver` trả về nội dung đã sửa đổi năm 2025/2026 dưới nhãn `EFFECTIVE_ORIGINAL`
- **Severity:** **P0 (Critical Blocker)**
- **File / Line:** `src/core/engines/pointInTimeResolver.ts:231-251`
- **Evidence:**
  Tại `pointInTimeResolver.ts:241-243`:
  ```ts
  temporal_state: 'EFFECTIVE_ORIGINAL',
  applicable_text:
    targetArticle.amendment_info.previous_excerpt || targetArticle.content,
  ```
  Trong `INITIAL_LEGAL_DOCUMENTS`, các điều khoản đã sửa đổi như `Điều 16`, `Điều 18`, `Điều 20`, `Điều 29` của Luật Kế toán `88/2015/QH13` và `Điều 12` của Nghị định `15/2021/NĐ-CP` chỉ lưu nội dung mới sau sửa đổi trong `targetArticle.content`, và **không có trường `previous_excerpt`** (cũng không có mảng `clauses`).
  Khi tra cứu `resolveProvisionAtDate({ doc_id: 'doc-lkt-88-2015', article_no: 'Điều 20', reference_date: '2024-06-15' })` (trước ngày Luật `56/2024/QH15` có hiệu lực `01/01/2025`), hệ thống trả về:
  - `temporal_state: 'EFFECTIVE_ORIGINAL'`
  - `applicable_text`: Nội dung mới của Luật `56/2024/QH15` (*"ngắn hơn 03 tháng... ngắn hơn 15 tháng"*), thay vì nội dung gốc năm 2015 (*"không quá 90 ngày"*)!
- **Root Cause:** Dùng toán tử `|| targetArticle.content` làm fallback khi thiếu `previous_excerpt`.
- **Impact:** Gây sai lệch nghiêm trọng về nội dung quy phạm áp dụng tại thời điểm quá khứ (Retroactive Law Contamination).
- **Proposed Fix:**
  1. Bổ sung đầy đủ `previous_excerpt` chuẩn Công báo năm 2015 cho `Điều 16`, `Điều 18`, `Điều 20`, `Điều 29` của `doc-lkt-88-2015` và `Điều 12` của `doc-nd-15-2023`.
  2. Trong `pointInTimeResolver.ts:241`, nếu `refDate < amendDate` nhưng cả `clauses[].diff_data.original_text` và `amendment_info.previous_excerpt` đều trống, bắt buộc áp dụng **Honest Abstention**: trả về cảnh báo `[CHƯA NẠP NỘI DUNG GỐC TRƯỚC NGÀY SỬA ĐỔI ${amendDate}]` thay vì âm thầm trả về `targetArticle.content` (bản mới).
- **Test Case:** `TC-AUDIT-INT-02`
- **Status:** **VERIFIED (OPEN)**

#### `FIND-INT-03` — [P1] `DEFAULT_TRANSITIONAL_RULES` tham chiếu tới `doc_id` không tồn tại và trả về nội dung Luật mới khi áp dụng chuyển tiếp Luật cũ
- **Severity:** **P1 (High)**
- **File / Line:** `src/core/engines/pointInTimeResolver.ts:15-55, 144-160`
- **Evidence:**
  1. `DEFAULT_TRANSITIONAL_RULES` khai báo `previous_doc_id: 'doc-lxd-2014-62-2020'` (dòng 20) và `new_doc_id: 'doc-nd-175-2024'` (dòng 44). Cả hai `doc_id` này đều không tồn tại trong `INITIAL_LEGAL_DOCUMENTS`.
  2. Tại dòng 144-160, khi điều kiện chuyển tiếp kích hoạt (`milestoneDate < r.cutoff_date && refDate >= r.cutoff_date`), quy tắc chuyển tiếp yêu cầu *"Tiếp tục thực hiện theo quy định của Luật cũ"*, nhưng trường `applicable_text` (dòng 154) vẫn gán `targetArticle.content` (tức nội dung của Luật mới) mà không ghi rõ rằng đây là nội dung Luật mới để đối chiếu.
- **Root Cause:** Thiếu liên kết thực tế tới bản ghi văn bản tiền nhiệm trong `corpus`.
- **Impact:** Người dùng đọc `applicable_text` trong trạng thái `TRANSITIONAL_APPLIED` có thể nhầm văn bản của Luật mới (`135/2025/QH15`) là văn bản của Luật cũ (`50/2014/QH13`).
- **Proposed Fix:** Trong nhánh `TRANSITIONAL_APPLIED`, hiển thị rõ cả quy tắc chuyển tiếp (`resolution_rule`) và ghi chú tường minh ở đầu `applicable_text`: `[LƯU Ý CHUYỂN TIẾP: Hồ sơ khởi tạo ngày ${milestoneDate} áp dụng quy định chuyển tiếp tại ${matchedTransitional.transition_article_ref} -> ${matchedTransitional.resolution_rule}]`.
- **Test Case:** `TC-AUDIT-INT-03`
- **Status:** **VERIFIED (OPEN)**

---

## PHẦN B — KIỂM TOÁN BẢO MẬT HỆ THỐNG (SECURITY AUDIT)

### 1. Bảng Đánh giá 10 Hạng mục Bảo mật

| Hạng mục kiểm toán | Trạng thái | Phát hiện & Bằng chứng | Mã phát hiện |
| :--- | :---: | :--- | :--- |
| **1. Authentication / Authorization tại API** | **FAIL (P1)** | Toàn bộ 8 endpoint POST trong `server.ts` (`/api/legal-audit`, `/api/aqua-chat`, `/api/contract-review`, `/api/stage-gate-audit`, `/api/ocr-dossier-extract`, `/api/expand-full-document`, `/api/cross-law-matrix`, `/api/legal-reasoning`) đều mở công khai không kiểm tra phiên/token. | `FIND-SEC-01` |
| **2. Input Schema Validation** | **FAIL (P1)** | Không có thư viện hoặc middleware kiểm tra kiểu dữ liệu đầu vào (`req.body`). Thử nghiệm gửi `{ mode: "INVALID", facts: "NOT_AN_ARRAY" }` tới `/api/legal-reasoning` không bị chặn ở tầng HTTP 400 mà đi thẳng vào lệnh gọi Gemini API. | `FIND-SEC-02` |
| **3. File Upload Validation** | **PARTIAL (P2)** | `CreateDocumentModal.tsx:79` giới hạn 15 MB ở client; `server.ts:17` giới hạn `express.json({ limit: '20mb' })`. Tuy nhiên `server.ts:288-340` chỉ kiểm tra chuỗi `mimeType`/đuôi tệp mà không kiểm tra chữ ký nhị phân (Magic Bytes: `%PDF-` hoặc `PK\x03\x04`). | `FIND-SEC-04` |
| **4. Prompt Injection Protection** | **PARTIAL (P2)** | Dữ liệu người dùng nhập (`customQuestion`, `contractText`, `extractedTextFromDocxOrRaw`, `facts`) được nối trực tiếp vào template literal của prompt mà không lọc chuỗi thoát (delimiter escaping) hoặc tách thành `user` content turn riêng biệt với `systemInstruction`. | `FIND-SEC-04` |
| **5. API Key Exposure** | **PASS (VERIFIED)** | `GEMINI_API_KEY` chỉ được đọc trên `server.ts:20` (`process.env.GEMINI_API_KEY`), không xuất hiện trong bất kỳ tệp client `src/*` hay gói bundle `dist/*` nào. | — |
| **6. Cross-User Data Access** | **PASS (Single-Tenant)** | Máy chủ `server.ts` hoàn toàn stateless (không lưu biến toàn cục dùng chung giữa các request); dữ liệu người dùng lưu trên `localStorage` của từng trình duyệt. | — |
| **7. Audit Trail (Nhật ký Kiểm toán)** | **PARTIAL (P2)** | Có nhật ký `auditLogs` (`App.tsx:992`) và `StageGateAuditView` (`appendAuditTrail`), nhưng lưu trên `localStorage` dạng JSON thuần chưa có chuỗi băm liên kết (hash-chain) chống chỉnh sửa nhật ký. | `FIND-SEC-05` |
| **8. Error Disclosure & Security Headers** | **FAIL (P2)** | `server.ts` trả về header `X-Powered-By: Express` (đã xác minh qua `PROBE 1`) và trả trực tiếp `error.message` nguyên bản trong mọi khối `catch` (`res.status(500).json({ error: message })`). | `FIND-SEC-05` |
| **9. Rate Limiting** | **FAIL (P1)** | Không có bộ giới hạn tần suất gọi API (Rate Limiter per IP/session) trên `server.ts`, dẫn tới rủi ro DoS tài chính / cạn kiệt hạn ngạch `GEMINI_API_KEY`. | `FIND-SEC-01` |
| **10. Backup, Restore & Export Safety (XSS)** | **FAIL (P1)** | Lỗ hổng **Stored DOM XSS** trong `BackupAndStatsModal.tsx:164-166` (dùng `innerHTML` không escape `d.title`, `d.code`, `d.text` trong tệp HTML xuất ra) và `LegalReasoningAndCaseView.tsx:351-405` (nối trực tiếp dữ liệu hồ sơ vào `doc.write(html)` khi in A4). | `FIND-SEC-03` |

---

### 2. Chi tiết các Phát hiện Bảo mật Trọng yếu (`FIND-SEC-01` .. `FIND-SEC-05`)

#### `FIND-SEC-01` — [P1] Thiếu Rate Limiting và Kiểm soát Truy cập trên 8 Endpoint AI trong `server.ts`
- **Severity:** **P1 (High)**
- **File / Line:** `server.ts:13-32, 34, 97, 141, 204, 272, 438, 539, 705`
- **Evidence:** Tất cả 8 route `app.post('/api/*')` đều gọi trực tiếp `ai.models.generateContent` ngay khi nhận request mà không có bộ đếm giới hạn số request/phút trên mỗi IP (`rateLimiter`).
- **Root Cause:** Chưa cấu hình middleware giới hạn tần suất (Rate Limiting) và xác thực phiên làm việc tại `server.ts`.
- **Impact:** Kẻ tấn công hoặc script tự động có thể gửi hàng nghìn request liên tiếp tới `/api/ocr-dossier-extract` (với payload 20 MB) hoặc `/api/legal-reasoning`, gây nghẽn bộ nhớ Node.js và làm cạn kiệt quota `GEMINI_API_KEY`.
- **Proposed Fix:** Bổ sung middleware Rate Limiter (tối đa 20 requests / phút / IP cho các route AI) và tắt `app.disable('x-powered-by')` trong `server.ts`.
- **Test Case:** `TC-AUDIT-SEC-01`
- **Status:** **VERIFIED (OPEN)**

#### `FIND-SEC-02` — [P1] Thiếu kiểm tra Schema Đầu vào (Input Validation) tại toàn bộ API `server.ts`
- **Severity:** **P1 (High)**
- **File / Line:** `server.ts:34-793`
- **Evidence:**
  Trong `PROBE 2` và `PROBE 3`, khi gửi `POST /api/legal-reasoning` với body `{}` hoặc `{ mode: "INVALID_MODE_XSS_<script>", referenceDate: "not-a-date", facts: "NOT_AN_ARRAY" }`, `server.ts:705-749` không trả về `HTTP 400 Bad Request` mà vẫn truyền thẳng `facts: "NOT_AN_ARRAY"` vào `JSON.stringify(facts)` và gọi `ai.models.generateContent`!
- **Root Cause:** Không kiểm tra kiểu dữ liệu, độ dài chuỗi tối đa và giá trị enum hợp lệ của `req.body` trước khi gọi SDK `@google/genai`.
- **Impact:** Tốn chi phí gọi LLM vô ích cho các request rác/lỗi, đồng thời tạo bề mặt tấn công Prompt Injection và DoS.
- **Proposed Fix:** Viết bộ validator tất định kiểm tra chặt chẽ mọi trường bắt buộc (`mode` thuộc 3 giá trị enum, `referenceDate` khớp `/^\d{4}-\d{2}-\d{2}$/`, `facts` là mảng không rỗng, giới hạn độ dài chuỗi) và trả về `HTTP 400` ngay lập tức nếu vi phạm.
- **Test Case:** `TC-AUDIT-SEC-02`
- **Status:** **VERIFIED (OPEN)**

#### `FIND-SEC-03` — [P1] Lỗ hổng Stored DOM XSS khi Xuất HTML Độc lập và In Báo cáo Pháp lý A4
- **Severity:** **P1 (High)**
- **File / Line:**
  - `src/components/BackupAndStatsModal.tsx:164-166`
  - `src/ui/views/LegalReasoningAndCaseView.tsx:351-405`
- **Evidence:**
  1. Tại `src/components/BackupAndStatsModal.tsx:164-166`, mã JavaScript nhúng trong tệp HTML xuất ra thực thi:
     ```js
     viewerEl.innerHTML = '<h1>' + d.title + '</h1><p><b>Số hiệu:</b> ' + d.code + ' · <b>Lĩnh vực:</b> ' + d.category + '</p><hr><pre>' + d.text + '</pre>';
     listEl.innerHTML = data.docs.map(d => '<button class="card" data-id="'+d.id+'"><b>'+d.code+'</b><br><small>'+d.title+'</small></button>').join('');
     ```
     Nếu một văn bản nạp từ tệp ngoài chứa `<img src=x onerror=alert(document.domain)>` trong `title` hoặc `text`, việc mở tệp HTML độc lập sẽ kích hoạt thực thi mã độc JavaScript.
  2. Tại `src/ui/views/LegalReasoningAndCaseView.tsx:351-405`, hàm `handlePrintEvidenceReport` nối trực tiếp `activeCase.title`, `activeCase.client_or_unit`, `f.event_title`, `f.description` vào chuỗi `html` rồi gọi `doc.write(html)` trên `iframe` cùng nguồn (same-origin).
- **Root Cause:** Nối chuỗi HTML thủ công (`innerHTML` / `doc.write`) mà không qua hàm `escapeHtml()`.
- **Impact:** Cho phép thực thi JavaScript trái phép (XSS) trong ngữ cảnh trình duyệt của người dùng khi in báo cáo A4 hoặc mở bản sao lưu HTML.
- **Proposed Fix:** Xây dựng hàm `escapeHtml(str: string)` chuẩn (mã hóa `&`, `<`, `>`, `"`, `'`) và áp dụng cho mọi biến nội suy trong `BackupAndStatsModal.tsx`, `LegalReasoningAndCaseView.tsx` và `ConsolidatedDocumentDrawer.tsx`.
- **Test Case:** `TC-AUDIT-SEC-03`
- **Status:** **VERIFIED (OPEN)**

#### `FIND-SEC-04` & `FIND-SEC-05` — [P2] Kiểm tra Magic Bytes khi tải tệp, chống Prompt Injection và ẩn `X-Powered-By`
- **Severity:** **P2 (Medium)**
- **File / Line:** `server.ts:14-18, 89-93, 272-369`
- **Evidence:**
  1. `PROBE 1 (/api/health)` xác nhận máy chủ trả về header `X-Powered-By: Express`.
  2. Tại `server.ts:288-340`, nếu người dùng gửi tệp giả danh `.pdf` hoặc `.docx`, máy chủ chưa kiểm tra 4 byte đầu tiên của `Buffer.from(base64Data, 'base64')` (`%PDF` = `0x25504446`, `DOCX/ZIP` = `0x504B0304`).
  3. Toàn bộ 7 endpoint gọi Gemini trong `server.ts` đều đặt cả chỉ thị hệ thống lẫn dữ liệu người dùng chung trong một chuỗi `prompt` thay vì tách `config.systemInstruction` (trừ endpoint OCR) và lọc thẻ đóng `"""`.
- **Proposed Fix:**
  1. Thêm `app.disable('x-powered-by')` trong `server.ts`.
  2. Kiểm tra Magic Bytes cho PDF/DOCX/PNG/JPEG/WEBP tại `/api/ocr-dossier-extract`.
  3. Tách `systemInstruction` riêng biệt cho mọi endpoint Gemini và làm sạch dữ liệu đầu vào.
- **Test Case:** `TC-AUDIT-SEC-04`, `TC-AUDIT-SEC-05`
- **Status:** **VERIFIED (OPEN)**
