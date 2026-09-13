# Recruitment Platform — Frontend

Đây là project [Next.js](https://nextjs.org) khởi tạo bằng [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), là giao diện web cho backend ở [`recruitment-platform-be`](../recruitment-platform-be).

## Bắt đầu

Chạy dev server:

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để xem kết quả.

## Deploy lên Vercel

App này deploy lên [Vercel](https://vercel.com) — kết nối repo này như
1 Vercel project (Vercel tự nhận diện Next.js, không cần config gì
thêm), mỗi lần push lên `main` sẽ tự deploy. Gần như mọi route ở đây
đều server-rendered, nên cần Node runtime (không phải static export);
Vercel hỗ trợ sẵn điều này trên gói Hobby miễn phí.

Set biến môi trường sau ở Vercel project (Project Settings →
Environment Variables), trỏ vào origin public của backend trên Railway
(xem `recruitment-platform-be/DEPLOY.md`):

- `BACKEND_URL` — origin phía server dùng để gọi API. Không public tới
  browser.
- `NEXT_PUBLIC_BACKEND_URL` — cùng origin đó nhưng expose ra browser bundle,
  dùng để socket chat realtime (`src/lib/realtime/socket.ts`) kết nối thẳng
  tới backend. Không còn edge proxy nào đứng trước domain public để route
  `/socket.io` hộ nữa, nên biến này **bắt buộc phải set** ở Vercel (không
  chỉ local) — thiếu nó chat sẽ fail vì client sẽ thử kết nối relative path
  ngay trên domain Vercel, nơi không có gì lắng nghe WebSocket đó.

Backend (Railway) cũng cần set `CORS_ORIGIN` đúng bằng domain Vercel này —
frontend và backend là hai origin khác nhau, cookie `access_token` dùng
`sameSite: 'none'; secure` trong production để hoạt động cross-origin (xem
`auth.controller.ts` bên backend).

Xem thêm [tài liệu deploy Next.js](https://nextjs.org/docs/app/building-your-application/deploying) nếu cần.
