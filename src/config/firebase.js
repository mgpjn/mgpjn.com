import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDsk9qX9JXdH0Lzs4sau4A9vsgI0hbJ4Us",
  authDomain: "mediglaxo-pharma.firebaseapp.com",
  projectId: "mediglaxo-pharma",
  storageBucket: "mediglaxo-pharma.firebasestorage.app",
  messagingSenderId: "264907684023",
  appId: "1:264907684023:web:43194ac08c9523ab517532"
};

// Initialize Firebase once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Helper for invisible reCAPTCHA verifier
export const getInvisibleRecaptcha = (containerId = 'recaptcha-container') => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {}
    window.recaptchaVerifier = null;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // Invisible reCAPTCHA auto-verified
    },
    'expired-callback': () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
    }
  });

  return window.recaptchaVerifier;
};

// Send Phone OTP using Firebase Phone Auth
export const sendFirebasePhoneOtp = async (phoneNumber, containerId = 'recaptcha-container') => {
  let formatted = phoneNumber.trim().replace(/\s+/g, '');
  if (!formatted.startsWith('+')) {
    if (formatted.length === 10) {
      formatted = '+91' + formatted;
    } else if (formatted.startsWith('91') && formatted.length === 12) {
      formatted = '+' + formatted;
    } else {
      formatted = '+91' + formatted;
    }
  }

  const appVerifier = getInvisibleRecaptcha(containerId);
  const confirmationResult = await signInWithPhoneNumber(auth, formatted, appVerifier);
  return confirmationResult;
};

export default app;
