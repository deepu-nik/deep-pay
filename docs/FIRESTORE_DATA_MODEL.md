# Firestore expense engine

## Scope

This branch migrates authenticated groups, expenses, settlement records and activity away from local mock services while keeping the existing Firebase Auth and user profile implementation.

The design deliberately avoids Cloud Functions, Firebase Admin credentials, payment gateways and sponsor-bank UPI onboarding.

## Collections

| Path | Purpose | Access |
|---|---|---|
| users/{uid} | Existing private account profile | Owner |
| users/{uid}/expenses/{id} | Personal expense records | Owner |
| users/{uid}/groupMemberships/{groupId} | Private group membership index | Owner |
| groups/{groupId} | Group metadata and member UID index | Active group members |
| groups/{groupId}/members/{uid} | In-group display name, role and join timestamp | Group members; a user can read their own membership document to accept an invite |
| groups/{groupId}/expenses/{id} | Shared expense records | Group members |
| groups/{groupId}/settlements/{id} | Pending and confirmed settlements | Group members |
| groupInvites/{inviteId} | Seven-day invite tokens | Authenticated users with an active, unexpired invite |

## Identity model

Firebase Auth UID is the only identity key. The previous mock IDs (You, aarav, etc.) are not converted to Firebase IDs.

The group document contains memberUids so the app can query a user's groups with an array-contains query. Each member also has a subdocument with a display name scoped to that group. The user's private groupMemberships subcollection mirrors membership for future navigation and indexes.

Group creation is owner-only. New members join through a random Firestore invite document that expires after seven days. The invite is not a UPI payment QR. It is a DeepPay membership invitation.

## Currency representation

All financial amounts are persisted as integer paise. The React Native domain layer exposes rupee numbers for current UI compatibility, and services convert values at the persistence boundary.

For an expense:

- amountMinor is the full amount in paise.
- participantUids is the set of actual group members involved.
- paidByUid identifies the payer.
- splits contains the per-member share in paise and optional percentage.
- paymentMethod is one of cash, UPI, card, bank transfer or unknown.

## Settlement lifecycle

1. The payer records that a payment was made. The status is payer_marked_paid.
2. The recipient sees the pending settlement.
3. Only the recipient can set the settlement to confirmed or rejected.
4. The balance calculation includes only confirmed settlements.

This is a peer-confirmation workflow, not bank verification. Returning from a UPI app or entering a UTR does not by itself prove a transfer happened.

## Security and trade-offs

The rules restrict reads and writes by owner or group membership, reject direct deletion of financial records, restrict group edits to owner name/archive actions, and restrict settlement confirmation to the recipient.

The client validates that participant shares are unique, non-negative and add up exactly to the expense total. Firestore Security Rules do not provide a general-purpose aggregation over an arbitrary list of share objects, and this zero-backend design does not independently verify the share sum against a maliciously modified client. A future trusted verifier would be needed for server-enforced arithmetic integrity. For now, financial records are collaborative group records and should be reviewable by all members.

Expenses are create-only in this milestone. Correction, edit and deletion workflows should use append-only adjustment records rather than silently rewriting historical balances.

## Data migration

The old local AsyncStorage mock data is retained on the device but not automatically imported. Its participant IDs are sample identifiers, not authenticated accounts. A future importer should show each old participant and let the owner explicitly map it to a DeepPay account or retain it as an unclaimed historical participant before writing anything to Firestore.

## Free-tier constraints

This implementation uses Firebase's client SDK and the Firestore Spark plan within its published quotas. No payment gateway, Cloud Functions or sponsor-bank UPI integration is required. Quotas are limits, not a guarantee of unlimited free service. UPI handoff, QR and transaction import features are subsequent milestones.


## UPI & QR handoff

The UPI screen stores the signed-in user's self-entered UPI ID and display name under `users/{uid}/paymentProfiles/upi`. The QR is generated locally from a standard `upi://pay` URI with INR currency and no fixed amount, so the payer enters the amount in their UPI app.

Scanning accepts a UPI payment URI (or a plain UPI ID) only. It does not open arbitrary URLs from QR codes. The recipient VPA, display name, amount and note are shown for review before handoff.

On Android, the app opens the standard UPI payment URI using the operating system so installed UPI apps can handle it. The current NPCI BHIM-UPI guidance describes UPI Intent as Android-only. iOS keeps the QR and VPA sharing functions but does not present the Android intent as available.

Returning from an external UPI app is not a payment confirmation callback. DeepPay therefore asks the user to explicitly report completion and may store an optional reference/UTR as `payer_reported` under `users/{uid}/upiTransactions/{id}`. These records are personal and do not change group balances. They are not verified by a bank, PSP, NPCI, or DeepPay. A UPI ID entered in the profile is also not validated as belonging to that user; it should be checked independently before sharing the QR.
