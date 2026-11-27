# DeepPay API

Independent Node.js REST API for DeepPay. The server is intentionally separate from the Expo application so it can be started, tested and deployed independently.

## Requirements

- Node.js 22 or newer
- MongoDB 7 or newer (local installation, Docker or MongoDB Atlas)
- npm

## Local setup

From the repository root:

```bash
cd server
cp .env.example .env
```

Set a private JWT signing secret in `server/.env`. On macOS/Linux you can generate one with:

```bash
openssl rand -hex 32
```

Replace the example `JWT_ACCESS_SECRET` value with the generated output. Never commit `.env`.

Start MongoDB locally, or provide an Atlas connection string as `MONGODB_URI`. For a local Docker installation:

```bash
docker run --name deeppay-mongo -p 27017:27017 -d mongo:8
```

Install dependencies and run the API:

```bash
npm install
npm run dev
```

The API listens on `http://localhost:4000` by default. Check `http://localhost:4000/health`.

Run the unit tests in a second terminal:

```bash
cd server
npm test
```

## API v1

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Service and MongoDB health |
| POST | `/api/v1/auth/register` | Create an account |
| POST | `/api/v1/auth/login` | Sign in with email and password |
| POST | `/api/v1/auth/refresh` | Rotate a refresh token |
| POST | `/api/v1/auth/logout` | Revoke a refresh token |
| GET | `/api/v1/auth/me` | Get the authenticated profile |
| PATCH | `/api/v1/auth/me` | Update the authenticated profile |

### Register

`POST /api/v1/auth/register`

```json
{
  "fullName": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "use-a-long-unique-password"
}
```

### Login

`POST /api/v1/auth/login`

```json
{
  "email": "aarav@example.com",
  "password": "use-a-long-unique-password"
}
```

Register and login return `data.user`, a short-lived `data.accessToken` and a rotating opaque `data.refreshToken`. Send the access token as `Authorization: Bearer <accessToken>`. Refresh tokens must be stored in the device's OS-backed secure storage by the mobile client, never in AsyncStorage or logs.

### Refresh

`POST /api/v1/auth/refresh`

```json
{
  "refreshToken": "<refresh-token>"
}
```

Each successful refresh invalidates the presented token and returns a replacement. The server stores only a SHA-256 hash of each refresh token.

### Authenticated profile

Include the access token in the Authorization header:

- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/me` with `{ "fullName": "New Name" }`

All API responses use a `data` or `error` envelope. Request validation errors return HTTP 400; unauthenticated requests return HTTP 401.

## Security controls in this foundation

- Passwords are hashed with bcrypt; plain-text passwords are never stored.
- Access tokens are signed with HS256, scoped to the DeepPay API and expire after 15 minutes by default.
- Refresh tokens are random opaque values, stored only as SHA-256 hashes, rotated on refresh and revocable on logout.
- Authenticated requests verify that the token's server-side session is still active.
- Authentication endpoints have a dedicated rate limit; the API also has a global IP rate limit.
- Helmet security headers, JSON body size limits, strict input validation and configurable CORS are enabled.
- User responses never include password hashes or refresh-session records.

## Current limitations

This is the first backend foundation, not a production launch:
- Email ownership verification and password reset are not implemented yet.
- Google sign-in is not wired up yet.
- The mobile app still uses its local demo auth adapter. API integration is a separate step after this server is run and tested.
- Refresh tokens are returned in the JSON response for native clients. The mobile app must persist them using Expo SecureStore before enabling this backend.
- Use HTTPS, managed secrets, a production MongoDB deployment, monitoring, backups and a persistent rate-limit store before public deployment.
- This API does not initiate, receive or settle UPI payments. It only provides account/session endpoints at this stage.

See the repository's root README for the product roadmap.
