// Add to AdminDashboard.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      alert("You must login as admin first.");
      navigate("/admin/login");
    }
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h1>Welcome to Admin Dashboard</h1>
      <p>This is a secure area only accessible after login.</p>
    </div>
  );
};

export default AdminDashboard;
