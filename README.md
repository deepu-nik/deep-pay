# DeepPay

Student-focused money companion — Split, Track, Settle, Groups and Insights.

## Current development status

### Mobile app
- Expo SDK 58 + React Native + TypeScript + Expo Router.
- Smart Home dashboard, DeepPay Pop and Snap Yellow themes.
- Quick Split with group member preselection and Repeat Last Split.
- Welcome, local demo profile creation, sign-in, profile editing and sign-out.
- The current mobile auth adapter is still local-only. It does not verify email ownership or sync profiles between devices.

### Backend foundation
- Independent Node.js + Express API under `server/`.
- MongoDB models for users and refresh sessions.
- Email/password registration and sign-in endpoints.
- Short-lived signed access tokens and rotating opaque refresh tokens.
- Request validation, bcrypt password hashing, rate limits, Helmet security headers and configurable CORS.
- API setup instructions: [server/README.md](server/README.md).

The API is **not deployed and not connected to the mobile app yet**. Keep using the local demo auth adapter until the backend is run locally, verified and integrated through the app's AuthService interface.

## Architecture principle

`Screen → Hook/State → Service → API Interface`

The mobile UI should depend on service interfaces rather than call HTTP endpoints directly. This lets us keep the tested local implementation available while introducing the real API adapter behind the same interface.

## Roadmap

- [x] Phase 0 — Design system + app shell
- [x] Phase 1 — Authentication + profile frontend prototype
- [x] Smart Home, themes and Expo SDK 58
- [x] Quick Split
- [ ] Backend foundation — API, MongoDB and account/session endpoints
- [ ] Mobile API integration — SecureStore token handling and real account sessions
- [ ] Email verification and password reset
- [ ] Cloud sync for friends, groups, expenses and settlements
- [ ] Real-time updates and notifications
- [ ] UPI payment handoff
- [ ] Analytics, budgets and insights
- [ ] Security review, end-to-end tests and release preparation

## Important product boundary

DeepPay is not a bank or UPI network. Payment initiation and settlement will remain with supported UPI apps and regulated payment providers. The current API stores account and session data only; it does not move money.

## Working brand

The product is currently called **DeepPay**. Branding is kept separate from application logic so the name can be changed later without restructuring the app.
