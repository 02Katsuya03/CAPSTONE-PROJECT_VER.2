import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutButton from '../../components/LogoutButton';
import '../css/UserPage.css';
import { auth } from '../../Firebase'; // ⭐ Import Firebase auth instance ⭐
import { signOut } from 'firebase/auth'; // ⭐ Import signOut function from Firebase ⭐

const UserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loginSuccessMessage, setLoginSuccessMessage] = useState(null);

  // Determine if the user logged in via Google
  const didLoginWithGoogle = location.state?.loginMethod === 'google';

  useEffect(() => {
    if (location.state && location.state.loginMethod) {
      if (location.state.loginMethod === 'google') {
        setLoginSuccessMessage('You successfully logged in with Google!');
      } else if (location.state.loginMethod === 'username') {
        setLoginSuccessMessage('You successfully logged in with your username!');
      } else if (location.state.loginMethod === 'phone') {
        setLoginSuccessMessage('You successfully logged in with your phone number!');
      }
    }
  }, [location.state]);

  // General application logout (clears app session, but not necessarily Firebase/Google)
  const handleAppLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('ageCategory'); // Assuming this is also session-specific

    console.log('Successfully logged out from application.');
    navigate('/login', { replace: true });
  };

  // ⭐ New function to explicitly sign out from Google/Firebase ⭐
  const handleGoogleSignOut = async () => {
    try {
      await signOut(auth); // Perform Firebase/Google sign-out
      console.log('Successfully signed out from Google/Firebase.');

      // Clear your application's local storage after Google sign-out
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('ageCategory');

      navigate('/login', { replace: true }); // Redirect to the login page

    } catch (error) {
      console.error('Error during Google sign out:', error);
      // Even if Firebase signOut fails, still clear local storage and redirect
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('ageCategory');
      navigate('/login', { replace: true });
      // You might want to show a user-friendly error message here
      alert('Failed to sign out from Google. Please try again or clear browser data.');
    }
  };


  return (
    <div className="userpage-wrapper">
      <div className="userpage-container">
        <h1>Welcome, {user?.username || user?.firstName || user?.email || 'User'}!</h1>
        <p>You have successfully logged in.</p>

        {loginSuccessMessage && (
          <div className="login-success-message">
            {loginSuccessMessage}
          </div>
        )}

        {/* General Application Logout Button */}
        <LogoutButton onLogout={handleAppLogout} />

        {/* ⭐ Conditional Google Sign Out Button ⭐ */}
        {didLoginWithGoogle && (
          <button className="google-signout-button" onClick={handleGoogleSignOut}>
            Sign Out of Google
          </button>
        )}
      </div>
    </div>
  );
};

export default UserPage;