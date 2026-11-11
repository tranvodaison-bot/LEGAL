# HƯỚNG DẪN & HỒ SƠ TRIỂN KHAI (DEPLOYMENT MANIFEST) — ĐẠI SƠN LEGAL (LexViet)

> **Cập nhật lần cuối:** 2026-11-11  
> **Trạng thái Production:** `LIVE / ACTIVE (HTTP 200 OK)`  
> **Kiến trúc:** Unified Fullstack (Express API + React 19 Vite PWA + Deterministic SSoT Legal Engine)

---

## 1. Thông Tin Hạ Tầng Đang Chạy Thực Tế (Production Cloud)

| Hạng mục | Giá trị cấu hình |
| :--- | :--- |
| **Nền tảng Cloud PaaS** | **Railway Cloud** (`production`) |
| **URL Web App Chính thức (HTTPS/PWA)** | **https://lexviet-web-production.up.railway.app** |
| **URL Healthcheck API** | **https://lexviet-web-production.up.railway.app/api/health** |
| **GitHub Source Repository** | `https://github.com/tranvodaison-bot/LEGAL` (Nhánh: `main`) |
| **Railway Project Name / ID** | `daison-lexviet-legal` (`1ed0a5cc-93ef-4124-bfb2-67f8dc01fa47`) |
| **Railway Service Name / ID** | `lexviet-web` (`fdfe6249-481b-4723-92ad-2e6e5a119410`) |
| **Railway Environment ID** | `production` (`6e70bca6-e394-45da-bab9-55757876803c`) |
| **Railway Workspace ID** | `9d48bd2c-803a-4600-9ae5-06a50fbe77da` |
| **Cổng Container (Target Port)** | `8080` (Tự động nhận qua `process.env.PORT` trong `server.ts`, fallback `3000` ở Local) |
| **Biến môi trường trên Production** | `NODE_ENV=production`, `GEMINI_API_KEY=AQ.Ab8***G36g` (Đã nạp & mã hóa trên Railway) |

---

## 2. Danh Sách Các Tệp Cấu Hình Deploy Trong Workspace

1. **[`Dockerfile`](file:///e:/4.%20AI_PROJECT/2_Project/2_LEGAL/Dockerfile)** — Đóng gói container chuẩn `node:22-alpine`, cài đặt dependencies với `--legacy-peer-deps`, chạy `npm run build` (sinh gói `dist/` + PWA Service Worker) và khởi chạy `npx tsx server.ts`.
2. **[`railway.json`](file:///e:/4.%20AI_PROJECT/2_Project/2_LEGAL/railway.json)** — Khai báo cấu hình Infrastructure-as-Code cho Railway (`DOCKERFILE`, healthcheck `/api/health`, tự động khởi động lại `ON_FAILURE`).
3. **[`.dockerignore`](file:///e:/4.%20AI_PROJECT/2_Project/2_LEGAL/.dockerignore)** — Loại trừ `node_modules`, `dist`, `.git`, `.env` khỏi Docker build context để tăng tốc độ build và bảo mật khóa API.
4. **[`.npmrc`](file:///e:/4.%20AI_PROJECT/2_Project/2_LEGAL/.npmrc)** — Cấu hình `legacy-peer-deps=true` giúp mọi trình cài đặt đám mây (Railway, Render, Vercel, Netlify) tự động tương thích giữa Vite 8 và các plugin React.
5. **[`server.ts`](file:///e:/4.%20AI_PROJECT/2_Project/2_LEGAL/server.ts)** — Máy chủ Express hợp nhất:
   - Phục vụ 9 API nghiệp vụ pháp lý (`/api/health`, `/api/legal-reasoning`, `/api/cross-law-matrix`, `/api/ocr-dossier-extract`, `/api/ocr-extract`, `/api/stage-gate-audit`, `/api/legal-audit`, `/api/contract-review`, `/api/aqua-chat`).
   - Tự động phục vụ thư mục tĩnh `dist/` và SPA routing khi `NODE_ENV=production`.
6. **[`.env`](file:///e:/4.%20AI_PROJECT/2_Project/2_LEGAL/.env) & [`.env.example`](file:///e:/4.%20AI_PROJECT/2_Project/2_LEGAL/.env.example)** — Tệp biến môi trường cục bộ (`.env` đã được chặn trong `.gitignore` để bảo mật khóa API).

---

## 3. Quy Trình Cập Nhật Phiên Bản Mới (Continuous Deployment — CI/CD)

Mỗi khi bạn chỉnh sửa mã nguồn hoặc bổ sung văn bản pháp luật mới vào kho SSoT tại `e:\4. AI_PROJECT\2_Project\2_LEGAL`, chỉ cần chạy 3 lệnh sau để kiểm thử và tự động cập nhật lên Web App chính thức:

```powershell
# Bước 1: Chạy kiểm thử nghiệm thu (17 test cases) và kiểm tra kiểu TypeScript
npm test
npm run lint

# Bước 2: Commit và đẩy lên nhánh main trên GitHub
git add -A
git commit -m "chore(ssot): cap nhat du lieu va tinh nang phap ly"
git push origin main
```

Ngay khi lệnh `git push origin main` hoàn tất, **Railway** sẽ tự động nhận diện commit mới từ GitHub, build lại Docker image và cập nhật không gián đoạn (Zero-Downtime Rollout) lên **https://lexviet-web-production.up.railway.app**.

---

## 4. Vận Hành Cục Bộ (Local Development & Production Preview)

```powershell
# 1. Chạy môi trường phát triển tại http://localhost:3000
npm run dev

# 2. Build gói Production vào thư mục dist/
npm run build

# 3. Chạy thử bản Production ngay trên máy Windows (cổng 3000)
npm run start:win
```
