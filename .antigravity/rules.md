# AGENT SYSTEM INSTRUCTIONS & OPERATING PROTOCOL — ĐẠI SƠN LEGAL

## 1. NGUYÊN TẮC BẤT BIẾN (CORE INVARIANTS)

### 1.1. Single Source of Truth (SSoT) về Kiến trúc & Quy phạm Pháp luật
1. **SSoT Kiến trúc Kỹ thuật:** Mọi quyết định kỹ thuật, schema dữ liệu, ranh giới Deterministic Engine / AI Engine và API contract PHẢI được cập nhật và lưu giữ tại `.docs/ARCHITECTURE.md` (đồng bộ với bộ tài liệu kiểm toán `/LEGAL_DOMAIN_DATA_MODEL.md` và `/TARGET_WORKFLOW.md`).
2. **SSoT Pháp lý (Legal Truthfulness Invariant):**
   - **Cấm tuyệt đối AI tự sinh điều khoản vào SSoT (`P0-01`):** Không bao giờ được nối nội dung do LLM sinh ra vào mảng `articles` của văn bản thuộc kho `VERIFIED_SSOT`.
   - **Chuẩn xác Số hiệu, Trích yếu & Phân tầng Xác thực (`P0-02`):** Mọi văn bản phải đối chứng với Công báo / CSDL Quốc gia (`vbpl.vn`, `chinhphu.vn`, `moc.gov.vn`), ghi rõ `authenticity_tier` (`VERIFIED_SSOT`, `OFFICIAL_VBHN`, `EXCERPT_ONLY`, `QUARANTINE_REVIEW`, `INTERNAL_SYNTHESIS`) và `completeness_ratio` (`loaded_articles / total_articles`).
   - **Phân biệt Văn bản Hợp nhất Chính thức & Bản Tổng hợp Nội bộ (`P0-03`):** Bản tự ghép nối điều khoản sửa đổi trên trình duyệt chỉ được gắn nhãn `BẢN TỔNG HỢP NỘI BỘ PHỤC VỤ TRA CỨU (INTERNAL WORKING SYNTHESIS)`, nghiêm cấm tự gán số hiệu `VBHN-...` hoặc đóng dấu đỏ xác thực giả.
   - **Khóa an toàn Pipeline OCR & SHA-256 (`P0-04`):** Cấm AI suy đoán số hiệu từ tên tệp; cấm dùng `Math.random()` sinh mã băm SHA-256 giả; mọi văn bản nạp qua OCR phải đi vào hàng đợi `QUARANTINE_REVIEW` trước khi duyệt lên `VERIFIED_SSOT`.
   - **Cấm Silent AI Fallback giả tạo (`P0-05`):** Khi mất mạng hoặc lỗi API AI, hệ thống phải trả về trạng thái `Error` minh bạch kèm dữ liệu đối chiếu xác định từ kho SSoT; nghiêm cấm trả về câu trả lời/ma trận mẫu cố định không liên quan.

### 1.2. Quản lý Trạng thái Liên tục (`.docs/STATE.md` & `.docs/LESSONS_LEARNED.md`)
- Trước và sau mỗi phase thực thi, cập nhật tiến độ vào `.docs/STATE.md`.
- Mọi nguyên nhân gốc rễ (Root Cause) khi kiểm toán và debug phải được ghi nhận tại `.docs/LESSONS_LEARNED.md`.

### 1.3. Zero Regression
- Bảo toàn 100% các tính năng hiện hữu của hệ thống (Trình đọc A4 liên tục, Mục lục tự động highlight, Biểu đồ phả hệ D3, So sánh song song, In-place Diff, Kiểm tra tuân thủ, Quản lý hồ sơ, Xuất báo cáo).
- Áp dụng Clean Architecture phân tầng (`src/core/`, `src/modules/`, `src/infrastructure/`, `src/ui/`) tương thích ngược với các component hiện có.

### 1.4. Test-Driven Verification (Gate 1 & Gate 2)
- Mọi hàm xử lý nghiệp vụ cốt lõi (Point-in-Time Legal Resolver, Citation Verifier, Deterministic Diff Engine, Corpus Integrity Validator, Legal Reasoning Engine) bắt buộc phải đi kèm bộ kiểm thử tự động (`tests/contract.spec.ts` và `src/modules/*/*.test.ts`).
- Mã nguồn chỉ được coi là hoàn thành khi Test Runner (`npm test`) báo `100% PASS` và trình kiểm tra kiểu (`npm run lint`) đạt `0 errors`.

---

## 2. MÁY TRẠNG THÁI 4 BƯỚC & 4 CỔNG KIỂM SOÁT (EXECUTION PHASES & STAGE GATES)

- **Gate 1 (Thấu triệt & Kiến trúc):** Chốt `.docs/ARCHITECTURE.md`, `.docs/STATE.md`, `.docs/LESSONS_LEARNED.md` và tạo `tests/contract.spec.ts`.
- **Gate 2 (Triển khai Core/Modules, Khắc phục P0/P1/P2 & Unit Test):** Hoàn thiện `src/core/`, `src/modules/`, `src/infrastructure/`, khắc phục triệt để `P0-01`..`P0-05`, `P1-01`..`P1-04`, `P2-01`..`P2-02` và chạy `npm test` đạt `100% PASS`.
- **Gate 3 (Kiểm toán Bảo mật, Hiệu năng & Chuẩn 4 Trạng thái UI):** Đảm bảo các UI Component xử lý đầy đủ `Loading`, `Empty`, `Error`, `Success`; kiểm tra chống Prompt Injection trên `server.ts`.
- **Gate 4 (Đóng gói Production & Nghiệm thu):** Chạy `compile_applet`, `lint_applet`, `npm test` và cập nhật biên bản nghiệm thu cuối cùng.
