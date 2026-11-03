# Kết nối app Expo với backend Interview English

Cập nhật ngày 03/11/2026. Tài liệu mô tả bản app đã kết nối API đọc nội dung và lưu bản sao trên điện thoại. Phần giao diện hiện tại được giữ lại, chưa tiếp tục thiết kế lại.

## Các địa chỉ cần biết

- Backend: https://interview-english.onrender.com
- Swagger để nộp và thử API: https://interview-english.onrender.com/docs
- OpenAPI: https://interview-english.onrender.com/openapi.json
- Kiểm tra server: https://interview-english.onrender.com/health

App gọi các đường dẫn `/api/...`, không gọi `/docs`. Swagger là công cụ thử và tài liệu hóa API, không phải kho dữ liệu riêng.

## Luồng dữ liệu

```text
App.tsx
  → fetchLearningContent trong src/api.ts
  → GET /api/lessons và GET /api/questions song song
  → ghép question.lessonId với lesson.id vào mảng prompts
  → cập nhật danh sách bài học trong app
  → lưu nội dung vào AsyncStorage
```

`fetchLessonQuestions(lessonId)` cũng được cung cấp để đọc riêng câu hỏi theo bài, nhưng luồng khởi động hiện tại dùng hai API danh sách ở trên.

## Khi không tải được backend

App đợi yêu cầu API, mỗi yêu cầu có giới hạn 90 giây. Nếu thành công, dùng nội dung mới và thử lưu bản sao. Nếu API thất bại:

1. Đọc bản lưu nội dung từ AsyncStorage.
2. Kiểm tra JSON và cấu trúc trường của từng bài, từng câu.
3. Nếu hợp lệ, dùng bản lưu và hiện “Đang dùng bài học đã lưu”.
4. Nếu không có hoặc bản lưu lỗi, dùng mảng `LESSONS` trong code và hiện “Đang dùng nội dung có sẵn”.

Đây là cơ chế API trước, bản lưu sau; hiện chưa hiển thị bản lưu ngay lập tức trong khi tải API. Khi server không phản hồi, người dùng có thể chờ tới 90 giây trước khi thấy bản lưu. Kiểu TypeScript trong `api.ts` chưa tự xác thực JSON từ server; kiểm tra cấu trúc hiện áp dụng cho bản lưu khi đọc lại.

Nếu tải API thành công nhưng lưu bản sao thất bại, app vẫn dùng được nội dung vừa tải trong phiên đó và thông báo bản mới chưa được lưu trên máy.

## Dữ liệu nào lưu ở đâu

| Dữ liệu | Nơi lưu hiện tại |
|---|---|
| Bài học và câu hỏi nguồn | File JSON của backend Render |
| Bản sao bài học đã tải | AsyncStorage, khóa `@interview-english/content/v1` |
| Tiến độ tự đánh giá | AsyncStorage, khóa `@interview-english/software-intern/v1` |
| Bản thu | Tạm thời trên thiết bị, dọn khi rời câu hoặc xóa |

Hai khóa AsyncStorage độc lập. Đặt lại tiến độ không xóa bản lưu bài học. Tiến độ chưa được gửi lên backend và chưa đồng bộ giữa điện thoại. App hiện không dùng API POST/PATCH/DELETE cho quản trị nội dung.

Render Free có filesystem tạm: thay đổi bài học qua Swagger có thể mất khi service restart, deploy hoặc ngủ. Backend khi khởi tạo lại sẽ dùng `seed.json`. Cần database hoặc ổ đĩa bền vững nếu muốn giữ thay đổi dài hạn.

## Chạy trên máy khác

Trong thư mục gốc repository, không phải thư mục backend:

```powershell
npm ci
npx expo start --tunnel
```

Quét QR bằng Expo Go phù hợp SDK 58. Với tunnel, máy tính và điện thoại đều cần Internet nhưng không bắt buộc cùng Wi-Fi. Không phải chạy backend local vì app đang gọi Render.

Giữ terminal Expo hoạt động. Mở terminal thứ hai để kiểm tra:

```powershell
npm run typecheck
npm test
```

Không cần dừng Expo. Có thể chạy `npm run typecheck -- --watch` để theo dõi mỗi lần lưu file. Các test âm thanh mô phỏng không xác nhận micro/loa thật.

## Cách kiểm tra kết nối đã thực hiện

### Backend tới app trên điện thoại

1. Trên Swagger, PATCH bài `intro` với body `{"subtitle":"Đang lấy dữ liệu từ backend Render"}`.
2. Reload app từ terminal Expo bằng `r`.
3. Quan sát mô tả trên thẻ bài giới thiệu bản thân đổi đúng theo server.
4. Khôi phục subtitle thành `Bản thân, mục tiêu và điểm mạnh`, rồi reload.

### Lỗi API và đọc bản lưu

1. Giữ mạng, khởi động app một lần với URL thật để tải và lưu nội dung.
2. Đổi tạm API_URL trong `src/api.ts` thành `https://interview-english.onrender.com/offline-test`.
3. Lưu file và reload app. API trả lỗi vì đường dẫn không tồn tại; app phải báo dùng bài học đã lưu và vẫn mở bài được.
4. Khôi phục API_URL thành `https://interview-english.onrender.com`, lưu và reload.

Người dùng đã xác nhận kiểm tra cập nhật từ Render và chuyển sang bản lưu thành công trên điện thoại. Kiểm tra lỗi đường dẫn không tương đương kiểm tra khởi động Expo Go khi hoàn toàn mất mạng: Expo Go còn cần kết nối máy chạy Metro để tải mã ứng dụng. Muốn kiểm tra khởi động offline độc lập cần bản build cài riêng.

## Những phần còn lại

- Kiểm thử tự động riêng cho luồng cache và lưu tiến độ của App.
- Xác thực cấu trúc JSON từ API và xử lý bài không có câu hỏi.
- Cải thiện thời gian mở app bằng cách hiển thị cache trước khi cập nhật API.
- CORS nếu chạy frontend trong trình duyệt Expo Web; lần kiểm tra hiện tại dùng Expo Go trên iPhone.
- Database bền vững, tài khoản và API tiến độ nếu cần đồng bộ.

Không đổi ID bài hoặc câu tùy tiện vì tiến độ hiện gắn với cặp ID. Nếu nội dung bị xóa trên backend, các tiến độ cũ chưa được tự động dọn khỏi máy.
