# Lexify Web

The Lexify website: a landing page plus a full dashboard (library, quizzes, grammar tutor, IELTS evaluation, themed packs, settings) that talks to the same backend as the Telegram bot.

## Stack

- Next.js 14 (App Router, static export)
- Tailwind CSS
- Framer Motion
- Plain `fetch` API client with a JWT bearer token in `localStorage`

## Setup

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL if not using the default
npm run dev                        # http://localhost:3000
```

The dashboard needs the backend running:

```bash
# from the repo root
python -m app.web                  # http://localhost:8001
```

## Build

```bash
npm run build      # static export into web/dist
npx serve dist      # preview the export locally
```

`next.config.js` uses `output: 'export'`, so the whole site — landing page and dashboard — ships as static HTML/JS. All data fetching happens client-side against the FastAPI backend, so the export can be hosted on any static host (Vercel, Netlify, S3, GitHub Pages) as long as `NEXT_PUBLIC_API_URL` points at a running `app.web` instance with CORS configured for that host (see `CORS_ORIGINS` in the backend `.env`).

## Auth

- Email/password: `/api/auth/register`, `/api/auth/login`.
- Telegram Mini App: if opened inside Telegram with `initData` present, the site logs in automatically via `/api/auth/telegram`, validating Telegram's HMAC signature server-side.
- A signed-in web account can link a Telegram account (`/dashboard/settings` → "Link Telegram account"), merging both into one profile so words and progress from the bot and the website share the same library.
