# DeepPay

Student payment and expense companion — Pay, Split, Track, Settle, Groups, and Insights.

## Current backend foundation

DeepPay uses **Firebase Authentication + Cloud Firestore** for account identity and cloud profile data.

- Firebase Authentication owns email/password credentials and session persistence.
- Cloud Firestore stores each user's profile at `users/{uid}`.
- The Expo app uses the Firebase JavaScript SDK, which works with Expo Go.
- Authentication state is persisted with React Native AsyncStorage through Firebase Auth's persistence adapter.
- Firestore Security Rules keep user profiles private and grant access to expenses, settlements and group membership only to the owner or authorized group members.
- There is no custom Express/MongoDB authentication server in this Firebase foundation.

The Firebase foundation covers account creation, sign-in, password reset, profile updates and sign-out. The Firestore expense-engine branch adds authenticated group membership, group invitations, paise-based expense records, settlement confirmations and a Firebase-backed activity feed. The Friends directory and cross-account friend discovery are still a later milestone.

## Firebase project setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Add a **Web app** to the project and copy its Firebase configuration values.
3. In **Authentication → Sign-in method**, enable **Email/Password**.
4. Create a **Cloud Firestore** database. Select a region close to your users.
5. In Firestore → Rules, publish the rules from the repository's `firestore.rules` file.
6. Copy `.env.example` to `.env` in the repository root and fill in the Web app configuration values:

```bash
cp .env.example .env
```

The Expo public environment variables are:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`

Firebase client configuration is not a server secret. Do not put a Firebase Admin service-account private key in the mobile app. Firestore Security Rules are the authorization boundary for direct client access.

## Install and run

From the repository root:

```bash
npx expo install firebase
npm install
npm run typecheck
npx expo start -c
```

Use Expo Go on Android to test the app.

## Current Firestore profile

The initial profile document is stored at:

`users/{firebaseAuthUid}`

Fields:

- `fullName`
- `email`
- `createdAt` (server timestamp)
- `updatedAt` (server timestamp)

The rules permit an authenticated user to read their own profile, create it with an email matching their Firebase Authentication account, and update only their name and update timestamp. Client-side deletion is denied.

## Security and next steps

- Never deploy permissive test-mode rules to a real project.
- Do not add an allow-all or authenticated-user-wide rule to unblock development.
- Group, expense and settlement repositories use explicit membership and ownership rules. Financial record corrections and stronger server-side validation remain future work.
- Consider Firebase App Check before a public launch.
- Email verification, Google sign-in and account deletion workflows can be added as separate auth enhancements.
- This milestone records expenses and peer-confirmed settlements. It does not initiate UPI payments or verify transfers with a bank.

## Product roadmap

- Phase 0 — Design system + app shell
- Phase 1 — Firebase Authentication + user profile
- Phase 2 — Firestore groups, expense ledger and settlement confirmations
- Phase 3 — Usernames, friend discovery, friend requests and group invitations (friend discovery and requests implemented; group invites implemented)
- Phase 4 — UPI QR, scanning and external app handoff
- Phase 5 — Personal finance analytics (implemented); bank transaction imports remain future work
- Phase 7 — Monthly category budgets (implemented)
- Phase 8 — Notifications
- Phase 9 — AI expense assistant
- Phase 10 — Receipt scanner + smart split

## Working brand

The product is currently called **DeepPay**. Branding is isolated from application logic so the name can be changed later without restructuring the app.


## Firestore expense engine

The implementation branch is feature/firestore-expense-engine, based on the Firebase foundation branch.

### Data model

- users/{uid} retains the existing private authentication profile.
- users/{uid}/expenses/{expenseId} stores personal expenses.
- users/{uid}/groupMemberships/{groupId} stores a private membership index.
- groups/{groupId} stores group metadata and member UIDs.
- groups/{groupId}/members/{uid} stores the member's in-group display name and role.
- groups/{groupId}/expenses/{expenseId} stores shared expenses.
- groups/{groupId}/settlements/{settlementId} stores payments awaiting recipient confirmation.
- groupInvites/{inviteId} stores seven-day group invitations.

Money is written as integer paise (for example, ₹125.50 is 12550) to avoid floating-point currency storage.

### Group invitations

Create a group with its owner first, then use the invite action from the group details screen. The invitation is valid for seven days. The invited person must sign in to DeepPay and open the invitation again before joining. Membership changes are performed through the invite flow; the group editor cannot add arbitrary client-side friend IDs.

### Expense and settlement behavior

- Expenses are immutable after creation in this first Firestore milestone. Edit, delete and audit/correction flows are intentionally deferred.
- Group expenses require every participant and the payer to be an actual group member.
- Personal expenses contain only the signed-in user.
- Settlements begin as payer_marked_paid. Only the recipient can confirm or reject them.
- Only confirmed settlements affect group balances.
- The current client verifies split arithmetic before writing; a trusted server-side verifier is not part of the zero-cost architecture. Group financial records therefore remain collaborative records, not bank-verified statements.

### Existing prototype data

Previously stored mock expenses and groups in local AsyncStorage are not deleted, but they are not automatically migrated. Sample IDs such as You, aarav and riya are not Firebase UIDs, so importing them without explicit identity mapping could assign balances to the wrong people. A reviewed import/mapping tool is a separate task.

### Publish Firestore rules

Before testing the new group and expense features, publish the repository rules to the same Firebase project used by the app:

    firebase deploy --only firestore:rules

Alternatively, copy firestore.rules into Firebase Console → Firestore Database → Rules and publish it. Do not use Firebase's permissive test rules.

### Free-tier boundary

The app uses the Firebase client SDK directly and does not require a payment gateway, Cloud Functions or a paid UPI provider for this milestone. Firebase Spark quotas apply; exceeding a free quota can pause the affected service until the quota resets. UPI payment execution is not included in this Firestore milestone.


## UPI and QR handoff

The UPI & QR screen supports:
- A personal receive QR generated from the UPI ID and display name that the account owner enters.
- QR scanning with the device camera. DeepPay accepts a UPI pay QR or a plain UPI ID; it does not open arbitrary links encoded in a QR.
- On Android, opening a standard upi://pay request in an installed UPI app.
- After returning, the user can explicitly save an outgoing transfer as payer_reported, optionally with the UPI app's reference/UTR.
- A personal list of payment records reported by the signed-in user.

This is an external-app handoff only. DeepPay is not a UPI PSP, TPAP, bank, or payment gateway. It does not create UPI IDs, debit accounts, receive bank callbacks, verify UTRs, or confirm that money moved. A payer-reported item must never be described as bank-verified. A group settlement remains pending until the recipient confirms it through the existing group flow.

NPCI's current BHIM-UPI guidelines describe UPI Intent as available for Android. The app therefore presents Android handoff on Android and keeps QR/VPA sharing available elsewhere. A QR generated from a self-entered UPI ID is only as accurate as the details the owner enters; verify the UPI ID independently before sharing it.

### UPI dependencies

The UPI screen uses Expo Camera and react-native-svg based QR rendering. After checkout, install the dependencies and refresh the package lock:

    npx expo install expo-camera react-native-svg
    npm install react-native-qrcode-svg
    npm install
    npm run typecheck

Camera permission is only requested when the Scan tab is opened.


## Personal finance insights and monthly budgets

The Insights screen summarizes the signed-in user's share of personal and group expenses by calendar month. It shows category totals, a daily average, and a comparison with the previous month when prior-month records exist.

Monthly category budgets are stored privately at `users/{uid}/budgets/{category}`. Each category has one reusable monthly limit. The screen compares the current month's recorded share against that limit and highlights overspending.

UPI handoff records are intentionally excluded from spending analytics because they are payer-reported and are not verified by a bank. Budgets are planning tools only; they do not move, reserve, or restrict money in a bank account.

Publish the updated owner-only budget rules before testing this screen:

    firebase deploy --only firestore:rules

 
## Friends and username discovery

Each account can claim one unique username (3–20 lowercase letters, digits or underscores). Other signed-in users can find that account by exact username and send a friend request. The recipient can accept or decline; accepted friendships are stored in a record visible only to the two members. Username lookup documents can be fetched by exact ID but cannot be listed.

The Friends screen is available from the Home header, Groups header, Profile, and the Create action sheet. Group membership still uses the existing seven-day invite-link flow; a friendship does not automatically add someone to a group.

Publish the updated username and friend-request security rules before testing:

    firebase deploy --only firestore:rules

