# DeepPay

Student payment and expense companion — Pay, Split, Track, Settle, Groups, and Insights.

## Development approach

DeepPay is built frontend-first. Each phase follows:

**Plan → Design UX → Build frontend → Mock data → Test user flow → UI polish → Edge cases → Approve phase → Backend implementation → API integration → End-to-end testing.**

## Current phase

**Phase 1 — Authentication + profile (frontend prototype)**

- Welcome, create-profile and sign-in screens.
- Local demo profiles and session persistence using AsyncStorage.
- Profile editing and sign-out.
- Route protection for signed-out users.
- No passwords are collected or stored, and email ownership is not verified in this prototype.
- Real authentication, cloud accounts and cross-device sync are reserved for the backend integration phase.

## Architecture principle

`Screen → Hook/State → Service → API Interface`

During frontend development, API interfaces are backed by mock services. Real backend services are integrated only after the frontend phase is approved.

## Roadmap

- Phase 0 — Design system + app shell
- Phase 1 — Authentication + profile
- Phase 2 — Expenses
- Phase 3 — Splitting
- Phase 4 — Friends + groups
- Phase 5 — Settlements
- Phase 6 — UPI handoff
- Phase 7 — Analytics + budgets
- Phase 8 — Notifications
- Phase 9 — AI expense assistant
- Phase 10 — Receipt scanner + smart split
- Backend integration — replace approved mock services with authenticated cloud APIs

## Working brand

The product is currently called **DeepPay**. Branding is isolated from application logic so the name can be changed later without restructuring the app.
