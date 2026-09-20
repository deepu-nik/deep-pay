# Development Guide

## Workflow

For every phase:
1. Plan
2. Design UX
3. Build frontend
4. Add realistic mock data
5. Test the user flow
6. Polish UI
7. Handle edge cases
8. Approve the phase
9. Implement backend
10. Integrate APIs
11. Run end-to-end tests

## Branching
- `main` — stable branch
- `feature/*` — phase or feature work
- `fix/*` — bug fixes

## Architecture rule
`Screen → Hook/State → Service → API Interface`

Frontend work uses mock implementations of service interfaces. Backend integration replaces the implementation, not the UI contract.

## Engineering standards
- TypeScript strictness
- Reusable components and design tokens
- Feature-based organization
- Accessible touch targets
- No secrets in source control
- Avoid direct database-shaped dependencies in UI
- Keep branding isolated in configuration

## Phase gate
A phase is approved only when its intended flows work, navigation is reliable, validation and edge states are handled, UI is consistent, and the app has been tested on a real device or emulator.
