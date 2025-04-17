import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "./config";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Instruction from "./pages/Instruction";
import FaceCapture from "./components/FaceCapture";

import Chatbot from './components/Chatbot';
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Content10to14 from "./pages/contents/Content10to14";
import Content15to18 from "./pages/contents/Content15to18";
import Content19to22 from "./pages/contents/Content19to22";
import Content23Above from "./pages/contents/Content23Above";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/`)
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch((err) => console.error("Error fetching API:", err));
  }, []);

  return (
    <Router>
      <LastSeenHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/instruction" element={<Instruction />} />
        <Route path="/face-capture" element={<FaceCapture />} />

        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ✅ Protected Routes: Users Must Be Logged In */}
        <Route path="/content-10-14" element={<ProtectedRoute><Content10to14 /></ProtectedRoute>} />
        <Route path="/content-15-18" element={<ProtectedRoute><Content15to18 /></ProtectedRoute>} />
        <Route path="/content-19-22" element={<ProtectedRoute><Content19to22 /></ProtectedRoute>} />
        <Route path="/content-23-above" element={<ProtectedRoute><Content23Above /></ProtectedRoute>} />

        {/* ✅ Catch-All Route for Deleted Pages */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

// ✅ Save Last Seen Page
const LastSeenHandler = () => {
  const location = useLocation();
  useEffect(() => {
    localStorage.setItem("lastSeenPage", location.pathname);
  }, [location]);
  return null;
};

// ✅ Corrected ProtectedRoute (Only Wraps Content)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;  // ✅ Only wrap content, don't add LogoutButton here
};

// ✅ Not Found Page
const NotFound = () => {
  return <h2>404 - Page Not Found</h2>;
};

export default App;
