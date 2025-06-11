import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import './css/ResetPassword.css';


const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const token = new URLSearchParams(location.search).get("token");

  useEffect(() => {
    if (!token) {
      setMessage("❌ Invalid or expired reset link.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const response = await axios.post("http://localhost:5001/password/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });

      setMessage(response.data.message);
      navigate("/login");
    } catch (error) {
      setMessage(error.response?.data?.message || "🚨 Password reset failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-wrapper">
      <form onSubmit={handleSubmit} className="reset-password-container">
        <h2>Reset Password</h2>

        {message && <p className="reset-password-message">{message}</p>}

        <div className="reset-password-input-group">
          <input
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            placeholder=" "
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <label htmlFor="new-password">New Password</label>
          <span
            className="reset-password-toggle"
            onClick={() => setShowNewPassword((prev) => !prev)}
          >
            {showNewPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </span>
        </div>

        <div className="reset-password-input-group">
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder=" "
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <label htmlFor="confirm-password">Confirm New Password</label>
          <span
            className="reset-password-toggle"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
