/**
 * Grants or removes the admin role.
 *   npm run make-admin -- someone@example.com          (grant)
 *   npm run make-admin -- someone@example.com --remove (remove)
 * Uses the same env as the app: emulators via .env.local, or
 * FIREBASE_SERVICE_ACCOUNT for a real project.
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error("Usage: npm run make-admin -- <email> [--remove]");
  process.exit(1);
}

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
const sa = raw ? JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) : null;
initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-lexify",
  ...(sa && !process.env.FIRESTORE_EMULATOR_HOST ? { credential: cert(sa) } : {}),
});

const admin = flag !== "--remove";
const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin });
await getFirestore().doc(`users/${user.uid}/private/state`).set({ role: admin ? "admin" : "student" }, { merge: true });
// Existing sessions keep old claims; revoking forces a fresh login with the new role.
await getAuth().revokeRefreshTokens(user.uid);
console.log(`${email}: admin=${admin}. The user must log in again.`);
