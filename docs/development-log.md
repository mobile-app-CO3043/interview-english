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
- Trạng thái: mới hướng dẫn thao tác Git; chưa xác nhận commit, push hoặc deploy. Không đưa token thật lên Git.

## Những việc còn lại của phần bảo vệ API

1. Phép thử local ở bước 04 đã được người thực hiện xác nhận đạt.
2. Test `backend/test/api.test.cjs` đã được cập nhật theo Guard mới và đạt 51 kiểm tra HTTP.
3. Cập nhật `backend/test/public-smoke.cjs` trước khi dùng lại với server có Guard. Không ghi token thật vào script.
4. Biến môi trường quản trị trên Render đã được lưu; mô tả Swagger trong app.ts đã cập nhật. Cần rà soát tài liệu README liên quan trước khi push.
5. Commit/push đúng các file cần thiết, chờ deploy rồi thử đọc và chặn ghi trên URL public.

Việc build thành công chỉ xác nhận mã biên dịch được, không chứng minh API public đã được bảo vệ. Bản sửa local chưa được push/deploy trong đợt hướng dẫn này.

## Mẫu ghi cho các bước tiếp theo

- Ngày và bước:
- File hoặc cấu hình đã thay đổi:
- Mục đích:
- Thay đổi cụ thể:
- Cách kiểm tra:
- Kết quả đã xác nhận:
- Điều còn lại và ảnh hưởng tới thành viên khác:

Hướng dẫn đã đưa ra nhưng chưa thấy file lưu hoặc chưa chạy kiểm tra phải ghi là “chưa xác nhận”.
