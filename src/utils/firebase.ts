/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Import the default configuration from root
import defaultFirebaseConfig from "../../firebase-applet-config.json";

export interface FirebaseConfigShape {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

// Check if a configuration object has valid fields
export function isFirebaseConfigured(config: FirebaseConfigShape): boolean {
  return !!(config && config.apiKey && config.projectId && config.authDomain);
}

// Get the active configuration (file config with localStorage overrides)
export function getActiveFirebaseConfig(): FirebaseConfigShape {
  const localConfigStr = localStorage.getItem("selix_firebase_custom_config");
  if (localConfigStr) {
    try {
      const parsed = JSON.parse(localConfigStr);
      if (isFirebaseConfigured(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error("Erro ao ler config do Firebase do localStorage", e);
    }
  }

  return defaultFirebaseConfig as FirebaseConfigShape;
}

// Save custom firebase configuration from the wizard UI
export function saveCustomFirebaseConfig(config: FirebaseConfigShape) {
  localStorage.setItem("selix_firebase_custom_config", JSON.stringify(config));
}

export function clearCustomFirebaseConfig() {
  localStorage.removeItem("selix_firebase_custom_config");
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  const config = getActiveFirebaseConfig();
  if (!isFirebaseConfigured(config)) {
    return null;
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    return appInstance;
  } catch (error) {
    console.error("Falha ao inicializar Firebase App:", error);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  
  if (!authInstance) {
    try {
      authInstance = getAuth(app);
    } catch (error) {
      console.error("Falha ao inicializar Firebase Auth:", error);
    }
  }
  return authInstance;
}

export function getFirebaseFirestore(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;

  if (!dbInstance) {
    try {
      const config = getActiveFirebaseConfig();
      dbInstance = getFirestore(app, config.firestoreDatabaseId || undefined);
    } catch (error) {
      console.error("Falha ao inicializar Firestore:", error);
    }
  }
  return dbInstance;
}

// Google Sign-in flow
export async function signInWithGoogleFirebase(): Promise<any> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error("O Firebase Auth não está configurado ou inicializado.");
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(authInstance, provider);
  const user = result.user;
  
  return {
    email: user.email,
    name: user.displayName || user.email?.split("@")[0] || "Usuário Firebase",
    picture: user.photoURL,
    provider: "firebase",
    uid: user.uid,
    verified: user.emailVerified,
    timestamp: new Date().toISOString()
  };
}

// Email/Password Log-In
export async function loginWithEmailFirebase(email: string, pass: string): Promise<any> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error("O Firebase Auth não está configurado.");
  }

  const result = await signInWithEmailAndPassword(authInstance, email, pass);
  const user = result.user;
  
  return {
    email: user.email,
    name: user.displayName || user.email?.split("@")[0] || "Usuário Firebase",
    picture: user.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120`,
    provider: "firebase",
    uid: user.uid,
    verified: user.emailVerified,
    timestamp: new Date().toISOString()
  };
}

// Email/Password Sign-Up
export async function signUpWithEmailFirebase(email: string, pass: string): Promise<any> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error("O Firebase Auth não está configurado.");
  }

  const result = await createUserWithEmailAndPassword(authInstance, email, pass);
  const user = result.user;

  return {
    email: user.email,
    name: user.email?.split("@")[0] || "Usuário Firebase",
    picture: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120`,
    provider: "firebase",
    uid: user.uid,
    verified: user.emailVerified,
    timestamp: new Date().toISOString()
  };
}

// Unified sign out
export async function signOutFirebase(): Promise<void> {
  const authInstance = getFirebaseAuth();
  if (authInstance) {
    await firebaseSignOut(authInstance);
  }
}
