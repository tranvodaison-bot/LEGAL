# KẾ HOẠCH & DANH MỤC CÔNG VIỆC TRIỂN KHAI (IMPLEMENTATION BACKLOG)
**Dự án:** ĐẠI SƠN LEGAL — Legal Knowledge & Reasoning Platform  
**Giai đoạn:** Bước 1 (Hoàn thiện) — Chuẩn hóa Backlog Bước 2 có Truy vết 1–1 / 1–n với `Risk ID`, `GAP ID` và `Test Case ID`  
**Nguyên tắc:** Chỉ triển khai sau khi Bước 1 được nghiệm thu; bảo toàn toàn bộ giao diện và chức năng đã có.

---

## 1. MA TRẬN BACKLOG CHI TIẾT THEO 4 PHASE (`BL-1.1` ĐẾN `BL-4.2`)

### PHASE 1: KHÓA TOÀN BỘ 5 RỦI RO P0 & CHUẨN HÓA TÍNH TRUNG THỰC PHÁP LUẬT (`P0-01`..`P0-05`)

| Backlog ID | Tên Hạng mục Sửa lỗi / Nâng cấp | Đường dẫn Tệp Mã nguồn Thực tế Cần Cập nhật / Tạo mới | Risk ID Giải quyết | GAP ID Giải quyết | Test Case ID Nghiệm thu | Nội dung Thực hiện Cụ thể |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BL-1.1** | **Mở rộng Schema Tính Trung thực Pháp luật, Cấp Điểm (`Point`) & Phiên bản Thời gian** | - Cập nhật `src/types/legal.ts` | `P0-01`<br>`P0-02`<br>`P0-03`<br>`P1-01` | `GAP-01`<br>`GAP-02`<br>`GAP-03`<br>`GAP-04`<br>`GAP-07` | `TC-P0-01`<br>`TC-P0-02`<br>`TC-P0-03`<br>`TC-P1-01` | Bổ sung `LegalAuthenticityTier`, `DocumentConsolidationNature`, `OfficialSourceProvenance` (`completeness_ratio`, `is_immutable`, `source_file_sha256`), `LegalPointItem`, `ProvisionTemporalVersion`, `TransitionalProvisionRule`, `CitationVerificationResult`, `LegalReasoningTrace`. |
| **BL-1.2** | **Chuẩn hóa Metadata 43 Văn bản theo Công báo, Gắn `authenticity_tier` & Chặn Tự sinh `original_text` Giả định** | - Cập nhật `src/data/legalCorpus.ts`<br>- Cập nhật `src/components/InPlaceClauseDiffViewer.tsx` (dòng 62–97)<br>- Cập nhật `src/components/ContinuousA4Reader.tsx`<br>- Cập nhật `src/App.tsx` (`CatalogDocumentCard`) | `P0-02`<br>`P2-01` | `GAP-02`<br>`GAP-04` | `TC-P0-02`<br>`TC-P2-01` | 1. Sửa lại chính xác tên/trích yếu và ngày hiệu lực theo nguồn chính thức (`chinhphu.vn`, `moc.gov.vn`) cho các văn bản bị gán sai số hiệu hoặc lệch ngày (`108/2025/QH15` là Luật Quản lý thuế; chuẩn hóa `15/2021/NĐ-CP` vs `15/2023/NĐ-CP`; chuẩn hóa trích yếu `209/2026/NĐ-CP`, `33, 37, 38/2026/TT-BXD`, `09/VBHN-BCT`; cập nhật đúng `issue_date: 2025-12-10` & `effective_date: 2026-07-01` cho `135/2025/QH15`).<br>2. Gỡ bỏ liên kết sửa đổi giả định của `108/2025/QH15` khỏi `Điều 6` Luật Kế toán `88/2015/QH13`; bổ sung `points`, `temporal_versions`, `transitional_rules` thật cho `88/2015/QH13` + `56/2024/QH15`.<br>3. Sửa `InPlaceClauseDiffViewer.tsx` dòng 72–74: không tự sinh câu giả định làm `original_text`.<br>4. Hiển thị rõ chỉ số `completeness_ratio` (`Đã nạp X/Y Điều · Z/W Khoản`) và bộ lọc `Authenticity Tier`. |
| **BL-1.3** | **Khóa Chặn AI Ghi đè SSoT (`/api/expand-full-document`) & Áp dụng Quarantine Gate + SHA-256 Thật cho OCR** | - Cập nhật `src/App.tsx` (dòng 642–643, 969–1067)<br>- Cập nhật `server.ts` (dòng 353, 438–525)<br>- Cập nhật `src/utils/ocrClient.ts` (dòng 19–29)<br>- Cập nhật `src/components/CreateDocumentModal.tsx` (dòng 48, 90, 261, 276–297) | `P0-01`<br>`P0-04` | `GAP-01`<br>`GAP-05` | `TC-P0-01`<br>`TC-P0-04` | 1. Vô hiệu hóa hành vi nối điều khoản do AI sinh vào `doc.articles` của văn bản SSoT trong `src/App.tsx`; lọc bỏ các điều khoản có prefix `-art-exp-` khỏi kho SSoT khi khởi tạo.<br>2. Xóa chỉ dẫn *"suy luận từ tiêu đề tệp"* tại `server.ts:353`.<br>3. Sửa `computeFileSha256Short` tại `src/utils/ocrClient.ts:19-29` trả về mã băm SHA-256 chuẩn 64 ký tự hex, xóa bỏ `Math.random()`.<br>4. Lưu `sha256Hash` trong `CreateDocumentModal.tsx` và gán `authenticity_tier: 'UNVERIFIED_INGESTION_QUARANTINE'` kèm quy trình xác nhận đối chiếu Công báo. |
| **BL-1.4** | **Tách biệt Rạch ròi "Bản Tổng hợp Nội bộ" và "Văn bản Hợp nhất Chính thức (VBHN)"** | - Cập nhật `src/components/ConsolidatedDocumentDrawer.tsx` (dòng 308–310, 736–741, 1390–1406) | `P0-03` | `GAP-03` | `TC-P0-03` | Đổi tiêu đề và chân chữ ký của bản do phần mềm tự ghép thành **`BẢN TỔNG HỢP NỘI BỘ PHỤC VỤ TRA CỨU (INTERNAL WORKING SYNTHESIS)`**; xóa bỏ việc tự sinh số hiệu `VBHN-...` và con dấu đỏ `[Đã ký & Xác thực Hợp nhất SSoT]`; bổ sung hộp thông báo phân biệt với VBHN chính thức theo Pháp lệnh `01/2012/UBTVQH13`. |
| **BL-1.5** | **Xóa bỏ Toàn bộ AI Fallback Giả định (`DEFAULT_AQUA_RESPONSE` & Ma trận 4 Luật Cứng)** | - Cập nhật `src/components/AquaAssistantDrawer.tsx` (dòng 22–31, 66, 111–139)<br>- Cập nhật `src/components/CrossLawAiDrawer.tsx` (dòng 44–130, 148–151, 204–216) | `P0-05` | `GAP-06` | `TC-P0-05` | 1. Xóa hằng số `DEFAULT_AQUA_RESPONSE` và các nhánh `if/else` trả lời sẵn trong `AquaAssistantDrawer.tsx`; khi lỗi API hoặc thiếu căn cứ, hiển thị thông báo `Honest Abstention Protocol` và trích xuất trực tiếp các điều khoản khớp từ khóa trong SSoT.<br>2. Xóa bỏ mảng 4 luật cứng trong `buildBaselineCrossLawMatrix` tại `CrossLawAiDrawer.tsx`; chỉ hiển thị các cạnh `directCrossRefs` có thật trong SSoT khi chưa chạy hoặc khi lỗi AI. |

---

### PHASE 2: ĐỒ THỊ TRI THỨC PHÁP LÝ, HIỆU LỰC THỜI GIAN & KIỂM CHỨNG TRÍCH DẪN (`P1-01`, `P1-02`, `P2-02`)

| Backlog ID | Tên Hạng mục Sửa lỗi / Nâng cấp | Đường dẫn Tệp Mã nguồn Thực tế Cần Cập nhật / Tạo mới | Risk ID Giải quyết | GAP ID Giải quyết | Test Case ID Nghiệm thu | Nội dung Thực hiện Cụ thể |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BL-2.1** | **Xây dựng Bộ giải Hiệu lực theo Thời điểm (`PointInTimeLegalResolver`) & Điều khoản Chuyển tiếp** | - Tạo mới `src/utils/pointInTimeResolver.ts`<br>- Cập nhật `src/App.tsx` (Header Cột 3)<br>- Cập nhật `src/components/InPlaceClauseDiffViewer.tsx`<br>- Cập nhật `src/components/DocumentGenealogyTreeDrawer.tsx` | `P1-01` | `GAP-07` | `TC-P1-01`<br>`TC-P1-02` | Cài đặt hàm deterministic `resolveDocumentAtDate` và `resolveClauseAtDate(clause, asOfDate, transactionDate)` đối chiếu `[effective_from, effective_to)` và `TransitionalProvisionRule`; tích hợp bộ chọn ngày **`Thời điểm áp dụng pháp luật (asOfDate)`** trên giao diện. |
| **BL-2.2** | **Xây dựng Bộ Kiểm chứng Trích dẫn (`CitationVerifier`) & Nâng cấp Cross-Law Audit** | - Tạo mới `src/utils/citationVerifier.ts`<br>- Cập nhật `src/components/CrossLawAiDrawer.tsx`<br>- Cập nhật `server.ts` (`/api/cross-law-matrix`) | `P1-02` | `GAP-08` | `TC-P1-03` | Cài đặt `verifyCitationAgainstCorpus(citation, documents)` kiểm tra sự tồn tại của số hiệu văn bản, số Điều, số Khoản và trạng thái hiệu lực tại `asOfDate`; gắn nhãn `VERIFIED_IN_SSOT`, `DOC_FOUND_ARTICLE_NOT_LOADED`, hoặc chặn `BLOCKED_HALLUCINATION`. |
| **BL-2.3** | **Nâng cấp Thuật toán Diff Từng từ theo Phân đoạn cho Văn bản Dài** | - Cập nhật `src/components/SideBySideComparisonView.tsx` (dòng 41–140) | `P2-02` | `GAP-12` | `TC-P2-02` | Thay thế nhánh cắt cứng `similarityPercent: 45` (dòng 59–68) bằng cơ chế chia theo từng đoạn/dòng rồi chạy LCS từng từ để văn bản dài vẫn giữ được diff chính xác. |

---

### PHASE 3: BỘ MÁY LẬP LUẬN PHÁP LÝ 3 CHẾ ĐỘ × 6 BƯỚC `IRAC+` (`P1-03`)

| Backlog ID | Tên Hạng mục Sửa lỗi / Nâng cấp | Đường dẫn Tệp Mã nguồn Thực tế Cần Cập nhật / Tạo mới | Risk ID Giải quyết | GAP ID Giải quyết | Test Case ID Nghiệm thu | Nội dung Thực hiện Cụ thể |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BL-3.1** | **Xây dựng Endpoint `/api/legal-reasoning` Chuẩn 6 Bước & Hậu kiểm Trích dẫn** | - Cập nhật `server.ts` | `P1-03` | `GAP-09` | `TC-P1-04`<br>`TC-P1-05` | Triển khai `POST /api/legal-reasoning` hỗ trợ 3 chế độ (`JUDICIAL_ANALYSIS`, `LEGAL_COUNSEL`, `LEGAL_AUDIT`) với `responseSchema` bắt buộc 6 bước (`step1_issue` → `step6_conclusion`), chỉ nhận tập quy phạm đã khóa từ SSoT tại `asOfDate`. |
| **BL-3.2** | **Xây dựng Giao diện `LegalReasoningDrawer.tsx` (Workbench Lập luận 6 Bước)** | - Tạo mới `src/components/LegalReasoningDrawer.tsx`<br>- Cập nhật `src/App.tsx` | `P1-03` | `GAP-09` | `TC-P1-04`<br>`TC-P1-05` | Giao diện Drawer cho phép chọn chế độ (`Judicial Analysis`, `Legal Counsel`, `Legal Audit`), chọn ngày sự kiện `asOfDate`, đính kèm tình tiết/chứng cứ, hiển thị minh bạch 6 bước lập luận kèm kết quả kiểm tra `CitationVerifier` cho từng căn cứ. |

---

### PHASE 4: KHÔNG GIAN HỒ SƠ VỤ VIỆC & BÁO CÁO DỰA TRÊN BẰNG CHỨNG (`P1-04`)

| Backlog ID | Tên Hạng mục Sửa lỗi / Nâng cấp | Đường dẫn Tệp Mã nguồn Thực tế Cần Cập nhật / Tạo mới | Risk ID Giải quyết | GAP ID Giải quyết | Test Case ID Nghiệm thu | Nội dung Thực hiện Cụ thể |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BL-4.1** | **Tích hợp Dòng thời gian Sự kiện Vụ việc (`CaseFactTimeline`) vào Kiểm toán Stage-Gate** | - Cập nhật `src/components/StageGateAuditView.tsx`<br>- Cập nhật `src/hooks/useComplianceGraph.ts` | `P1-04` | `GAP-10` | `TC-P1-06` | Cho phép gắn ngày sự kiện thực tế cho từng Gate/Bước hồ sơ trong vụ việc, tự động kiểm tra hiệu lực của quy phạm pháp luật đúng tại ngày sự kiện đó và khóa cổng `LOCKED_GATE` khi thiếu chứng cứ có `SHA-256` hợp lệ. |
| **BL-4.2** | **Xây dựng Trình Kết xuất Báo cáo Pháp lý Dựa trên Bằng chứng (`EvidenceBasedReportModal.tsx`)** | - Tạo mới `src/components/EvidenceBasedReportModal.tsx`<br>- Cập nhật `src/components/GlobalAuditSummaryPanel.tsx` | `P1-04` | `GAP-11` | `TC-P1-07` | Xuất báo cáo kiểm toán/tư vấn/phân tích xét xử chuẩn A4 & JSON gồm: Thông tin vụ việc, Bảng quy phạm SSoT (kèm nguồn gốc, tỷ lệ toàn văn & hiệu lực tại `asOfDate`), Danh mục chứng cứ SHA-256, Chuỗi lập luận 6 bước và Tuyên bố giới hạn dữ liệu. |

---

## 2. BẢNG ĐỐI CHIẾU TRUY VẾT TỔNG HỢP (100% COVERAGE MATRIX)

| Risk ID | Mức độ | GAP ID | Backlog ID | Test Case ID |
| :--- | :---: | :--- | :--- | :--- |
| **P0-01** | P0 | `GAP-01` | `BL-1.1`, `BL-1.3` | `TC-P0-01` |
| **P0-02** | P0 | `GAP-02`, `GAP-04` | `BL-1.1`, `BL-1.2` | `TC-P0-02` |
| **P0-03** | P0 | `GAP-03` | `BL-1.1`, `BL-1.4` | `TC-P0-03` |
| **P0-04** | P0 | `GAP-05` | `BL-1.3` | `TC-P0-04` |
| **P0-05** | P0 | `GAP-06` | `BL-1.5` | `TC-P0-05` |
| **P1-01** | P1 | `GAP-07` | `BL-1.1`, `BL-2.1` | `TC-P1-01`, `TC-P1-02` |
| **P1-02** | P1 | `GAP-08` | `BL-2.2` | `TC-P1-03` |
| **P1-03** | P1 | `GAP-09` | `BL-3.1`, `BL-3.2` | `TC-P1-04`, `TC-P1-05` |
| **P1-04** | P1 | `GAP-10`, `GAP-11` | `BL-4.1`, `BL-4.2` | `TC-P1-06`, `TC-P1-07` |
| **P2-01** | P2 | `GAP-04` | `BL-1.2` | `TC-P2-01` |
| **P2-02** | P2 | `GAP-12` | `BL-2.3` | `TC-P2-02` |
