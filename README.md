# Interview English

MVP luyện tiếng Anh phỏng vấn cho sinh viên CNTT ứng tuyển **Software Intern**.

## Assignment 1 — Public Project Entry Point

Các tài liệu và liên kết chính của dự án được tập trung tại đây để thuận tiện đánh giá:

- [Assignment 1 Report](./docs/assignment1/assignment1-report.md)
- [Project Architecture](./docs/architecture.md)
- [GitHub Organization](https://github.com/mobile-app-CO3043)
- [GitHub Projects](https://github.com/orgs/mobile-app-CO3043/projects)
- [Research evidence](./docs/assignment1/)

Sau khi tạo board Assignment 1, thay link **GitHub Projects** ở trên bằng link trực tiếp tới board đó.

## Đã triển khai

- Ba bài học: giới thiệu bản thân, dự án/kỹ năng kỹ thuật, teamwork/giải quyết vấn đề.
- Mỗi bài có ba câu hỏi luyện phỏng vấn và câu trả lời tham khảo; nội dung cần được người có kinh nghiệm rà soát.
- Luồng học: đọc/nghe câu hỏi → tự nói hoặc ghi âm → nghe lại → xem/nghe cụm từ và mẫu trả lời → tự đánh dấu kết quả.
- Ghi âm bằng micro, dừng, nghe lại từ đầu, ghi lại hoặc xóa bản thu. Mỗi lượt tự dừng sau khoảng 60 giây.
- Đọc câu hỏi, cụm từ và câu trả lời bằng giọng tổng hợp tiếng Anh (`expo-speech`), không phải bản thu của giáo viên.
- Dừng âm thanh khi rời câu hoặc chuyển app ra nền. Từ chối quyền micro vẫn có thể xem/nghe mẫu và tự học.
- Lưu tiến độ trên điện thoại bằng AsyncStorage.

## Chạy app

```powershell
cd 'D:\261\Mobile App\tu-vung-thuc-te'
npm start
```

Quét QR bằng Expo Go. Nếu mạng LAN không kết nối được, chạy `npx expo start --tunnel`.

Sau khi cập nhật mã nguồn, chạy `npm install` nếu dùng máy khác, rồi khởi động lại Expo bằng `npx expo start --clear`.

## Ghi âm và nghe mẫu

1. Mở một bài học. Bấm **Nghe câu hỏi** nếu cần.
2. Bấm **Bắt đầu ghi âm**, cấp quyền micro khi điện thoại hỏi. Nói khoảng 20–30 giây rồi **Dừng ghi âm**.
3. Bấm **Nghe lại bản thu**. Có thể ghi lại hoặc xóa.
4. Chọn **Xem gợi ý / Tôi đã nói xong**, rồi **Nghe cụm từ** hoặc **Nghe câu trả lời mẫu**.
5. Có thể ẩn gợi ý, tự nói lại và tự chọn **Cần luyện lại / Đã nói được**.

Lưu ý:

- Bản thu dùng tạm trong câu hiện tại, không được tải lên máy chủ và không lưu trong AsyncStorage. App dọn các file tạm của câu đó khi rời câu hoặc bấm xóa. Nếu app bị hệ điều hành đóng đột ngột, file cache có thể còn cho đến khi hệ thống dọn; chưa có thư viện lưu lịch sử bản thu.
- Giọng và khả năng đọc khi không có mạng phụ thuộc dịch vụ/giọng tiếng Anh đã cài trên điện thoại. App không tích hợp API giọng nói đám mây hay yêu cầu API key.
- Trên iPhone, tắt chế độ im lặng và tăng âm lượng nếu không nghe được giọng mẫu. Trong Expo Go, quyền micro mang tên Expo Go; lời giải thích quyền riêng của app có hiệu lực khi build lại bản native.
- Nếu đã từ chối quyền micro và không được hỏi lại, mở Cài đặt điện thoại để cấp quyền cho ứng dụng/Expo Go. Trên web cần HTTPS hoặc localhost để truy cập micro.
- Không phát mẫu trong lúc ghi âm, tránh bản thu chứa giọng mẫu. Các nút bị khóa ngắn khi đang xử lý âm thanh để tránh bấm trùng.

## Kiểm thử

Mã nguồn chính: `App.tsx` quản lý bài học/tiến độ; `src/PracticeScreen.tsx` hiển thị màn luyện nói; `src/usePracticeAudio.ts` xử lý quyền micro, ghi/phát âm và dọn tài nguyên. Các trường hợp kiểm thử ở `src/__tests__/PracticeAudio.test.tsx`.

```powershell
npm run typecheck
npm test
```

Kiểm thử tự động mô phỏng thư viện âm thanh để kiểm tra luồng và xử lý lỗi, không xác nhận phần cứng micro/loa. Trước khi demo, thử trực tiếp trên điện thoại:

- Cấp quyền → ghi 10 giây → dừng → nghe lại hai lần; thử ghi lại và xóa.
- Từ chối quyền → vẫn xem gợi ý/nghe mẫu được; cấp lại quyền trong Cài đặt.
- Nghe lần lượt câu hỏi, cụm từ, câu mẫu; đổi mẫu/dừng đọc không bị chồng tiếng.
- Đang thu thì quay lại trang chủ, chuyển app ra nền hoặc khóa màn hình: micro phải dừng.
- Ghi khoảng 60 giây: tự dừng; lượt ghi mới không dừng ngay vì bộ đếm cũ.
- Chuyển câu: không còn bản thu của câu trước; đóng/mở app vẫn giữ tiến độ tự đánh giá.

Tài liệu: [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/), [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech/).

Lưu ý trước khi phát hành: npm còn báo các cảnh báo bảo mật ở chuỗi phụ thuộc (bao gồm công cụ Expo/Jest). Cần rà soát bằng `npm audit` trước bản phát hành; không tự chạy `npm audit fix --force` vì có thể đổi phiên bản SDK không tương thích. `SafeAreaView` cũ cũng có cảnh báo deprecated; nên chuyển sang safe-area-context khi hoàn thiện giao diện.

## Ngoài phạm vi MVP

- Nhận diện giọng nói thành chữ và AI đánh giá phát âm/nội dung: để giai đoạn sau, khi nhóm có thời gian và kỹ năng kiểm chứng.
- Chat bot phỏng vấn, đăng nhập/đồng bộ, lịch sử bản thu lâu dài.
- Các role khác như Data Analyst Intern hoặc Business Analyst Intern.
