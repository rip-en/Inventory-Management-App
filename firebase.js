// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABlEJkbnRnnY9-TZhv19lVTMCs2Up78P4",
  authDomain: "inventory-management-bb647.firebaseapp.com",
  projectId: "inventory-management-bb647",
  storageBucket: "inventory-management-bb647.appspot.com",
  messagingSenderId: "467605560568",
  appId: "1:467605560568:web:6ffa7a5305fed2d5abaf0d",
  measurementId: "G-RGEHSJRDGS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;