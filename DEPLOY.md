# Đưa AIPLab Studio lên Cloudflare Pages (miễn phí)

Cloudflare Pages phục vụ trang giao diện (thư mục `dist`), còn các đường dẫn `/api/*` chạy bằng
Pages Functions (thư mục `functions`, dùng chung mã với máy chủ Node trong `server/app.ts`).
Gói miễn phí đủ cho vài trường dùng: khoảng 100 000 lượt gọi API mỗi ngày, trang không "ngủ".

## Chuẩn bị (làm một lần)

1. Tạo tài khoản miễn phí tại <https://dash.cloudflare.com/sign-up>.
2. Đăng nhập Cloudflare từ máy tính (mở trình duyệt để bạn bấm đồng ý):

   ```bash
   npx wrangler login
   ```

3. Nên tạo **khóa API mới** ở dịch vụ AI và không dùng lại khóa cũ.

## Chạy thử trên máy trước khi đưa lên

Tạo tệp `.dev.vars` ở thư mục gốc (tệp này không đưa lên git), ghi khóa API:

```
AI_API_KEY=khóa-của-bạn
```

Rồi chạy:

```bash
npm run cf:dev
```

Mở <http://localhost:8788>: đây là trang chạy giống hệt trên Cloudflare.

## Đưa lên Cloudflare

1. Đưa trang lên lần đầu (lệnh sẽ hỏi tạo dự án `aiplab-studio`, chọn nhánh sản phẩm là `master`):

   ```bash
   npm run cf:deploy
   ```

2. Đặt khóa API cho bản trên mạng (lệnh sẽ hỏi bạn dán khóa vào, khóa không hiện ra màn hình):

   ```bash
   npx wrangler pages secret put AI_API_KEY
   ```

3. Đưa lên lại một lần nữa để bản trên mạng nhận khóa:

   ```bash
   npm run cf:deploy
   ```

Địa chỉ trang có dạng `https://aiplab-studio.pages.dev`. Mỗi lần sửa mã, chạy lại `npm run cf:deploy`.

## Cấu hình

Các biến không bí mật nằm trong `wrangler.toml` (mục `[vars]`), sửa ở đó rồi deploy lại:

| Biến | Ý nghĩa |
|---|---|
| `AI_BASE_URL` | Địa chỉ dịch vụ AI kiểu OpenAI (`/chat/completions`) |
| `AIPLAB_MODEL` | Tên mô hình |
| `AIPLAB_RATE_LIMIT` | Số lượt hỏi AI tối đa trong 10 phút cho một địa chỉ IP (mặc định 30). Cả trường dùng chung một mạng thì chung một IP, nên đừng đặt quá thấp |
| `AIPLAB_THINKING` | Đặt `on` để mô hình "suy nghĩ" trước khi trả lời (chậm hơn) |
| `AIPLAB_AI` | Đặt `off` để tắt AI, chỉ dò từ khóa |

Khóa bí mật `AI_API_KEY` chỉ đặt bằng `wrangler pages secret put` hoặc trong trang quản lý
Cloudflare (Workers & Pages → aiplab-studio → Settings → Variables and Secrets), không ghi vào `wrangler.toml`.

## Lưu ý

- Giới hạn lượt hỏi AI được đếm riêng ở từng máy chủ của Cloudflare nên chỉ là gần đúng. Nếu bị gọi
  quá nhiều, có thể giảm `AIPLAB_RATE_LIMIT`, hoặc gắn tên miền riêng vào Cloudflare để dùng quy tắc
  giới hạn của Cloudflare (gói miễn phí có một quy tắc).
- `wrangler` trong dự án đang ở bản 4.86.0 vì máy đang dùng Node 20. Khi nâng lên Node 22, có thể cập
  nhật `wrangler` lên bản mới hơn.
- Muốn tự động deploy mỗi khi đẩy mã: đưa mã lên GitHub, rồi trong Cloudflare chọn
  Workers & Pages → Create → Pages → Connect to Git, lệnh build `npm run build`, thư mục `dist`,
  và đặt `AI_API_KEY` trong phần Variables and Secrets.
