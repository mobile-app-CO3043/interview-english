# Backend và Swagger Docs cho Interview English

Ngày thực hiện: 03/11/2026.

## 1. Link đã mở công khai để thử ngay

**Swagger Docs để nộp bài:** https://interview-english.onrender.com/docs

**OpenAPI JSON:** https://interview-english.onrender.com/openapi.json

Backend đã triển khai thành công trên Render bằng Docker từ repository của nhóm. Link trên không phụ thuộc máy cá nhân và có thể thử API trực tiếp trong Swagger. Render Free có thể ngủ khi không có truy cập; lần mở lại có thể cần chờ khoảng một phút. Khả năng hoạt động phụ thuộc service và tài khoản Render, không được bảo đảm vĩnh viễn.

Trước khi deploy Render, dự án từng dùng Cloudflare Tunnel để thử tạm. Tunnel không cần thiết cho URL Render. Các file log của lần thử cũ nằm ngoài repository tại:

- `D:\261\Mobile App\tmp\interview-api-processes.json`
- `D:\261\Mobile App\tmp\interview-api.out.log`
- `D:\261\Mobile App\tmp\interview-api.err.log`
- `D:\261\Mobile App\tmp\interview-tunnel.err.log`

Nếu từng nộp link `trycloudflare.com`, hãy thay bằng URL Render `/docs` ở trên.

## 2. Đối chiếu yêu cầu trên lớp

Ảnh đề bài yêu cầu “Develop and Deploy 2 API collections for your Assignment Project”, nộp link Swagger Docs có thể thử API trực tiếp; khuyến nghị NestJS.

Backend này dùng NestJS và TypeScript, chia thành hai nhóm trong Swagger:

1. **Lessons – Bài học:** tạo, danh sách, chi tiết, cập nhật, xóa và lấy câu hỏi theo bài.
2. **Questions – Câu hỏi:** tạo, danh sách, lọc theo bài, chi tiết, cập nhật và xóa.

Đây là API thực sự chạy được, không phải chỉ có bản thiết kế OpenAPI. Swagger UI phục vụ trực tiếp từ backend, hỗ trợ **Try it out → Execute** trên cùng máy chủ. Có 11 thao tác API, chia thành đúng hai nhóm nghiệp vụ.

App Expo đã gọi API đọc bài học và câu hỏi qua `src/api.ts`. Nội dung được lưu trên điện thoại để dự phòng khi API lỗi; tiến độ tự đánh giá vẫn lưu riêng bằng AsyncStorage, chưa đồng bộ lên server. Chưa có tài khoản hoặc tải bản ghi âm. Dữ liệu mẫu gồm đúng 3 bài và 9 câu từ `App.tsx` tại thời điểm tạo backend. Xem [hướng dẫn kết nối và cache](./docs/api-integration.md).

## 3. Danh sách API

| Nhóm | Method | URL | Kết quả thành công |
|---|---|---|---|
| Lessons | GET | `/api/lessons` | 200, danh sách bài |
| Lessons | POST | `/api/lessons` | 201, bài mới |
| Lessons | GET | `/api/lessons/{lessonId}` | 200, chi tiết bài |
| Lessons | PATCH | `/api/lessons/{lessonId}` | 200, bài đã sửa |
| Lessons | DELETE | `/api/lessons/{lessonId}` | 204, không có body |
| Lessons | GET | `/api/lessons/{lessonId}/questions` | 200, câu hỏi của bài |
| Questions | GET | `/api/questions` | 200, danh sách câu |
| Questions | POST | `/api/questions` | 201, câu mới |
| Questions | GET | `/api/questions/{questionId}` | 200, chi tiết câu |
| Questions | PATCH | `/api/questions/{questionId}` | 200, câu đã sửa |
| Questions | DELETE | `/api/questions/{questionId}` | 204, không có body |

`GET /api/questions?lessonId=intro` lọc câu hỏi của bài `intro`. Các bài mẫu có ID `intro`, `projects`, `teamwork`.

Mã lỗi được xử lý: **400** nếu body sai, thiếu trường, trường lạ, giá trị null hoặc màu sai định dạng; **404** nếu bài/câu không tồn tại; **409** nếu ID trùng, đổi ID hoặc xóa bài còn câu hỏi. ID câu hỏi là duy nhất trong toàn bộ nhóm Questions. Không dùng ID chứa dấu cách. PATCH chỉ gửi trường cần sửa; không được đổi ID.

## 4. Cách thử để trình bày cho thầy

1. Mở link Swagger ở mục 1 hoặc URL hosting ở mục 7.
2. Mở **GET /api/lessons → Try it out → Execute**. Ban đầu nhận 3 bài.
3. Mở **GET /api/lessons/{lessonId}/questions**, nhập `intro`, Execute. Ban đầu nhận 3 câu.
4. Mở **POST /api/lessons**, Try it out và gửi body:

```json
{
  "id": "demo-lesson",
  "number": "BÀI 04",
  "title": "Luyện phỏng vấn thử",
  "subtitle": "Bài học tạo từ Swagger",
  "icon": "🎯",
  "color": "#4F46E5"
}
```

5. Mở **POST /api/questions**, tạo câu thuộc bài vừa tạo:

```json
{
  "id": "demo-question",
  "lessonId": "demo-lesson",
  "question": "Why do you want to learn English?",
  "vietnamese": "Vì sao bạn muốn học tiếng Anh?",
  "phrase": "I want to communicate with my team.",
  "meaning": "Tôi muốn giao tiếp với nhóm.",
  "answer": "I want to learn English to communicate with my team and prepare for interviews.",
  "translation": "Tôi muốn học tiếng Anh để giao tiếp với nhóm và chuẩn bị phỏng vấn."
}
```

6. Thử **PATCH /api/questions/{questionId}** với ID `demo-question`, body:

```json
{
  "answer": "I want to improve my English for software engineering interviews."
}
```

7. GET lại để thấy dữ liệu đã đổi.
8. Xóa `demo-question` trước, rồi xóa `demo-lesson`. Cả hai trả 204, body trống là đúng. Nếu demo nhiều lần mà gặp 409 trùng ID, dùng ID mới hoặc xóa dữ liệu demo cũ.
9. Thử GET với ID `missing` để minh họa 404; POST body `{}` để minh họa 400; xóa bài `intro` còn câu hỏi để minh họa 409.

Sau khi deploy Guard: GET công khai; POST, PATCH và DELETE cần token quản trị. Trước khi thử thao tác ghi trong Swagger, bấm Authorize, dán token vào ô nhập mà không thêm chữ Bearer, rồi xác nhận. Thiếu hoặc sai token trả 401; server chưa cấu hình ADMIN_API_KEY trả 503. Khi đã Authorize đúng, POST body {} trả 400 do thiếu trường. Chỉ dùng dữ liệu thử nghiệm.

## 5. Chạy lại backend trên máy

Mở terminal PowerShell riêng, không dừng terminal Expo. Cần có `backend/.env` với `DATABASE_URL` và `DATABASE_URL_UNPOOLED` từ Neon; lấy tên biến từ `.env.example`, không ghi giá trị thật vào Git. Trên máy mới, chạy hai script bên dưới để tạo bảng và nhập dữ liệu mẫu trước khi khởi động API.

```powershell
cd 'D:\261\Mobile App\tu-vung-thuc-te\backend'
npm ci
node scripts/migrate.cjs
node scripts/seed.cjs
npm run build
$env:ADMIN_API_KEY = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
npm start
```

Mở http://localhost:3100/docs. Đây là link trên máy bạn, không phải link nộp cho thầy. `GET /health` kiểm tra server đang chạy. Nếu báo cổng 3100 đã được dùng, có thể backend nền vẫn đang chạy: thử mở link trước, không cần chạy thêm một server.

Để mở URL công khai mới, giữ backend chạy và mở terminal khác:

```powershell
cd 'D:\261\Mobile App\tu-vung-thuc-te\backend'
powershell -ExecutionPolicy Bypass -File .\start-public.ps1
```

Script dùng binary `cloudflared.exe` đã tải vào `D:\261\Mobile App\tmp\tools`. Nó in URL mới dạng `https://....trycloudflare.com`. Thêm `/docs` vào cuối URL. Đừng chạy lại script nếu vẫn cần giữ URL cũ.

Nếu chuyển sang máy khác, cài cloudflared theo tài liệu chính thức, chạy backend rồi chạy:

```powershell
cloudflared tunnel --url http://127.0.0.1:3100 --protocol http2
```

## 6. Kiểm thử và lưu dữ liệu

```powershell
cd 'D:\261\Mobile App\tu-vung-thuc-te\backend'
npm test
```

Bài kiểm thử cần mạng tới Neon. Helper tạo schema PostgreSQL ngẫu nhiên, nhập seed riêng, dựng server trên cổng ngẫu nhiên và kiểm tra Swagger, hai nhóm CRUD, quyền quản trị, validation, liên kết bài/câu và dữ liệu sau khi khởi động lại. Sau khi đóng ứng dụng, helper xóa schema test. Không đặt DATABASE_SCHEMA trong .env hoặc Render; bộ test tự quản lý biến này. Không chạy test với search_path trỏ tới bảng nội dung thật.

Ngày 10/11/2026: bản PostgreSQL local build thành công và đạt 51 kiểm tra HTTP, gồm CRUD, validation, quyền quản trị và dữ liệu sau khi khởi động lại ứng dụng. Test dùng schema tạm riêng rồi dọn sau khi kết thúc. Ảnh terminal xác nhận bản PostgreSQL trên Render đạt PUBLIC SMOKE PASSED, các bản ghi smoke đã được xóa. Người thực hiện xác nhận GET bài thử trả 200 sau deploy lại; trợ lý kiểm tra lại URL public cũng nhận đúng bản ghi persist-check-20261110. Người thực hiện xác nhận DELETE trả 204; kiểm tra độc lập sau đó GET bài thử trả 404, danh sách còn 3 bài và 9 câu.

Có thể thử trực tiếp URL công khai bằng:

```powershell
node test/public-smoke.cjs https://interview-english.onrender.com
```

Chỉ chạy script public sau khi deploy Guard. Trước khi chạy, đặt biến môi trường ADMIN_API_KEY trong terminal bằng đúng token đã cấu hình trên Render. Script kiểm tra GET công khai, chặn POST thiếu/sai token và thử CRUD bằng token đúng trên các bản ghi thử riêng, sau đó dọn dữ liệu thử. Không ghi token thật vào script hoặc GitHub.

Bản backend mới đọc/ghi PostgreSQL qua DATABASE_URL. Schema nằm trong backend/sql/001-create-tables.sql; scripts/migrate.cjs tạo bảng và scripts/seed.cjs nhập dữ liệu mẫu, bỏ qua ID đã tồn tại. Các chỉnh sửa trong file JSON cũ không tự được chuyển sang PostgreSQL. Không đưa connection string vào Git hoặc app Expo.

Đã tách thư mục backend khỏi kiểm tra TypeScript của Expo trong `tsconfig.json` để các decorator NestJS không làm lỗi app. Backend có `package.json` và `package-lock.json` riêng; cài thư viện backend trong thư mục `backend`, không cài ở thư mục Expo.

## 7. Lấy URL hosting ổn định hơn để nộp

Service hiện tại đã deploy trên Render bằng Docker và có URL ở mục 1. Các bước dưới là cách tạo lại service bằng Node runtime nếu cần; cũng có thể dùng Dockerfile trong `backend`. Không tạo thêm service chỉ để sử dụng link đang chạy.

1. Đưa các file mới lên repository `mobile-app-CO3043/interview-english` bằng quy trình Git của nhóm. Không đưa `node_modules`, `.venv`, `data` hoặc log lên Git. Nếu dùng Git trong VS Code, chọn đúng các file backend, `README-SWAGGER.md` và thay đổi `tsconfig.json` để commit, không vô tình gộp các thay đổi giao diện chưa muốn nộp.
2. Đăng nhập https://dashboard.render.com bằng tài khoản của nhóm.
3. Chọn **New → Web Service**, kết nối repository của nhóm.
4. Chọn đúng branch có mã backend và cấu hình:

| Mục | Giá trị |
|---|---|
| Name | Tên khả dụng, ví dụ `interview-english-api` |
| Language hoặc Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free nếu khả dụng |
| Health Check Path | `/health` |
| Environment Variable | `NODE_VERSION=24.11.0` |

5. Trước khi deploy, thêm `DATABASE_URL` (pooled connection string của Neon) và `ADMIN_API_KEY` vào Environment của service. Database phải được tạo bảng và nhập dữ liệu trước bằng các script ở mục 5. Không thêm DATABASE_SCHEMA của test. Nhấn Deploy và đợi build thành công; backend đọc cổng `PORT` do hosting cấp và lắng nghe trên `0.0.0.0`.
6. Sao chép URL thật Render cấp, thêm `/docs`. Không tự đoán hostname từ ví dụ.
7. Mở URL trên điện thoại bằng 4G hoặc cửa sổ trình duyệt riêng; thử GET, POST và DELETE trực tiếp trong Swagger như mục 4.
8. Nộp URL `/docs` thật đã kiểm tra. Khi đó không cần để máy cá nhân bật.

Nếu dùng Blueprint, file cấu hình nằm ở `backend/render.yaml`; cần chỉ đúng đường dẫn file Blueprint đó. Không phải chỉ có file cấu hình là đã deploy.

Backend Render có thể ngủ và cần thời gian khởi động lại. Sau khi triển khai bản PostgreSQL, dữ liệu nội dung nằm trên Neon, tách khỏi filesystem của Render; deploy backend không tự xóa hoặc seed lại database. Cần quản lý sao lưu và giới hạn tài khoản Neon riêng.

## 8. Cấu trúc mã nguồn và phần chưa làm

```text
backend/
  src/main.ts            Khởi động và cổng server
  src/app.ts             Module, ValidationPipe, Swagger
  src/controllers.ts     Hai nhóm API
  src/dto.ts             Schema request và response
  src/postgres-store.ts  Đọc/ghi bài học và câu hỏi trong PostgreSQL
  src/database.service.ts  Pool kết nối PostgreSQL
  sql/001-create-tables.sql  Định nghĩa bảng và khóa ngoại
  scripts/migrate.cjs    Chạy SQL tạo bảng
  scripts/seed.cjs       Nhập dữ liệu mẫu, bỏ qua ID đã có
  test/database-helper.cjs  Tạo và dọn schema PostgreSQL test
  seed.json              Dữ liệu 3 bài và 9 câu từ app
  test/api.test.cjs      Kiểm thử HTTP trên máy
  test/public-smoke.cjs  Kiểm thử URL công khai
  Dockerfile            Đóng gói để deploy
  render.yaml           Cấu hình Render
  start-public.ps1       Mở tunnel khi backend đã chạy
```

App Expo đã kết nối API đọc nội dung. Commit PostgreSQL `71d2a08` đã triển khai trên Render; GET trả 3 bài học, 9 câu hỏi với mã 200 và CRUD có token đạt PUBLIC SMOKE PASSED theo ảnh kết quả ngày 10/11/2026. Bản local đạt 51 kiểm tra HTTP; người thực hiện đã xác nhận giữ bài thử qua deploy lại và GET public được kiểm tra lại thành công. Chưa có tài khoản người dùng hoặc đồng bộ tiến độ; app Expo không chứa token quản trị hay mật khẩu database.

## 9. Tài liệu chính thức đã tham khảo

- NestJS Swagger: https://docs.nestjs.com/openapi/introduction
- NestJS Validation: https://docs.nestjs.com/techniques/validation
- NestJS Deployment: https://docs.nestjs.com/deployment
- Cloudflare Quick Tunnels: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
- Cloudflared downloads: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
- Render Node deployment: https://render.com/docs/deploy-node-express-app
- Render Free và các giới hạn: https://render.com/docs/free
