import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBINS0DTaIz53-RBtyGbv3Z470E-M4ICz0",
  authDomain: "inkr-c289c.firebaseapp.com",
  projectId: "inkr-c289c",
  storageBucket: "inkr-c289c.firebasestorage.app",
  messagingSenderId: "115542698684",
  appId: "1:115542698684:web:6fdb9a1f94874227e0feb9",
};

function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export const app = getFirebaseApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
