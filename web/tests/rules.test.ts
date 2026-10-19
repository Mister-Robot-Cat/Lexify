/**
 * Firestore security rules, checked against the running emulators
 * (`npm run emulators` in another terminal, then `npm run test:rules`).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import { initializeApp as adminInit } from "firebase-admin/app";
import { getFirestore as adminFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
const projectId = "demo-lexify";
const admin = adminFirestore(adminInit({ projectId }, "rules-admin"));

let app: FirebaseApp;
let fs: Firestore;
let uid: string;
let otherUid: string;

async function client(name: string) {
  const a = initializeApp({ apiKey: "demo-key", projectId }, name);
  const auth = getAuth(a);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const f = getFirestore(a);
  connectFirestoreEmulator(f, "127.0.0.1", 8080);
  const cred = await createUserWithEmailAndPassword(auth, `${name}-${Date.now()}@test.dev`, "secret123");
  return { a, f, uid: cred.user.uid };
}

const denied = (p: Promise<unknown>) => expect(p).rejects.toMatchObject({ code: "permission-denied" });

beforeAll(async () => {
  const me = await client("me");
  const other = await client("other");
  app = me.a;
  fs = me.f;
  uid = me.uid;
  otherUid = other.uid;
  await deleteApp(other.a);
  await admin.doc(`users/${uid}`).set({ email: "me@test.dev", displayName: "Me", locale: "en" });
  await admin.doc(`users/${uid}/private/state`).set({ role: "student" });
  await admin.doc(`users/${otherUid}`).set({ email: "other@test.dev", displayName: "Other", locale: "az" });
  await admin.doc("attempts/mine").set({ uid, status: "submitted", band: 6.5 });
  await admin.doc("attempts/theirs").set({ uid: otherUid, status: "submitted", band: 7 });
  await admin.doc("answerKeys/reading-1").set({ answers: ["A"] });
  await admin.doc("promoCodes/FREE").set({ percent: 100 });
});

afterAll(async () => {
  await deleteApp(app);
});

describe("profile", () => {
  it("can read own profile but not someone else's", async () => {
    expect((await getDoc(doc(fs, `users/${uid}`))).exists()).toBe(true);
    await denied(getDoc(doc(fs, `users/${otherUid}`)));
  });
  it("can change name and language only", async () => {
    await updateDoc(doc(fs, `users/${uid}`), { displayName: "New name", locale: "ru" });
    await denied(updateDoc(doc(fs, `users/${uid}`), { email: "hacker@test.dev" }));
    await denied(updateDoc(doc(fs, `users/${uid}`), { locale: "fr" }));
  });
  it("cannot write role, access or diagnostic state", async () => {
    await denied(setDoc(doc(fs, `users/${uid}/private/state`), { role: "admin" }));
    await denied(updateDoc(doc(fs, `users/${uid}/private/state`), { access: { "ielts-academic": { until: new Date(2100, 0) } } }));
  });
});

describe("scores and attempts", () => {
  it("can read own attempts only", async () => {
    expect((await getDoc(doc(fs, "attempts/mine"))).data()?.band).toBe(6.5);
    await denied(getDoc(doc(fs, "attempts/theirs")));
  });
  it("cannot create or change attempts or bands", async () => {
    await denied(updateDoc(doc(fs, "attempts/mine"), { band: 9 }));
    await denied(setDoc(doc(fs, "attempts/fake"), { uid, status: "submitted", band: 9 }));
    await denied(setDoc(doc(fs, `progress/${uid}`), { overall: 9 }));
  });
});

describe("server-only collections", () => {
  it("hides answer keys and promo codes", async () => {
    await denied(getDoc(doc(fs, "answerKeys/reading-1")));
    await denied(getDoc(doc(fs, "promoCodes/FREE")));
  });
  it("blocks orders written by the client", async () => {
    await denied(setDoc(doc(fs, "orders/x"), { uid, status: "paid" }));
  });
});
