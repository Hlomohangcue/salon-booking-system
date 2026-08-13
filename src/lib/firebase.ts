import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app: FirebaseApp = initializeApp(firebaseConfig)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)
export const auth: Auth = getAuth(app)

/**
 * Optional App Check initialisation.
 *
 * App Check is only enabled when `VITE_FIREBASE_APP_CHECK_KEY` (a reCAPTCHA v3
 * site key) is present. This keeps the app fully functional without App Check
 * while allowing it to be enabled in production to protect backend resources
 * from abuse. When the key is absent, `appCheck` is `null` and Firebase works
 * exactly as before.
 */
const appCheckKey: string = import.meta.env.VITE_FIREBASE_APP_CHECK_KEY ?? ''

export const appCheck: AppCheck | null = appCheckKey
  ? initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckKey),
      isTokenAutoRefreshEnabled: true,
    })
  : null
