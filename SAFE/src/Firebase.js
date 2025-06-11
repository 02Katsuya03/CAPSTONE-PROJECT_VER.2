// src/Firebase.js (Example)

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"; // <--- Add FacebookAuthProvider

const firebaseConfig = {
    apiKey: "AIzaSyCd5AwwLMQ6i3XZ53Mqh0DVHeM_lacjo8w",
    authDomain: "my-app-login-c49bf.firebaseapp.com",
    projectId: "my-app-login-c49bf",
    storageBucket: "my-app-login-c49bf.firebasestorage.app",
    messagingSenderId: "54986923370",
    appId: "1:54986923370:web:4cba81f08e34d80705d913"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider(); // <--- Add this line for Facebook provider

// For phone auth (even if not used now, keep if you might re-enable)
// export { auth, googleProvider, facebookProvider, RecaptchaVerifier, signInWithPhoneNumber };

// If you are completely removing phone auth functionality:
export { auth, googleProvider, facebookProvider }; // <-- Simpler export