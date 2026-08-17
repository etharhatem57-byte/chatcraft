# ChatCraft API

## Conventions

- Request and ordinary response bodies are JSON.
- Authentication is supplied by the `chatcraft_session` HTTP-only cookie.
- Mutating routes reject mismatched browser origins.
- Errors use `{ "error": string, "code": string }`.
- A `401 UNAUTHORIZED` response should send browser clients to `/login`.

## Authentication

### `POST /api/auth/register`

```json
{
  "name": "Amina",
  "email": "amina@example.com",
  "password": "minimum-eight-characters",
  "language": "ar"
}
```

Returns `201` with a public user and creates the session cookie. Possible codes include `VALIDATION_ERROR`, `EMAIL_EXISTS`, and `RATE_LIMITED`.

### `POST /api/auth/login`

```json
{ "email": "amina@example.com", "password": "..." }
```

Returns the public user and creates the session cookie. Invalid email and password cases intentionally share `INVALID_CREDENTIALS`.

### `POST /api/auth/logout`

Expires the session cookie.

### `GET /api/auth/me`

Returns `{ user, demo }` for the active session.

## Conversations

### `GET /api/chats`

Returns summaries newest first:

```json
{
  "chats": [{
    "id": "...",
    "title": "Project plan",
    "language": "en",
    "createdAt": "2026-08-15T10:00:00.000Z",
    "updatedAt": "2026-08-15T10:04:00.000Z",
    "preview": "Here is a practical plan..."
  }]
}
```

### `POST /api/chats`

Body: `{ "language": "en" }`. Returns `201` with the complete empty chat.

### `GET /api/chats/:id`

Returns the complete owned conversation and embedded messages.

### `PATCH /api/chats/:id`

Body: `{ "title": "New title" }`. Titles are limited to 80 characters.

### `DELETE /api/chats/:id`

Permanently removes the owned conversation.

### `POST /api/chats/:id/messages`

Body: `{ "content": "Message text" }`.

The server saves the user message, creates an automatic title for a new conversation, sends recent history to Groq, and returns an incremental UTF-8 text stream. On completion, the assembled assistant response is persisted. Prompt length is limited to 8,000 characters and provider output to 2,048 completion tokens.

## Profile

### `GET /api/user/profile`

Returns `{ user, stats: { totalChats } }`.

### `PATCH /api/user/profile`

```json
{ "name": "Amina", "language": "ar" }
```

Returns the updated public user and refreshes the language cookie.

## Health

### `GET /api/health`

Returns service mode, Groq configuration status, and server time. It deliberately exposes no credentials or database URI.
