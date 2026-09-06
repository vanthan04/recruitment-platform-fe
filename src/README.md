# `src/` — Kiến trúc & quy ước

Tài liệu này mô tả cách mã nguồn frontend được tổ chức và các quy ước dùng
xuyên suốt project. Xem [README.md](../README.md) ở root repo để biết cách
chạy dev server / deploy; tài liệu này tập trung vào "code ở đâu, viết theo
kiểu gì".

Stack: Next.js (App Router) + React + TypeScript, TailwindCSS, shadcn/ui
(Radix), react-hook-form + zod, socket.io-client cho chat realtime.

## Cấu trúc thư mục

```
src/
├── app/                  # Routes (Next.js App Router)
│   ├── (auth)/           # Route group: login, register, verify-email, ...
│   └── (main)/           # Route group: các trang sau khi vào app (job, cv, admin, ...)
├── components/
│   ├── ui/               # Component shadcn/ui (button, dialog, input, ...) — generated, ít khi sửa tay
│   ├── layout/            # Header, Footer, mobile nav, notification bell
│   ├── chat/, jobs/, companies/, home/, shared/  # Component theo domain/feature
├── contexts/             # React context cho state client-side xuyên trang (chat, sidebar)
├── hooks/                # Custom hook dùng chung (debounce, url filter, api toast)
├── lib/
│   ├── api/              # `Api` class — lớp fetch duy nhất gọi backend
│   ├── services/         # Server Actions ("use server") — 1 file / domain, gọi qua `api`
│   ├── types/            # Type + hàm map wire-shape ↔ domain-shape, 1 file / domain
│   ├── constants/        # PATH, endpoint, cache tag, cookie config, ...
│   ├── middlewares/      # Logic cho src/middleware.ts (session refresh, auth guard)
│   ├── realtime/         # Socket.IO client singleton (chat)
│   └── utils/            # Helper thuần (cn, format, http, enum-param, notification-link)
└── middleware.ts         # Next.js middleware (session + auth), chạy trước mọi request
```

Alias `@/*` trỏ vào `src/*` (xem [tsconfig.json](../tsconfig.json)).

## `app/` — Routing

- **Route groups**: `(auth)` cho các trang chưa đăng nhập (login, register,
  forgot/reset password, verify-email); `(main)` cho phần còn lại, dùng
  chung `Header`/`Footer`/`SidebarProvider` ở [`app/(main)/layout.tsx`](<app/(main)/layout.tsx>).
  Mỗi group có `layout.tsx` riêng, không ảnh hưởng URL.
- **Parallel + intercepting route**: `app/(main)/jobs/@modal/(.)[id]` — mở
  chi tiết job dạng modal khi click từ list (giữ URL `/jobs/[id]`, không
  rời trang list), `default.tsx` render `null` khi không có modal nào active.
  Đây là pattern duy nhất trong repo dùng parallel routes — chỉ áp dụng lại
  nếu có nhu cầu tương tự (xem chi tiết job overlay lên list).
- Phần lớn `page.tsx` là **Server Component** (`async function Page()`), gọi
  thẳng service (`lib/services/*.ts`) để fetch data — không có
  client-side data-fetching layer (không React Query/SWR). Trang cần
  tương tác (form, filter, realtime) mới có `"use client"` ở component con.
- `error.tsx` / `loading.tsx` theo đúng quy ước Next.js (error boundary,
  suspense fallback) — có cả ở root `app/` và trong từng segment cần riêng.

## `lib/api` — Lớp gọi backend

`lib/api/index.ts` export 1 singleton `api` (`Api` class) là **điểm gọi
backend duy nhất** — mọi service phải đi qua đây, không `fetch` trực tiếp.
Điểm quan trọng:

- File có `import "server-only"` ⇒ **chỉ import được từ server** (Server
  Component / Server Action). `ApiError` được tách riêng ra
  [`lib/api/error.ts`](lib/api/error.ts) (không có `server-only`) để client
  component (vd. `useApiToast`) có thể `instanceof ApiError` được.
- Tự động gắn `Authorization: Bearer <access_token>` từ cookie, tự retry
  1 lần khi gặp 401 bằng cách refresh token rồi gọi lại request gốc
  (`skipAuth: true` để bỏ qua, dùng cho login/register/refresh).
- `get/post/put/patch/delete` trả thẳng `data` đã unwrap khỏi envelope;
  `getPaginated` trả cả `{ items, metadata }` cho các endpoint list
  (`metadata` chứa `{ total, page, limit }` — xem `ListMeta` trong
  [`lib/types/common.ts`](lib/types/common.ts)).
- Envelope response từ backend luôn có dạng
  `{ success, message, code?, data, metadata?, timestamp }` — khớp với
  `common/dtos/response.dto.ts` phía BE, không tự chế shape khác.
- Cache: mặc định `no-store` (dynamic); muốn cache thì set `next: { tags }`
  và revalidate bằng `revalidateTag`/`revalidatePath` (xem constant
  `CACHE_TAG` + cách dùng trong `job.service.ts`).

## `lib/services` — Server Actions theo domain

Mỗi file `*.service.ts` là 1 domain (`job`, `company`, `chat`, `cv`, ...),
đánh dấu `"use server"`, export các hàm gọi `api` + `revalidateTag`/`redirect`
khi cần. Đây là lớp duy nhất mà component (Server hoặc Client, qua Server
Action) gọi để lấy/đổi dữ liệu — component không tự build URL hay gọi `api`
trực tiếp.

## `lib/types` — Wire shape vs domain shape

1 file / domain, đặt cạnh service cùng tên. Quy ước: nếu backend trả field
tên khác convention FE (vd. snake_case `access_token`), khai báo type
`*Wire` riêng + hàm `to*()` để map sang type domain (camelCase) — xem
[`lib/types/auth.ts`](lib/types/auth.ts) (`AuthTokensWire` → `toAuthTokens`).
Không để type wire rò rỉ ra ngoài `lib/services`.

## `middleware.ts` + `lib/middlewares`

`src/middleware.ts` chỉ compose 2 hàm, chạy theo thứ tự:

1. **`session.middleware.ts`** (`withSession`) — nếu còn refresh token
   nhưng access token đã hết hạn, chủ động gọi `/auth/refresh` và set lại
   cookie _trước khi_ Server Component nào render (Next chỉ cho set cookie
   trong Server Action/Route Handler/Middleware, không cho set giữa lúc
   render).
2. **`auth.middleware.ts`** (`withAuth`) — chỉ kiểm tra **sự tồn tại** của
   cookie access token (nhanh, chạy ở edge, không gọi backend) để redirect
   route protected (`/profile`, `/onboarding`, `/recruiter`, `/admin`) về
   `/login`, và redirect ngược route guest-only (`/login`, `/register`, ...)
   khi đã đăng nhập. Trang nào cần token _hợp lệ_ thật sự (không chỉ tồn
   tại) thì tự verify lại qua `getCurrentUser()` phía service.

`matcher` loại trừ static asset (`_next/static`, ảnh, favicon) để middleware
không chạy trên mọi request tài nguyên tĩnh.

## `lib/realtime` — Chat socket

`lib/realtime/socket.ts` export `getChatSocket()` — singleton Socket.IO
client, `"use client"`, mở thẳng từ browser đến `PUBLIC_BACKEND_URL` (không
qua Next server) vì cần gửi kèm cookie `access_token` httpOnly qua
`withCredentials`. `contexts/chat-context.tsx` là nơi duy nhất dùng socket
này — quản lý state qua `useReducer` (optimistic send, reconcile khi có ack,
typing, presence), expose qua `useChat()`/`useChatPresence()` (tách 2 context
để phần chỉ cần trạng thái online/offline không re-render theo tin nhắn mới).

## `components/`

- **`components/ui/`** — component do shadcn/ui generate (xem
  [`components.json`](../components.json)), không viết tay theo domain
  logic; chỉnh sửa trực tiếp nếu cần nhưng tránh nhét business logic vào đây.
- **Các thư mục còn lại** (`chat/`, `jobs/`, `companies/`, `home/`,
  `layout/`, `shared/`) — component theo domain/feature, được page trong
  `app/` compose lại. `shared/` là component tái dùng chéo domain
  (`pagination-bar`, `error-state`, `province-ward-fields`,
  `social-login-buttons`).

## `contexts/` & `hooks/`

- `contexts/` chỉ chứa state cần chia sẻ giữa nhiều component không có quan
  hệ cha-con trực tiếp và tồn tại lâu hơn 1 page: `chat-context` (xem trên),
  `sidebar-context` (trạng thái mở/đóng sidebar). Không dùng context cho
  state chỉ 1 component/1 page cần.
- `hooks/` là hook thuần dùng chung nhiều nơi: `use-api-toast` (hiện toast
  lỗi từ `ApiError`), `use-debounced-value`, `use-url-filter` (đồng bộ filter
  UI với query string). Hook riêng cho 1 page thì để cạnh page đó
  (vd. `app/(main)/jobs/get-job-detail-props.ts`), không cho vào đây.

## Testing

- Test đặt trong `__tests__/` cạnh code được test (vd.
  `components/chat/__tests__`, `lib/utils/__tests__`, `contexts/__tests__`),
  không có thư mục `tests/` tập trung riêng.
- Chạy qua Babel (`babel-jest`), **không dùng `next/jest`** — SWC native
  binary bị chặn bởi Windows Application Control trên máy dev, còn bản WASM
  fallback phá alias `@/...` khi transform. Lý do ghi chi tiết ở
  [`jest.config.ts`](../jest.config.ts) — đừng đổi lại `next/jest` mà không
  kiểm tra lại điều kiện này trước.
- `moduleNameMapper` trong `jest.config.ts` mock riêng `server-only` và
  `next/cache` — service có `"use server"`/`import "server-only"` vẫn test
  được trong Jest nhờ các mock này.

## Quy ước chung

- Import luôn qua alias `@/...`, không dùng relative path xuyên thư mục
  (`../../..`).
- Đường dẫn route: lấy từ `PATH` trong
  [`lib/constants/path.ts`](lib/constants/path.ts), không hardcode string
  route trong component.
- Endpoint backend: lấy từ `*_ENDPOINT` trong
  [`lib/constants/endpoint.ts`](lib/constants/endpoint.ts), không hardcode
  string trong service.
- Comment trong code ưu tiên giải thích "tại sao" (constraint ẩn, quyết định
  đánh đổi, workaround) — không comment lại "cái gì" khi tên biến/hàm đã rõ.
