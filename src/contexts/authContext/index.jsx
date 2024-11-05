import React, { useContext, useState, useEffect } from "react";
import { auth } from "../../firebase/firebase";
import { GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [loading, setLoading] = useState(true);
  
  let idleTimeout; // Declare variable to hold the timeout ID

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    
    // Listen for user activity
    const handleUserActivity = () => resetIdleTimer();
    
    // Add event listeners for user activity
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keypress", handleUserActivity);

    return () => {
      unsubscribe();
      clearTimeout(idleTimeout); // Clear timeout on unmount
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keypress", handleUserActivity);
    };
  }, []);

  async function initializeUser(user) {
    if (user) {
      setCurrentUser({ ...user });

      const isEmail = user.providerData.some(
        (provider) => provider.providerId === "password"
      );
      setIsEmailUser(isEmail);

      const isGoogle = user.providerData.some(
        (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
      );
      setIsGoogleUser(isGoogle);

      setUserLoggedIn(true);
      resetIdleTimer(); // Start idle timer when user logs in
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
    }

    setLoading(false);
  }

  const resetIdleTimer = () => {
    clearTimeout(idleTimeout); // Clear any existing timeout
    idleTimeout = setTimeout(() => {
      // Log out the user after 5 minutes of inactivity
      signOut(auth).then(() => {
        console.log('User has been logged out due to inactivity.');
      }).catch((error) => {
        console.error('Error logging out:', error);
      });
    }, 5 * 60 * 1000); // 5 minutes
  };

  const deleteUserAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await user.delete(); // Delete the user account
      } catch (error) {
        console.error("Error deleting user account:", error);
        throw error; // Rethrow the error to handle it in the calling function
      }
    }
  };

  const value = {
    userLoggedIn,
    isEmailUser,
    isGoogleUser,
    currentUser,
    deleteUserAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
