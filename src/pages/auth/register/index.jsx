import React, { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/authContext";
import {
  doCreateUserWithEmailAndPassword,
  doSendEmailVerification,
} from "../../../firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsOverlay, setShowTermsOverlay] = useState(false); // State for overlay
  const [termsViewed, setTermsViewed] = useState(false); // State to track if terms have been viewed
  const [showPassword, setShowPassword] = useState(false); // For toggling password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // For toggling confirm password visibility
  const [isFocused, setIsFocused] = useState(false);

  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleError = (error) => {
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
      case "auth/network-request-failed":
        toast.error("Network error. Please check your connection.");
        break;
      case "auth/email-already-in-use":
        toast.error("The email address is already in use by another account.");
        break;
      case "auth/weak-password":
        toast.error(
          "The password is too weak. Please choose a stronger password."
        );
        break;
      case "auth/operation-not-allowed":
        toast.error(
          "Account creation is disabled at this time. Please contact support."
        );
        break;
      case "auth/requires-recent-login":
        toast.error("Please log in again before trying this action.");
        break;
      case "auth/user-disabled":
        toast.error("This account has been disabled. Please contact support.");
        break;
      case "auth/unverified-email":
        toast.error("Please verify your email address before signing in.");
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
    if (!isRegistering) {
      setIsRegistering(true);
      if (!passwordValid || !passwordsMatch || !termsAccepted) {
        setErrorMessage(
          "Please ensure all form fields are valid and terms are accepted."
        );
        setIsRegistering(false);
        return;
      }
      try {
        await doCreateUserWithEmailAndPassword(email, password);
        await doSendEmailVerification();
        navigate("/verification");
      } catch (error) {
        handleError(error);
        setIsRegistering(false);
      }
    }
  };

  const validatePassword = (password) => {
    const regex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-zA-Z]).{8,}$/;
    return regex.test(password);
  };

  const toggleTermsOverlay = () => {
    setShowTermsOverlay(!showTermsOverlay);
    setTermsViewed(true); // Mark terms as viewed when overlay is opened
  };

  return (
    <>
      {userLoggedIn ? (
        <Navigate to="/verification" />
      ) : (
        <div className="Register">
          <ToastContainer />
          <div className="div">
            <div className="ellipse" />
            <div className="frame">
              <div className="frame-2">
                <div className="text-wrapper-2">Create a new Account</div>
                <div className="frame-3">
                  <form onSubmit={onSubmit} className="frame-3">
                    <div className="div-wrappers">
                      <input
                        type="email"
                        placeholder="Email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="div-wrappers password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          const isValid = validatePassword(e.target.value);
                          setPasswordValid(isValid);
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => {
                          if (passwordValid) setIsFocused(false);
                        }}
                        required
                      />
                      <FontAwesomeIcon
                        icon={showPassword ? faEye : faEyeSlash}
                        className="password-icon"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </div>
                    {(isFocused && !passwordValid) && (
                      <p className="paragraph">
                        Password must be at least 8 characters long and contain
                        at least one uppercase letter, one lowercase letter, one
                        digit, and one special character.
                      </p>
                    )}
                    <div className="div-wrappers password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPasswordsMatch(e.target.value === password);
                        }}
                        disabled={!passwordValid}
                        required
                      />
                      <FontAwesomeIcon
                        icon={showConfirmPassword ? faEye : faEyeSlash}
                        className="password-icon"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      />
                    </div>
                    {!passwordsMatch && (
                      <p className="p">Passwords do not match.</p>
                    )}
                    {errorMessage && <p className="p error">{errorMessage}</p>}

                    <div className="frame-4">
                      <input
                        type="checkbox"
                        className="rectangle"
                        checked={termsAccepted}
                        onChange={(e) => {
                          if (!termsViewed) {
                            toast.error(
                              "Please view the Terms & Conditions before accepting."
                            );
                            return;
                          }
                          setTermsAccepted(e.target.checked);
                        }}
                      />
                      <div className="text-wrapper-4">I accept the</div>
                      <button
                        type="button"
                        className="terms-conditions"
                        onClick={toggleTermsOverlay}
                        style={{
                          background: "none",
                          border: "none",
                          color: "blue",
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                      >
                        Terms & Conditions
                      </button>
                    </div>

                    <div className="frame-5">
                      <button
                        type="submit"
                        className="text-wrapper-5"
                        disabled={
                          isRegistering ||
                          !passwordValid ||
                          !passwordsMatch ||
                          !termsAccepted
                        }
                      >
                        {isRegistering ? "Signing Up..." : "Sign Up"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="text-wrapper-6">
                  <div className="nonunderlinefull-link">
                    Already have an account?
                  </div>
                  <Link to="/login" className="full-link">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay for Terms & Conditions */}
          {showTermsOverlay && (
            <div className="overlay">
              <div className="overlay-content">
                <h2>Terms & Conditions</h2>
                <h2>1. Acceptance of Terms</h2>
                <hr></hr>
                <p>
                  By accessing or using our platform, you agree to comply with
                  and be bound by these Terms and Conditions. If you do not
                  agree with any part of these terms, please do not use our
                  services.
                </p>

                <h2>2. Changes to Terms</h2>
                <p>
                  STI College Las Piñas reserves the right to modify these Terms
                  and Conditions at any time. Changes will be effective
                  immediately upon posting on this page. Your continued use of
                  the service after any changes constitutes acceptance of the
                  new Terms.
                </p>

                <h2>3. Information Use</h2>
                <p>
                  STI College Las Piñas reserves the right to use all gathered
                  information at any time or for any reason at our sole
                  discretion without notice. However, we have no right to alter
                  any information from our users. The information gathered will
                  remain confidential and will be used solely for relevant
                  academic purposes.
                </p>

                <h2>4. User Responsibilities</h2>
                <p>
                  Users are responsible for maintaining the confidentiality of
                  their accounts and passwords. You agree to notify us
                  immediately of any unauthorized use of your account or any
                  other breach of security.
                </p>

                <h2>5. Limitation of Liability</h2>
                <p>
                  STI College Las Piñas shall not be liable for any damages
                  arising out of the use or inability to use our services. This
                  includes, but is not limited to, direct, indirect, incidental,
                  or consequential damages.
                </p>

                <h2>6. Governing Law</h2>
                <p>
                  These Terms and Conditions are governed by and construed in
                  accordance with the laws of the Philippines. Any disputes
                  arising out of or in connection with these terms shall be
                  subject to the exclusive jurisdiction of the courts of the
                  Philippines.
                </p>

                <h2>7. Contact Information</h2>
                <p>
                  If you have any questions or concerns about these Terms and
                  Conditions, please contact us at{" "}
                  <a href="mailto:support@sticollegelaspinas.edu.ph">
                    support@sticollegelaspinas.edu.ph
                  </a>
                </p>
                <button className="close-overlay" onClick={toggleTermsOverlay}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Register;
