import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/content.css";  // Import the content-specific CSS file

const Content10_14 = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const token = localStorage.getItem("token");

    if (!token || !storedUsername) {
      navigate("/login");
    } else {
      setUsername(storedUsername);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("ageCategory");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const goToChatbot = () => {
    navigate("/chatbot");  // Redirect to the chatbot page
  };

  return (
    <div className="content-container">
      <h2 className="content-header">Welcome, {username} 👋</h2>
      <p>This is the content page for the age group 19-22.</p>

      <button 
        onClick={handleLogout} 
        className="logout-btn"
      >
        Logout
      </button>

      <button 
        onClick={goToChatbot} 
        className="chatbot-btn"
      >
        Go to Chatbot
      </button>
    </div>
  );
};

export default Content10_14;
