"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const useEmulators = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "true";

export const firebaseConfigured = useEmulators || !!(config.apiKey && config.projectId);

let auth: Auth | null = null;

/** Client Auth instance, or null when Firebase isn't configured yet. Only used on auth pages. */
export function clientAuth(): Auth | null {
  if (!firebaseConfigured) return null;
  if (auth) return auth;
  const app: FirebaseApp = getApps().length
    ? getApp()
    : initializeApp(useEmulators ? { apiKey: "demo-key", projectId: config.projectId || "demo-lexify" } : config);
  auth = getAuth(app);
  if (useEmulators) connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  return auth;
}

/** Firebase sends its emails in this language. */
export function setAuthLanguage(locale: string) {
  const a = clientAuth();
  if (a) a.languageCode = locale;
}
