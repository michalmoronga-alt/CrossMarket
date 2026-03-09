import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBHBQQWl0M7IX7PnXq5Ellemy9Tuvy5tKE",
    authDomain: "crossmarket-a701c.firebaseapp.com",
    projectId: "crossmarket-a701c",
    storageBucket: "crossmarket-a701c.firebasestorage.app",
    messagingSenderId: "747133324058",
    appId: "1:747133324058:web:372ac3f8c7d95ed59dbaa3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);