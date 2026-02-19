import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBeyejB8a0ed5I0nPyngYf0A0JxqamH-_c",
  authDomain: "flyntlok-training-portal.firebaseapp.com",
  projectId: "flyntlok-training-portal",
  storageBucket: "flyntlok-training-portal.firebasestorage.app",
  messagingSenderId: "760353969509",
  appId: "1:760353969509:web:9c0056dc591b84349abd8c",
  measurementId: "G-EHWZL20WC9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
