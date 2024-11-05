import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import deviconGoogle from "./google.png";
import {
  doSignInWithEmailAndPassword,
  doSignInWithGoogle,
  doPasswordReset,
} from "../../../firebase/auth";
import { useAuth } from "../../../contexts/authContext";
import { useNavigate } from "react-router-dom";
import "./style.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"; // Import icons
const Login = () => {
  const { userLoggedIn, currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLockedOut, setIsLockedOut] = useState(false);
  const maxLoginAttempts = 3;
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false); // State for showing/hiding password

  const handleAuthError = (error) => {
    switch (error.code) {
      case "auth/user-not-found":
        toast.error("No account found with this email address.");
        break;
      case "auth/wrong-password":
      case "auth/invalid-credential":
        toast.error("Incorrect email or password. Please try again.");
        break;
      case "auth/too-many-requests":
        toast.error("Too many login attempts. Please try again later.");
        break;
      case "auth/invalid-email":
        toast.error("Invalid email address format.");
        break;
      case "auth/email-already-in-use":
        toast.error("This email is already linked to another account.");
        break;
      case "auth/user-disabled":
        toast.error("This account has been disabled. Please contact support.");
        break;
      case "auth/network-request-failed":
        toast.error("Network error. Please check your connection.");
        break;
      case "auth/weak-password":
        toast.error("The password entered is too weak.");
        break;
      case "auth/operation-not-allowed":
        toast.error("Logging in with email/password is currently disabled.");
        break;
      case "auth/requires-recent-login":
        toast.error("Please log in again before performing this action.");
        break;
      case "auth/internal-error":
        toast.error("An internal error occurred. Please try again later.");
        break;
      default:
        toast.error("An unknown error occurred. Please try again later.");
        break;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous error

    if (isLockedOut) {
      setErrorMessage(
        "Your account is temporarily locked due to multiple failed login attempts. Please try again later."
      );
      return;
    }

    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doSignInWithEmailAndPassword(email, password);
      } catch (error) {
        console.log("Full error:", error); // Log the full error object for debugging
        handleAuthError(error);
        setIsSigningIn(false);
        setLoginAttempts((prevAttempts) => {
          const newAttempts = prevAttempts + 1;
          if (newAttempts >= maxLoginAttempts) {
            setIsLockedOut(true);
          }
          return newAttempts;
        });
      }
    }
  };

  const onGoogleSignIn = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doSignInWithGoogle();
      } catch (error) {
        console.error("Full Error:", error); // Log for debugging
        handleAuthError(error);
        setIsSigningIn(false);
      }
    }
  };
  const onResetPassword = async () => {
    if (!email) {
        toast.error("Please enter your email address to reset your password.", {
            autoClose: 10000, // Show error toast for 10 seconds
        });
        return;
    }
    try {
        await doPasswordReset(email);
        toast.success("Password reset email sent! Please check your inbox.", {
            autoClose: 10000, // Show success toast for 10 seconds
        });
    } catch (error) {
        handleAuthError(error);
        toast.error("Error sending password reset email.", {
            autoClose: 10000, // Show error toast for 10 seconds
        });
    }
};


  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  if (userLoggedIn) {
    const uid = currentUser?.uid;
    return (
      <Navigate
        to={
          uid === "fj20QT1j1LWl3bBNBfqoHxPOaH13"
            ? "/HRDashboard"
            : "/ApplicantDashboard"
        }
        state={{ userId: uid }}
      />
    );
  }

  return (
    <div className="login">
      <ToastContainer />
      <div className="div1">
        <div className="ellipse1" />
        <div className="frame1">
          <div className="text-wrapper1"></div>
          <div className="frame-21">
            <div className="text-wrapper-21">Welcome Back</div>
            <form onSubmit={onSubmit} className="frame-31">
              <div className="div-wrapper1">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="div-wrapper1">
                <input
                  type={showPassword ? "text" : "password"} // Toggle input type
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="toggle-password-icon"
                >
                  <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                </button>
              </div>
              <button
                className="frame-41"
                type="submit"
                disabled={isSigningIn}
                style={{ color: "white" }}
              >
                {isSigningIn ? "Signing In..." : "Sign In"}
              </button>
            </form>
            <div className="frame-wrapper1">
              <div className="frame-51">
                <div className="text-nonunderline">Don’t have an account?</div>
                <Link to={"/register"} className="text-wrapper-51">
                  Sign Up
                </Link>
              </div>
            </div>
            <button onClick={onResetPassword} className="forgot-password">
              Forgot Password?
            </button>
            {errorMessage ===
              "Please enter your email address to reset your password." && (
              <div className="password-reset-message">{errorMessage}</div>
            )}
            <div className="frame-61">
              <div className="rectangle1" />
              <div className="or">OR</div>
              <div className="rectangle-21" />
            </div>
            <div className="frame-71">
              <div className="frame-81" onClick={onGoogleSignIn}>
                <img
                  className="devicon-google"
                  alt="Google"
                  src={deviconGoogle}
                />
                <span className="text-wrapper-71">
                  {isSigningIn ? "Signing In..." : "Continue with Google"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
