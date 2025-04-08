import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "./config";
import Home from "./pages/Home";
import AdminRegister from "./pages/AdminRegister";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/contents/AdminDashboard";

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
      <h1>{message}</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<AdminRegister />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
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