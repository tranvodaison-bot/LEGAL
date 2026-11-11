# ĐẠI SƠN LEGAL — DANH MỤC KHẮC PHỤC ƯU TIÊN (`REMEDIATION_BACKLOG.md`)

**Ngày lập:** 11/11/2026  
**Nguyên tắc:** Chỉ triển khai sau khi Chủ đầu tư / Người dùng phê duyệt kết quả Kiểm toán Độc lập. Các hạng mục **P0** là điều kiện tiên quyết bắt buộc trước khi nghiệm thu hệ thống.

---

## 1. SPRINT P0 — CÁC CHỐT CHẶN NGHIÊM TRỌNG BẮT BUỘC XỬ LÝ TRƯỚC KHI GO-LIVE (6 HẠNG MỤC)

### Hạng mục `REM-P0-01` (Khắc phục `FIND-ARCH-01`: Chặn OCR ghi thẳng vào SSoT)
- **Tệp cần sửa:**
  - `src/components/CreateDocumentModal.tsx` (dòng `317–340`)
  - `src/App.tsx` (dòng `2169–2180`)
  - `src/modules/legal-library/legalLibrary.service.ts` (dòng `52–74`)
- **Nội dung sửa chữa:**
  1. Gắn cờ nguồn gốc `ingestion_source: 'OCR_UPLOAD' | 'MANUAL_ENTRY'` khi tạo văn bản từ `CreateDocumentModal`.
  2. Trong `handleSaveNewDocument` (`App.tsx`), nếu văn bản được tạo từ OCR hoặc không có `official_source_url` hợp lệ kèm mã băm xác thực, bắt buộc gọi `ingestOcrDocumentToQuarantine()` và lưu vào kho cách ly `UNVERIFIED_OCR_QUARANTINE` (`daison_legal_ocr_quarantine_v1`), tuyệt đối không ghi vào hay ghi đè `documents` (SSoT).
- **Test nghiệm thu:** `TC-AUDIT-01`.

---

### Hạng mục `REM-P0-02` (Khắc phục `FIND-CORPUS-01` & `FIND-CORPUS-04`: Chuẩn hóa tổng số Điều thực tế của toàn bộ 43 văn bản)
- **Tệp cần sửa:**
  - `src/core/corpus/corpusIntegrityValidator.ts` (dòng `13–63`)
  - `src/data/legalCorpus.ts` (bổ sung trường `total_articles_count` chính xác cho cả 43 văn bản)
- **Nội dung sửa chữa:**
  1. Bổ sung đầy đủ tổng số điều thực tế theo Công báo cho toàn bộ 43 văn bản trong `OFFICIAL_TOTAL_ARTICLES_MAP` (ví dụ: `38/2019/QH14`: 152 Điều, `86/2015/QH13`: 60 Điều, `29/2018/QH14`: 28 Điều, `85/2016/NĐ-CP`: 35 Điều, `58/2016/QH13`: 82 Điều, `13/2020/QH14`: 74 Điều, `08/2021/QH15`: 176 Điều, `33/2024/QH15`: 86 Điều, `27/2023/QH15`: 83 Điều, `29/2023/QH15`: 83 Điều, `31/2024/QH15`: 260 Điều...).
  2. Xóa bỏ hoàn toàn nhánh lấy `doc.compliance_stats?.total_sections` và nhánh fallback `|| loadedCount` trong `computeDocumentCompleteness`. Nếu một văn bản chưa khai báo `total_articles_count`, mặc định xếp loại `EXCERPT` (Trích lục), cấm xếp loại `FULL_TEXT (100%)`.
- **Test nghiệm thu:** `TC-AUDIT-02`, `TC-AUDIT-12`.

---

### Hạng mục `REM-P0-03` (Khắc phục `FIND-CORPUS-02` & `FIND-CORPUS-05`: Làm sạch triệt để dư chấn số hiệu sai trên toàn hệ thống)
- **Tệp cần sửa:**
  - `src/data/legalCorpus.ts` (dòng `1346–1359, 1404–1418, 1549, 1595, 2413–2447, 2532–2549, 3155`)
  - `src/data/stageGateCorpus.ts` (dòng `52, 85, 291, 313, 396, 424, 445, 513, 566, 625, 772`)
  - `src/components/SideBySideComparisonView.tsx` (dòng `80`)
  - `server.ts` (dòng `365, 590`)
- **Nội dung sửa chữa:**
  1. Thay thế toàn bộ tham chiếu `Luật số 108/2025/QH15` (gắn với sửa đổi Luật Kế toán) thành `Luật số 56/2024/QH15` và bổ sung `previous_excerpt` nguyên văn năm 2015 cho `Điều 16, 18, 20, 29` của `doc-lkt-88-2015`.
  2. Thay thế toàn bộ tham chiếu `15/2023/NĐ-CP` (gắn với Quản lý dự án đầu tư xây dựng) thành `175/2024/NĐ-CP` hoặc `15/2021/NĐ-CP` đúng bản chất pháp lý.
  3. Sửa số hiệu Luật Đấu thầu tại `stageGateCorpus.ts` từ `23/2023/QH15` thành `22/2023/QH15` và ánh xạ lại 8 khóa ngoại `doc_id` đứt gãy.
- **Test nghiệm thu:** `TC-AUDIT-03`, `TC-AUDIT-13`.

---

### Hạng mục `REM-P0-04` (Khắc phục `FIND-CORPUS-03`: Tách biệt văn bản dự phóng/mô phỏng 2026 và sửa phân loại `OFFICIAL_VBHN`)
- **Tệp cần sửa:**
  - `src/core/corpus/corpusIntegrityValidator.ts` (dòng `81–145`)
  - `src/data/legalCorpus.ts` (dòng `575–576, 1791–2353`)
- **Nội dung sửa chữa:**
  1. Tại `doc-nd-15-2023` (`15/2021/NĐ-CP`), xóa `is_consolidated: true` (hoặc chuyển thông tin `06/VBHN-BXD` sang trường ghi chú tham khảo) để không bị phân loại nhầm thành `OFFICIAL_VBHN`.
  2. Trong `classifyCorpusTier()`, bắt buộc kiểm tra sự tồn tại của `official_source_url` hợp lệ và không gắn nhãn `VERIFIED_SSOT` / `VERIFIED_EXCERPT` cho 15 văn bản dự phóng năm 2026 chưa có nguồn Công báo chính thức (chuyển sang phân vùng `INTERNAL_SYNTHESIS` / `REFERENCE_DRAFT` có cảnh báo rõ ràng).
- **Test nghiệm thu:** `TC-AUDIT-04`.

---

### Hạng mục `REM-P0-05` (Khắc phục `FIND-INT-01`: Kiểm증 đến cấp Khoản/Điểm và tích hợp `CitationVerifier` vào luồng AI thực tế)
- **Tệp cần sửa:**
  - `src/core/verification/citationVerifier.ts` (dòng `46–97`)
  - `src/components/LegalReasoningAndCaseView.tsx` (dòng `253–296`)
- **Nội dung sửa chữa:**
  1. Trong `verifySingleCitation`, chuẩn hóa so khớp `doc_number` chính xác (không dùng `.includes()` hai chiều gây dương tính giả) và khi `extractedClauseNo` có giá trị (ví dụ `Khoản 999`), bắt buộc kiểm tra Khoản đó có tồn tại thực sự trong `matchedArticle.clauses` hoặc nội dung định danh `1. / 2. / Khoản X` của Điều đó; nếu không tồn tại phải trả về `UNVERIFIED_CITATION`.
  2. Tích hợp `verifyCitations()` trực tiếp vào luồng nhận kết quả từ `/api/legal-reasoning` trong `LegalReasoningAndCaseView.tsx` để hiển thị huy hiệu `VERIFIED` / `UNVERIFIED` cho từng căn cứ pháp lý do AI trả về.
- **Test nghiệm thu:** `TC-AUDIT-05`.

---

### Hạng mục `REM-P0-06` (Khắc phục `FIND-INT-02` & `FIND-INT-03`: Sửa lỗi `PointInTimeResolver` trả văn bản tương lai cho ngày quá khứ)
- **Tệp cần sửa:**
  - `src/core/temporal/pointInTimeResolver.ts` (dòng `27–44, 189–248`)
  - `src/data/legalCorpus.ts` (bổ sung `previous_excerpt` cho các điều đã sửa đổi)
- **Nội dung sửa chữa:**
  1. Khi `queryDate < amendmentDate` trên một điều có `is_amended === true`, nếu thiếu `previous_excerpt`, **tuyệt đối không trả về `targetArticle.content` dưới nhãn `EFFECTIVE_ORIGINAL`**; phải trả về trạng thái cảnh báo rõ ràng (`HISTORICAL_TEXT_UNAVAILABLE`) hoặc tra cứu từ `amendment_history` / `previous_excerpt` đã bổ sung đầy đủ.
  2. Cập nhật `DEFAULT_TRANSITIONAL_RULES` trỏ đúng tới `doc_id` thực tế trong kho (`doc-lxd-2014`, `doc-nd-15-2023`).
- **Test nghiệm thu:** `TC-AUDIT-06`, `TC-AUDIT-14`.

---

## 2. SPRINT P1 — CÁC HẠNG MỤC BẢO MẬT, KIẾN TRÚC VÀ TOÀN VẸN CẤP CAO (9 HẠNG MỤC)

| Mã hạng mục | Khắc phục Finding | Nội dung thực hiện | Tệp tác động |
| :--- | :--- | :--- | :--- |
| **`REM-P1-01`** | `FIND-SEC-01`, `FIND-SEC-02`, `FIND-SEC-05` | Bổ sung middleware kiểm tra schema đầu vào (`HTTP 400` khi thiếu trường hoặc vượt ngưỡng ký tự), Rate Limiting theo IP trên `/api/*`, tắt `x-powered-by` và ẩn `error.message` nội bộ | `server.ts` |
| **`REM-P1-02`** | `FIND-SEC-03` | Viết hàm `escapeHtml()` lọc toàn bộ dữ liệu động trước khi kết xuất báo cáo HTML/Print; xóa bỏ `document.write` không lọc dữ liệu | `src/components/BackupAndStatsModal.tsx`, `src/components/LegalReasoningAndCaseView.tsx` |
| **`REM-P1-03`** | `FIND-ARCH-02` | Đồng bộ hóa schema payload của `legalApiClient.ts` với `server.ts` và kết nối `LegalReasoningAndCaseView.tsx` sử dụng `legalApiClient` | `src/infrastructure/api/legalApiClient.ts`, `src/components/LegalReasoningAndCaseView.tsx` |
| **`REM-P1-04`** | `FIND-ARCH-03` | Hợp nhất hằng số `STORAGE_KEYS` về một nguồn duy nhất tại `src/infrastructure/storage/localStorageAdapter.ts` | `src/App.tsx`, `src/infrastructure/storage/localStorageAdapter.ts` |
| **`REM-P1-05`** | `FIND-ARCH-04` | Buộc luồng Import JSON trong `BackupAndStatsModal` đi qua `prepareVerifiedCorpus` và không tự gán ngày hiệu lực giả `2026-01-01` | `src/components/BackupAndStatsModal.tsx`, `src/App.tsx` |
| **`REM-P1-06`** | `FIND-ARCH-05` | Bọc `try/catch` an toàn quanh `resolveDocumentAtDate` trong `LegalReasoningAndCaseView.tsx` | `src/components/LegalReasoningAndCaseView.tsx` |
| **`REM-P1-07`** | `FIND-ARCH-06` | Xóa bỏ hoàn toàn dữ liệu AI mẫu và trạng thái `Pass` giả định trong khối `catch` của `handleRunMcpAudit` và `StageGateAuditView.tsx` | `src/App.tsx`, `src/components/StageGateAuditView.tsx` |

---

## 3. SPRINT P2 — HOÀN THIỆN KIỂM THỬ & LÀM SẠCH MÃ NGUỒN (3 HẠNG MỤC)

1. **`REM-P2-01` (`FIND-INT-04`):** Kết nối `loadAiDraftForDocument` vào giao diện tab `Kho Bản nháp AI (AI_DRAFTS)` để người dùng xem lại các bản nháp đã lưu kèm nhãn cảnh báo không có giá trị pháp lý.
2. **`REM-P2-02` (`FIND-SEC-04`):** Kiểm tra magic bytes (`%PDF-`, `\x89PNG`, `\xFF\xD8\xFF`) cho tệp tải lên `/api/ocr-extract` và bọc delimiter chống Prompt Injection.
3. **`REM-P2-03` (`FIND-TEST-01`):** Mở rộng `tests/contract.spec.ts` bổ sung đầy đủ các bài kiểm thử `TC-AUDIT-01` đến `TC-AUDIT-21`.
