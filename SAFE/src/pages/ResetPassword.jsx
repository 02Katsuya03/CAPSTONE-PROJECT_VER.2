import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract token and type from URL
  const token = new URLSearchParams(location.search).get("token");
  const type = new URLSearchParams(location.search).get("type");

  useEffect(() => {
    // Check if the token and type are missing or invalid
    if (!token || !type) {
      setMessage("❌ Invalid or expired reset link.");
    }
  }, [token, type]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      setMessage("⚠️ Passwords do not match!");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setMessage("⚠️ Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      // Send POST request to reset the password
      const response = await axios.post("http://localhost:5001/password/reset-password", {
        token,
        newPassword,
        confirmPassword, // Ensure the server receives this field if needed
        type,
      });

      setMessage(response.data.message); // Success message
      navigate("/login"); // Redirect to login page after successful reset
    } catch (error) {
      setMessage(error.response?.data?.message || "🚨 Password reset failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
