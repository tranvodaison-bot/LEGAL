# KIẾN TRÚC NGHIỆP VỤ & CHUỖI VẬN HÀNH MỤC TIÊU (TARGET WORKFLOW)
**Dự án:** ĐẠI SƠN LEGAL — Legal Knowledge & Reasoning Platform  
**Giai đoạn:** Bước 1 (Hoàn thiện) — Thiết kế Kiến trúc 6 Phân hệ, Ranh giới Deterministic/AI & Đồng bộ Ma trận Truy vết  
**Chuỗi giá trị cốt lõi:**  
`Trusted Legal Data → Legal Library → Legal Knowledge Graph → Cross-Law Audit → Legal Reasoning → Evidence-based Report`

---

## 1. CHUỖI VẬN HÀNH KHÉP KÍN & CÁC CHỐT CHẶN BẢO VỆ (END-TO-END WORKFLOW)

```
[NGUỒN CHÍNH THỨC: Công báo / vbpl.vn / chinhphu.vn / moc.gov.vn]
   │
   ▼  (Chốt chặn P0-01, P0-02, P0-04: Cấm AI tự sinh điều khoản SSoT; Cấm suy đoán số hiệu OCR; Băm SHA-256 64-hex)
[PHÂN HỆ 1: LEGAL LIBRARY & TRUSTED DATA]
   │  • Phân tầng 4 cấp: VERIFIED_OFFICIAL_SSOT | PARTIAL_VERIFIED_EXTRACT | UNVERIFIED_INGESTION_QUARANTINE | INTERNAL_GUIDE_SANDBOX
   │  • Hiển thị tỷ lệ toàn văn: completeness_ratio (Đã nạp X/Y Điều · Z/W Khoản)
   │  • Tách biệt: OFFICIAL_SIGNED_VBHN vs. INTERNAL_WORKING_SYNTHESIS (Chốt chặn P0-03)
   ▼
[PHÂN HỆ 2: LEGAL KNOWLEDGE GRAPH & POINT-IN-TIME RESOLVER]
   │  • Đồ thị có hướng cấp độ Văn bản → Điều → Khoản → Điểm (AMENDS, REPEALS, GUIDES, CONSTRAINS, TRANSITIONAL)
   │  • Bộ giải hiệu lực thời gian: resolveProvisionAtDate(doc, article, asOfDate, inceptionDate) (Giải quyết P1-01)
   ▼
[PHÂN HỆ 3: CROSS-LAW AUDIT ENGINE]
   │  • Lớp 1 (Deterministic): Truy vấn trực tiếp các cạnh đồ thị có thật trong SSoT
   │  • Lớp 2 (Grounded AI + CitationVerifier): Phân tích rủi ro xuất toán liên luật và kiểm tra tồn tại trích dẫn (Chốt chặn P0-05, P1-02)
   ▼
[PHÂN HỆ 4: LEGAL AI REASONING ENGINE (3 Chế độ × 6 Bước IRAC+)]
   │  • 3 Chế độ: JUDICIAL_ANALYSIS | LEGAL_COUNSEL | LEGAL_AUDIT
   │  • 6 Bước bắt buộc: Issue → Rule → Interpretation → Application → Counterargument → Conclusion
   │  • Honest Abstention Protocol: Cấm trả lời mẫu cố định khi lỗi API / thiếu dữ liệu SSoT (Chốt chặn P0-05, P1-03)
   ▼
[PHÂN HỆ 5: LEGAL CASE WORKSPACE]
   │  • Quản lý Hồ sơ vụ việc, Dòng thời gian sự kiện (CaseFactMilestone), Chứng cứ có SHA-256 và Khóa cổng 17 Stage-Gates (Giải quyết P1-04)
   ▼
[PHÂN HỆ 6: GOVERNANCE & EVIDENCE-BASED REPORT]
      • Xuất Báo cáo Pháp lý dựa trên Bằng chứng kèm Bảng đối chiếu quy phạm SSoT, Phiên bản thời điểm, Dấu vân tay số SHA-256 và Tuyên bố giới hạn dữ liệu.
```

---

## 2. ĐẶC TẢ CHI TIẾT 6 PHÂN HỆ NGHIỆP VỤ (DATA OWNERSHIP, ENTITIES, WORKFLOW, VERSIONING & AI BOUNDARY)

### Phân hệ 1: Legal Library (Thư viện Pháp luật & Kiểm soát Nguồn Xác thực)
- **Tệp hiện trạng liên quan:** `src/App.tsx`, `src/data/legalCorpus.ts`, `src/components/CreateDocumentModal.tsx`, `src/components/InPlaceClauseDiffViewer.tsx`, `src/components/ContinuousA4Reader.tsx`, `src/components/ConsolidatedDocumentDrawer.tsx`, `src/components/SideBySideComparisonView.tsx`.
- **Entities sở hữu:** `LegalDocument`, `OfficialSourceProvenance`, `LegalArticle`, `ClauseItem`, `LegalPointItem`.
- **Quy trình kiểm soát nạp & xác thực (`GAP-01`..`GAP-05`):**
  1. **Tệp nạp qua OCR (`CreateDocumentModal.tsx`):** Bắt buộc tính `SHA-256` thật 64 ký tự hex (`src/utils/ocrClient.ts`), cấm dùng `Math.random()`, cấm AI suy đoán số hiệu từ tên tệp (`server.ts:353`), và lưu vào trạng thái `UNVERIFIED_INGESTION_QUARANTINE`.
  2. **Kiểm duyệt & Niêm phong (`Verify & Seal`):** Chỉ khi chuyên viên đối chiếu với nguồn chính thức (`vbpl.vn` / `chinhphu.vn`) thì mới chuyển sang `PARTIAL_VERIFIED_EXTRACT` hoặc `VERIFIED_OFFICIAL_SSOT` (`is_immutable: true`).
  3. **Tách biệt Bản tổng hợp nội bộ và VBHN chính thức (`ConsolidatedDocumentDrawer.tsx`):** Bản do phần mềm tự ghép từ `diff_data.replaced_text` bắt buộc mang `consolidation_nature: 'INTERNAL_WORKING_SYNTHESIS'` và tiêu đề **`BẢN TỔNG HỢP NỘI BỘ PHỤC VỤ TRA CỨU`**, tuyệt đối không đóng dấu xác thực giả định của Văn phòng Quốc hội.

### Phân hệ 2: Legal Knowledge Graph (Đồ thị Tri thức Pháp lý & Hiệu lực Thời gian)
- **Tệp hiện trạng liên quan:** `src/components/DocumentGenealogyTreeDrawer.tsx`, `src/components/LegalMapAndCrossCheck.tsx`, `src/types/legal.ts`.
- **Entities sở hữu:** `LegalKnowledgeEdge`, `ProvisionTemporalVersion`, `TransitionalProvisionRule`.
- **Quy trình giải hiệu lực theo thời điểm (`Point-in-Time Resolution` — `GAP-07`, `P1-01`):**
  1. Người dùng hoặc Hồ sơ vụ việc truyền vào mốc ngày sự kiện `asOfDate` (ví dụ `2024-06-15` hoặc `2025-03-10`).
  2. Bộ máy deterministic `pointInTimeResolver.ts` kiểm tra `effective_date` / `expiration_date` của văn bản và duyệt qua mảng `temporal_versions` của từng Khoản/Điểm:
     - Nếu `asOfDate < amending_doc.effective_date`: trả về nguyên văn lời văn bản gốc (`original_text`) đang có hiệu lực tại thời điểm đó.
     - Nếu `asOfDate >= amending_doc.effective_date`: trả về lời văn đã sửa đổi (`replaced_text`), đồng thời kiểm tra `TransitionalProvisionRule` nếu ngày bắt đầu dự án/giao dịch (`transaction_inception_date`) diễn ra trước ngày luật sửa đổi có hiệu lực.

### Phân hệ 3: Cross-Law Audit (Kiểm toán Đối soát Chéo Liên luật)
- **Tệp hiện trạng liên quan:** `src/components/CrossLawAiDrawer.tsx`, `server.ts` (`/api/cross-law-matrix`).
- **Entities sở hữu:** `CrossLawAuditResponse`, `CrossLawMatrixItem`, `CitationVerificationResult`.
- **Quy trình vận hành (`GAP-06`, `GAP-08`, `P0-05`, `P1-02`):**
  1. **Loại bỏ hoàn toàn ma trận cứng 4 luật** trong `buildBaselineCrossLawMatrix` (`CrossLawAiDrawer.tsx:44-130`).
  2. **Bước 1 (Deterministic Graph Lookup):** Truy xuất các cạnh `LegalCrossReference` / `LegalKnowledgeEdge` thực tế đang kết nối với văn bản/điều khoản đang chọn.
  3. **Bước 2 (Grounded AI Cross-Law Analysis + Citation Verifier):** Gửi nội dung điều khoản và danh sách văn bản thực trong kho lên `/api/cross-law-matrix`. Khi nhận kết quả, chạy `verifyCitationsAgainstSSoT(result, allDocuments)` để gắn nhãn xác thực từng trích dẫn (`VERIFIED_IN_SSOT`, `DOC_FOUND_ARTICLE_NOT_LOADED`, `UNVERIFIED_EXTERNAL_CITATION`).

### Phân hệ 4: Legal AI Reasoning Engine (3 Chế độ × 6 Bước `IRAC+`)
- **Tệp hiện trạng liên quan:** `src/components/AquaAssistantDrawer.tsx`, `src/components/LegalComplianceCheckView.tsx`, `server.ts`.
- **Entities sở hữu:** `LegalReasoningTrace`, `GroundedRuleCitation`.
- **Quy trình vận hành (`GAP-06`, `GAP-09`, `P0-05`, `P1-03`):**
  - Hỗ trợ 3 chế độ chuyên biệt:
    1. **`JUDICIAL_ANALYSIS` (Phân tích Xét xử / Tài phán):** Trung lập, đối chiếu hiệu lực quy phạm đúng tại ngày xảy ra sự kiện pháp lý, đánh giá giá trị chứng cứ và lập luận hai phía.
    2. **`LEGAL_COUNSEL` (Tư vấn Pháp chế):** Nhận diện rủi ro pháp lý, phân tích điều kiện áp dụng và đề xuất phương án khắc phục hợp pháp.
    3. **`LEGAL_AUDIT` (Kiểm toán Tuân thủ & Thanh quyết toán):** Kiểm tra điều kiện tiên quyết (Stage-Gate), thẩm quyền ký, định mức và cảnh báo nguy cơ xuất toán.
  - Bắt buộc thực hiện tuần tự 6 bước: **`Issue → Rule → Interpretation → Application → Counterargument → Conclusion`**.
  - **Giao thức Từ chối Trung thực (`Honest Abstention Protocol`):** Xóa bỏ hoàn toàn `DEFAULT_AQUA_RESPONSE` (`AquaAssistantDrawer.tsx:22-31, 66, 134, 138`). Khi dịch vụ AI lỗi hoặc kho SSoT chưa có điều khoản liên quan, trả về `epistemic_status: 'ABSTAINED_SERVICE_UNAVAILABLE'` hoặc `'ABSTAINED_INSUFFICIENT_SSOT'`.

### Phân hệ 5: Legal Case Workspace (Không gian Hồ sơ Vụ việc)
- **Tệp hiện trạng liên quan:** `src/components/StageGateAuditView.tsx`, `src/components/ContractReviewView.tsx`, `src/hooks/useComplianceGraph.ts`, `src/data/stageGateCorpus.ts`.
- **Entities sở hữu:** `CaseFactMilestone`, `ProjectStepRecord`, `ComplianceGate`.
- **Quy trình vận hành (`GAP-10`, `P1-04`):** Kết nối dòng thời gian sự kiện của dự án/vụ việc (`CaseFactMilestone.event_date`) với bộ giải `PointInTimeLegalResolver` và đồ thị 17 Stage-Gates (`useComplianceGraph.ts`).

### Phân hệ 6: Governance & Evidence Audit (Quản trị & Báo cáo Dựa trên Bằng chứng)
- **Tệp hiện trạng liên quan:** `src/components/GlobalAuditSummaryPanel.tsx`, `src/components/GlobalAuditDashboard.tsx`, `src/components/BackupAndStatsModal.tsx`.
- **Entities sở hữu:** `EvidenceBasedReportSnapshot`, `AuditLogEntry`.
- **Quy trình vận hành (`GAP-11`, `P1-04`):** Kết xuất báo cáo kiểm toán/pháp lý dựa trên bằng chứng (`EvidenceBasedReportModal.tsx`) tổng hợp toàn bộ căn cứ SSoT đã xác minh, tỷ lệ nạp toàn văn, mã băm `SHA-256` của chứng cứ, chuỗi lập luận 6 bước và mục công khai giới hạn dữ liệu.

---

## 3. BẢNG PHÂN ĐỊNH RANH GIỚI DETERMINISTIC ENGINE VS. AI ENGINE

| Chức năng | Deterministic Engine (Xác định 100% bằng Thuật toán & CSDL) | AI Engine (Hỗ trợ Phân tích trong Ranh giới Đã khóa) | Chốt chặn Nghiêm cấm (Hard Guardrail) |
| :--- | :--- | :--- | :--- |
| **Quản lý nội dung Điều/Khoản/Điểm SSoT** | Lưu trữ, kiểm tra tính bất biến (`is_immutable`) và tính tỷ lệ `completeness_ratio`. | Không được phép can thiệp vào `doc.articles`. | **Chặn `P0-01`:** Cấm `/api/expand-full-document` ghi vào `doc.articles`. |
| **Xác định bản chất Văn bản Hợp nhất** | Kiểm tra `consolidation_nature`: phân biệt `OFFICIAL_SIGNED_VBHN` và `INTERNAL_WORKING_SYNTHESIS`. | Không tham gia. | **Chặn `P0-03`:** Cấm tự sinh số hiệu VBHN và con dấu xác thực cho bản tự ghép. |
| **Xác định hiệu lực tại ngày `asOfDate`** | Giải bằng `pointInTimeResolver.ts` trên `temporal_versions` và `transitional_rules`. | Diễn giải ngữ nghĩa điều khoản chuyển tiếp trong Bước 3 (`Interpretation`). | **Chặn `P1-01`:** AI không được tự tuyên bố hiệu lực trái với kết quả của `pointInTimeResolver`. |
| **Kiểm tra trích dẫn & Đối soát chéo** | `citationVerifier.ts` kiểm tra từng số hiệu văn bản và số Điều/Khoản đối chiếu với SSoT. | Phân tích giao thoa liên luật từ danh sách quy phạm đã xác minh. | **Chặn `P0-05`, `P1-02`:** Xóa bỏ ma trận 4 luật cứng; gắn cờ mọi trích dẫn ngoài SSoT. |
| **Lập luận pháp lý 6 bước (`IRAC+`)** | Cung cấp tập `Rule` nguyên văn tại `asOfDate` và hậu kiểm trích dẫn đầu ra. | Thực hiện phân tích 6 bước theo chế độ `Judicial` / `Counsel` / `Audit`. | **Chặn `P0-05`, `P1-03`:** Xóa bỏ `DEFAULT_AQUA_RESPONSE`; bắt buộc từ chối trung thực khi thiếu căn cứ. |
