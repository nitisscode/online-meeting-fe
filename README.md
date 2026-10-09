# Online Meeting frontend

Next.js app for the meeting platform. It signs people in and manages meeting records through the Django API in `D:\online-meeting`.

Live video, WebRTC signaling, and AI summaries are other services. This app does not implement them.

## Stack

- Next.js 16 (App Router) and React 19
- TypeScript
- Tailwind CSS 4
- Zod for server-side form validation

## Setup

Requirements: Node.js 22, and the Django API from the backend repo.

```bash
cd D:\online-meeting-fe
copy .env.example .env.local
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Django is expected at `http://127.0.0.1:8000` unless `DJANGO_API_URL` says otherwise.

Start Django from `D:\online-meeting` with its own README. The browser never calls Django directly, so CORS is not required for this setup.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Path-safety checks |
| `npm run build` | Production build |

## How requests move

```
Browser  →  Next.js server actions  →  Django
             httpOnly cookies            Authorization: Bearer
```

Login stores the Django access and refresh JWTs in httpOnly cookies. Client JavaScript cannot read them. Later requests to Django are made by the Next.js server, which attaches the access token. When Django returns 401, the server rotates the refresh token once and retries.

Cookie names live in `src/constants/auth.ts`. `src/proxy.ts` repeats those names so the edge proxy does not import the app.

## API this app uses

| Action | Django |
| --- | --- |
| Sign up | `POST /users/signup/` |
| Sign in | `POST /users/login/` with `{ email, password }` (`email` may be a username) |
| Current user | `GET /users/me/` |
| Refresh | `POST /users/token/refresh/` |
| Sign out | `POST /users/token/blacklist/` |
| List, create, read, delete meetings | `/meetings/` |

Meeting status values match Django: `0` scheduled, `1` live, `2` ended, `3` cancelled. Limits and role codes are in `src/constants/meetings.ts`.

The participant routes are not called. The Django viewset reads `meeting_id` in one method and `meeting_pk` in another, so that API is not stable enough to build against yet.

## Security

- `DJANGO_API_URL` is server-only. Do not add a `NEXT_PUBLIC_` API URL.
- Cookies are `HttpOnly`. `Secure` is on in production. The refresh cookie is `SameSite=Strict`.
- Login failures use one message, so the form does not reveal whether the account exists.
- Server actions validate input with Zod before calling Django. Meeting ids must be UUIDs.
- Django 5xx bodies are replaced with a generic message. Field errors are length-limited and stripped of `<` and `>`.
- The post-login `next` path must be a relative path on this site.
- Security headers, including a content security policy, are set in `next.config.ts`.
- Login, signup, and meeting writes have a small in-memory rate limit. It resets when the process restarts and does not coordinate across multiple servers. Keep a limit on Django as well.
- Do not commit `.env.local`. `.env.example` has no secrets.

## Layout

```
src/
  app/                  pages and server actions
  components/           forms and meeting UI
  constants/            routes, API paths, status codes, limits
  lib/                  Django client, cookies, validation
  proxy.ts              sends anonymous users to sign in
```

Authenticated UI that reads the session is inside `<Suspense>`, which is required while Cache Components are enabled.
