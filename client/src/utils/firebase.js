import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAMYYUXiyfjyWWWe0Dx3J5Bjse4qavPDRU',
  authDomain: 'vingo-4911b.firebaseapp.com',
  projectId: 'vingo-4911b',
  storageBucket: 'vingo-4911b.firebasestorage.app',
  messagingSenderId: '637186017159',
  appId: '1:637186017159:web:216fcdf9fd5dd9328070f7',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Always show the Google account selector popup (like takeUforward)
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export { app, auth, googleProvider, GoogleAuthProvider };
