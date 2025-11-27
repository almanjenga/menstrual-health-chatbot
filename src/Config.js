import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyANRg1BHdhsGmnu_3f155bb-BoBF5Ufaug",
  authDomain: "isproject2-1fb39.firebaseapp.com",
  projectId: "isproject2-1fb39",
  storageBucket: "isproject2-1fb39.firebasestorage.app",
  messagingSenderId: "766130965369",
  appId: "1:766130965369:web:9ca681d84c490bcd62bda8",
  measurementId: "G-T6JT2KN91N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Google login
const handleGoogleLogin = async (setError, navigate) => {
  try {
    await signInWithPopup(auth, googleProvider);
    navigate("/chat");
  } catch (error) {
    console.error(error);
    setError("Google login failed. Please try again.");
  }
};

//  Email login
const handleSubmit = async (e, setError, navigate) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    navigate("/chat");
  } catch (error) {
    console.error(error);
    setError("Invalid credentials. Please check your email and password.");
  }
};

// Signup with email & password
const handleSignUp = async (email, password, firstName, lastName, setError) => {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // Format name nicely (capitalize)
    const formattedName = `${firstName.trim()[0].toUpperCase() + firstName.trim().slice(1).toLowerCase()} ${lastName.trim()[0].toUpperCase() + lastName.trim().slice(1).toLowerCase()}`;

    // Update Firebase user profile with full name
    await updateProfile(user, { displayName: formattedName });

    // Reload user info so it's updated immediately
    await user.reload();

    await sendEmailVerification(user);
    console.log("User created and profile updated:", user.displayName);

    alert("✅ Verification email sent! Please check your inbox before logging in.");
    setError("");
    return true;
  } catch (err) {
    console.error("Signup error:", err);
    setError("Failed to create account. Check password strength or email validity.");
    return false;
  }
};


export { auth, googleProvider, handleGoogleLogin, handleSubmit, handleSignUp };
