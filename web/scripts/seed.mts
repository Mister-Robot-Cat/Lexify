/**
 * Loads the placeholder content into Firestore.
 *   npm run seed             → courses, lessons, diagnostic and practice tasks, answer keys, default config
 *   npm run seed -- --demo   → also creates demo accounts and promo codes (emulators only)
 *   npm run seed -- --force  → also overwrites documents that already exist
 * Without --force only missing documents are written, so edits made in the admin panel are kept.
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { seedDocuments } from "../content/seed-docs";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
const emulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const sa = raw ? JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) : null;
if (!emulator && !sa) {
  console.error("Set FIRESTORE_EMULATOR_HOST (local) or FIREBASE_SERVICE_ACCOUNT (real project).");
  process.exit(1);
}
initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-lexify",
  ...(sa && !emulator ? { credential: cert(sa) } : {}),
});
const db = getFirestore();

const force = process.argv.includes("--force");
const writes = seedDocuments().map(([path, data]) => [db.doc(path), data] as const);

const existing = new Set((await db.getAll(...writes.map(([ref]) => ref))).filter((s) => s.exists).map((s) => s.ref.path));
const batch = db.batch();
let written = 0;
for (const [ref, data] of writes) {
  if (!force && existing.has(ref.path)) continue;
  batch.set(ref, data);
  written++;
}
await batch.commit();
console.log(`Wrote ${written} of ${writes.length} seed documents${force ? "" : " (existing ones kept; --force overwrites)"}.`);

if (process.argv.includes("--demo")) {
  if (!emulator) {
    console.error("--demo only runs against the emulators.");
    process.exit(1);
  }
  const auth = getAuth();
  for (const [email, admin] of [["student@lexify.test", false], ["admin@lexify.test", true]] as const) {
    const user = await auth.getUserByEmail(email).catch(() => auth.createUser({ email, password: "lexify123", emailVerified: true, displayName: admin ? "Admin" : "Student" }));
    if (admin) await auth.setCustomUserClaims(user.uid, { admin: true });
    await db.doc(`users/${user.uid}`).set({ email, displayName: user.displayName, locale: "ru" }, { merge: true });
    await db.doc(`users/${user.uid}/private/state`).set({ role: admin ? "admin" : "student" }, { merge: true });
    console.log(`Demo account: ${email} / lexify123${admin ? " (admin)" : ""}`);
  }
  // Demo promo codes for trying the checkout.
  await db.doc("promoCodes/WELCOME20").set({ percentOff: 20, active: true, uses: 0, maxUses: null, expiresAt: null, courseIds: [], note: "Demo: 20% off" }, { merge: true });
  await db.doc("promoCodes/LEXIFY100").set({ percentOff: 100, active: true, uses: 0, maxUses: 100, expiresAt: null, courseIds: [], note: "Demo: free access" }, { merge: true });
  console.log("Demo promo codes: WELCOME20 (20%), LEXIFY100 (100%)");
}
process.exit(0);
