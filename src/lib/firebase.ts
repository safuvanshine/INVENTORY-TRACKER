import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-jg42jWHSqgqoiM4u-BoyPjYMzmMrVDM",
  authDomain: "inventory-tracker-48cc8.firebaseapp.com",
  projectId: "inventory-tracker-48cc8",
  storageBucket: "inventory-tracker-48cc8.firebasestorage.app",
  messagingSenderId: "125585953727",
  appId: "1:125585953727:web:9070796bacc9f0d5d3870a",
  measurementId: "G-925GXWP8RM"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const VAULT_SECRET_KEY = "SHINE_VAULT_SEC_2026_KEY_99X";
export default app;

