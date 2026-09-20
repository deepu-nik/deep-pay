# DeepPay — Product Requirements Document

## Vision
Make managing shared student expenses fast, simple, social, and transparent.

## Core pillars
- Pay
- Split
- Track
- Settle
- Groups
- Insights

## MVP
- Authentication
- Home dashboard
- Manual expenses
- Expense history and filters
- Friends
- Equal, custom, and percentage splitting
- Groups
- Group balances
- Settlements
- Basic analytics
- UPI QR/payment handoff
- Notifications

## V2
- AI expense assistant
- Receipt OCR
- Item-level smart splitting
- Advanced budgets and insights
- Student/college workflows
- Gamification where useful and non-sensitive

## UX principles
- Fast common actions
- Clear hierarchy
- Minimal cognitive load
- Useful loading, empty, and error states
- Mobile-first responsive layouts
- Accessible touch targets
- Consistent motion and component behavior

## Frontend-first process
Each phase follows:

**Plan → Design UX → Build frontend → Mock data → Test user flow → UI polish → Edge cases → Approve phase → Backend implementation → API integration → End-to-end testing.**

## Architecture
Screens consume feature hooks/state. Hooks consume service interfaces. Mock services implement those interfaces during frontend work. Real API services replace mocks after frontend approval.

The frontend must never depend directly on MongoDB document shapes. API request/response types are defined before real APIs.

## Payment boundary
DeepPay does not act as a bank or UPI network. Actual payment processing remains within the applicable regulated UPI/payment ecosystem. DeepPay owns the surrounding UX and its own expense records.
