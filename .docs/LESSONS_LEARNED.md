# NHẬT KÝ BÀI HỌC KINH NGHIỆM & NGUYÊN NHÂN GỐC RỄ (LESSONS LEARNED) — ĐẠI SƠN LEGAL

## 1. Các Bài học Cốt lõi về Tính Trung thực Pháp lý (Legal Truthfulness)

### Bài học 01 — Không bao giờ kết luận văn bản pháp luật là giả định chỉ dựa trên năm ban hành (2025–2026)
- **Hiện tượng:** Trong kho `src/data/legalCorpus.ts` có nhiều văn bản mang năm ban hành `2025` và `2026` (như Luật `91/2025/QH15`, `116/2025/QH15`, `117/2025/QH15`, `122/2025/QH15`, `135/2025/QH15`, Nghị định `165/2025/NĐ-CP`, `356/2025/NĐ-CP`, `206..333/2026/NĐ-CP`).
- **Nguyên nhân gốc rễ (Root Cause):** Nếu chỉ nhìn năm ban hành để suy đoán thì sẽ phân loại sai các đạo luật có thật đã được Quốc hội khóa XV thông qua tại Kỳ họp thứ 9 (tháng 6/2025) và Kỳ họp thứ 10 (tháng 12/2025). Ngược lại, khi tra cứu đối chiếu trực tiếp trên Công báo (`chinhphu.vn`, `moc.gov.vn`), đã phát hiện chính xác **07 văn bản bị gán sai số hiệu sang tên luật/trích yếu khác** (nghiêm trọng nhất là `108/2025/QH15` — thực tế là *Luật Quản lý thuế* nhưng bị ghi nhầm thành *Luật sửa đổi Luật Kế toán về IFRS*, và `15/2023/NĐ-CP` mang nội dung của `15/2021/NĐ-CP`).
- **Giải pháp khắc phục:** Luôn đối chứng từng văn bản với nguồn chính thức (`chinhphu.vn`, `moc.gov.vn`, `vbpl.vn`), đính chính số hiệu/trích yếu/ngày hiệu lực chuẩn xác và gắn trường `authenticity_tier` + `completeness_ratio` cho từng bản ghi.

### Bài học 02 — Cấm để AI ghi đè trực tiếp vào kho dữ liệu gốc SSoT (`P0-01`)
- **Hiện tượng:** Hàm `handleExpandFullDocumentWithAi` tại `src/App.tsx:969-1067` gọi `/api/expand-full-document` (`server.ts:438-525`) và nối thẳng các điều khoản do LLM tự sáng tác vào `doc.articles` của văn bản SSoT.
- **Nguyên nhân gốc rễ:** Thiếu ranh giới phân vùng lưu trữ giữa dữ liệu pháp quy đã xác minh (`VERIFIED_SSOT`) và bản nháp phân tích của AI (`AI_ANALYSIS_DRAFT`).
- **Giải pháp khắc phục:** Khóa chặt kho `VERIFIED_SSOT` ở chế độ bất biến đối với đầu ra của AI; mọi nội dung do AI sinh ra phải lưu ở phân vùng tách biệt và gắn cờ `is_ai_draft: true`.

### Bài học 03 — Cấm dùng `Math.random()` hoặc chuỗi giả định để che giấu lỗi (`P0-04`, `P0-05`, `P2-01`)
- **Hiện tượng:**
  1. `src/utils/ocrClient.ts:27` dùng `Math.random()` sinh chuỗi 64 ký tự hex giả làm mã SHA-256 khi đọc tệp lỗi.
  2. `src/components/AquaAssistantDrawer.tsx:134` trả về `DEFAULT_AQUA_RESPONSE` (về Luật BVDLCN) cho mọi câu hỏi khi API lỗi.
  3. `src/components/InPlaceClauseDiffViewer.tsx:72-74` tự ghép chuỗi tạo câu văn bản gốc giả định khi thiếu mảng `clauses`.
- **Nguyên nhân gốc rễ:** Tư duy "demo-first" cố gắng không để giao diện báo lỗi bằng cách bịa dữ liệu mẫu. Trong phần mềm pháp lý và kiểm toán, dữ liệu giả tạo còn nguy hiểm hơn gấp nhiều lần so với thông báo lỗi.
- **Giải pháp khắc phục:** Xóa bỏ hoàn toàn mọi khối sinh dữ liệu giả trong `catch` hoặc fallback; thay thế bằng trạng thái `Error` / `Empty` chuẩn xác và trung thực.

### Bài học 04 — Thuật toán Diff trên văn bản pháp luật dài (`P2-02`)
- **Hiện tượng:** `src/components/SideBySideComparisonView.tsx:58-68` kiểm tra `if (a.length * b.length > 250000)` thì bỏ qua so sánh từ và gán cứng `similarityPercent: 45`.
- **Nguyên nhân gốc rễ:** Chạy thuật toán quy hoạch động LCS trực tiếp trên toàn bộ mảng từ của điều khoản dài gây tốn bộ nhớ $O(N \times M)$.
- **Giải pháp khắc phục:** Thiết kế `deterministicDiffEngine.ts` sử dụng thuật toán so sánh phân cấp 2 pha (tách theo câu/khoản trước, sau đó chạy LCS cấp từ trên từng cặp câu thay đổi), đảm bảo tính đúng tỷ lệ tương đồng thực tế `100%` ở mọi độ dài văn bản.
