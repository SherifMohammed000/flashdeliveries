import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// USER: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyAIvJxW3yCQRY8pdC1Brw-5TJl-BBkknHI",
    authDomain: "fdel-b335c.firebaseapp.com",
    projectId: "fdel-b335c",
    storageBucket: "fdel-b335c.firebasestorage.app",
    messagingSenderId: "1057536524913",
    appId: "1:1057536524913:web:1b20f2aa748f00227d91d0",
    measurementId: "G-B2X73160N1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

// Initialize Auth and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
