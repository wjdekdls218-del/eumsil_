import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAJzi8TDsrMim6Sfm9uK1JAiwrRkCcr9PY",
  authDomain: "eumsil-ab852.firebaseapp.com",
  projectId: "eumsil-ab852",
  storageBucket: "eumsil-ab852.firebasestorage.app",
  messagingSenderId: "246424613141",
  appId: "1:246424613141:web:0bd8742208982c9b98391c",
  measurementId: "G-PMRGJH282P"
}

const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
