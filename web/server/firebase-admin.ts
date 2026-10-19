import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const usingEmulators = !!process.env.FIRESTORE_EMULATOR_HOST;

function serviceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json);
}

/** True when the server can talk to Firebase (real project or local emulators). */
export function isFirebaseConfigured(): boolean {
  return usingEmulators || !!process.env.FIREBASE_SERVICE_ACCOUNT;
}

function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-lexify";
  const sa = serviceAccount();
  return initializeApp({
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    ...(sa && !usingEmulators ? { credential: cert(sa) } : {}),
  });
}

export const adminAuth = () => getAuth(app());
export const db = () => getFirestore(app());
export const bucket = () => getStorage(app()).bucket();
