// src/pages/Login.jsx

import React, { useState, useEffect, useRef } from "react"; // ⭐ NEW: Import useRef ⭐
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import {
  auth,
  googleProvider,
  facebookProvider,
} from "../Firebase";
import {
  signInWithPopup,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import "./css/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // States for Account Linking (from previous update)
  const [showAccountLinkingPrompt, setShowAccountLinkingPrompt] = useState(false);
  const [conflictingEmail, setConflictingEmail] = useState("");
  const [existingProviders, setExistingProviders] = useState([]);
  const [pendingCredential, setPendingCredential] = useState(null);

  // ⭐ NEW STATES FOR LOGIN ATTEMPT LIMITER ⭐
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0); // in seconds
  const lockoutTimerRef = useRef(null); // Ref to hold the interval ID

  // Helper to save login data to localStorage
  const saveLoginData = (token, user, rememberMeChecked) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    if (rememberMeChecked) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedUsername', user.username || '');
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedUsername');
    }
  };

  // Helper to handle successful login and redirect
  const handleSuccessfulLogin = (redirectToPath, userObject, methodUsed = 'username') => {
    const token = localStorage.getItem('token');
    saveLoginData(token || 'firebase_token_placeholder', userObject, rememberMe);

    const finalRedirectPath = redirectToPath === 'Admin_Base' ? '/admin' : '/userpage';

    // Clear any existing lockout timer on successful login
    if (lockoutTimerRef.current) {
        clearInterval(lockoutTimerRef.current);
        lockoutTimerRef.current = null;
    }
    setLockoutTimeRemaining(0); // Reset lockout state

    navigate(finalRedirectPath, { replace: true, state: { loginMethod: methodUsed } });
  };


  // useEffect for Auto-Redirection, "Remember Me", and Lockout Timer
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const isRemembered = localStorage.getItem('rememberMe') === 'true';

    if (token && (isRemembered || storedUser)) {
      try {
        const user = JSON.parse(storedUser || '{}');
        const userRole = user.role;

        if (userRole === 'admin') {
          navigate('/admin', { replace: true });
        } else if (userRole === 'user') {
          navigate('/userpage', { replace: true });
        } else {
          navigate('/userpage', { replace: true });
        }
      } catch (e) {
        console.error("Failed to parse user data from localStorage:", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedUsername');
        navigate('/login', { replace: true });
      }
    }
    if (isRemembered) {
      const rememberedUsername = localStorage.getItem('rememberedUsername');
      if (rememberedUsername) {
        setUsername(rememberedUsername);
        setRememberMe(true);
      }
    }

    // ⭐ Lockout Timer Logic ⭐
    if (lockoutTimeRemaining > 0) {
        if (lockoutTimerRef.current) {
            clearInterval(lockoutTimerRef.current);
        }
        lockoutTimerRef.current = setInterval(() => {
            setLockoutTimeRemaining(prevTime => {
                if (prevTime <= 1) { // If time is 1 second or less, clear interval
                    clearInterval(lockoutTimerRef.current);
                    lockoutTimerRef.current = null;
                    setErrorMessage("You can try logging in again."); // Message when lockout ends
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000); // Update every second
    }

    // Cleanup interval on component unmount
    return () => {
        if (lockoutTimerRef.current) {
            clearInterval(lockoutTimerRef.current);
        }
    };
  }, [navigate, lockoutTimeRemaining]); // Re-run effect if lockoutTimeRemaining changes


  // Handle Username/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    setShowAccountLinkingPrompt(false);

    // ⭐ Prevent login if currently locked out ⭐
    if (lockoutTimeRemaining > 0) {
        setErrorMessage(`Account locked. Please wait ${Math.ceil(lockoutTimeRemaining / 60)} minutes.`);
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post("http://localhost:5001/api/login", {
        username,
        password,
      });

      if (response.data.status === "success") {
        localStorage.setItem('token', response.data.token);
        handleSuccessfulLogin(response.data.redirectTo, response.data.user, 'username');
      } else {
        // ⭐ Check for lockout status from backend ⭐
        if (response.data.lockout) {
            setLockoutTimeRemaining(response.data.timeLeftSeconds);
            setErrorMessage(response.data.message);
        } else {
            setErrorMessage(response.data.message || "Login failed. Please try again.");
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Server error. Please try again later.";
      setErrorMessage(errorMsg);

      // ⭐ Check for lockout status from backend on error response ⭐
      if (err.response?.data?.lockout) {
          setLockoutTimeRemaining(err.response.data.timeLeftSeconds);
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generic Social Login Handler (for Google and Facebook)
  const handleSocialLogin = async (provider, methodName) => {
    setErrorMessage("");
    setLoading(true);
    setShowAccountLinkingPrompt(false);
    setConflictingEmail("");
    setExistingProviders([]);
    setPendingCredential(null);

    // Social logins are not affected by username/password lockout
    // but if you wanted to disable social login buttons during lockout, you could add:
    // if (lockoutTimeRemaining > 0) {
    //     setErrorMessage("Login is temporarily disabled. Please wait.");
    //     setLoading(false);
    //     return;
    // }

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user; // Firebase user object
      const { email, displayName, uid, photoURL } = user;

      const firstName = displayName ? displayName.split(" ")[0] : '';
      const lastName = displayName ? displayName.split(" ").slice(1).join(" ") : '';

      // Send Firebase user data to your backend for custom JWT issuance/user creation
      const backendRes = await axios.post("http://localhost:5001/api/social-login", {
        email,
        firstName,
        lastName,
        firebaseUid: uid,
        profilePicture: photoURL || null,
        loginMethod: methodName
      });

      if (backendRes.data.status === "success") {
        localStorage.setItem('token', backendRes.data.token);
        handleSuccessfulLogin(backendRes.data.redirectTo, backendRes.data.user, methodName);
      } else {
        setErrorMessage(backendRes.data.message || `${methodName} login failed on backend.`);
      }

    } catch (error) {
      console.error(`${methodName} login error:`, error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setErrorMessage(`${methodName} login cancelled by user.`);
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData.email;
        const credential = error.credential;

        if (email && credential) {
            setConflictingEmail(email);
            setPendingCredential(credential);

            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            setExistingProviders(signInMethods);
            setShowAccountLinkingPrompt(true);
            setErrorMessage(`An account with ${email} already exists.`);
        } else {
            setErrorMessage(`An account with that email already exists using a different login method.`);
        }

      } else {
        setErrorMessage(`${methodName} login failed. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for linking accounts
  const handleLinkAccount = async (existingProviderId) => {
    setLoading(true);
    setErrorMessage("");

    let providerToUse;
    if (existingProviderId === GoogleAuthProvider.PROVIDER_ID) {
      providerToUse = googleProvider;
    } else if (existingProviderId === FacebookAuthProvider.PROVIDER_ID) {
      providerToUse = facebookProvider;
    } else if (existingProviderId === EmailAuthProvider.PROVIDER_ID) {
      setErrorMessage("Please log in with your username/password and then link accounts in your profile settings.");
      setLoading(false);
      return;
    } else {
      setErrorMessage("Unsupported existing login method for linking.");
      setLoading(false);
      return;
    }

    try {
      const reauthResult = await signInWithPopup(auth, providerToUse);

      if (auth.currentUser && pendingCredential) {
        const linkResult = await auth.currentUser.linkWithCredential(pendingCredential);
        const linkedUser = linkResult.user;

        const backendRes = await axios.post("http://localhost:5001/api/social-login", {
          email: linkedUser.email,
          firstName: linkedUser.displayName?.split(" ")[0] || '',
          lastName: linkedUser.displayName?.split(" ").slice(1).join(" ") || '',
          firebaseUid: linkedUser.uid,
          profilePicture: linkedUser.photoURL || null,
          loginMethod: `linked_${pendingCredential.providerId}`,
        });

        if (backendRes.data.status === "success") {
          localStorage.setItem('token', backendRes.data.token);
          handleSuccessfulLogin(backendRes.data.redirectTo, backendRes.data.user, `linked_${pendingCredential.providerId}`);
        } else {
          setErrorMessage(backendRes.data.message || "Account linking failed on backend.");
        }
      } else {
        setErrorMessage("Failed to link account: User not authenticated or no pending credential.");
      }

    } catch (linkError) {
      console.error("Account linking error:", linkError);
      setErrorMessage(`Failed to link account: ${linkError.message || "Unknown error"}. Please try again.`);
    } finally {
      setLoading(false);
      setShowAccountLinkingPrompt(false);
      setConflictingEmail("");
      setExistingProviders([]);
      setPendingCredential(null);
    }
  };


  const handleBack = () => navigate("/home");

  // Determine if login button should be disabled
  const isLoginDisabled = loading || lockoutTimeRemaining > 0;

  // Format lockout time for display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="register-page-container">
      <div className="back-button" onClick={handleBack}>
        <i className="bx bx-arrow-back"></i>
      </div>

      <div className="login-wrapper">
        <div className="login-container">
          <h2>Login</h2>
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          {/* Account Linking Prompt */}
          {showAccountLinkingPrompt && (
            <div className="account-linking-prompt">
              <p>An account with email <strong>{conflictingEmail}</strong> already exists.</p>
              <p>Please log in using one of the existing methods below to link your new account:</p>
              <div className="linking-options">
                {existingProviders.map((providerId) => (
                  <button
                    key={providerId}
                    onClick={() => handleLinkAccount(providerId)}
                    className={
                        providerId === GoogleAuthProvider.PROVIDER_ID ? "google-button" :
                        providerId === FacebookAuthProvider.PROVIDER_ID ? "facebook-button" :
                        "default-button"
                    }
                    disabled={loading}
                  >
                    {providerId === GoogleAuthProvider.PROVIDER_ID && <><i className="bx bxl-google" /> Continue with Google</>}
                    {providerId === FacebookAuthProvider.PROVIDER_ID && <><i className="bx bxl-facebook" /> Continue with Facebook</>}
                    {providerId === EmailAuthProvider.PROVIDER_ID && <><i className="bx bx-envelope" /> Continue with Email/Password</>}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAccountLinkingPrompt(false)} className="cancel-button">Cancel</button>
            </div>
          )}

          {/* Only show regular login form if not showing linking prompt */}
          {!showAccountLinkingPrompt && (
            <>
              {/* Username/Password Login Form */}
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <input
                    name="username"
                    type="text"
                    required
                    placeholder=" "
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={isLoginDisabled} // Disable input if locked out
                  />
                  <label>Username</label>
                </div>
                <div className="input-group">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} // Corrected: was setPassword(e.target.checked)
                    autoComplete="current-password"
                    disabled={isLoginDisabled} // Disable input if locked out
                  />
                  <label>Password</label>
                  <span
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </span>
                </div>
                <div className="options">
                  <label>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoginDisabled} // Disable checkbox if locked out
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <button type="submit" className="login-button" disabled={isLoginDisabled}>
                  {loading ? 'Logging in...' :
                   lockoutTimeRemaining > 0 ? `Locked Out (${formatTime(lockoutTimeRemaining)})` :
                   'Login'}
                </button>
              </form>

              <div className="divider">
                <span>or</span>
              </div>

              <div className="social-buttons">
                <button onClick={() => handleSocialLogin(googleProvider, 'google')} className="google-button" disabled={loading}>
                  <i className="bx bxl-google" /> {loading ? 'Logging in...' : 'Continue with Google'}
                </button>
                <button onClick={() => handleSocialLogin(facebookProvider, 'facebook')} className="facebook-button" disabled={loading}>
                  <i className="bx bxl-facebook" /> {loading ? 'Logging in...' : 'Continue with Facebook'}
                </button>
              </div>
            </>
          )}

          <div className="register-link">
            Don’t have an account? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;