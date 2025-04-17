import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./css/Register.css";

const Register = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [faceImagePreview, setFaceImagePreview] = useState(state?.faceImagePreview || "");
  const [faceImageFile, setFaceImageFile] = useState(state?.faceImageFile || null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    birthdate: "",
    age: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);
  const toggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    if (name === "birthdate") {
      const birthDate = new Date(value);
      const currentDate = new Date();
      let age = currentDate.getFullYear() - birthDate.getFullYear();
      if (
        currentDate.getMonth() < birthDate.getMonth() ||
        (currentDate.getMonth() === birthDate.getMonth() &&
          currentDate.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      updatedData.age = age;
    }

    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!faceImageFile) {
      alert("Face image is required!");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append("faceImage", faceImageFile);

    try {
      const response = await axios.post("http://localhost:5001/user/register", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert(response.data.message);
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Registration Failed!");
    }
  };

  return (
    <div className="register-container">
      <span className="back-icon" onClick={() => navigate("/")}>
        <i className="bx bx-arrow-back"></i>
      </span>
      <h2>Register</h2>

      <form onSubmit={handleSubmit} className="form">
        {["firstName", "lastName", "username", "email", "birthdate"].map((name) => (
          <div key={name} className="form-group">
            <input
              type={name === "email" ? "email" : name === "birthdate" ? "date" : "text"}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              required
              placeholder=" "
              autoComplete="off"
            />
            <label>{name.replace(/^\w/, (c) => c.toUpperCase())}</label>
          </div>
        ))}

        <div className="form-group">
          <input type="text" name="age" value={formData.age || ""} readOnly placeholder=" " />
          <label>Age</label>
        </div>

        <div className="form-group password-group">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <label>Password</label>
          <span className="eye-icon" onClick={togglePassword}>
            <i className={`bx ${showPassword ? "bx-hide" : "bx-show"}`}></i>
          </span>
        </div>

        <div className="form-group password-group">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <label>Confirm Password</label>
          <span className="eye-icon" onClick={toggleConfirmPassword}>
            <i className={`bx ${showConfirmPassword ? "bx-hide" : "bx-show"}`}></i>
          </span>
        </div>

        <div className="form-group">
          <label>Face Image</label>
          {faceImagePreview ? (
            <img src={faceImagePreview} alt="Captured Face" style={{ width: "100%", borderRadius: "8px" }} />
          ) : (
            <p>No face image captured. Please capture your face first.</p>
          )}
        </div>

        <button type="submit" className="submit-btn">Register</button>
      </form>
    </div>
  );
};

export default Register;
