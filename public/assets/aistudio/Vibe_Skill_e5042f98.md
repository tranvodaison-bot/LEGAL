---
name: enterprise-vibe-coder
description: Skill điều phối vòng đời phát triển phần mềm chuẩn Clean Architecture qua Vibe Coding
---

## NGUYÊN TẮC BẤT BIẾN (INVARIANTS)
1. Single Source of Truth: Mọi quyết định kiến trúc phải lưu vào docs/architecture.md.
2. Test-Driven: Mọi tính năng phải có Test Runner xác nhận trước khi commit.
3. Zero Regression: Không được xóa logic hiện có trừ khi có yêu cầu tái cấu trúc rõ ràng.

## MÁY TRẠNG THÁI (EXECUTION PHASES & GATES)

### Phase 1: Thấu triệt & Kiến trúc (Kế thừa Prompt 9, 6, 1)
- Trigger: Khi tiếp nhận yêu cầu tính năng mới.
- Nhiệm vụ: Tech Lead phản biện -> Định hình Schema & API Contract.
- Cổng kiểm soát (Gate 1): Tạo file `contract.spec.ts` hoặc schema migration. Chưa viết mã UI.

### Phase 2: Triển khai & Tự kiểm thử (Kế thừa Prompt 7, 8)
- Trigger: Vượt qua Gate 1.
- Nhiệm vụ: Xây dựng UI Component và Business Logic.
- Cổng kiểm soát (Gate 2): Tự động viết và chạy Unit Test. Mã code phải pass 100%.

### Phase 3: Kiểm toán, Bảo mật & Tối ưu (Kế thừa Prompt 2, 3, 4, 10)
- Trigger: Mã nguồn chạy được nhưng cần kiểm tra chuẩn production.
- Nhiệm vụ: Quét lỗ hổng xác thực/phân quyền, rà soát logic thừa, tối ưu render/truy vấn.
- Cổng kiểm soát (Gate 3): Chạy linter, security audit checklist và memory leak check.

### Phase 4: Đóng gói & Bàn giao (Kế thừa Prompt 5, 11)
- Trigger: Sẵn sàng phát hành.
- Nhiệm vụ: Dọn dẹp cấu trúc thư mục chuẩn Clean Architecture, cập nhật README, sinh script build/deploy.
- Cổng kiểm soát (Gate 4): Build thành công ra artifact (Docker container, Desktop binary, hoặc production bundle).