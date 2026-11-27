import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxpmDcZ_Cds-BqjHamz7pUg2FYNXl-BDk",
  authDomain: "password-locker-e7f0f.firebaseapp.com",
  projectId: "password-locker-e7f0f",
  storageBucket: "password-locker-e7f0f.firebasestorage.app",
  messagingSenderId: "617437203048",
  appId: "1:617437203048:web:3cfe97358e23eb9e2e49dd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth & Firestore
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Authentication helpers (session persistence: cleared when browser session ends)
export const loginWithGoogle = async () => {
  await setPersistence(auth, browserSessionPersistence);
  return signInWithPopup(auth, googleProvider);
};
export const loginWithEmail = async (email, password) => {
  await setPersistence(auth, browserSessionPersistence);
  return signInWithEmailAndPassword(auth, email, password);
};
export const registerWithEmail = async (email, password) => {
  await setPersistence(auth, browserSessionPersistence);
  return createUserWithEmailAndPassword(auth, email, password);
};
export const logoutUser = () => signOut(auth);

export { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  onAuthStateChanged
};

