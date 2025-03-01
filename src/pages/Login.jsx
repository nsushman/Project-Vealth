import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "../firebase"; // Your Firebase config
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const [error, setError] = useState("");

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
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
