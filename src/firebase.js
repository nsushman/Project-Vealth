// Import the functions you need from the SDKs you need
import os from "os";
import { initializeApp } from "firebase/app";

// Destructure environment variables
const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_APP_ID,
  VITE_MESSAGINGSENDER_ID
} = import.meta.env;

// Your web app's Firebase configuration
const firebaseConfig = {

  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: "vealth-project.firebaseapp.com",
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: "vealth-project.firebasestorage.app",
  messagingSenderId: VITE_MESSAGINGSENDER_ID,
  appId: VITE_FIREBASE_APP_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);