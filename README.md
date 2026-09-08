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
Environment Variables), trỏ vào Elastic IP của EC2 bên backend (hoặc 1
domain khi đã có — xem `recruitment-platform-be/DEPLOY.md` và repo
`recruitment-platform-infra` để biết cách cấp phát):

- `BACKEND_URL` — origin phía server dùng để gọi API. Không public.

**Không** set `NEXT_PUBLIC_BACKEND_URL` trên Vercel. Biến này chỉ dùng ở
`.env` local (xem `.env.example`) — production không cần nó: socket chat
realtime (`src/lib/realtime/socket.ts`) kết nối bằng relative path
(`io("/ws")`), được route sang backend qua Cloudflare Worker đứng trước
domain public (repo riêng — xem
[`recruitment-platform-edge`](https://github.com/vanthan04/recruitment-platform-edge)).
Set `NEXT_PUBLIC_BACKEND_URL` trên Vercel sẽ khiến client lại nối thẳng
tới origin backend thật — đúng thứ kiến trúc này cố tránh.

Xem thêm [tài liệu deploy Next.js](https://nextjs.org/docs/app/building-your-application/deploying) nếu cần.
