# ĐẠI SƠN LEGAL — KIỂM TOÁN KHO DỮ LIỆU PHÁP LUẬT (LEGAL CORPUS VALIDATION REPORT)

Tài liệu này kiểm toán độc lập toàn bộ **43 bản ghi** trong `INITIAL_LEGAL_DOCUMENTS`, **10 bản ghi** `INITIAL_CROSS_REFERENCES`, **12 nút** `COMPLIANCE_REQUIREMENT_NODES`, **02 mẫu** `CONTRACT_REVIEW_TEMPLATES`, **04 cảnh báo** `INITIAL_DAILY_ALERTS` (`src/data/legalCorpus.ts`) và **32 bước tuân thủ** `MASTER_COMPLIANCE_STEPS` (`src/data/stageGateCorpus.ts`).

---

## 1. TỔNG QUAN CHẤT LƯỢNG KHO DỮ LIỆU PHÁP LUẬT

| Chỉ tiêu kiểm toán | Số lượng | Kết quả đối chứng độc lập | Mức rủi ro |
| :--- | :---: | :--- | :---: |
| **Tổng số bản ghi trong `INITIAL_LEGAL_DOCUMENTS`** | 43 | 42 văn bản quy phạm / tổng hợp + 01 tài liệu hướng dẫn (`huong-dan`) | — |
| **Số văn bản nạp toàn văn 100% các Điều thực tế của Luật/Nghị định** | **0 / 42** | Tất cả 42 văn bản pháp luật trong kho đều là **bản trích lược** (từ 1 đến 10 Điều trọng tâm), không có văn bản pháp luật nào nạp đủ 100% toàn văn từ Điều 1 đến Điều cuối. | **P0** |
| **Số văn bản trích lược 1 Điều bị hệ thống gắn nhầm nhãn `VERIFIED_SSOT` (`is_full_text: true`)** | **11 / 42** | Do thiếu trong `OFFICIAL_TOTAL_ARTICLES_MAP` và không có `total_articles_count`, hệ thống tự lấy `total = loaded = 1` và báo `Toàn văn đầy đủ (1/1 Điều — 100%)`! | **P0** |
| **Số văn bản bị tính sai `total_articles_count` do lấy nhầm `compliance_stats.total_sections`** | **14 / 42** | VD: Luật Đất đai `31/2024/QH15` báo `3/38 Điều` (thực tế 260 Điều); Luật Đấu thầu `22/2023/QH15` báo `3/34 Điều` (thực tế 96 Điều). | **P1** |
| **Số văn bản bị gắn nhầm nhãn `OFFICIAL_VBHN`** | **1 / 42** | `doc-nd-15-2023` (`15/2021/NĐ-CP`) vẫn để `is_consolidated: true`, `consolidated_doc_number: '06/VBHN-BXD'`, bị phân loại thành `OFFICIAL_VBHN`. | **P0** |
| **Số văn bản năm 2026 chưa có nguồn Công báo chính thức nhưng gắn nhãn `VERIFIED_*`** | **15 / 42** | Các Nghị định `206..217/2026/NĐ-CP`, `330..333/2026/NĐ-CP`, `248/2026/NĐ-CP` và Thông tư `33..38/2026/TT-BXD` chỉ có URL mẫu `thuvien-vbpl-26.web.app`. | **P0** |
| **Số vị trí còn sót tham chiếu sai đến `108/2025/QH15` (IFRS) và `15/2023/NĐ-CP` (Xây dựng)** | **14 vị trí** | Nằm trong `amendment_info`, `INITIAL_CROSS_REFERENCES`, `INITIAL_DAILY_ALERTS`, `stageGateCorpus.ts`, `SideBySideComparisonView.tsx` và `server.ts`. | **P0** |
| **Số liên kết khóa ngoại (`docId` / `articleId`) bị đứt gãy trong `stageGateCorpus.ts`** | **08 liên kết** | Trỏ tới ID không tồn tại (`doc-lpccc-2024`, `doc-ldt-23-2023`, `art-nd217-d8`, `art-ldd-d87`...). | **P1** |

---

## 2. BẢNG KIỂM TOÁN CHI TIẾT TẤT CẢ 43 BẢN GHI TRONG `INITIAL_LEGAL_DOCUMENTS`

| STT | ID Bản ghi | Số hiệu | Ngày BH / Ngày HL | Điều đã nạp | Tổng số Điều hệ thống đang báo | Tổng số Điều chuẩn thực tế | Nhãn `authenticity_tier` hiện tại | Kết luận Kiểm toán Độc lập |
| :-: | :--- | :--- | :---: | :-: | :-: | :-: | :--- | :--- |
| 1 | `doc-ldtc-58-2024` | `58/2024/QH15` | `2024-11-29` / `2025-01-01` | 3 | **54 (SAI)** | **103** | `VERIFIED_EXCERPT` | **LỖI P1 (`FIND-CORPUS-04`)**: Lấy nhầm `compliance_stats.total_sections = 54` làm tổng số Điều (Luật ĐTC 2024 thực tế có 103 Điều). |
| 2 | `doc-lxd-135-2025` | `135/2025/QH15` | `2025-12-10` / `2026-07-01` | 3 | 168 | 168 | `VERIFIED_EXCERPT` | Đã sửa ngày hiệu lực `2026-07-01`; tuy nhiên nội dung Điều 14, 89, 123 cần gắn rõ nguồn trích lược. |
| 3 | `doc-nd-15-2023` | `15/2021/NĐ-CP` | `2021-03-03` / `2021-03-03` | 2 | 111 | 111 | **`OFFICIAL_VBHN` (SAI)** | **LỖI P0 (`FIND-CORPUS-03`)**: (1) Bị gắn sai `is_consolidated: true`, `consolidated_doc_number: '06/VBHN-BXD'` nên thành `OFFICIAL_VBHN`; (2) Ngoài đời thực đã bị thay thế bởi `175/2024/NĐ-CP` từ `30/12/2024` nhưng vẫn ghi `status: 'SUA_DOI_BO_SUNG'` bởi `217/2026/NĐ-CP`. |
| 4 | `doc-nd-217-2026` | `217/2026/NĐ-CP` | `2026-06-19` / `2026-07-01` | 2 | 35 | Chưa có Công báo | **`VERIFIED_EXCERPT` (SAI)** | **LỖI P0 (`FIND-CORPUS-03`)**: Văn bản giả định/dự phóng năm 2026 chưa có nguồn Công báo nhưng gắn nhãn `VERIFIED_EXCERPT`. |
| 5 | `doc-nd-206-2026` | `206/2026/NĐ-CP` | `2026-06-15` / `2026-07-01` | 1 | 24 | Chưa có Công báo | **`VERIFIED_EXCERPT` (SAI)** | **LỖI P0 (`FIND-CORPUS-03`)**: Văn bản giả định năm 2026 (`source_url: thuvien-vbpl-26.web.app`), không có nguồn Công báo. |
| 6 | `doc-nd-207-2026` | `207/2026/NĐ-CP` | `2026-06-15` / `2026-07-01` | 1 | 31 | Chưa có Công báo | **`VERIFIED_EXCERPT` (SAI)** | **LỖI P0 (`FIND-CORPUS-03`)**: Văn bản giả định năm 2026, không có nguồn Công báo. |
| 7 | `doc-nd-209-2026` | `209/2026/NĐ-CP` | `2026-06-15` / `2026-07-01` | 1 | **1 (SAI)** | Chưa có Công báo | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01` & `03`)**: Chỉ nạp 1 Điều (`Điều 5`) nhưng báo `1/1 Điều (Toàn văn đầy đủ)` và gắn `VERIFIED_SSOT`! |
| 8 | `doc-nd-210-2026` | `210/2026/NĐ-CP` | `2026-06-15` / `2026-07-01` | 1 | 29 | Chưa có Công báo | **`VERIFIED_EXCERPT` (SAI)** | **LỖI P0 (`FIND-CORPUS-03`)**: Văn bản giả định năm 2026, không có nguồn Công báo. |
| 9 | `doc-nd-212-2026` | `212/2026/NĐ-CP` | `2026-06-17` / `2026-07-01` | 1 | **1 (SAI)** | Chưa có Công báo | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01` & `03`)**: Chỉ nạp `Điều 10` (1 Điều) nhưng báo `1/1 Điều` (`VERIFIED_SSOT`). |
| 10 | `doc-tt-33-2026` | `33/2026/TT-BXD` | `2026-06-25` / `2026-07-01` | 1 | **1 (SAI)** | Chưa có Công báo | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01` & `03`)**: Chỉ nạp `Điều 4` (1 Điều) nhưng báo `1/1 Điều` (`VERIFIED_SSOT`). |
| 11 | `doc-tt-34-2026` | `34/2026/TT-BXD` | `2026-06-26` / `2026-07-01` | 1 | **1 (SAI)** | Chưa có Công báo | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01` & `03`)**: Chỉ nạp `Điều 3` (1 Điều) nhưng báo `1/1 Điều` (`VERIFIED_SSOT`). |
| 12 | `doc-tt-36-2026` | `36/2026/TT-BXD` | `2026-06-25` / `2026-07-01` | 1 | **1 (SAI)** | Chưa có Công báo | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01` & `03`)**: Chỉ nạp `Điều 6` (1 Điều) nhưng báo `1/1 Điều` (`VERIFIED_SSOT`). |
| 13 | `doc-tt-37-2026` | `37/2026/TT-BXD` | `2026-06-26` / `2026-07-01` | 1 | **1 (SAI)** | Chưa có Công báo | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01` & `03`)**: Chỉ nạp `Điều 5` (1 Điều) nhưng báo `1/1 Điều` (`VERIFIED_SSOT`). |
| 14 | `doc-tt-38-2026` | `38/2026/TT-BXD` | `2026-06-30` / `2026-07-01` | 1 | **1 (SAI)** | Chưa có Công báo | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01` & `03`)**: Chỉ nạp `Điều 3` (1 Điều) nhưng báo `1/1 Điều` (`VERIFIED_SSOT`). |
| 15 | `doc-ldd-31-2024` | `31/2024/QH15` | `2024-01-18` / `2024-08-01` | 3 | **38 (SAI)** | **260** | `VERIFIED_EXCERPT` | **LỖI P1 (`FIND-CORPUS-04`)**: Luật Đất đai 2024 có 260 Điều, đang báo nhầm 38 Điều theo `compliance_stats`. |
| 16 | `doc-ldt-22-2023` | `22/2023/QH15` | `2023-06-23` / `2024-01-01` | 3 | **34 (SAI)** | **96** | `VERIFIED_EXCERPT` | **LỖI P1 (`FIND-CORPUS-04`)**: Luật Đấu thầu 2023 có 96 Điều, đang báo nhầm 34 Điều theo `compliance_stats`. |
| 17 | `doc-lpccc-55-2024` | `55/2024/QH15` | `2024-11-29` / `2025-07-01` | 1 | **27 (SAI)** | **55** | `VERIFIED_EXCERPT` | **LỖI P1 (`FIND-CORPUS-04`)**: Luật PCCC & CNCH 2024 có 55 Điều, đang báo nhầm 27 Điều. |
| 18 | `doc-nd-99-2021` | `99/2021/NĐ-CP` | `2021-11-11` / `2022-01-01` | 2 | **22 (SAI)** | **56** | `VERIFIED_EXCERPT` | **LỖI P1 (`FIND-CORPUS-04`)**: Nghị định 99/2021/NĐ-CP có 56 Điều, đang báo nhầm 22 Điều. |
| 19 | `doc-lkt-88-2015` | `88/2015/QH13` | `2015-11-20` / `2017-01-01` | 10 | 74 | 74 | `VERIFIED_EXCERPT` | **LỖI P0 (`FIND-CORPUS-02` & `FIND-INT-02`)**: Điều 18 & Điều 29 vẫn ghi bị sửa đổi bởi `108/2025/QH15` về IFRS vào ngày `2025-11-25`; Điều 16, 18, 20, 29 thiếu `previous_excerpt`. |
| 20 | `doc-lqlthue-38-2019` | `38/2019/QH14` | `2019-06-13` / `2020-07-01` | 1 | **1 (SAI)** | **152** | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01`)**: Luật Quản lý thuế 2019 có 152 Điều, mới nạp `Điều 91` (1 Điều) nhưng hệ thống báo `1/1 Điều (Toàn văn đầy đủ)` và gắn `VERIFIED_SSOT`! |
| 21 | `doc-lsd9luat-56-2024` | `56/2024/QH15` | `2024-11-29` / `2025-01-01` | 1 | 11 | 11 | `VERIFIED_EXCERPT` | Đúng siêu dữ liệu (`1/11 Điều`, `VERIFIED_EXCERPT`). |
| 22 | `doc-lsdlkt-108-2025` | `108/2025/QH15` | `2025-12-10` / `2026-07-01` | 1 | 152 | 152 | `VERIFIED_EXCERPT` | Tiêu đề đã đổi sang Luật Quản lý thuế, nhưng `id` vẫn là `doc-lsdlkt-108-2025` và `amends_doc_ids` vẫn trỏ vào `doc-lkt-88-2015`. |
| 23 | `doc-vbhn-18-vpqh` | `THNB-LKT-88-2015` | `2025-12-15` / `2026-07-01` | 1 | 1 | 1 | `INTERNAL_SYNTHESIS` | Đã gắn `INTERNAL_SYNTHESIS`, nhưng `title` (`legalCorpus.ts:1549`) vẫn nhắc tới `Luật 108/2025/QH15` như văn bản sửa đổi Luật Kế toán. |
| 24 | `doc-tt-200-2014` | `200/2014/TT-BTC` | `2014-12-22` / `2015-01-01` | 1 | 129 | 129 | `VERIFIED_EXCERPT` | **LỖI P0 (`FIND-CORPUS-02`)**: `replaced_by_label` (`legalCorpus.ts:1595`) vẫn ghi sai: *"Thông tư Chế độ kế toán mới theo Luật 108/2025/QH15 (từ 01/01/2027)"* (thực tế thay thế bởi `99/2025/TT-BTC` từ `01/01/2026`). |
| 25 | `doc-nd-85-2021-tmdt` | `13/VBHN-BCT` | `2022-02-18` / `2022-02-18` | 1 | 80 | 80 | `OFFICIAL_VBHN` | Đúng số hiệu VBHN `13/VBHN-BCT` của Bộ Công Thương (`1/80 Điều`). |
| 26 | `doc-bvdlcn-91-2025` | `91/2025/QH15` | `2025-06-26` / `2026-01-01` | 4 | 68 | 68 | `VERIFIED_EXCERPT` | Đúng siêu dữ liệu (`4/68 Điều`, `VERIFIED_EXCERPT`). |
| 27 | `doc-nd-356-2025` | `356/2025/NĐ-CP` | `2025-12-31` / `2026-01-01` | 1 | 48 | 48 | `VERIFIED_EXCERPT` | Đúng siêu dữ liệu (`1/48 Điều`, `VERIFIED_EXCERPT`). |
| 28 | `doc-lanm-116-2025` | `116/2025/QH15` | `2025-12-10` / `2026-07-01` | 1 | 52 | 52 | `VERIFIED_EXCERPT` | Đúng siêu dữ liệu (`1/52 Điều`, `VERIFIED_EXCERPT`). |
| 29 | `doc-nd-333-2026` | `333/2026/NĐ-CP` | `2026-08-19` / `2026-08-19` | 1 | 30 | Chưa có Công báo | **`VERIFIED_EXCERPT` (SAI)** | **LỖI P0 (`FIND-CORPUS-03`)**: Văn bản giả định tháng 08/2026 chưa có nguồn Công báo. |
| 30 | `doc-nd-331-2026` | `331/2026/NĐ-CP` | `2026-08-19` / `2026-08-19` | 1 | 34 | Chưa có Công báo | **`VERIFIED_EXCERPT` (SAI)** | **LỖI P0 (`FIND-CORPUS-03`)**: Văn bản giả định tháng 08/2026 chưa có nguồn Công báo. |
| 31 | `doc-nd-330-2026` | `330/2026/NĐ-CP` | `2026-08-19` / `2026-08-19` | 1 | 164 | Chưa có Công báo | **`VERIFIED_EXCERPT` (SAI)** | **LỖI P0 (`FIND-CORPUS-03`)**: Văn bản giả định tháng 08/2026 chưa có nguồn Công báo. |
| 32 | `doc-ldl-60-2024` | `60/2024/QH15` | `2024-11-30` / `2025-07-01` | 1 | **17 (SAI)** | **46** | `VERIFIED_EXCERPT` | **LỖI P1 (`FIND-CORPUS-04`)**: Luật Dữ liệu 2024 có 46 Điều, đang báo nhầm 17 Điều theo `compliance_stats`. |
| 33 | `doc-nd-165-2025` | `165/2025/NĐ-CP` | `2025-06-30` / `2025-07-01` | 1 | 36 | 36 | `VERIFIED_EXCERPT` | Đúng siêu dữ liệu (`1/36 Điều`). |
| 34 | `doc-llt-33-2024` | `33/2024/QH15` | `2024-06-21` / `2025-07-01` | 1 | **15 (SAI)** | **65** | `VERIFIED_EXCERPT` | **LỖI P1 (`FIND-CORPUS-04`)**: Luật Lưu trữ 2024 có 65 Điều, đang báo nhầm 15 Điều theo `compliance_stats`. |
| 35 | `doc-lbvbmnn-117-2025` | `117/2025/QH15` | `2025-12-10` / `2026-07-01` | 1 | 38 | 38 | `VERIFIED_EXCERPT` | Đúng siêu dữ liệu (`1/38 Điều`). |
| 36 | `doc-exp-nd13-2023` | `13/2023/NĐ-CP` | `2023-04-17` / `2023-07-01` | 1 | 44 | 44 | `VERIFIED_EXCERPT` | Đúng siêu dữ liệu (`1/44 Điều`, `HET_HIEU_LUC`). |
| 37 | `doc-exp-latttm-86-2015` | `86/2015/QH13` | `2015-11-19` / `2016-07-01` | 1 | **1 (SAI)** | **60** | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01`)**: Luật ATTTM 2015 có 60 Điều, chỉ nạp 1 Điều nhưng báo `1/1 Điều (Toàn văn đầy đủ)` (`VERIFIED_SSOT`). |
| 38 | `doc-exp-lbvbmnn-29-2018` | `29/2018/QH14` | `2018-11-15` / `2020-07-01` | 1 | **1 (SAI)** | **28** | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01`)**: Luật BVBMNN 2018 có 28 Điều, chỉ nạp 1 Điều nhưng báo `1/1 Điều (Toàn văn đầy đủ)` (`VERIFIED_SSOT`). |
| 39 | `doc-exp-nd85-2016` | `85/2016/NĐ-CP` | `2016-07-01` / `2016-07-01` | 1 | **1 (SAI)** | **35** | **`VERIFIED_SSOT` (SAI)** | **LỖI P0 (`FIND-CORPUS-01`)**: Nghị định 85/2016/NĐ-CP có 35 Điều, chỉ nạp 1 Điều nhưng báo `1/1 Điều (Toàn văn đầy đủ)` (`VERIFIED_SSOT`). |
| 40 | `doc-exp-nd53-2022` | `53/2022/NĐ-CP` | `2022-08-15` / `2022-10-01` | 1 | 30 | 30 | `VERIFIED_EXCERPT` | Đúng siêu dữ liệu (`1/30 Điều`). |
| 41 | `doc-ltmdt-122-2025` | `122/2025/QH15` | `2025-12-10` / `2026-07-01` | 1 | 74 | 74 | `VERIFIED_EXCERPT` | Đúng siêu dữ liệu (`1/74 Điều`). |
| 42 | `doc-nd-248-2026` | `248/2026/NĐ-CP` | `2026-06-30` / `2026-07-01` | 1 | 28 | Chưa có Công báo | **`VERIFIED_EXCERPT` (SAI)** | **LỖI P0 (`FIND-CORPUS-03`)**: Văn bản giả định tháng 06/2026 chưa có nguồn Công báo. |
| 43 | `huong-dan` | `HƯỚNG DẪN` | `2026-11-08` / `2026-11-08` | 5 | 5 | 5 | `REFERENCE_GUIDE` | Tài liệu hướng dẫn nội bộ (`REFERENCE_GUIDE`). |

---

## 3. CHI TIẾT CÁC PHÁT HIỆN TRONG KHO DỮ LIỆU PHÁP LUẬT

### `FIND-CORPUS-01` — [P0] Gán nhãn giả dương tính `VERIFIED_SSOT` (`Toàn văn 1/1 Điều — 100%`) cho 11 văn bản trích lược

- **Severity:** **P0 (Critical Blocker)**
- **File / Line:** `src/core/engines/corpusIntegrityValidator.ts:12-40, 50-72, 74-89`
- **Evidence:**
  Chạy kiểm chứng độc lập trên `prepareVerifiedCorpus(INITIAL_LEGAL_DOCUMENTS)` cho thấy 11 văn bản pháp luật chỉ mới nạp duy nhất **01 Điều trích lược** nhưng do không được khai báo trong `OFFICIAL_TOTAL_ARTICLES_MAP` và không có `compliance_stats.total_sections`, biểu thức:
  ```ts
  const knownTotal =
    doc.total_articles_count ||
    OFFICIAL_TOTAL_ARTICLES_MAP[doc.doc_number] ||
    doc.compliance_stats?.total_sections ||
    loadedCount;
  ```
  đã tự động gán `knownTotal = loadedCount = 1`, dẫn tới `is_full_text = true` (`1/1 Điều — 100%`) và `authenticity_tier = 'VERIFIED_SSOT'` cho:
  1. `38/2019/QH14` (Luật Quản lý thuế 2019 — thực tế có **152 Điều**, chỉ nạp `Điều 91`).
  2. `86/2015/QH13` (Luật An toàn thông tin mạng 2015 — thực tế có **60 Điều**, chỉ nạp `Điều 3`).
  3. `29/2018/QH14` (Luật Bảo vệ bí mật nhà nước 2018 — thực tế có **28 Điều**, chỉ nạp `Điều 5`).
  4. `85/2016/NĐ-CP` (Nghị định bảo đảm an toàn HTTT theo cấp độ — thực tế có **35 Điều**, chỉ nạp `Điều 9`).
  5. `209/2026/NĐ-CP`, `212/2026/NĐ-CP`, `33/2026/TT-BXD`, `34/2026/TT-BXD`, `36/2026/TT-BXD`, `37/2026/TT-BXD`, `38/2026/TT-BXD` (mỗi văn bản chỉ nạp 1 Điều bất kỳ như Điều 4, Điều 5, Điều 10).
- **Root Cause:** Logic fallback `|| loadedCount` trong `computeDocumentCompleteness` mặc định coi một văn bản không rõ tổng số Điều là đã nạp đủ 100% toàn văn!
- **Impact:** Đánh lừa trực tiếp người dùng và `CitationVerifier` rằng hệ thống đang lưu trữ toàn văn 100% các văn bản này.
- **Proposed Fix:**
  1. Tuyệt đối **cấm** dùng `|| loadedCount` để suy ra `is_full_text = true` nếu văn bản chỉ có `< 5` Điều hoặc số thứ tự Điều đã nạp lớn hơn `loadedCount` (VD: chỉ có 1 phần tử nhưng là `Điều 91` thì chắc chắn tổng số Điều `>= 91`!).
  2. Điền đầy đủ `total_articles_count` chuẩn Công báo cho toàn bộ 42 văn bản trong `INITIAL_LEGAL_DOCUMENTS`.
- **Test Case:** `TC-AUDIT-CORPUS-01`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-CORPUS-02` — [P0] Ô nhiễm dữ liệu dây chuyền (Cascading Misattribution) từ `108/2025/QH15` và `15/2023/NĐ-CP`

- **Severity:** **P0 (Critical Blocker)**
- **File / Line:**
  - `src/data/legalCorpus.ts:1346-1359` (`Điều 18` Luật Kế toán `88/2015/QH13`)
  - `src/data/legalCorpus.ts:1404-1418` (`Điều 29` Luật Kế toán `88/2015/QH13`)
  - `src/data/legalCorpus.ts:1549` (`doc-vbhn-18-vpqh`)
  - `src/data/legalCorpus.ts:1594-1595` (`doc-tt-200-2014`)
  - `src/data/legalCorpus.ts:2367-2372, 2388-2393` (`xref-nd15-lxd14`, `xref-nd217-nd15`)
  - `src/data/legalCorpus.ts:2532-2549` (`xref-lsd108-lkt88`)
  - `src/data/legalCorpus.ts:2893` (`alert-pmu-03`)
  - `src/data/stageGateCorpus.ts:291, 313, 445, 625-626`
  - `src/components/SideBySideComparisonView.tsx:80`
  - `server.ts:365, 590`
- **Evidence:**
  1. Mặc dù bản ghi `doc-lsdlkt-108-2025` đã đổi tên thành *"Luật Quản lý thuế số 108/2025/QH15"*, nhưng:
     - Tại `src/data/legalCorpus.ts:1348`, `amendment_info.amending_doc_title` của `Điều 18` Luật Kế toán vẫn ghi: **`"Luật Quản lý thuế 38/2019/QH14 & Luật sửa đổi Luật Kế toán 108/2025/QH15"`** (`promulgation_date: '2025-11-25'`).
     - Tại `src/data/legalCorpus.ts:1405-1417`, `Điều 29` Luật Kế toán vẫn ghi bị sửa đổi bởi **`108/2025/QH15`** về **"biểu mẫu Báo cáo tình hình tài chính theo IFRS"**.
     - Tại `src/data/legalCorpus.ts:2538-2543`, liên kết `xref-lsd108-lkt88` vẫn ghi: **`"Phả hệ Lần 3 (2025): Luật 108/2025/QH15 → Điều 6, 18, 29 Luật Kế toán 88/2015/QH13 (Áp dụng IFRS)"`**.
     - Tại `src/data/legalCorpus.ts:1595`, Thông tư `200/2014/TT-BTC` vẫn ghi `replaced_by_label: 'Thông tư Chế độ kế toán mới theo Luật 108/2025/QH15 (từ 01/01/2027)'` thay vì **Thông tư `99/2025/TT-BTC`** (có hiệu lực từ `01/01/2026`).
  2. Mặc dù bản ghi `doc-nd-15-2023` đã đổi `doc_number` thành `15/2021/NĐ-CP`, nhưng `xref-nd15-lxd14`, `xref-nd217-nd15`, `alert-pmu-03`, `stageGateCorpus.ts:291,313,445,625` và `server.ts:365` vẫn tiếp tục viện dẫn **`Nghị định 15/2023/NĐ-CP`** như là Nghị định về quản lý dự án đầu tư xây dựng!
- **Root Cause:** Ở Bước 2 chỉ sửa trường `title` và `doc_number` ở cấp bản ghi cha (`LegalDocument`) để vượt qua 4 câu `if` trong `validateCorpusIntegrity()`, mà không quét và làm sạch ảnh hưởng dây chuyền trong các mảng con (`articles[].amendment_info`, `INITIAL_CROSS_REFERENCES`, `INITIAL_DAILY_ALERTS`, `stageGateCorpus.ts`, `server.ts`).
- **Impact:** Khi mở Cây phả hệ, Văn bản hợp nhất nội bộ, Đối soát chéo hoặc Stage-Gate Audit, hệ thống vẫn hiển thị thông tin pháp lý sai sự thật (`Luật sửa đổi Luật Kế toán 108/2025/QH15` và `Nghị định 15/2023/NĐ-CP`).
- **Proposed Fix:** Quét và đính chính toàn bộ 14 vị trí tham chiếu dây chuyền nêu trên; bổ sung quy tắc quét toàn văn (`deep corpus scan`) vào `validateCorpusIntegrity()`.
- **Test Case:** `TC-AUDIT-CORPUS-02`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-CORPUS-03` — [P0] Phân loại sai `authenticity_tier` cho 15 văn bản dự phóng năm 2026 và `doc-nd-15-2023` (`15/2021/NĐ-CP`)

- **Severity:** **P0 (Critical Blocker)**
- **File / Line:**
  - `src/core/engines/corpusIntegrityValidator.ts:74-89`
  - `src/data/legalCorpus.ts:323-650, 1790-2320`
- **Evidence:**
  1. `doc-nd-15-2023` (`15/2021/NĐ-CP`, `src/data/legalCorpus.ts:336-337`) đặt `is_consolidated: true` và `consolidated_doc_number: '06/VBHN-BXD'`. Hàm `resolveAuthenticityTier` (`corpusIntegrityValidator.ts:84-86`) lập tức trả về **`OFFICIAL_VBHN`** cho bản ghi này, dù thực chất bản ghi đang lưu trích lược 2 Điều của Nghị định `15/2021/NĐ-CP` (vốn đã hết hiệu lực và bị thay thế bởi Nghị định `175/2024/NĐ-CP` từ ngày `30/12/2024`).
  2. 15 bản ghi Nghị định/Thông tư năm 2026 (`206, 207, 209, 210, 212, 217, 248, 330, 331, 333/2026/NĐ-CP` và `33, 34, 36, 37, 38/2026/TT-BXD`) không có liên kết Công báo chính thức nhưng vẫn được phân loại là `VERIFIED_SSOT` hoặc `VERIFIED_EXCERPT`.
- **Root Cause:** `resolveAuthenticityTier` chưa kiểm tra tính xác thực của nguồn Công báo (`national_database_url` / `vbpl.vn`) trước khi cấp nhãn `VERIFIED_*`.
- **Impact:** Vi phạm nghiêm trọng nguyên tắc *"Tất cả quy phạm trong kho đã xác minh phải liên kết tới nguồn chính thức; không trộn dữ liệu mô phỏng/dự phóng với dữ liệu Công báo"*.
- **Proposed Fix:**
  1. Bổ sung phân loại `SIMULATED_SCENARIO_2026` (hoặc đưa vào `REFERENCE_GUIDE` / `QUARANTINE_REVIEW`) cho các văn bản kịch bản/dự phóng chưa có link Công báo `vbpl.vn` / `congbao.chinhphu.vn`.
  2. Với `doc-nd-15-2023` (`15/2021/NĐ-CP`), bỏ `is_consolidated: true`, cập nhật trạng thái đã được thay thế bởi `175/2024/NĐ-CP` từ `2024-12-30` và nạp bổ sung bản ghi `doc-nd-175-2024` (`175/2024/NĐ-CP`).
- **Test Case:** `TC-AUDIT-CORPUS-03`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-CORPUS-04` — [P1] Tính sai `total_articles_count` do dùng `compliance_stats.total_sections`

- **Severity:** **P1 (High)**
- **File / Line:** `src/core/engines/corpusIntegrityValidator.ts:54-58`
- **Evidence:**
  Trong `computeDocumentCompleteness`:
  ```ts
  const knownTotal =
    doc.total_articles_count ||
    OFFICIAL_TOTAL_ARTICLES_MAP[doc.doc_number] ||
    doc.compliance_stats?.total_sections ||
    loadedCount;
  ```
  Trường `compliance_stats.total_sections` là tổng số yêu cầu tuân thủ (compliance checkpoints), không phải tổng số Điều của văn bản. Hậu quả là 7 đạo luật/nghị định lớn bị hiển thị sai tổng số Điều trên giao diện:
  - `58/2024/QH15` (Luật Đầu tư công): báo `54 Điều` (thực tế **103 Điều**).
  - `31/2024/QH15` (Luật Đất đai): báo `38 Điều` (thực tế **260 Điều**).
  - `22/2023/QH15` (Luật Đấu thầu): báo `34 Điều` (thực tế **96 Điều**).
  - `55/2024/QH15` (Luật PCCC & CNCH): báo `27 Điều` (thực tế **55 Điều**).
  - `99/2021/NĐ-CP` (Nghị định quyết toán vốn ĐTC): báo `22 Điều` (thực tế **56 Điều**).
  - `60/2024/QH15` (Luật Dữ liệu): báo `17 Điều` (thực tế **46 Điều**).
  - `33/2024/QH15` (Luật Lưu trữ): báo `15 Điều` (thực tế **65 Điều**).
- **Root Cause:** Đánh đồng `compliance_stats.total_sections` với `total_articles_count`.
- **Impact:** Sai lệch chỉ số độ phủ (`coverage_percent`) và thông tin số lượng Điều của các đạo luật trụ cột.
- **Proposed Fix:** Xóa hoàn toàn nhánh fallback `doc.compliance_stats?.total_sections` khỏi `computeDocumentCompleteness` và khai báo chính xác `total_articles_count` trong `OFFICIAL_TOTAL_ARTICLES_MAP`.
- **Test Case:** `TC-AUDIT-CORPUS-04`
- **Status:** **VERIFIED (OPEN)**

---

### `FIND-CORPUS-05` — [P1] 08 Liên kết khóa ngoại (`docId` / `articleId`) bị đứt gãy và sai số hiệu Luật Đấu thầu trong `stageGateCorpus.ts`

- **Severity:** **P1 (High)**
- **File / Line:** `src/data/stageGateCorpus.ts:280, 346, 596-603, 633-641, 780-790, 815-825, 905-915`
- **Evidence:**
  Chạy script kiểm tra toàn vẹn tham chiếu (`referential integrity check`) giữa `MASTER_COMPLIANCE_STEPS` và `INITIAL_LEGAL_DOCUMENTS` phát hiện 08 lỗi đứt gãy khóa ngoại:
  1. `step_code: 'I.3.1'` (`stageGateCorpus.ts:601-602`): trỏ tới `docId: 'doc-lpccc-2024'`, `articleId: 'art-lpccc-d15'` (Trong kho SSoT ID đúng là `'doc-lpccc-55-2024'` và chỉ có `'art-lpccc-d18'`).
  2. `step_code: 'I.4.1'` (`stageGateCorpus.ts:639-640`): trỏ tới `docId: 'doc-nd-217-2026'`, `articleId: 'art-nd217-d8'` (`Điều 8` không tồn tại trong `doc-nd-217-2026`).
  3. `step_code: 'II.7.1'` và `'II.10.1'`, cùng `RISK_CATALOG_18` (`stageGateCorpus.ts:280, 346`): ghi sai số hiệu Luật Đấu thầu thành **`23/2023/QH15`** (`docId: 'doc-ldt-23-2023'`, `articleId: 'art-ldt-d43'`, `'art-ldt-d16'`), trong khi Luật Đấu thầu năm 2023 mang số hiệu **`22/2023/QH15`** (`doc-ldt-22-2023`), còn `23/2023/QH15` trên Công báo là **Luật Giá 2023**!
  4. `step_code: 'II.8.1'`: trỏ tới `docId: 'doc-ldd-31-2024'`, `articleId: 'art-ldd-d87'` (`Điều 87` chưa được nạp trong `doc-ldd-31-2024`).
- **Root Cause:** Không có bài kiểm thử tự động kiểm tra khóa ngoại (`Foreign Key Integrity Test`) giữa `stageGateCorpus.ts` và `legalCorpus.ts`.
- **Impact:** Khi người dùng nhấn vào căn cứ pháp lý trong màn hình Stage-Gate Audit ở các bước `I.3.1`, `I.4.1`, `II.7.1`, `II.8.1`, `II.10.1`, trình đọc không mở được văn bản/điều khoản đích và hiển thị sai số hiệu Luật Đấu thầu thành `23/2023/QH15`.
- **Proposed Fix:** Sửa toàn bộ `23/2023/QH15` thành `22/2023/QH15`, đồng bộ `docId`/`articleId` khớp 100% với `INITIAL_LEGAL_DOCUMENTS`, và thêm bài test kiểm tra khóa ngoại tự động.
- **Test Case:** `TC-AUDIT-CORPUS-05`
- **Status:** **VERIFIED (OPEN)**
