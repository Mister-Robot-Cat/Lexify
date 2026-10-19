/**
 * Loads the placeholder content into Firestore.
 *   npm run seed            → courses, lessons, diagnostic tasks, answer keys, default config
 *   npm run seed -- --demo  → also creates demo accounts (emulators only)
 * Existing documents with the same ids are overwritten; other documents are left alone.
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { seedCourses, seedLessons } from "../content/catalog";
import { seedAnswerKeys, seedDiagnosticTasks } from "../content/diagnostic";

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

const batch = db.batch();
for (const c of seedCourses) batch.set(db.collection("courses").doc(c.id), c);
for (const l of seedLessons) {
  const { body, ...meta } = l;
  batch.set(db.collection("lessons").doc(l.id), meta);
  batch.set(db.collection("lessonBodies").doc(l.id), { body });
}
for (const t of seedDiagnosticTasks) batch.set(db.collection("diagnosticTasks").doc(t.id), t);
for (const [id, key] of Object.entries(seedAnswerKeys)) batch.set(db.collection("answerKeys").doc(id), key);
batch.set(db.doc("config/diagnostic"), { paywall: { reading: false, listening: false, writing: false, speaking: false } }, { merge: true });
batch.set(db.doc("config/ai"), { monthlyLimit: 40 }, { merge: true });
await batch.commit();
console.log(`Seeded ${seedCourses.length} courses, ${seedLessons.length} lessons, ${seedDiagnosticTasks.length} diagnostic tasks.`);

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
}
process.exit(0);
