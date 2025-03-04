import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from "firebase/firestore"; // Firestore imports
import { db } from "../firebase"; // Import Firestore instance
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const [error, setError] = useState("");

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user; // Get logged-in user details

      // ✅ Check if the user already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        // ✅ If user doesn't exist, create a new record in Firestore
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          balance: 0,
          parentID: "",
          userType: "child",
        });
        console.log("New user created in Firestore:", user.email);
      } else {
        console.log("User already exists:", user.email);
      }

      // ✅ Check if user already has accounts
      const accountsRef = collection(db, "accounts");
      const accountsQuery = await getDocs(accountsRef);
      const userAccounts = accountsQuery.docs.filter(doc => doc.data().child_id === user.uid);

      if (userAccounts.length === 0) {
        console.log("No accounts found for user. Creating default accounts...");

        // ✅ Create first account: "My Piggy Bank"
        await addDoc(accountsRef, {
          child_id: user.uid, // Link to user
          account_name: "My Piggy Bank",
          balance: 335.10, // Default balance
        });

        // ✅ Create second account: "Halloween Costume"
        const goalEndDate = new Date();
        goalEndDate.setDate(goalEndDate.getDate() + 10); // Add 10 days

        await addDoc(accountsRef, {
          child_id: user.uid, // Link to user
          account_name: "Halloween Costume",
          balance: 15.30, // Default balance
          goal_amount: 20.00, // Goal amount
          goal_end_date: goalEndDate.toISOString(), // Store as ISO string
        });

        console.log("Default accounts created successfully.");
      } else {
        console.log("User already has accounts, skipping account creation.");
      }

      // ✅ Redirect to Home Page
      navigate("/home");
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  // Handle Facebook Click (just show a toast)
  const handleFacebookClick = () => {
    setError("Facebook login is not available yet");
  };

  return (
    <div className="login-page">
      {/* Top Bar */}
      <div className="top-bar">
        <p className="prototype-text">Prototype Alpha</p>
      </div>

      {/* Center Content */}
      <div className="header">
        <img
          src="/assets/vealth-logo.svg"
          alt="Vealth Logo"
          className="vealth-logo"
        />
        <h1 className="login-title">Login to Vealth</h1>
      </div>

      {/* Button Container */}
      <div className="button-container">
        <button className="sso-btn" onClick={handleGoogleSignIn}>
          <img
            src="/assets/google-sso-icon.png"
            alt="Google Icon"
            className="icon"
          />
          Continue with Google
        </button>
        <button className="sso-btn facebook-btn" onClick={handleFacebookClick}>
          <img
            src="/assets/facebook-sso-icon.png"
            alt="Facebook Icon"
            className="icon"
          />
          Continue with Facebook
        </button>
      </div>

      {/* Toast for Error Messages */}
      {error && (
        <div
          className="toast show position-fixed bottom-0 end-0 m-3"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <strong className="me-auto">Error</strong>
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            ></button>
          </div>
          <div className="toast-body">{error}</div>
        </div>
      )}
    </div>
  );
}
