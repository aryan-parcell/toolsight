import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5ICC8J4fIGoGvX4pCR2jfosl7nruDcek",
  authDomain: "toolsight-teng.firebaseapp.com",
  projectId: "toolsight-teng",
  storageBucket: "toolsight-teng.firebasestorage.app",
  messagingSenderId: "528230253135",
  appId: "1:528230253135:web:25f2ceef52fd5a1067203a",
  measurementId: "G-9JE0XBFE0L"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);