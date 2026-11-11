# KIẾN TRÚC TỔNG THỂ, MÔ HÌNH DỮ LIỆU & HỢP ĐỒNG API — ĐẠI SƠN LEGAL

> **Single Source of Truth (SSoT):** Tài liệu này hợp nhất thiết kế kiến trúc từ `/TARGET_WORKFLOW.md` và `/LEGAL_DOMAIN_DATA_MODEL.md` theo chuẩn Clean Architecture (`Repo_Structure`).

---

## 1. CHUỖI GIÁ TRỊ NGHIỆP VỤ CỐT LÕI (VALUE CHAIN)

```text
[1. Trusted Legal Data (SSoT + SHA-256 + Quarantine Gate)]
        │
        ▼
[2. Legal Library (Authenticity Tier + Completeness Ratio X/Y Articles)]
        │
        ▼
[3. Legal Knowledge Graph (Article/Clause/Point Graph + Point-in-Time Resolver)]
        │
        ▼
[4. Cross-Law Audit (Deterministic Graph Traversal + Verified AI Cross-Check)]
        │
        ▼
[5. Legal AI Reasoning (3 Modes: Judicial / Counsel / Audit × 6 Steps IRAC+)]
        │
        ▼
[6. Case Workspace & Evidence-based Report (Fact Timeline + Citation Verifier)]
```

---

## 2. KIẾN TRÚC PHÂN TẦNG CLEAN ARCHITECTURE (`src/`)

```text
src/
├── core/                                      # Tầng Domain Entities & Deterministic Legal Engines (0 UI dependency)
│   ├── entities/
│   │   └── legalDomain.ts                     # Thực thể chuẩn: AuthenticityTier, PointInTimeQuery, IRACPlusResult, CaseWorkspace
│   └── engines/
│       ├── corpusIntegrityValidator.ts        # Kiểm toán kho văn bản, tính completeness_ratio & kiểm chứng siêu dữ liệu Công báo
│       ├── pointInTimeResolver.ts             # Bộ giải hiệu lực Điều/Khoản theo thời điểm & quy tắc chuyển tiếp (Transitional Rule)
│       ├── citationVerifier.ts                # Bộ kiểm chứng trích dẫn tất định (đối chiếu đầu ra AI với kho VERIFIED_SSOT)
│       └── deterministicDiffEngine.ts         # Bộ so sánh văn bản phân cấp 2 pha (Sentence/Clause + Word LCS), xóa bỏ gán cứng 45%
├── modules/                                   # 6 Phân hệ Nghiệp vụ (Mỗi module có .model.ts, .service.ts, .test.ts)
│   ├── legal-library/                         # Phân hệ 1: Quản trị kho SSoT, Quarantine OCR & Phân tầng xác thực
│   ├── knowledge-graph/                       # Phân hệ 2: Đồ thị phả hệ & Lịch sử sửa đổi cấp Điều/Khoản/Điểm
│   ├── cross-law-audit/                       # Phân hệ 3: Đối soát chéo liên luật tất định + AI có kiểm chứng
│   ├── legal-reasoning/                       # Phân hệ 4: Suy luận pháp lý 3 chế độ × 6 bước IRAC+
│   ├── case-workspace/                        # Phân hệ 5: Hồ sơ vụ việc, Dòng thời gian sự kiện (Fact Timeline) & Chứng cứ
│   └── governance-audit/                      # Phân hệ 6: Nhật ký kiểm toán bất biến (Immutable Audit Trail) & SHA-256
├── infrastructure/                            # Tầng Hạ tầng Kỹ thuật
│   ├── crypto/
│   │   └── sha256.ts                          # Băm SHA-256 chuẩn Web Crypto / Node Crypto (không dùng Math.random())
│   ├── storage/
│   │   └── partitionedStorage.ts              # Phân vùng lưu trữ tách biệt: VERIFIED_SSOT vs QUARANTINE_OCR vs AI_DRAFT
│   └── api/
│       └── legalApiClient.ts                  # HTTP Client chuẩn hóa trạng thái Error/Timeout (không dùng silent fake fallback)
└── ui/                                        # Tầng Giao diện Người dùng (4 trạng thái: Loading, Empty, Error, Success)
    ├── components/
    └── views/
        └── LegalReasoningAndCaseView.tsx      # Giao diện tích hợp Suy luận Pháp lý 6 bước IRAC+, Point-in-Time & Hồ sơ vụ việc
```

---

## 3. ĐẶC TẢ SCHEMA DỮ LIỆU CỐT LÕI (DATA SCHEMA)

### 3.1. Phân tầng Xác thực Văn bản (`AuthenticityTier`)
- `'VERIFIED_SSOT'`: Văn bản quy phạm pháp luật đã đối chiếu khớp số hiệu, trích yếu, ngày ban hành, ngày hiệu lực với Công báo / CSDL Quốc gia và nạp đầy đủ toàn văn.
- `'VERIFIED_EXCERPT'`: Văn bản quy phạm pháp luật có thật trên Công báo (đã xác minh số hiệu, ngày ban hành, ngày hiệu lực), hiện nạp trích lược các điều khoản trọng tâm (`loaded_articles_count < total_articles_count`).
- `'OFFICIAL_VBHN'`: Văn bản hợp nhất chính thức do Văn phòng Quốc hội hoặc Bộ/Ngành ký xác thực hợp nhất theo Luật Hợp nhất văn bản QPPL.
- `'INTERNAL_SYNTHESIS'`: Bản tổng hợp nội bộ do hệ thống tự ghép nối để phục vụ tra cứu nhanh (cấm gắn dấu đỏ VBHN chính thức).
- `'QUARANTINE_REVIEW'`: Văn bản mới nạp qua OCR hoặc người dùng tải lên, đang chờ kiểm duyệt viên đối chiếu bản gốc trước khi đưa vào SSoT.
- `'REFERENCE_GUIDE'`: Tài liệu hướng dẫn sử dụng nội bộ (không phải văn bản QPPL).

### 3.2. Bộ giải Hiệu lực theo Thời điểm (`PointInTimeResolution`)
- Đầu vào: `doc_id`, `article_number`, `clause_index?`, `reference_date` (`YYYY-MM-DD`), `transitional_event_date?` (`YYYY-MM-DD`).
- Đầu ra:
  - `effective_status_at_date`: `'NOT_YET_EFFECTIVE' | 'EFFECTIVE_ORIGINAL' | 'EFFECTIVE_AMENDED' | 'EXPIRED_OR_REPEALED' | 'TRANSITIONAL_APPLIED'`
  - `applicable_text`: Nội dung quy phạm đúng tại thời điểm `reference_date` (nếu `reference_date < amending_effective_date` thì trả về `original_text` trước sửa đổi).
  - `amending_doc_number?`: Số hiệu văn bản sửa đổi nếu đã áp dụng bản sửa đổi.
  - `transitional_note?`: Thuyết minh áp dụng điều khoản chuyển tiếp.

### 3.3. Cấu trúc Suy luận Pháp lý 6 Bước (`IRACPlusAnalysis`)
- `mode`: `'JUDICIAL_ANALYSIS' | 'LEGAL_COUNSEL' | 'LEGAL_AUDIT'`
- `reference_date`: Ngày sự kiện pháp lý dùng để khóa phiên bản quy phạm.
- `steps`:
  1. `issue`: Vấn đề pháp lý cốt lõi cần giải quyết.
  2. `rule`: Danh sách quy phạm áp dụng kèm kết quả kiểm chứng từ `CitationVerifier` (`VERIFIED_IN_SSOT` / `EXCERPT_WARNING` / `UNVERIFIED_CITATION`).
  3. `interpretation`: Giải thích nội hàm quy phạm và điều kiện áp dụng tại thời điểm `reference_date`.
  4. `application`: Đối chiếu tình tiết thực tế (`FactEvent`) và chứng cứ (`EvidenceItem`) vào quy phạm.
  5. `counterargument`: Phân tích ngoại lệ, rủi ro tranh chấp hoặc quan điểm phản biện của đoàn thanh tra/kiểm toán.
  6. `conclusion`: Kết luận pháp lý và khuyến nghị hành động có gắn mức độ tin cậy xác thực.

---

## 4. HỢP ĐỒNG API BACKEND (`server.ts`)

| Endpoint | Phương thức | Mục đích & Ràng buộc Toàn vẹn Pháp lý |
| :--- | :---: | :--- |
| `GET /api/health` | `GET` | Kiểm tra trạng thái máy chủ, phiên bản kiến trúc và thống kê kho SSoT. |
| `POST /api/ocr-extract` | `POST` | Trích xuất văn bản từ tệp tải lên; **cấm suy đoán số hiệu từ tên tệp**; gắn trạng thái mặc định `QUARANTINE_REVIEW`. |
| `POST /api/expand-full-document` | `POST` | **Đã khóa bảo vệ SSoT (`P0-01`):** Chỉ trả về bản nháp tham khảo trong vùng `AI_ANALYSIS_DRAFT` (hoặc từ chối ghi đè vào SSoT), kèm cờ `is_ai_draft: true` và cảnh báo không dùng làm căn cứ pháp lý. |
| `POST /api/legal-reasoning` | `POST` | Thực thi suy luận pháp lý 3 chế độ (`JUDICIAL_ANALYSIS`, `LEGAL_COUNSEL`, `LEGAL_AUDIT`) theo đúng 6 bước `IRAC+`, tự động chạy `CitationVerifier` hậu kiểm mọi trích dẫn với kho SSoT trước khi trả về client. |
| `POST /api/cross-check-article` | `POST` | Đối soát chéo điều khoản liên luật; nếu lỗi API trả về HTTP 502/503 minh bạch để client hiển thị trạng thái `Error` + dữ liệu đồ thị tất định, không dùng fallback giả. |
