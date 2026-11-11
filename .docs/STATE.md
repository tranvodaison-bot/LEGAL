# TRẠNG THÁI DỰ ÁN & THEO DÕI STAGE GATE (PROJECT STATE & GATE TRACKER)

**Tên Dự án:** ĐẠI SƠN LEGAL — Legal Knowledge & Reasoning Platform  
**Kiến trúc:** Enterprise Vibe Coding & Clean Architecture (`src/core` → `src/modules` → `src/infrastructure` → `src/ui`)  
**Cập nhật lần cuối:** 2026-11-10  
**Trạng thái tổng thể:** `HOÀN TẤT 4 GATE (GATE 1 -> GATE 4: 100% PASS)`

---

## 1. BẢNG THEO DÕI 4 CỔNG KIỂM SOÁT (STAGE GATES)

| Cổng (Gate) | Hạng mục kiểm soát | Trạng thái | Bằng chứng xác thực |
| :--- | :--- | :---: | :--- |
| **Gate 1: Governance & Contract Spec** | Thiết lập `.antigravity/rules.md`, `.docs/ARCHITECTURE.md`, `.docs/STATE.md`, `.docs/LESSONS_LEARNED.md` và bộ kiểm thử hợp đồng `tests/contract.spec.ts` | `[x] PASS` | Tệp quản trị đã lưu trên đĩa; `npm test` thực thi tự động qua `tsx --test tests/contract.spec.ts` |
| **Gate 2: Core Logic & P0/P1/P2 Remediation** | Khắc phục triệt để `P0-01`..`P0-05`, `P1-01`..`P1-04`, `P2-01`..`P2-02`; xây dựng `PointInTimeResolver`, `CitationVerifier`, `DeterministicDiffEngine`, `LegalReasoningEngine` | `[x] PASS` | `09/09` bài kiểm thử hợp đồng trong `tests/contract.spec.ts` (`TC-P0-01`..`TC-P2-02`) đạt `100% PASS` |
| **Gate 3: Security, Performance & 4-State UI** | Đảm bảo lưu trữ phân vùng (`VERIFIED_SSOT`, `QUARANTINE_OCR`, `AI_DRAFTS`, `CASE_WORKSPACES`), băm `SHA-256` chuẩn FIPS 180-4, UI 4 trạng thái (`Empty`, `Loading`, `Error`, `Success`) | `[x] PASS` | Xóa bỏ hoàn toàn `Math.random()` trong `ocrClient.ts` và `DEFAULT_AQUA_RESPONSE` trong `AquaAssistantDrawer.tsx` |
| **Gate 4: Build, Linter & Final Acceptance** | Kiểm tra biên dịch `compile_applet`, kiểm tra tĩnh `lint_applet` (`tsc --noEmit`) và toàn bộ bộ test tự động | `[x] PASS` | `npm test` PASS `9/9`, `compile_applet` PASS, `lint_applet` `0 errors` |

---

## 2. DANH MỤC HẠNG MỤC ĐÃ HOÀN THÀNH CHI TIẾT

- `[x]` **Khắc phục P0-01 (Chặn AI tự sinh ghi đè SSoT):** Cập nhật `server.ts` (`/api/expand-full-document`), `src/modules/legal-library/legalLibrary.service.ts` (`attachAiExpandedDraftSafely`) và `src/App.tsx` (`handleExpandFullDocumentWithAi`) để lưu bản nháp mở rộng AI vào phân vùng cách ly `AI_DRAFTS`, bảo toàn nguyên vẹn `doc.articles` của `VERIFIED_SSOT`.
- `[x]` **Khắc phục P0-02 (Chuẩn hóa 43 văn bản & Completeness Metadata):** Đính chính 07 văn bản từng bị gán sai số hiệu/trích yếu (`108/2025/QH15`, `15/2021/NĐ-CP`, `209/2026/NĐ-CP`, `33/2026/TT-BXD`, `37/2026/TT-BXD`, `38/2026/TT-BXD`, `13/VBHN-BCT`, `THNB-LKT-88-2015`), sửa chuẩn ngày ban hành/hiệu lực của 12 văn bản năm 2025–2026 và hiển thị huy hiệu `X/Y Điều` (`completeness_meta`) trên thẻ văn bản.
- `[x]` **Khắc phục P0-03 (Phân biệt VBHN Chính thức vs Bản Tổng hợp Nội bộ):** Cập nhật `src/components/ConsolidatedDocumentDrawer.tsx` và `src/App.tsx` để chỉ đóng dấu xác thực VBHN cho văn bản có `authenticity_tier === 'OFFICIAL_VBHN'`, còn lại hiển thị rõ nhãn `BẢN TỔNG HỢP NỘI BỘ PHỤC VỤ TRA CỨU` với mã `THNB-...`.
- `[x]` **Khắc phục P0-04 (Xóa SHA-256 giả tạo & Cách ly OCR):** Triển khai `src/infrastructure/crypto/sha256.ts` chuẩn FIPS 180-4, xóa bỏ `Math.random()` trong `src/utils/ocrClient.ts`, cấm đoán số hiệu từ `filename` trong `server.ts`, và đưa văn bản OCR mới nạp vào trạng thái `QUARANTINE_REVIEW` (`DANG_DU_THAO`) trong `src/components/CreateDocumentModal.tsx`.
- `[x]` **Khắc phục P0-05 (Xóa Fallback AI giả tạo khi lỗi mạng):** Xóa bỏ `DEFAULT_AQUA_RESPONSE` trong `src/components/AquaAssistantDrawer.tsx`, thay bằng giao diện 4 trạng thái chuẩn (`Empty`, `Loading`, `Error`, `Success`) và gắn nhãn nguồn minh bạch trong `src/components/CrossLawAiDrawer.tsx`.
- `[x]` **Triển khai P1-01..P1-04 (PointInTimeResolver, CitationVerifier, 6-Step IRAC+ Reasoning & CaseWorkspace):** Xây dựng đầy đủ các engine trong `src/core/engines/`, dịch vụ trong `src/modules/` và giao diện tích hợp tại `src/ui/views/LegalReasoningAndCaseView.tsx`.
- `[x]` **Khắc phục P2-01 & P2-02 (In-place Diff & Deterministic Diff Engine):** Xóa bỏ chuỗi gốc tự sinh giả định trong `src/components/InPlaceClauseDiffViewer.tsx` và thay thế giới hạn `similarityPercent: 45` trong `src/components/SideBySideComparisonView.tsx` bằng thuật toán `HIERARCHICAL_SENTENCE_WORD_LCS` tại `src/core/engines/deterministicDiffEngine.ts`.
