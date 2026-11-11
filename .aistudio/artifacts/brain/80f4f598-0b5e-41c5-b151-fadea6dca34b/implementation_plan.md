# Phân hệ Tự động Tổng hợp & Xuất Bản Văn bản Hợp nhất (VBHN) Chuẩn Nghị định 30/2020/NĐ-CP

Giải pháp tự động hợp nhất các điều, khoản, điểm đã qua sửa đổi, bổ sung vào văn bản quy phạm pháp luật gốc để tạo thành **Bản Văn bản Hợp nhất (VBHN)** hoàn chỉnh ngay trong Drawer trượt bên phải màn hình, hỗ trợ xuất và in ấn định dạng trang A4 chuẩn thể thức hành chính kèm Mục lục Phả hệ sửa đổi phục vụ công tác pháp chế, thẩm định và thanh quyết toán.

## User Review & Critical Decisions

> [!IMPORTANT]
> Kế hoạch dưới đây đã được chuẩn hóa theo đúng các lựa chọn ưu tiên của bạn ở bước làm rõ yêu cầu. Nhấn **Proceed** để bắt đầu triển khai mã nguồn.

- **Confirmed Decision 1 (Phân hệ cốt lõi)**: Triển khai bộ máy **Tự động ghép và xem Bản Văn bản Hợp nhất (VBHN)** — tự động thay thế các đoạn văn bản cũ bằng nội dung mới đang có hiệu lực (`replaced_text`), kèm chú thích chân trang hợp nhất chuẩn thể thức Văn phòng Quốc hội (`[1]`, `[2]`, ...).
- **Confirmed Decision 2 (Bố cục giao diện)**: Hiển thị trong **Drawer trượt từ bên phải màn hình**, cho phép kỹ sư/cán bộ pháp chế vừa đối chiếu văn bản gốc ở Cột 3 vừa kiểm tra Bản Hợp nhất VBHN mà không bị mất ngữ cảnh đọc hiện tại.
- **Confirmed Decision 3 (Đầu ra phục vụ hồ sơ)**: Tích hợp chế độ **Bản in A4 chuẩn Nghị định 30/2020/NĐ-CP kèm Mục lục Phả hệ sửa đổi** (hỗ trợ in trực tiếp qua cửa sổ in chuyên dụng khổ A4 và tải xuống tệp HTML A4 độc lập để lưu hồ sơ).

---

## 1. Overview & Core Concept

- **What It Does**:
  - Tự động quét toàn bộ lịch sử sửa đổi (`amendment_history`), các Điều có cờ `is_amended`, và dữ liệu thay thế từng Khoản (`clauses` / `diff_data.replaced_text`) của một văn bản gốc để tổng hợp thành một **Văn bản Hợp nhất (VBHN)** liền mạch.
  - Tự động chèn ký hiệu chú thích hợp nhất chuẩn pháp điển hóa (ví dụ: *"Khoản này được sửa đổi, bổ sung theo quy định tại Luật số 56/2024/QH15, có hiệu lực kể từ ngày 01/01/2025"*) và lập **Bảng Mục lục Phả hệ & Chú thích Hợp nhất** ở đầu tài liệu.
  - Cho phép chuyển đổi linh hoạt giữa 2 chế độ hiển thị ngay trong Drawer:
    1. **Bản Hợp nhất sạch (Clean Consolidated View)**: Chỉ hiển thị lời văn đang có hiệu lực pháp lý hiện hành kèm số thứ tự chú thích `[1]`, `[2]` chuẩn VBHN.
    2. **Bản Hợp nhất có đánh dấu vết sửa đổi (Redline / Annotated VBHN)**: Tô sáng nhẹ các đoạn văn bản đã được ghép mới từ các luật sửa đổi và cho phép bật/tắt nhanh chú thích nguồn sửa đổi.
- **Target Audience / Persona**: Chuyên viên pháp chế doanh nghiệp, kỹ sư QS/đấu thầu, kiểm toán viên nội bộ và cán bộ quản lý dự án cần một bản văn bản hợp nhất chính xác, đầy đủ căn cứ sửa đổi để đính kèm tờ trình, hồ sơ nghiệm thu hoặc giải trình kiểm toán.
- **Key Value**: Loại bỏ hoàn toàn thao tác tra cứu thủ công rời rạc qua 3–4 luật sửa đổi khác nhau; giảm thiểu rủi ro áp dụng nhầm điều khoản đã hết hiệu lực hoặc bị sửa đổi một phần.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Kích hoạt nhanh từ Cột 2 & Cột 3**:
     - Tại thẻ văn bản ở Cột 2 hoặc trên thanh công cụ đọc văn bản ở Cột 3, người dùng nhấn nút **"📑 Xem Bản Hợp nhất (VBHN)"**.
  2. **Tương tác trong Drawer Văn bản Hợp nhất (Bên phải màn hình)**:
     - Đầu Drawer hiển thị thông tin định danh VBHN (Số hiệu VBHN tự động hoặc theo công báo, danh sách các văn bản được hợp nhất theo thứ tự thời gian, tổng số Điều/Khoản đã được hợp nhất).
     - Thanh công cụ bên trong Drawer cho phép:
       - Lọc xem **Toàn bộ Điều khoản** hoặc **Chỉ các Điều có nội dung hợp nhất mới**.
       - Chuyển đổi giữa **Chế độ Bản sạch (Clean VBHN)** và **Chế độ Dấu vết hợp nhất (Annotated VBHN)**.
       - Nhấp vào mục lục phả hệ để cuộn mượt đến Điều khoản hoặc chú thích hợp nhất tương ứng.
  3. **Xuất & In Bản A4 chuẩn Nghị định 30/2020/NĐ-CP kèm Mục lục Phả hệ**:
     - Nhấn nút **"🖨 In Bản A4 (NĐ 30/2020 + Mục lục Phả hệ)"** hoặc **"⬇ Tải Bản A4 (.HTML chuẩn in)"** để mở bản in A4 được dàn trang chuẩn: có Quốc hiệu - Tiêu ngữ, Lời nói đầu liệt kê các văn bản hợp nhất, Bảng Mục lục Phả hệ sửa đổi, Toàn văn các Điều khoản đã ghép nội dung mới, Danh mục Chú thích hợp nhất cuối văn bản và Khối Xác thực Nơi nhận/Người ký.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Trang trọng, chuẩn mực hành chính nhà nước và pháp chế doanh nghiệp (Vietnamese Official Gazette & Enterprise Legal Standard).
  - *Color Palette & Mood*:
    - Nền giấy A4: Trắng kem công báo (`#FFFDF9`) ở chế độ Sáng và Đá phiến trầm (`#181715`) ở chế độ Tối.
    - Màu chủ đạo: Xanh Navy Pháp chế (`#152D42`) kết hợp điểm nhấn Vàng kim Công báo (`#C6A342` / `#E9C96D`).
    - Màu trạng thái hợp nhất: Xanh ngọc lục bảo (`#047857`) cho điều khoản đã hợp nhất nội dung mới; Vàng hổ phách (`#B45309`) cho chỉ dẫn chú thích phả hệ `[1]`, `[2]`.
  - *Typography & Hierarchy*:
    - Nội dung văn bản A4 sử dụng phông chữ có chân (`Source Serif 4` / `Lora`) với cỡ chữ chuẩn và căn đều hai bên (`text-justify`).
    - Số hiệu văn bản, ngày có hiệu lực và số đếm điều khoản dùng phông đơn cách (`JetBrains Mono` / `tabular-nums`) đảm bảo thẳng hàng tuyệt đối trong bảng mục lục phả hệ.
  - *Interactive Feedback & Motion*:
    - Drawer trượt mượt từ cạnh phải với hiệu ứng mờ nền (`backdrop-blur-xs`).
    - Khi nhấp vào ký hiệu chú thích `[1]`, `[2]` trong lời văn hợp nhất, hệ thống tự động cuộn và làm sáng dòng chú thích nguồn luật sửa đổi tương ứng.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Cơ chế Tự động Ghép lời văn Hợp nhất (Client-Side Deterministic Consolidation Engine)**
  - *Chosen Approach*: Xây dựng bộ máy hợp nhất tất định (deterministic) trên dữ liệu SSoT: với mỗi Điều/Khoản có `is_amended = true` và `diff_data.replaced_text`, bộ máy tự động thay thế đoạn văn bản gốc bằng `replaced_text`, đồng thời sinh mã tham chiếu chú thích `[N]` liên kết trực tiếp tới `amending_doc_id`, số hiệu văn bản sửa đổi và ngày có hiệu lực.
  - *Why*: Đảm bảo độ chính xác nguyên văn 100% theo công báo mà không phụ thuộc độ trễ mạng hay rủi ro suy diễn sai lời văn pháp luật.
  - *Alternatives Considered*: Dùng AI viết lại toàn văn — bị loại bỏ cho bước ghép câu chữ vì văn bản quy phạm pháp luật đòi hỏi chính xác từng dấu câu theo bản gốc.

- **Decision 2: Xuất Bản in A4 thông qua Cửa sổ Dàn trang A4 Chuyên biệt & Tệp HTML Độc lập**
  - *Chosen Approach*: Tạo bộ kết xuất trang in A4 chuyên biệt (`@media print` chuẩn khổ `210mm × 297mm`, lề trái `30mm`, lề phải `15mm`, lề trên/dưới `20mm` theo đúng Phụ lục I Nghị định `30/2020/NĐ-CP`) bao gồm cả Bảng Mục lục Phả hệ và Chú thích chân trang, tránh việc in lẫn thanh cuộn hoặc giao diện 3 cột bên ngoài.
  - *Why*: Đảm bảo khi người dùng xuất ra máy in hoặc lưu PDF từ trình duyệt, tài liệu thu được là một văn bản hành chính A4 chuẩn mực, sạch sẽ và dùng được ngay cho hồ sơ chính thức.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        KHO DỮ LIỆU PHÁP LUẬT SSoT                            │
│  LegalDocument + amendment_history[] + LegalArticle[] + ClauseItem/ClauseDiff│
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                BỘ MÁY TỔNG HỢP VĂN BẢN HỢP NHẤT (VBHN ENGINE)                │
│  1. Hợp nhất danh sách văn bản gốc + các văn bản sửa đổi theo thời gian      │
│  2. Thay thế lời văn cũ bằng replaced_text tại từng Khoản bị sửa đổi         │
│  3. Sinh hệ thống chú thích chuẩn VBHN [1], [2]... & Mục lục Phả hệ          │
└─────────────────┬────────────────────────────────────────────┬───────────────┘
                  │                                            │
                  ▼                                            ▼
┌─────────────────────────────────────────┐  ┌─────────────────────────────────┐
│   DRAWER VĂN BẢN HỢP NHẤT (BÊN PHẢI)    │  │ BỘ XUẤT & IN A4 (NĐ 30/2020)    │
│  • Tóm lược căn cứ hợp nhất             │  │  • Quốc hiệu - Tiêu ngữ chuẩn   │
│  • Mục lục Phả hệ & Điều khoản tương tác│  │  • Bảng Mục lục Phả hệ sửa đổi  │
│  • Chế độ Bản sạch / Dấu vết hợp nhất   │  │  • Toàn văn A4 đã ghép VBHN     │
│  • Tra cứu chéo Chú thích [1], [2]...   │  │  • Xác thực hợp nhất & Nơi nhận │
└─────────────────────────────────────────┘  └─────────────────────────────────┘
```

- **Data Model & State**:
  - **Mô hình dữ liệu Văn bản Hợp nhất (`ConsolidatedDocumentModel`)**:
    - Thông tin chung: Số hiệu VBHN, văn bản gốc, danh sách các văn bản sửa đổi (`amendment_history` xếp theo ngày ban hành).
    - Danh sách Điều khoản hợp nhất (`ConsolidatedArticleItem`): Lưu trạng thái từng Khoản sau khi đã thay thế bằng `diff_data.replaced_text`, kèm mảng chỉ mục chú thích `footnoteIndices: number[]`.
    - Danh sách Chú thích Hợp nhất (`ConsolidationFootnote`): Lưu mã `[1]`, `[2]`, số hiệu văn bản sửa đổi, ngày ban hành, ngày có hiệu lực, nội dung gốc trước khi sửa (để tra cứu ngược khi cần).
- **Interactive Component & State Mapping**:
  - Nút **"📑 Bản Hợp nhất (VBHN)"** tại Cột 2 và Header Cột 3 cập nhật state `consolidatedDrawerDocId` để mở Drawer trượt bên phải.
  - Bộ chuyển đổi chế độ trong Drawer (`clean` | `annotated`) và bộ lọc (`all` | `amended_only`) cập nhật tức thời danh sách điều khoản hiển thị trên trang A4 trong Drawer.
  - Nút **"🖨 In Bản A4 chuẩn NĐ 30/2020"** kích hoạt chế độ in chuẩn khổ A4 (với lề trang hành chính và mục lục phả hệ đầy đủ), đồng thời hỗ trợ nút **"⬇ Xuất tệp A4 (.HTML)"** để lưu trữ ngoại tuyến.
