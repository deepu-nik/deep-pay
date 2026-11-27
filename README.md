# DeepPay

Student payment and expense companion — Pay, Split, Track, Settle, Groups, and Insights.

## Current backend foundation

DeepPay uses **Firebase Authentication + Cloud Firestore** for account identity and cloud profile data.

- Firebase Authentication owns email/password credentials and session persistence.
- Cloud Firestore stores each user's profile at `users/{uid}`.
- The Expo app uses the Firebase JavaScript SDK, which works with Expo Go.
- Authentication state is persisted with React Native AsyncStorage through Firebase Auth's persistence adapter.
- Firestore Security Rules restrict each user to their own profile document. Other collections remain denied until their access model is designed.
- There is no custom Express/MongoDB authentication server in this Firebase foundation.

The current Firebase phase covers account creation, sign-in, password reset, profile updates and sign-out. Expense, group, split and settlement repositories are still separate mock-data work and will be migrated to Firestore with collection-specific rules in later phases.

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

The rules permit an authenticated user to read their own profile, create it with their verified Auth email, and update only their name and update timestamp. Client-side deletion is denied.

## Security and next steps

- Never deploy permissive test-mode rules to a real project.
- Do not add an allow-all or authenticated-user-wide rule to unblock development.
- Groups, expenses, settlements and shared balances need explicit membership and ownership rules before their Firestore repositories are enabled.
- Consider Firebase App Check before a public launch.
- Email verification, Google sign-in and account deletion workflows can be added as separate auth enhancements.
- DeepPay does not move money or execute UPI transactions in this phase; it stores account/profile information only.

## Product roadmap

- Phase 0 — Design system + app shell
- Phase 1 — Firebase Authentication + user profile
- Phase 2 — Firestore expense storage
- Phase 3 — Splitting
- Phase 4 — Friends + groups and membership rules
- Phase 5 — Settlements
- Phase 6 — UPI handoff
- Phase 7 — Analytics + budgets
- Phase 8 — Notifications
- Phase 9 — AI expense assistant
- Phase 10 — Receipt scanner + smart split

## Working brand

The product is currently called **DeepPay**. Branding is isolated from application logic so the name can be changed later without restructuring the app.
