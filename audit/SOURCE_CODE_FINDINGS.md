# ĐẠI SƠN LEGAL — KIỂM TOÁN MÃ NGUỒN & KIẾN TRÚC (SOURCE CODE & ARCHITECTURE FINDINGS)

Tài liệu này ghi nhận kết quả đọc và đối chứng trực tiếp toàn bộ mã nguồn tại `src/App.tsx`, `server.ts`, `package.json`, `src/core/`, `src/modules/`, `src/infrastructure/`, `src/components/`, `src/ui/`, `src/data/` và `tests/contract.spec.ts`.

---

## 1. BẢNG TỔNG HỢP PHÁT HIỆN MÃ NGUỒN & KIẾN TRÚC

| Finding ID | Severity | Tệp & Dòng mã | Loại vi phạm | Trạng thái |
| :--- | :---: | :--- | :--- | :---: |
| **`FIND-ARCH-01`** | **P0** | `src/App.tsx:2169-2180`, `src/components/CreateDocumentModal.tsx:336`, `src/modules/legal-library/legalLibrary.service.ts:52-63` | Bypass Service Layer & Direct SSoT Mutation + Dead Code | **VERIFIED** |
| **`FIND-ARCH-02`** | **P1** | `src/infrastructure/api/legalApiClient.ts:6-50`, `server.ts:705-785`, `src/ui/views/LegalReasoningAndCaseView.tsx:233-246` | Inconsistent API Contract & Dead Infrastructure Module | **VERIFIED** |
| **`FIND-ARCH-03`** | **P1** | `src/App.tsx:165-177`, `src/infrastructure/storage/partitionedStorage.ts:12-17` | Duplicate / Split-Brain Storage Keys | **VERIFIED** |
| **`FIND-ARCH-04`** | **P1** | `src/App.tsx:2214-2234`, `src/components/BackupAndStatsModal.tsx:180-253` | Bypass Integrity Validator on JSON Restore + Fabricated Dates | **VERIFIED** |
| **`FIND-ARCH-05`** | **P1** | `src/ui/views/LegalReasoningAndCaseView.tsx:118-171`, `src/core/engines/pointInTimeResolver.ts:71-86` | Unhandled Synchronous Throw in React Render (`useMemo`) | **VERIFIED** |
| **`FIND-ARCH-06`** | **P1** | `src/App.tsx:1954-1985`, `src/components/StageGateAuditView.tsx:458-500`, `src/components/ContractReviewView.tsx:83-85` | Silent Fallback Masking API Failures (Violates 4-State UI) | **VERIFIED** |
| **`FIND-ARCH-07`** | **P2** | `src/App.tsx:1-4828` | Monolithic God Component & Direct `fetch` / `localStorage` Coupling | **VERIFIED** |
| **`FIND-INT-04`** | **P2** | `src/infrastructure/storage/partitionedStorage.ts:39-49` | Unused Export / Dead Reader (`loadAiDraftForDocument`) | **VERIFIED** |

---

## 2. CHI TIẾT TỪNG PHÁT HIỆN (FINDING DETAILS)

### `FIND-ARCH-01` — [P0] Luồng nạp văn bản OCR bỏ qua `ingestOcrDocumentToQuarantine` và ghi thẳng vào kho SSoT

- **Severity:** **P0 (Critical Blocker)**
- **File / Line:**
  - `src/modules/legal-library/legalLibrary.service.ts:52-63`
  - `src/infrastructure/storage/partitionedStorage.ts:51-75`
  - `src/components/CreateDocumentModal.tsx:304-336`
  - `src/App.tsx:1113`, `src/App.tsx:2169-2180`
- **Evidence:**
  1. Tại `src/modules/legal-library/legalLibrary.service.ts:52-63`, hàm `ingestOcrDocumentToQuarantine(doc: LegalDocument, sha256Hash: string)` được định nghĩa để lưu văn bản OCR vào `STORAGE_KEYS.QUARANTINE_OCR` (`daison_legal_quarantine_ocr_v1`).
  2. Kiểm tra toàn bộ mã nguồn bằng `grep -rn "ingestOcrDocumentToQuarantine\|loadQuarantineDocuments\|saveQuarantineDocument" src/`: **Không có bất kỳ component hay view nào gọi các hàm này.**
  3. Tại `src/components/CreateDocumentModal.tsx:336`, khi người dùng nhấn **"Lưu vào Thư viện ĐẠI SƠN"** sau khi chạy OCR, component gọi `onSaveNewDocument(newDoc, newCrossRef)`.
  4. Tại `src/App.tsx:2169-2180`, `handleSaveNewDocument` thực thi:
     ```ts
     setDocuments((prev) => {
       const filtered = prev.filter(
         (d) =>
           d.id !== newDoc.id &&
           d.doc_number.toUpperCase() !== newDoc.doc_number.toUpperCase()
       );
       return [newDoc, ...filtered];
     });
     ```
  5. Ngay sau đó, `useDebouncedStorageEffect(STORAGE_KEYS.DOCS, documents, 350)` (`src/App.tsx:1113`) ghi đè toàn bộ mảng `documents` (đã lẫn văn bản OCR mới nạp và甚至 ghi đè luôn văn bản SSoT cũ nếu trùng `doc_number`!) xuống `localStorage['daison_os_documents_v5']`.
- **Root Cause:** Tầng UI (`CreateDocumentModal.tsx` và `App.tsx`) không đi qua `legalLibrary.service.ts` khi lưu văn bản mới mà thao tác trực tiếp trên React state `documents`.
- **Impact:**
  1. Phá vỡ hoàn toàn cơ chế cách ly `QUARANTINE_OCR` (`P0-04`): Văn bản OCR chưa được kiểm duyệt viên đối chiếu bản gốc vẫn trộn lẫn vào kho `documents` SSoT.
  2. Nguy hiểm hơn: dòng `d.doc_number.toUpperCase() !== newDoc.doc_number.toUpperCase()` tại `src/App.tsx:2177` cho phép một tệp OCR có số hiệu trùng với văn bản SSoT (VD: `135/2025/QH15`) **xóa sổ và thay thế hoàn toàn văn bản SSoT gốc** trong phiên làm việc!
- **Proposed Fix:**
  1. Trong `handleSaveNewDocument` (`src/App.tsx`), nếu `newDoc.authenticity_tier === 'QUARANTINE_REVIEW'` hoặc `newDoc.status === 'DANG_DU_THAO'`, bắt buộc gọi `ingestOcrDocumentToQuarantine(newDoc, newDoc.sha256_hash || '')` để lưu vào `STORAGE_KEYS.QUARANTINE_OCR` và **tuyệt đối không cho phép ghi đè** bất kỳ văn bản nào đang có trong `INITIAL_LEGAL_DOCUMENTS`.
  2. Hiển thị danh sách `loadQuarantineDocuments()` trong một tab/ngăn "Hàng đợi Kiểm duyệt OCR (`QUARANTINE_REVIEW`)" riêng biệt, yêu cầu thao tác phê duyệt tường minh trước khi chuyển sang SSoT.
- **Test Case:** `TC-AUDIT-ARCH-01`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-ARCH-02` — [P1] Lệch hợp đồng API (Broken Contract) giữa `legalApiClient.ts` và `server.ts` + Dead Code

- **Severity:** **P1 (High)**
- **File / Line:**
  - `src/infrastructure/api/legalApiClient.ts:6-50`
  - `server.ts:705-785`
  - `src/ui/views/LegalReasoningAndCaseView.tsx:233-246`
- **Evidence:**
  1. `src/infrastructure/api/legalApiClient.ts:32` xuất hàm `invokeLegalReasoningApi(payload: LegalReasoningRequestPayload)`. Kết quả tìm kiếm `grep -rn "invokeLegalReasoningApi" src/` cho thấy hàm này **không được import ở bất kỳ đâu**.
  2. Trong `LegalReasoningAndCaseView.tsx:233`, giao diện gọi trực tiếp `fetch('/api/legal-reasoning', ...)` mà bỏ qua `legalApiClient.ts`.
  3. Đối chiếu hợp đồng dữ liệu giữa `legalApiClient.ts` và `server.ts`:
     - **Request:** `legalApiClient.ts:18` định nghĩa trường `candidateProvisions`, trong khi `server.ts:713` đọc `rulesContext` từ `req.body`.
     - **Response:** `legalApiClient.ts:42,49` kiểm tra `if (!response.ok || !data || !data.reasoning)` và trả về `data.reasoning as IRACPlusReasoningOutput`, trong khi `server.ts:785` trả về `return res.json({ aiReasoning: parsed })`. Nếu gọi `invokeLegalReasoningApi`, hàm này sẽ luôn ném lỗi ở dòng 42!
- **Root Cause:** Khi xây dựng `LegalReasoningAndCaseView.tsx` và `server.ts`, lập trình viên viết `fetch` trực tiếp trong view và thay đổi cấu trúc JSON trả về thành `{ aiReasoning }`, bỏ quên `src/infrastructure/api/legalApiClient.ts`.
- **Impact:** Vi phạm nguyên tắc Clean Architecture (UI gọi thẳng `fetch` thay vì đi qua `infrastructure/api`), tồn tại mã chết (dead code) và hợp đồng kiểu (type contract) sai lệch.
- **Proposed Fix:** Chuẩn hóa DTO giữa `server.ts` và `legalApiClient.ts`, sau đó bắt buộc `LegalReasoningAndCaseView.tsx` gọi qua `invokeLegalReasoningApi()` thuộc tầng `infrastructure/api`.
- **Test Case:** `TC-AUDIT-ARCH-02`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-ARCH-03` — [P1] Phân mảnh khóa lưu trữ `localStorage` giữa `App.tsx` và `partitionedStorage.ts`

- **Severity:** **P1 (High)**
- **File / Line:**
  - `src/App.tsx:165-177`
  - `src/infrastructure/storage/partitionedStorage.ts:12-17`
- **Evidence:**
  - `src/infrastructure/storage/partitionedStorage.ts:12-17` khai báo:
    ```ts
    export const STORAGE_KEYS = {
      VERIFIED_SSOT: 'daison_legal_ssot_v14_verified_corpus',
      QUARANTINE_OCR: 'daison_legal_quarantine_ocr_v1',
      AI_DRAFTS: 'daison_legal_ai_draft_notes_v1',
      CASE_WORKSPACES: 'daison_legal_case_workspaces_v1',
    } as const;
    ```
  - Tuy nhiên, `src/App.tsx:165-177` lại khai báo một hằng số nội bộ trùng tên `STORAGE_KEYS` với `DOCS: 'daison_os_documents_v5'`, và toàn bộ ứng dụng lưu kho văn bản vào `'daison_os_documents_v5'`. Khóa `STORAGE_KEYS.VERIFIED_SSOT` (`'daison_legal_ssot_v14_verified_corpus'`) trong `partitionedStorage.ts` hoàn toàn không được đọc hay ghi ở bất kỳ đâu.
- **Root Cause:** Không hợp nhất quản lý lưu trữ của `App.tsx` vào `src/infrastructure/storage/partitionedStorage.ts`.
- **Impact:** Gây hiểu nhầm khi kiểm toán bảo mật/lưu trữ địa phương và làm phân mảnh kiến trúc lưu trữ phân vùng.
- **Proposed Fix:** Chuyển toàn bộ thao tác đọc/ghi kho SSoT của `App.tsx` về dùng chung `STORAGE_KEYS` và các hàm helper có kiểm tra toàn vẹn trong `src/infrastructure/storage/partitionedStorage.ts`.
- **Test Case:** `TC-AUDIT-ARCH-03`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-ARCH-04` — [P1] Luồng Khôi phục Sao lưu JSON bỏ qua `prepareVerifiedCorpus` và tự sinh ngày hiệu lực giả

- **Severity:** **P1 (High)**
- **File / Line:**
  - `src/components/BackupAndStatsModal.tsx:180-253`
  - `src/App.tsx:2214-2234`
- **Evidence:**
  1. Tại `BackupAndStatsModal.tsx:212-215`, khi nhập tệp JSON định dạng cũ (`parsed.docs`), hệ thống tự gán:
     ```ts
     issue_date: new Date().toISOString().slice(0, 10),
     effective_date: new Date().toISOString().slice(0, 10),
     status: 'CON_HIEU_LUC',
     ```
     cho mọi văn bản được nhập mà không biết ngày ban hành/ngày hiệu lực thật.
  2. Tại `src/App.tsx:2220-2234`, `handleImportBackupData` nối thẳng `uniqueIncoming` vào `setDocuments((prev) => [...prev, ...uniqueIncoming])` mà **không chạy `prepareVerifiedCorpus(uniqueIncoming)` hay `validateCorpusIntegrity(uniqueIncoming)`**.
- **Root Cause:** Thiếu bước kiểm duyệt và làm giàu siêu dữ liệu (`enrichDocumentIntegrityMetadata`) tại cổng nhập sao lưu JSON.
- **Impact:** Nếu tệp JSON sao lưu chứa các điều khoản do AI sinh ra từ phiên bản cũ (`is_ai_draft: true` hoặc `-art-exp-`), hoặc chứa các văn bản không có `authenticity_tier` / `completeness_meta`, chúng sẽ đi thẳng vào kho `documents` SSoT mà không bị lọc bỏ.
- **Proposed Fix:** Bắt buộc chạy `prepareVerifiedCorpus` và lọc bỏ các điều khoản `is_ai_draft` trong `handleImportBackupData`; với văn bản từ bản sao lưu thiếu ngày hiệu lực gốc, phải gắn `authenticity_tier: 'QUARANTINE_REVIEW'` thay vì tự gán ngày hiện tại và trạng thái `CON_HIEU_LUC`.
- **Test Case:** `TC-AUDIT-ARCH-04`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-ARCH-05` — [P1] Lỗi ném ngoại lệ đồng bộ (`throw new Error`) trong `useMemo` tại `LegalReasoningAndCaseView.tsx`

- **Severity:** **P1 (High)**
- **File / Line:**
  - `src/ui/views/LegalReasoningAndCaseView.tsx:118-171`
  - `src/core/engines/pointInTimeResolver.ts:71-86`
- **Evidence:**
  - Hàm `resolveProvisionAtDate` (`pointInTimeResolver.ts:73,83`) ném ngoại lệ đồng bộ `throw new Error(...)` nếu không tìm thấy `doc_id` hoặc `article_no`.
  - Tại `LegalReasoningAndCaseView.tsx:144-155` (`deterministicReasoning`) và `160-171` (`primaryPitResolution`), component gọi `buildDeterministicIRACBaseline` và `resolveProvisionAtDate` ngay bên trong `useMemo` **không có khối `try / catch`**.
  - Đặc biệt, tại `LegalReasoningAndCaseView.tsx:126-139`, `targetProvisions` gán cứng `doc-lxd-135-2025` (`Điều 14`) và `doc-ldd-31-2024` (`Điều 45`). Khi người dùng đổi `selectedDocId` hoặc nếu `selectedArticleNo` trong một nhịp render chưa kịp đồng bộ với `selectedDocId` mới, `resolveProvisionAtDate` sẽ `throw Error` ngay trong pha render và làm sập toàn bộ ứng dụng (do không có React Error Boundary).
- **Root Cause:** Gọi hàm domain có thể `throw` bên trong `useMemo` của React mà không bọc `try/catch` hoặc trả về kiểu `Result<T, Error>`.
- **Impact:** Nguy cơ sập trắng trang (White Screen of Death) khi người dùng chuyển đổi nhanh giữa các văn bản trong tab Suy luận Pháp lý IRAC+.
- **Proposed Fix:** Bọc `try/catch` bên trong `deterministicReasoning` và `primaryPitResolution` tại `LegalReasoningAndCaseView.tsx`, đồng thời bổ sung `ErrorBoundary` bọc quanh từng phân hệ chính.
- **Test Case:** `TC-AUDIT-ARCH-05`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-ARCH-06` — [P1] Tự động ghi đè văn bản fallback khi lỗi API tại `handleRunMcpAudit` và `StageGateAuditView`

- **Severity:** **P1 (High)**
- **File / Line:**
  - `src/App.tsx:1954-1985`
  - `src/components/StageGateAuditView.tsx:458-502`
  - `src/components/ContractReviewView.tsx:83-85`
- **Evidence:**
  - Mặc dù `AquaAssistantDrawer.tsx` đã xóa `DEFAULT_AQUA_RESPONSE` để tuân thủ `P0-05`, tại `src/App.tsx:1970-1985` (`handleRunMcpAudit` gọi `/api/legal-audit`), khối `catch` vẫn tự động sinh chuỗi `fallbackAnalysis` và lưu vào `mcpAnalysisMap` cũng như `mcpAuditRecords` **mà không hiển thị trạng thái lỗi (Error State)** cho người dùng biết cuộc gọi AI đã thất bại.
  - Tương tự, tại `src/components/StageGateAuditView.tsx:468-475`, ngay cả khi `response.ok` là `false` (ví dụ HTTP 500), hệ thống vẫn gán `audited_by: 'Gemini 3.8 Multi-Agent MCP'` cho bản tóm tắt nội bộ!
- **Root Cause:** Chưa áp dụng đồng bộ quy tắc 4-State UI (`Empty / Loading / Error / Success`) và cấm mạo danh nhãn AI cho 3 luồng `/api/legal-audit`, `/api/stage-gate-audit`, `/api/contract-review`.
- **Impact:** Người dùng hiểu lầm rằng kết quả fallback tĩnh trên màn hình là kết quả phân tích trực tiếp từ mô hình Gemini 3.8.
- **Proposed Fix:** Hiển thị rõ banner lỗi kết nối (`Error State`) khi API trả về lỗi, và nếu hiển thị kết quả đối soát tất định nội bộ thì phải gắn nhãn `[Đối soát Tất định Nội bộ — Offline/Không dùng AI]`, tuyệt đối không gắn nhãn `audited_by: 'Gemini 3.8 Multi-Agent MCP'`.
- **Test Case:** `TC-AUDIT-ARCH-06`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-ARCH-07` — [P2] `src/App.tsx` vẫn là God Component (4.828 dòng) và `loadAiDraftForDocument` chưa được kết nối UI (`FIND-INT-04`)

- **Severity:** **P2 (Medium)**
- **File / Line:**
  - `src/App.tsx:1-4828`
  - `src/infrastructure/storage/partitionedStorage.ts:39-49`
- **Evidence:**
  1. `src/App.tsx` có kích thước 215.749 bytes (4.828 dòng), ôm đồm cả 3 cột thư viện, MCP Inspector, tìm kiếm, bộ lọc và 11 `useDebouncedStorageEffect`.
  2. Hàm `loadAiDraftForDocument(docId)` trong `src/infrastructure/storage/partitionedStorage.ts:39` được viết để đọc các điều khoản nháp AI đã lưu cách ly, nhưng không có bất kỳ component nào gọi hàm này. Do đó, sau khi người dùng bấm nút mở rộng điều khoản AI và nhận thông báo toast *"Đã lưu Bản nháp AI vào phân vùng cách ly (AI_DRAFTS)"*, người dùng không có cách nào xem lại các điều khoản nháp đó trên giao diện.
- **Root Cause:** Quá trình chuyển đổi sang Clean Architecture mới tách các dịch vụ mới vào `src/core/` và `src/modules/`, chưa tách phần trình đọc 3 cột cũ ra khỏi `src/App.tsx` và chưa thêm ngăn xem `AI_DRAFTS` cách ly.
- **Impact:** Giảm khả năng bảo trì dài hạn và gây hụt hẫng trải nghiệm khi bản nháp AI được lưu vào `localStorage` nhưng không thể mở xem.
- **Proposed Fix:** Bổ sung chế độ bật/tắt xem "Bản nháp tham khảo AI (Cách ly khỏi SSoT)" đọc từ `loadAiDraftForDocument(doc.id)` với viền cảnh báo màu hổ phách rõ ràng, và tách dần Cột 1, Cột 2, Cột 3 từ `src/App.tsx` sang `src/ui/views/`.
- **Test Case:** `TC-AUDIT-ARCH-07`
- **Status:** **VERIFIED (OPEN)**
