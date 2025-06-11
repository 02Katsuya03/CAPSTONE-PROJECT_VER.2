// src/components/Logout.jsx
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Logout = ({ onLogout }) => { // Accept onLogout prop if passed from UserPage
  const navigate = useNavigate();

  const handleLogoutClick = async () => { // Renamed to avoid conflict if onLogout is also called handleLogout
    try {
      const logoutTime = new Date().toLocaleString();

      // 🔃 Send logout request to server (optional, but good for backend logging/session invalidation)
      // Make sure the URL is correct for your backend.
      await axios.post("http://localhost:5001/logout");

      // 💾 Preserve "rememberMe" data and the remembered username
      const rememberedMeFlag = localStorage.getItem("rememberMe"); // 'true' or null
      const rememberedUsername = localStorage.getItem("rememberedUsername"); // Stored username or null

      // 🧹 Clear session-related data only
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // ✅ IMPORTANT: Also remove the 'user' object from localStorage
      localStorage.removeItem("ageCategory"); // If this is session-specific, keep it.

      // ♻️ Restore rememberMe data ONLY if it was set
      if (rememberedMeFlag === 'true') { // Check for explicit 'true' string
        localStorage.setItem("rememberMe", 'true');
        // Restore username ONLY if it was remembered
        if (rememberedUsername) {
          localStorage.setItem("rememberedUsername", rememberedUsername);
        }
      } else {
        // If rememberMe was not true, ensure associated data is also cleared
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberedUsername");
      }

      // 🕒 Optional: Log logout time (client-side only)
      localStorage.setItem("lastLogoutTime", logoutTime);

      // Call the parent's onLogout function if it was passed (e.g., from UserPage)
      if (onLogout) {
        onLogout(); // This might handle navigation
      } else {
        // 🔁 If no parent onLogout, redirect here
        navigate("/login", { replace: true });
      }

    } catch (error) {
      console.error("Logout Error:", error);
      // Even if backend fails, usually clear client-side session for UX
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Decide if you want to keep rememberMe info if logout fails
      // For now, it will keep it based on the logic above
      navigate("/login", { replace: true }); // Still redirect to login
    }
  };

  return (
    <button
      onClick={handleLogoutClick} // Use the new function name
      style={{ background: "#8DAEED", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer" }}
    >
      Logout
    </button>
  );
};

export default Logout;