# Nhật ký thay đổi dự án Interview English

File này ghi những thay đổi để các thành viên trong nhóm theo dõi. Từ ngày 10/11/2026, mỗi bước hướng dẫn sửa file sẽ được bổ sung tại đây sau khi kiểm tra file đã lưu. Phân biệt rõ code đã có, kiểm tra đã chạy và bước mới hướng dẫn nhưng chưa xác nhận. Không ghi token, mật khẩu hoặc giá trị biến môi trường bí mật vào nhật ký.

## 10/11/2026 — Bắt đầu bảo vệ API ghi dữ liệu

### 01 — Tạo Guard kiểm tra token quản trị

- File: `backend/src/admin-write.guard.ts` — thêm mới.
- Mục đích: chặn thao tác ghi dữ liệu nếu không có token quản trị hợp lệ.
- Cách hoạt động: GET, HEAD và OPTIONS được phép; các method khác phải gửi `Authorization: Bearer <token>`.
- Token kỳ vọng: lấy từ biến môi trường `ADMIN_API_KEY` trên backend, không đưa vào app Expo.
- Thiếu cấu hình server: trả 503. Thiếu/sai token: trả 401.
- So sánh SHA256 của hai token bằng `timingSafeEqual`.
- Trạng thái đã xác nhận: file đã được tạo và build backend thành công.

### 02 — Kích hoạt Guard và cấu hình Swagger

- File: `backend/src/app.ts` — đã sửa.
- Import `APP_GUARD` và `AdminWriteGuard`; đăng ký Guard toàn cục trong providers của AppModule.
- Thêm scheme `admin-token` bằng `addBearerAuth`, tạo nút Authorize trên Swagger.
- Đánh dấu các operation POST, PUT, PATCH và DELETE cần token; thêm mô tả mã lỗi 401/503.
- GET vẫn công khai để app đọc bài học mà không chứa bí mật quản trị.
- Trạng thái đã xác nhận: đọc lại file và chạy `npm run build` trong `backend` thành công ngày 10/11/2026.
- Chưa xác nhận trong bước này: token local, gọi API qua Guard, cấu hình Render và deploy code mới.

### 03 — Thêm nhật ký cho nhóm

- File: `docs/development-log.md` — thêm mới.
- Nội dung: file đã sửa, mục đích, cách kiểm tra, kết quả thực tế và việc còn lại.
- Bước này không chỉnh sửa thêm logic app hoặc backend.

### 04 — Hướng dẫn kiểm tra token trên máy trước khi deploy

- File mã nguồn cần sửa thêm: không có.
- Cấu hình tạm trong terminal PowerShell: tạo `ADMIN_API_KEY` ngẫu nhiên, đặt `PORT=3101`, đặt `DATA_FILE=data/admin-auth-check.json`.
- Dùng cổng 3101 để phân biệt với backend cũ có thể đang chạy ở 3100.
- Dùng file dữ liệu riêng, được `.gitignore` loại trừ, để không sửa dữ liệu demo local hiện có.
- Tạo token bằng Node crypto, sao chép vào clipboard để dán vào Authorize; không hiển thị hoặc gửi token lên chat/GitHub.
- Các biến này chỉ có hiệu lực trong terminal hiện tại và tiến trình được nó khởi động; chưa cấu hình token trên Render.
- Kết quả mong đợi: GET lessons không token trả 200; POST lessons body `{}` không token trả 401; sau khi Authorize với token đúng, POST body `{}` trả 400 do body thiếu trường. Phép thử này không tạo bản ghi mới.
- Trạng thái: người thực hiện đã xác nhận thành công các kết quả 200 → 401 → 400 trên máy local. Chưa xác nhận cấu hình và deploy Guard trên Render.

### 05 — Hướng dẫn cập nhật test tự động cho Guard

- File cần sửa: `backend/test/api.test.cjs`.
- Mục đích: test CRUD cũ cần token khi ghi; bổ sung kiểm tra quyền mà không dùng token thật.
- Thay đổi được hướng dẫn: tạo token ngẫu nhiên riêng cho test, giữ lại và khôi phục giá trị môi trường trước test; hàm request tự gửi token cho method ghi nhưng không gửi cho GET; cho phép gọi thử với token thiếu/sai.
- Bổ sung các ca POST/PATCH/DELETE cho cả Lessons và Questions với thiếu/sai token, GET công khai, server thiếu cấu hình trả 503 và schema bearer trong OpenAPI.
- Vẫn dùng server cổng ngẫu nhiên và thư mục dữ liệu tạm, không sửa dữ liệu local đang dùng hoặc dữ liệu Render.
- Cách kiểm tra: chạy `npm test` tại `backend` trong terminal riêng; nếu áp dụng đúng các bước sẽ có 51 kiểm tra HTTP thay cho 36 kiểm tra cũ.
- Trạng thái: đã đọc lại các phần sửa trong file; ảnh kết quả người thực hiện gửi xác nhận **51 HTTP checks passed**, 1 bài test đạt, 0 thất bại.

### 06 — Hướng dẫn cấu hình token quản trị trên Render

- File mã nguồn cần sửa: không có.
- Cấu hình bên ngoài repository: Render → service `interview-english` → Environment → biến `ADMIN_API_KEY`.
- Tạo token production ngẫu nhiên riêng bằng Node crypto trong PowerShell và sao chép vào clipboard; không ghi giá trị vào nhật ký, code, commit hoặc chat.
- Hướng dẫn chọn Save only để lưu cấu hình cho lần deploy code Guard sắp tới; Save only chưa áp dụng vào service đang chạy.
- Không đặt `PORT=3101` hoặc `DATA_FILE=data/admin-auth-check.json` lên Render. Đây chỉ là cấu hình thử trên máy.
- Kết quả thực tế: người thực hiện đã chọn lưu kèm deploy. Ảnh xác nhận biến `ADMIN_API_KEY` đã được lưu với giá trị được che và service đang Live ở commit `31cd502`. Không xác minh được nội dung token từ ảnh.
- Trạng thái: hoàn tất lưu biến trên đúng service. Lần deploy này vẫn chạy code cũ; Guard mới ở local chưa được push/deploy nên chưa kết luận API public đã được bảo vệ.

### 07 — Hướng dẫn sửa mô tả Swagger cho đúng trạng thái ứng dụng

- File cần sửa: `backend/src/app.ts`, dòng 27 tại thời điểm hướng dẫn.
- Mục đích: bỏ mô tả cũ nói API ghi công khai và app Expo chưa kết nối backend.
- Nội dung mới: Expo đã đọc bài học/câu hỏi từ backend; GET công khai; thao tác ghi cần Bearer token quản trị; chưa có tài khoản người dùng; dữ liệu JSON trên hosting không có ổ đĩa bền vững có thể bị khởi tạo lại.
- Kiểm tra: lưu file rồi chạy `npm test` tại thư mục `backend`; mong đợi 51 HTTP checks passed, 0 thất bại.
- Trạng thái: đã đọc lại mô tả mới trong file; người thực hiện xác nhận toàn bộ test đạt. Chưa push/deploy Guard.

### 08 — Hướng dẫn cập nhật script kiểm tra public có token

- File cần sửa: `backend/test/public-smoke.cjs`, thay toàn bộ nội dung cũ.
- Mục đích: kiểm tra GET công khai, POST thiếu/sai token trả 401 và CRUD có token trên các bản ghi thử riêng.
- Token đọc từ biến môi trường `ADMIN_API_KEY`, không ghi trong file. Cleanup cũng gửi token; chỉ xóa các ID thử ngẫu nhiên của lần chạy.
- Kiểm tra ngay: `node --check test/public-smoke.cjs` tại backend chỉ kiểm tra cú pháp, không gọi Render. Chưa chạy script public trước khi deploy Guard.
- Trạng thái: đã đọc lại script đã lưu; người thực hiện xác nhận kiểm tra cú pháp không lỗi. Chưa chạy trên Render.

### 09 — Sửa kiểm tra dọn dữ liệu thử lặp lại

- File cần sửa: `backend/test/public-smoke.cjs`.
- Phát hiện khi đọc lại: khối finally xóa lại các bản ghi đã xóa trong luồng thành công; phản hồi 404 bình thường đang bị in thành cảnh báo dọn dữ liệu.
- Hướng dẫn: hàm request nhận một hoặc nhiều mã mong đợi; cleanup chấp nhận 204 hoặc 404. Các kiểm tra CRUD chính vẫn giữ mã chính xác.
- Kiểm tra: `node --check test/public-smoke.cjs`; chưa gọi public trước deploy Guard.
- Trạng thái: người thực hiện xác nhận hoàn tất; đã đọc lại bốn dòng sửa và chạy `node --check` thành công.

### 10 — Hướng dẫn cập nhật README về quyền quản trị

- File cần sửa: `README-SWAGGER.md`.
- Mục đích: tài liệu nhóm mô tả đúng GET công khai, ghi cần Bearer token, cách Authorize và cách cấp biến môi trường cho backend/script kiểm tra.
- Ghi rõ Guard đã kiểm tra local nhưng cần deploy và kiểm tra public; không ghi token thật vào tài liệu hoặc app Expo.
- Trạng thái: đã đọc lại README, xác nhận các nội dung hướng dẫn được lưu. Chưa push/deploy Guard.

### 11 — Hướng dẫn commit và push phần bảo vệ API

- Phạm vi: `README-SWAGGER.md`, `backend/src/admin-write.guard.ts`, `backend/src/app.ts`, `backend/test/api.test.cjs`, `backend/test/public-smoke.cjs`, `docs/development-log.md`.
- Đã kiểm tra: `git diff --check` không báo lỗi nội dung; script public hợp lệ cú pháp. Các thư mục marketing, wireframes và báo cáo readiness không thuộc commit này.
- Hướng dẫn stage đúng sáu file, kiểm tra danh sách staged, commit rồi push nhánh master để Render triển khai.
- Trạng thái: commit local `0c79a74` đã tạo; người thực hiện xác nhận hoàn tất push/deploy. Kiểm tra URL public bên dưới xác nhận Guard đã hoạt động. Không đưa token thật lên Git.

### 12 — Kiểm tra Guard trên Render

- Không sửa mã nguồn; cập nhật nhật ký.
- Kết quả gọi trực tiếp `https://interview-english.onrender.com`: GET `/api/lessons` trả 200; POST `/api/lessons` với body `{}` không token trả 401; `/openapi.json` có schema `admin-token` với scheme `bearer`.
- Các phép thử trên không tạo hoặc sửa bản ghi.
- Đã xác nhận: đọc công khai và chặn ghi thiếu token trên public. Ảnh Swagger người thực hiện gửi xác nhận sau Authorize, POST body `{}` trả 400 với lỗi thiếu trường của DTO; token production đã được chấp nhận. Không tạo bài học trong phép thử này.
- CRUD public bằng script public-smoke đã được xác nhận đạt ở bước 14. Không ghi token vào nhật ký.

## Những việc còn lại của phần bảo vệ API

1. Phép thử local ở bước 04 đã được người thực hiện xác nhận đạt.
2. Test `backend/test/api.test.cjs` đã được cập nhật theo Guard mới và đạt 51 kiểm tra HTTP.
3. Script `backend/test/public-smoke.cjs` đã cập nhật, kiểm tra cú pháp và chạy public thành công theo ảnh ở bước 14.
4. Biến môi trường Render, mô tả Swagger và README đã cập nhật.
5. Commit `0c79a74` đã triển khai; GET 200, POST thiếu token 401 và POST có token đúng với body thiếu trường 400 đã được xác nhận. Các cập nhật nhật ký sau commit cần được commit sau khi hoàn tất kiểm tra.

Phần Guard đã được triển khai và kiểm tra local/public; còn đưa bản nhật ký kết quả mới nhất lên GitHub. Dữ liệu JSON trên Render vẫn chưa có lưu trữ bền vững.

## Mẫu ghi cho các bước tiếp theo

- Ngày và bước:
- File hoặc cấu hình đã thay đổi:
- Mục đích:
- Thay đổi cụ thể:
- Cách kiểm tra:
- Kết quả đã xác nhận:
- Điều còn lại và ảnh hưởng tới thành viên khác:

Hướng dẫn đã đưa ra nhưng chưa thấy file lưu hoặc chưa chạy kiểm tra phải ghi là “chưa xác nhận”.

### 13 — Khắc phục lấy nhầm nội dung clipboard khi chạy public smoke

- Ảnh terminal cho thấy ADMIN_API_KEY chứa đoạn lệnh PowerShell nhiều dòng thay vì token; fetch từ chối header Authorization do ký tự xuống dòng (invalid header value).
- Chưa xác nhận CRUD public đạt; lỗi này không chứng minh backend bị lỗi hoặc token Render sai.
- Nguyên nhân: sao chép khối lệnh hướng dẫn sau khi sao chép token đã ghi đè clipboard.
- Hướng dẫn: dán sẵn lệnh gán Get-Clipboard vào terminal nhưng chưa Enter, quay lại Render sao chép token, rồi trở về terminal nhấn Enter. Gõ tay lệnh chạy script sau đó để tránh dán token vào terminal.
- Không ghi token vào log. Chưa sửa mã nguồn trong bước này.

### 14 — Xác nhận public smoke đạt trên Render

- Bằng chứng: ảnh terminal người thực hiện gửi có `PUBLIC SMOKE PASSED`.
- Kết quả: GET 200; POST thiếu/sai token 401; POST có token với body thiếu trường 400; tạo bài/câu hỏi 201; sửa và đọc 200; xóa bài còn câu hỏi 409; xóa câu hỏi và bài thử 204; GET sau xóa 404. Cleanup lặp lại trả 404 đúng dự kiến.
- Dữ liệu thử của lần chạy đã được xóa theo kết quả trên ảnh. Không ghi token vào tài liệu.
- File cập nhật trong bước này: chỉ `docs/development-log.md`; không sửa giao diện hoặc mã backend.
- Hướng dẫn tiếp: xóa biến token khỏi terminal và clipboard, commit/push riêng nhật ký để nhóm đọc được. Chưa xác nhận người thực hiện hoàn tất hai thao tác này.
- Ưu tiên tiếp theo sau khi lưu kết quả: thiết kế lưu trữ database bền vững thay cho JSON trước khi bổ sung tài khoản và đồng bộ tiến độ.

### 15 — Bắt đầu chuẩn bị PostgreSQL

- Đã xác nhận commit nhật ký `00da454` có trong Git local; người thực hiện xác nhận hoàn tất dọn token.
- Đọc lại store.ts: backend hiện lưu JSON đồng bộ và chưa có thư viện PostgreSQL.
- Đề xuất dùng PostgreSQL trên Neon, backend tiếp tục chạy Render. Bước đầu chỉ tạo project database tên interview-english và xem mục Connect; chưa thêm DATABASE_URL vào Render hoặc sửa code.
- Tài liệu tham khảo: https://neon.com/docs/get-started/connect-neon
- Trạng thái: đã hướng dẫn tạo project, chưa xác nhận database được tạo. Không ghi connection string hoặc mật khẩu vào nhật ký.

### 16 — Tạo và liên kết Neon theo yêu cầu trực tiếp

- Theo https://neon.com/get-started/prompt.md, đã cài Neon CLI, đăng nhập qua trình duyệt và chạy neon init cho Codex.
- Organization: org-weathered-heart-70870458. Project: interview-english (red-voice-58118098). Region người thực hiện chọn: AWS Singapore. Branch: main.
- CLI đã cài plugin Neon cho Codex, tạo neon.ts và liên kết .neon, sinh .env.local gồm DATABASE_URL và DATABASE_URL_UNPOOLED cùng metadata branch. Không ghi giá trị bí mật vào nhật ký.
- File thay đổi: .gitignore (bỏ qua env), neon.ts, package.json/package-lock.json (dependency do Neon init), backend/package.json/package-lock.json (dotenv), backend/src/main.ts (đọc env khi khởi động), backend/.env.example (mẫu không có bí mật), docs/development-log.md.
- Đã lưu hai connection strings vào backend/.env. File này và .env.local bị Git bỏ qua; backend đọc .env khi chạy npm start tại backend. Không có import database vào giao diện Expo.
- Kiểm tra: Expo typecheck đạt; backend build và 51 HTTP checks đạt; hai URL có định dạng PostgreSQL hợp lệ. Chưa chạy truy vấn SQL hoặc migrate dữ liệu.
- Phạm vi: kết nối cấu hình đã chuẩn bị; Store vẫn dùng JSON. Chưa thay đổi Render, chưa commit hoặc push bước này. Cần khởi động lại Codex để nạp plugin/MCP Neon.

### 17 — Hướng dẫn cài driver PostgreSQL cho backend

- Đã kiểm tra package.json và controllers.ts: backend chưa có pg; Store vẫn dùng file JSON. MCP Neon chưa xuất hiện trong danh sách công cụ của phiên hiện tại, có thể tiếp tục bằng CLI đã đăng nhập.
- Hướng dẫn chạy tại backend: npm install pg; npm install -D @types/pg; npm run build.
- File sẽ thay đổi khi cài: backend/package.json, backend/package-lock.json. Không cài driver vào package Expo ở thư mục gốc.
- Mục đích: chuẩn bị thư viện gửi truy vấn PostgreSQL và kiểu TypeScript, trước khi viết script tạo bảng và seed.
- Trạng thái: đã hướng dẫn, chưa xác nhận cài thư viện hoặc build. Chưa tạo bảng, sửa Store, migrate dữ liệu hoặc thay đổi Render.

### 18 — Hướng dẫn tạo schema PostgreSQL

- Đã đọc backend/package.json: pg và @types/pg đã được cài; người thực hiện xác nhận build đạt.
- File hướng dẫn tạo mới: backend/sql/001-create-tables.sql.
- Hai bảng lessons và questions giữ các trường hiện có trong DTO. questions.lesson_id tham chiếu lessons.id với ON DELETE RESTRICT; có index để lấy câu hỏi theo bài. sort_order giữ thứ tự bài/câu khi chuyển từ mảng JSON.
- Không lưu questionCount thành cột: sẽ đếm câu hỏi khi đọc. SQL sử dụng transaction và CREATE TABLE IF NOT EXISTS cho lần khởi tạo; không phải công cụ tự sửa schema cũ.
- Trạng thái: mới hướng dẫn lưu file SQL; chưa chạy SQL, tạo bảng thực tế, seed hoặc chuyển Store sang PostgreSQL. Bước sau sẽ tạo script đọc backend/.env để áp dụng schema.

### 19 — Hướng dẫn chạy schema trên Neon

- Đã đọc backend/sql/001-create-tables.sql: nội dung khớp hướng dẫn bước 18; file đã được lưu. Chưa chạy SQL tại thời điểm đọc.
- File hướng dẫn tạo: backend/scripts/migrate.cjs. Script đọc backend/.env theo đường dẫn tuyệt đối dựa trên __dirname, ưu tiên DATABASE_URL_UNPOOLED và dùng pg Client.
- Script chạy file SQL bằng một kết nối; khi lỗi thử ROLLBACK và đóng kết nối. Không in connection string hay toàn bộ lỗi chứa dữ liệu nhạy cảm; chỉ in mã lỗi nếu có.
- Sau khi tạo bảng, đếm số dòng trong lessons/questions để xác nhận truy vấn thành công. Không xóa hoặc seed dữ liệu trong bước này.
- Lệnh: node --check scripts/migrate.cjs, sau đó node scripts/migrate.cjs tại backend.
- Trạng thái: mới hướng dẫn; chưa xác nhận script được lưu hoặc bảng đã được tạo trên Neon. Backend Store vẫn dùng JSON.

### 20 — Hướng dẫn nhập dữ liệu mẫu PostgreSQL

- Đã đọc scripts/migrate.cjs; người thực hiện xác nhận hoàn tất chạy migration. Chưa có ảnh hoặc phép truy vấn độc lập xác minh kết quả trong bước này.
- Đã kiểm tra seed.json gồm 3 bài học và 9 câu hỏi.
- File hướng dẫn tạo: backend/scripts/seed.cjs. Đọc backend/.env và seed.json, nhập bài trước rồi câu hỏi trong một transaction, truy vấn có tham số và giữ sort_order theo thứ tự mảng.
- ON CONFLICT (id) DO NOTHING: không ghi đè dữ liệu đã có. Đây là nhập dữ liệu mẫu từ seed.json, không phải chuyển những chỉnh sửa trong data/database.json hoặc dữ liệu hiện tại trên Render.
- Lệnh: node --check scripts/seed.cjs, rồi node scripts/seed.cjs tại backend. Database mới mong đợi 3 bài, 9 câu và DATABASE SEED PASSED.
- Trạng thái: đã hướng dẫn, chưa xác nhận file seed.cjs đã lưu hoặc dữ liệu đã nhập. Store vẫn dùng JSON, chưa chuyển API sang PostgreSQL.

### 21 — Hướng dẫn tạo service kết nối PostgreSQL

- Người thực hiện xác nhận đã nhập seed; đã đọc phần đầu scripts/seed.cjs. Chưa truy vấn độc lập để xác nhận số lượng dữ liệu.
- File hướng dẫn tạo: backend/src/database.service.ts.
- Service dùng pg Pool với DATABASE_URL, tối đa 5 kết nối, timeout kết nối 15 giây, timeout query 30 giây; kiểm tra SELECT 1 khi Nest khởi tạo và đóng Pool khi ứng dụng dừng.
- Thiếu DATABASE_URL sẽ báo lỗi cấu hình, không tự quay về JSON; không ghi connection string vào code hoặc log.
- Kiểm tra bước này: npm run build tại backend. Chỉ xác minh biên dịch; service chưa đăng ký trong AppModule, Store chưa đổi và API vẫn dùng JSON.
- Trạng thái: đã hướng dẫn, chưa xác nhận file mới đã lưu hoặc build. Bước sau thay Store và đăng ký service.

### 22 — Hướng dẫn tạo phần đọc dữ liệu PostgreSQL

- Đã đọc database.service.ts: file được lưu đúng; người thực hiện xác nhận build đạt.
- File hướng dẫn tạo: backend/src/postgres-store.ts. Chuẩn bị PostgresStore với listLessons/getLesson/listQuestions/getQuestion, dùng DatabaseService và truy vấn tham số.
- Trả questionCount dạng số nguyên, đổi lesson_id thành lessonId và không lộ sort_order trong JSON trả về; giữ thứ tự theo sort_order, id.
- Kiểm tra bước này: npm run build tại backend. Chưa đăng ký PostgresStore vào AppModule; API vẫn dùng Store JSON. Các phương thức ghi sẽ bổ sung trước khi kích hoạt.
- Trạng thái: mới hướng dẫn; chưa xác nhận file mới đã lưu hoặc build. Chưa chạy test đọc PostgreSQL qua API.

### 23 — Hướng dẫn thêm thao tác ghi bài học vào PostgresStore

- Đã đọc postgres-store.ts: bốn hàm đọc được lưu; người thực hiện xác nhận build đạt.
- File sửa: backend/src/postgres-store.ts. Tại bản hiện tại: thêm createLesson/updateLesson/deleteLesson trước dấu đóng class dòng 72; bổ sung import ConflictException và DTO tạo/cập nhật bài học.
- Truy vấn tham số, giữ ID bất biến, gán sort_order cho bài mới. UPDATE dùng COALESCE để PATCH chỉ đổi trường đã gửi; DTO hiện chặn null.
- Xử lý lỗi unique violation 23505 thành 409 và foreign key violation 23503 khi xóa bài còn câu hỏi thành 409; ID không tồn tại trả 404.
- Kiểm tra: npm run build. Chưa kích hoạt PostgresStore, chưa gọi API ghi PostgreSQL; còn ba hàm ghi câu hỏi trước khi nối AppModule/controllers.
- Trạng thái: đã hướng dẫn, chưa xác nhận phần sửa được lưu hoặc build.

### 24 — Hướng dẫn thêm thao tác ghi câu hỏi PostgreSQL

- Đã đọc postgres-store.ts và xác nhận ba hàm ghi bài học đã lưu; người thực hiện báo build đạt.
- File sửa: backend/src/postgres-store.ts. Trước dấu đóng class dòng 157 tại thời điểm đọc, thêm createQuestion/updateQuestion/deleteQuestion; thêm CreateQuestionDto và UpdateQuestionDto vào import DTO.
- Truy vấn có tham số, ánh xạ lessonId sang lesson_id; ID câu hỏi bất biến. ID trùng trả 409; câu hỏi hoặc bài học không tồn tại trả 404. Khóa ngoại vẫn chặn dữ liệu mồ côi khi có thao tác đồng thời.
- Kiểm tra: npm run build tại backend. PostgresStore chưa đăng ký; API hiện vẫn dùng JSON.
- Trạng thái: đã hướng dẫn, chưa xác nhận file được lưu hoặc build. Tiếp theo nối provider và sửa controller DELETE để chờ Promise trước khi trả 204, rồi kiểm tra PostgreSQL thực tế.

### 25 — Hướng dẫn kích hoạt PostgreSQL trong API local

- Đã đọc phần cuối PostgresStore và file app/controllers; người thực hiện xác nhận build đạt sau khi thêm các hàm ghi câu hỏi.
- File hướng dẫn sửa: backend/src/controllers.ts (import/inject PostgresStore và return Promise tại hai hàm DELETE); backend/src/app.ts (đăng ký DatabaseService, PostgresStore thay Store JSON).
- Kiểm tra: build, mở server local cổng 3102 bằng npm start tại backend, thử GET lessons và câu hỏi bài intro trong Swagger. Chưa push hoặc thay đổi Render.
- Bộ test api.test.cjs hiện vẫn chuẩn bị dữ liệu JSON tạm; cần chuyển sang database/schema test riêng trước khi chạy lại, tránh tác động database chính. Build không xác minh truy vấn SQL.
- Trạng thái: mới hướng dẫn, chưa xác nhận sửa file hoặc API PostgreSQL local hoạt động. store.ts JSON cũ giữ lại nhưng không còn provider sau khi áp dụng bước này.

### 26 — Chuẩn bị cô lập schema cho test PostgreSQL

- Người thực hiện xác nhận bước nối API hoàn tất; đã đọc app.ts có DatabaseService và PostgresStore. Chưa có phép gọi độc lập xác minh API local trong bước này.
- Đã đọc test/api.test.cjs: test cũ dùng DATA_FILE và ID cố định, chưa thể chạy an toàn với schema nội dung thật.
- File hướng dẫn sửa: backend/src/database.service.ts. Thêm DATABASE_SCHEMA tùy chọn, kiểm tra tên bằng regex giới hạn, truyền search_path chỉ gồm schema đó qua options của pg Pool. Không thêm public làm fallback.
- Khi không đặt DATABASE_SCHEMA, ứng dụng giữ search_path mặc định. Biến schema dành cho test sẽ do bộ test đặt và khôi phục, không thêm vào Render hoặc .env ở bước này.
- Kiểm tra: npm run build. Chưa chạy npm test; còn tạo helper khởi tạo/seed schema tạm và sửa lifecycle test để dọn schema khi kết thúc.
- Trạng thái: mới hướng dẫn, chưa xác nhận thay đổi được lưu hoặc build.

### 27 — Hướng dẫn tạo helper database cho test

- Đã đọc DatabaseService: cấu hình DATABASE_SCHEMA được lưu đúng; người thực hiện xác nhận build đạt.
- File hướng dẫn tạo: backend/test/database-helper.cjs.
- Helper đọc backend/.env, chọn direct URL nếu có, tạo schema tên test_<UUID> do code sinh; đặt search_path chỉ trỏ schema này, chạy file SQL và nhập seed vào các bảng riêng bằng truy vấn tham số.
- Trả schema, connectionString và cleanup cho bộ test. cleanup chỉ DROP schema ngẫu nhiên của lần chạy, đóng kết nối trong finally; khi khởi tạo lỗi cũng dọn schema đã tạo.
- Không in URL hoặc mật khẩu. Dữ liệu nội dung public không thuộc search_path của helper.
- Kiểm tra bước này: node --check test/database-helper.cjs. Chưa chạy helper độc lập hoặc npm test; bước sau gắn vào test/api.test.cjs và khôi phục env sau test.
- Trạng thái: đã hướng dẫn, chưa xác nhận file được lưu hoặc cú pháp đạt.

### 28 — Hướng dẫn nối bộ test HTTP với schema PostgreSQL tạm

- Đã đọc helper đã lưu và kiểm tra cú pháp thành công.
- File sửa: backend/test/api.test.cjs. Bỏ setup thư mục JSON tạm; dùng createTestDatabase, đặt DATABASE_URL và DATABASE_SCHEMA cho ứng dụng test, giữ token ngẫu nhiên riêng.
- Khi kết thúc: đóng app trước, cleanup schema sau, luôn khôi phục các biến môi trường đã đổi kể cả khi dọn lỗi. Các kiểm tra HTTP và restart giữ nguyên.
- Chạy npm test tại backend; cần mạng tới Neon. Mong đợi 51 HTTP checks passed. Hai lần createApp dùng cùng schema test để kiểm tra dữ liệu còn sau restart, cuối cùng schema bị xóa.
- Trạng thái: đã hướng dẫn sửa, chưa xác nhận file đã lưu hoặc toàn bộ test PostgreSQL đạt. Render vẫn chưa được chuyển sang database.

### 29 — Chẩn đoán lỗi tạo câu hỏi PostgreSQL

- Ảnh test: POST /api/questions nhận 500 thay vì 201.
- Đã tái hiện truy vấn trực tiếp trong schema test riêng: PostgreSQL báo 42P08, inconsistent types deduced for parameter $2. Không phải cảnh báo SSL gây thất bại này.
- Nguyên nhân: cùng tham số lessonId xuất hiện trong INSERT và biểu thức SELECT tính sort_order, PostgreSQL suy luận kiểu không nhất quán.
- Đã thử truy vấn sửa trong schema tạm và đạt: ép $2 thành varchar(80) ở VALUES và WHERE của subquery. Schema chẩn đoán đã được dọn.
- File hướng dẫn sửa: backend/src/postgres-store.ts, dòng 171 và 173 tại thời điểm đọc. Chưa tự sửa file; người thực hiện sẽ lưu rồi chạy npm test để kiểm tra toàn bộ.
- Hướng dẫn truy vấn trước đây thiếu ép kiểu; lỗi nằm trong code được hướng dẫn, không phải thao tác nhập của người thực hiện.

### 30 — Sửa ánh xạ lỗi ON DELETE RESTRICT

- Test đã vượt bước tạo câu hỏi, hiện lỗi DELETE bài còn câu hỏi: nhận 500 thay vì 409.
- Đã tái hiện bằng PostgresStore trong schema test riêng: Neon trả SQLSTATE 23001 (restrict_violation), trong khi code chỉ bắt 23503 (foreign_key_violation). Schema chẩn đoán đã được dọn.
- File hướng dẫn sửa: backend/src/postgres-store.ts, dòng 151 tại thời điểm đọc. Chấp nhận cả 23001 và 23503 trong catch của deleteLesson, cùng chuyển thành ConflictException 409.
- Không thay đổi các catch của createQuestion/updateQuestion; đây là trường hợp xóa bài với ON DELETE RESTRICT.
- Trạng thái: đã tìm nguyên nhân, mới hướng dẫn sửa; chưa xác nhận toàn bộ npm test đạt. Lỗi do ánh xạ thiếu mã PostgreSQL trong hướng dẫn trước.

### 31 — Trực tiếp sửa lỗi xóa bài còn câu hỏi và kiểm tra

- Người thực hiện yêu cầu sửa trực tiếp bước này.
- Đã sửa backend/src/postgres-store.ts dòng 151: deleteLesson nhận cả SQLSTATE 23503 và 23001, trả ConflictException 409 khi bài còn câu hỏi.
- Đã chạy npm test tại backend: build đạt, 51 HTTP checks passed, 1 test đạt, 0 thất bại; có kiểm tra CRUD, validation, quyền quản trị và dữ liệu sau khi khởi động lại app trên schema PostgreSQL tạm.
- Bộ test hoàn tất cleanup schema theo helper. Không sửa dữ liệu nội dung public hoặc deploy Render trong bước này.
- Cập nhật file: backend/src/postgres-store.ts và docs/development-log.md. Chưa commit/push.

### 32 — Chuẩn bị biến database trên Render trước deploy

- Đã đọc Dockerfile: dùng COPY các đường dẫn cụ thể, hiện không copy .env; .dockerignore chưa có quy tắc env. Backend khởi tạo DatabaseService cần DATABASE_URL trên Render khi deploy code mới.
- File hướng dẫn sửa: backend/.dockerignore, thêm .env và .env.* ở cuối để loại secrets khỏi build context.
- Cấu hình hướng dẫn: Neon project red-voice-58118098, Connect, branch main, pooled connection string; thêm DATABASE_URL vào Environment của đúng Render service interview-english và chọn Save only.
- Giữ nguyên ADMIN_API_KEY. Không thêm DATABASE_SCHEMA của test. DATABASE_URL_UNPOOLED chỉ đang dùng cho migration/seed local, chưa cần đặt trên Render.
- Trạng thái: mới hướng dẫn, chưa xác nhận lưu biến hoặc .dockerignore. Chưa push/deploy; cần sửa mô tả Swagger/README về PostgreSQL và kiểm tra phạm vi commit trước khi triển khai.

### 33 — Cập nhật tài liệu PostgreSQL trước deploy

- Người thực hiện xác nhận đã thêm DATABASE_URL trên Render; không đọc giá trị secret hoặc xác minh kết nối Render trong bước này.
- Đã đọc backend/.dockerignore và xác nhận .env/.env.* đã thêm.
- File hướng dẫn sửa: backend/src/app.ts (mô tả PostgreSQL), backend/src/controllers.ts (POST bài học cần quản trị), README-SWAGGER.md (lưu trữ, trạng thái triển khai và kết quả 51 HTTP checks PostgreSQL local).
- Mô tả phân biệt local đã chuyển PostgreSQL và Render vẫn chờ deploy; dữ liệu JSON tùy chỉnh chưa tự động được nhập vào Neon. Không cam kết giữ dữ liệu vĩnh viễn.
- Trạng thái: mới hướng dẫn sửa tài liệu, chưa xác nhận file được lưu. Chưa commit/push code PostgreSQL.

### 34 — Trực tiếp hoàn thiện Markdown và chuẩn bị commit PostgreSQL

- Từ bước này người thực hiện yêu cầu mọi sửa đổi .md được trợ lý thực hiện trực tiếp.
- Đã cập nhật README-SWAGGER.md: cách cấu hình env, migrate/seed trên máy mới, test bằng schema tạm, biến Render cần có và danh sách file PostgreSQL; sửa mô tả test JSON còn sót.
- Đã xác nhận app.ts/controllers.ts có mô tả PostgreSQL và quyền quản trị mới.
- Kiểm tra: Expo npm run typecheck đạt, git diff --check không lỗi nội dung; .env.local và backend/.env được git check-ignore xác nhận loại trừ. Backend đã đạt 51 HTTP checks ở bước 31, từ đó chỉ sửa tài liệu/mô tả Swagger.
- Hướng dẫn stage danh sách file PostgreSQL/Neon và tài liệu cụ thể, bỏ qua marketing, wireframes và readiness; kiểm tra staged rồi commit/push để Render triển khai.
- Trạng thái: chưa stage, commit, push hoặc xác nhận Render chạy PostgreSQL. Người thực hiện đã xác nhận thêm DATABASE_URL trên Render, chưa kiểm tra giá trị. Sau Live cần kiểm tra GET, CRUD có token và dữ liệu còn sau restart/deploy.
