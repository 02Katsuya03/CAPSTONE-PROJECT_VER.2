// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google"; // ✅ Import
import { API_BASE_URL } from "./config";
import './i18n/i18n.js';
import SplashScreen from "./pages/Splashscreen";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Chatbot from './components/Chatbot';
import Login from "./pages/Login";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import AdminBase from "./pages/ADMIN/Admin_Base";
import AdminDashboard from "./pages/ADMIN/Admin_Dashboard";
import AdminUser from "./pages/ADMIN/Admin_User";

import UserPage from "./pages/USER/UserPage";
import NotFound from "./components/NotFound";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/`)
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch((err) => console.error("Error fetching API:", err));
  }, []);

  return (
    <GoogleOAuthProvider clientId="113484728861-u6nchjg1k2enidfrp1u695q7o2gns77o.apps.googleusercontent.com"> {/* ✅ Wrap your app */}
      <Router>
        <LastSeenHandler />
        <Routes>
          <Route
            path="/"
            element={<SplashScreen onComplete={() => window.location.href = "/home"} />}
          />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/admin" element={<ProtectedRoute><AdminBase /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/user" element={<ProtectedRoute><AdminUser /></ProtectedRoute>} />
          <Route path="/userpage" element={<ProtectedRoute><UserPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

const LastSeenHandler = () => {
  const location = useLocation();
  useEffect(() => {
    localStorage.setItem("lastSeenPage", location.pathname);
  }, [location]);
  return null;
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default App;
