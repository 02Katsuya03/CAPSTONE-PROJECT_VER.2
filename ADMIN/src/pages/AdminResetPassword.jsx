import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../config";

const AdminResetPassword = () => {
  const [params] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");

  const token = params.get("token");
  const type = params.get("type");

  const handleReset = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword, type }),
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <form onSubmit={handleReset}>
      <h2>Admin Reset Password</h2>
      <input type="password" placeholder="New Password" onChange={(e) => setNewPassword(e.target.value)} required />
      <button type="submit">Reset Password</button>
    </form>
  );
};

export default AdminResetPassword;
