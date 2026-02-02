// tests/lib/helpers.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import chalk from 'chalk';
import fs from 'fs';

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyD5ICC8J4fIGoGvX4pCR2jfosl7nruDcek",
    authDomain: "toolsight-teng.firebaseapp.com",
    projectId: "toolsight-teng",
    storageBucket: "toolsight-teng.firebasestorage.app",
    messagingSenderId: "528230253135",
    appId: "1:528230253135:web:25f2ceef52fd5a1067203a",
    measurementId: "G-9JE0XBFE0L"
};


export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- STATE MANAGEMENT ---
// We save IDs to a file so individual scripts can find them
const STATE_FILE = 'test-state.json';
export let State: any = {
    runId: Math.floor(Math.random() * 10000),
    users: [],
    docs: [] // { path: 'toolboxes/abc' }
};

export const loadState = () => {
    if (fs.existsSync(STATE_FILE)) State = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
};
export const saveState = () => fs.writeFileSync(STATE_FILE, JSON.stringify(State, null, 2));

// --- LOGGING HELPERS ---
export const section = (msg: string) => console.log(chalk.yellow.bold(`\n=== ${msg} ===`));
export const info = (msg: string) => console.log(chalk.blue(`ℹ ${msg}`));
export const pass = (msg: string) => console.log(chalk.green(`✔ PASS: ${msg}`));
export const fail = (msg: string) => {
    console.log(chalk.red(`✘ FAIL: ${msg}`));
    process.exit(1); // Stop immediately on failure
};

// --- AUTH HELPERS ---
export const signIn = async (email: string) => {
    await signOut(auth);
    await signInWithEmailAndPassword(auth, email, 'password123');
};