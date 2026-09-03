This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

This app deploys to [Vercel](https://vercel.com) — connect this repo as a
Vercel project (Vercel auto-detects Next.js, no config needed) and every
push to `main` deploys automatically. Almost every route here is
server-rendered, so it needs a Node runtime (not a static export); Vercel
provides that on its free Hobby plan.

Set these as Vercel project env vars (Project Settings → Environment
Variables), pointing at the backend's EC2 Elastic IP (or a domain once
one exists — see `recruitment-platform-be/DEPLOY.md` and the
`recruitment-platform-infra` repo for how that's provisioned):

- `BACKEND_URL` — server-side origin for API calls.
- `NEXT_PUBLIC_BACKEND_URL` — same origin, exposed to the browser (the
  realtime chat socket is opened client-side, so it needs this rather
  than the server-only `BACKEND_URL`).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
