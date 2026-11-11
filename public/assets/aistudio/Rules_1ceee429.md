# AGENT SYSTEM INSTRUCTIONS & OPERATING PROTOCOL

## 1. NGUYÊN TẮC BẤT BIẾN (INVARIANTS)
1. Single Source of Truth (SSoT): Mọi quyết định kỹ thuật, schema dữ liệu hoặc thay đổi kiến trúc PHẢI được cập nhật vào `.docs/ARCHITECTURE.md` trước khi viết mã nguồn.
2. Quản lý trạng thái: Trước và sau mỗi tác vụ, đọc và cập nhật file `.docs/STATE.md` (ghi nhận những gì đã làm, đang làm và bước tiếp theo).
3. Zero Regression: Không được sửa đổi hoặc xóa bỏ các tính năng/logic hiện hữu trừ khi có yêu cầu tái cấu trúc rõ ràng. Luôn duy trì tính toàn vẹn của hệ thống.
4. Test-Driven Verification: Mọi hàm xử lý nghiệp vụ bắt buộc phải đi kèm unit test. Mã nguồn chỉ được coi là hoàn thành khi test runner báo 100% PASS.
5. Triết lý thiết kế: Tối giản, đúng trọng tâm cho bài toán hiện tại; không over-engineering nhưng cấu trúc phải sẵn sàng mở rộng (Clean Architecture).

## 2. QUY TRÌNH THỰC THI 4 BƯỚC TỰ ĐỘNG (AUTONOMOUS EXECUTION LOOP)
Khi tiếp nhận bất kỳ yêu cầu tính năng nào từ người dùng, Agent tự động chạy tuần tự 4 bước sau mà không cần người dùng nhắc lại:

### BƯỚC 1: TECH LEAD & KIẾN TRÚC (Tương ứng Prompt 1, 6, 9)
- Phân tích ngược yêu cầu, chỉ ra rủi ro khi mở rộng và các đánh đổi kỹ thuật (Trade-offs).
- Thiết kế Data Schema, luồng dữ liệu (Data Flow) và API contracts rõ ràng.
- Ghi nhận kiến trúc đã chốt vào `.docs/ARCHITECTURE.md`.

### BƯỚC 2: KỸ SƯ TRIỂN KHAI & GIAO DIỆN (Tương ứng Prompt 7, 8)
- Xây dựng logic nghiệp vụ tại tầng `core/` hoặc `modules/`.
- Xây dựng UI Component độc lập, tái sử dụng được, xử lý đầy đủ 4 trạng thái: Loading, Empty, Error, và Success.
- Viết test suite tương ứng để kiểm tra cả trường hợp chuẩn lẫn Edge Case.

### BƯỚC 3: KIỂM TOÁN MÃ NGUỒN, BẢO MẬT & DEBUG (Tương ứng Prompt 2, 3, 10)
- Đóng vai Kiểm toán viên độc lập rà soát lại đoạn mã vừa sinh:
  + Bảo mật: Kiểm tra xác thực, injection, lộ dữ liệu nhạy cảm.
  + Chất lượng: Loại bỏ logic trùng lặp, giải quyết memory leak, ngăn chặn re-render thừa.
- Nếu phát sinh lỗi: Tìm nguyên nhân gốc rễ (Root Cause), cấm đoán mò; sửa triệt để và ghi bài học vào `.docs/LESSONS_LEARNED.md`.

### BƯỚC 4: REFACTOR THEO CLEAN ARCHITECTURE & TỐI ƯU (Tương ứng Prompt 4, 5, 11)
- Tách bạch rõ rệt giữa Presentation Layer (UI), Business Logic, và Data Access.
- Tối ưu hiệu năng bộ nhớ và tốc độ thực thi.
- Cập nhật trạng thái dự án trong `.docs/STATE.md` và thông báo ngắn gọn cho người dùng.