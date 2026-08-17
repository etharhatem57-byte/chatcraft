# ChatCraft

A production-oriented bilingual AI chat workspace built with the Next.js App Router, MongoDB/Mongoose, Groq streaming, TypeScript, and Tailwind CSS.

## Highlights

- Full English and Arabic interface with instant LTR/RTL switching
- Secure email/password registration and login
- HTTP-only, signed JWT session cookie with seven-day persistence
- Chat creation, history, continuation, automatic titles, rename, and delete
- Incremental AI response streaming from Groq
- Persistent MongoDB storage through Mongoose
- User profile and persistent language preference
- Responsive mobile drawer, tablet layout, and desktop sidebar
- Localized dates, validation messages, empty states, loading states, and errors
- Same-origin mutation checks, bcrypt password hashing, Zod validation, and rate limiting
- Credential-free in-memory demo mode for local evaluation

## Stack

- **Framework:** Next.js 16 (compatible with the requested Next.js 14+ App Router architecture)
- **UI:** React 19, Tailwind CSS 3, Lucide icons
- **Database:** MongoDB with Mongoose
- **AI:** Groq SDK with streamed chat completions
- **Auth:** bcryptjs + signed JWT in an HTTP-only cookie
- **Validation:** Zod
- **Language:** TypeScript

## Quick start

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

If `MONGODB_URI` is omitted, ChatCraft automatically runs in **demo mode**. Users, conversations, and messages are kept in server memory and reset when the server restarts. If `GROQ_API_KEY` is omitted, the message endpoint returns a visibly streamed local demonstration response. This lets the complete UX be evaluated without credentials.

## Production environment

Create `.env.local` for development or configure the following in your hosting provider:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatcraft
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET=a-long-random-secret-with-at-least-32-characters
DEMO_MODE=false
```

Generate a session secret with:

```bash
openssl rand -base64 48
```

Never expose `GROQ_API_KEY`, `MONGODB_URI`, or `JWT_SECRET` through a `NEXT_PUBLIC_` variable.

## Commands

```bash
npm run dev        # local server on 0.0.0.0:3000
npm run typecheck  # strict TypeScript validation
npm run lint       # ESLint with Next.js Core Web Vitals rules
npm run build      # optimized production build
npm start          # production server
```

## Project structure

```text
app/
  api/
    auth/                   registration, login, logout, current session
    chats/                  chat CRUD and streaming messages
    user/profile/           profile read/update
  chat/[id]/                protected chat experience
  login/ register/ profile/ application pages
components/
  auth/ chat/ landing/ profile/ providers/ ui/
lib/
  auth.ts                    JWT and password helpers
  data.ts                    MongoDB/demo data access boundary
  demo-store.ts              credential-free preview store
  mongodb.ts                 cached Mongoose connection
  rate-limit.ts              API throttling
  security.ts                same-origin checks and text cleanup
  validation.ts              Zod request schemas
locales/                     complete English and Arabic dictionaries
models/                      Mongoose User and Chat schemas
types/                       shared DTOs
```

## Data models

### User

- `name`: 2–50 characters
- `email`: normalized, unique, indexed
- `passwordHash`: bcrypt hash, excluded from normal queries
- `language`: `en` or `ar`
- automatic `createdAt` and `updatedAt`

### Chat

- `userId`: indexed user reference
- `title`: up to 80 characters
- `language`: language in which the chat was created
- embedded messages with `role`, `content`, and `timestamp`
- automatic `createdAt` and `updatedAt`
- compound index on `userId` and `updatedAt`

## API summary

All protected endpoints derive the user identity from the HTTP-only session cookie. Chat queries always include `userId`, preventing cross-account access.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create user and session |
| POST | `/api/auth/login` | Verify credentials and create session |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/chats` | List or create conversations |
| GET/PATCH/DELETE | `/api/chats/:id` | Read, rename, or delete one conversation |
| POST | `/api/chats/:id/messages` | Save user message and stream the assistant response |
| GET/PATCH | `/api/user/profile` | Read or update profile |
| GET | `/api/health` | Service mode and provider status |

The message endpoint responds as `text/plain; charset=utf-8` with chunked streaming. All other endpoints use JSON.

## Security notes

- Passwords are hashed with bcrypt using 12 rounds.
- Sessions use signed, issuer/audience-bound JWTs in `HttpOnly`, `SameSite=Lax` cookies.
- Production cookies are marked `Secure`.
- Mutation routes validate the request origin in addition to SameSite cookie protection.
- Zod constrains all input types and lengths; control characters are stripped from prompts.
- Every protected route checks the authenticated user and scopes database operations by `userId`.
- Authentication, chat creation, and message endpoints are rate limited.
- API secrets remain server-only.
- Common browser security headers are configured globally.

The included rate limiter is intentionally dependency-free and applies per application instance. For a multi-region or horizontally scaled deployment, replace its `Map` store with a shared Redis/Upstash limiter while retaining the same call sites.

## Deployment

### Vercel

1. Push this folder to a Git repository.
2. Import the repository in Vercel.
3. Add the production environment variables listed above.
4. Allow your deployment's outbound IPs in MongoDB Atlas, or use Atlas network access appropriate to your environment.
5. Deploy, then verify `/api/health`, registration, message streaming, and both language directions.

The Groq route declares a 60-second maximum duration. Confirm that the selected hosting plan supports streaming responses and the required function duration.

## Quality checklist

The repository is validated with:

```bash
npm run lint
npm run typecheck
npm run build
npm audit
```

For production operations, connect your preferred error monitoring platform in route catch blocks, use a shared rate-limit store, enable database backups, and configure uptime monitoring against `/api/health`.
