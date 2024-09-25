import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDMuXXvNqmIP2w1f90YXg8wvuGOgv79hUc",
  authDomain: "luxfinance-1.firebaseapp.com",
  projectId: "luxfinance-1",
  storageBucket: "luxfinance-1.appspot.com",
  messagingSenderId: "593664398611",
  appId: "1:593664398611:web:bf26c436b9d79f7aaa36e6",
  measurementId: "G-R2TCFY4E0H"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };