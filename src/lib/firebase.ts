/**
 * firebase.ts — Inicialización del SDK de Firebase (Client Side)
 *
 * Lee las credenciales desde las variables de entorno NEXT_PUBLIC_FIREBASE_*.
 * Exporta las instancias de `auth`, `db` (Firestore) y `storage`
 * para ser importadas por los componentes que necesiten Firebase.
 *
 * ⚠️ Este módulo es solo para el cliente (browser). Nunca importar en
 *    Server Components puros ni en el body de layouts de servidor.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth }      from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage }   from "firebase/storage";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Evita reinicializar la app si ya existe (útil en HMR de desarrollo)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
