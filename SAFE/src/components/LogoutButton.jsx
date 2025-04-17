import { useNavigate } from "react-router-dom";
import axios from "axios";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // ✅ Get Current Time
      const logoutTime = new Date().toLocaleString();

      await axios.post("http://localhost:5001/logout");

      // ✅ Save Last Logout Time (Optional, for logs)
      localStorage.setItem("lastLogoutTime", logoutTime);

      // ✅ Clear User Data
      localStorage.removeItem("token");
      localStorage.removeItem("ageCategory");

      // ✅ Redirect to Login
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;
