import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post("http://localhost:5001/admin/login", formData);

      if (response.data.success) {
        alert(response.data.message); // ✅ Show success message
        localStorage.setItem("adminToken", response.data.token); // ✅ Save token if needed
        navigate("/dashboard"); // ✅ Redirect
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "❌ Login failed.";
      setMessage(msg);
      alert(msg);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" style={{ marginTop: "10px", background: "#8DAEED", border: "none", padding: "10px" }}>
          Login
        </button>
      </form>
      {message && <p style={{ marginTop: "10px", color: "red" }}>{message}</p>}
    </div>
  );
};

export default AdminLogin;
