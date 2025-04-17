import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5001/user/verify-password", credentials);
      if (response.data.success) {
        setIsPasswordVerified(true);
        setIsCapturing(true);
        setCountdown(5);
        setError("");
      } else {
        setError(response.data.message || "Incorrect username or password.");
      }
    } catch (err) {
      console.error("Password Check Error:", err);
      if (err.response) {
        console.error("Server Response:", err.response.data);
        setError(err.response.data.message || "An error occurred during password verification.");
      } else {
        setError("Network or server error occurred.");
      }
    }
  };
  
  useEffect(() => {
    if (isCapturing && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      captureFace();
    }
  }, [countdown, isCapturing]);

  useEffect(() => {
    const startVideo = async () => {
      if (!isPasswordVerified) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setError("⚠️ Failed to access webcam.");
      }
    };

    startVideo();

    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isPasswordVerified]);

  const captureFace = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg");
    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach(track => track.stop());

    verifyFace(imageDataUrl);
  };

  const verifyFace = async (imageDataUrl) => {
    try {
      const response = await axios.post("http://localhost:5001/user/face-login", {
        username: credentials.username,
        faceImage: imageDataUrl,
      });

      if (response.data.success) {
        const { token, ageCategory, username } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("ageCategory", ageCategory);
        localStorage.setItem("username", username);
        navigateBasedOnAgeCategory(ageCategory);
      } else {
        setError(response.data.message || "Face verification failed.");
        setIsPasswordVerified(false);
      }
    } catch (err) {
      console.error("Face Verification Error:", err);
      setError("Face verification failed! Try again.");
      setIsPasswordVerified(false);
    }
  };

  const navigateBasedOnAgeCategory = (ageCategory) => {
    switch (ageCategory) {
      case "10-14":
        navigate("/content-10-14");
        break;
      case "15-18":
        navigate("/content-15-18");
        break;
      case "19-22":
        navigate("/content-19-22");
        break;
      case "23-above":
        navigate("/content-23-above");
        break;
      default:
        navigate("/");
        break;
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!isPasswordVerified && (
        <div>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={credentials.username}
            onChange={handleInputChange}
          /><br /><br />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleInputChange}
          /><br /><br />
          <button onClick={handleLogin}>Verify Password</button>
        </div>
      )}

      {isPasswordVerified && (
        <div style={{ position: "relative", width: "100%", maxWidth: "400px", margin: "auto", marginBottom: "20px" }}>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              borderRadius: "10px",
              objectFit: "cover",
              aspectRatio: "1/1"
            }}
            autoPlay
            muted
          />
          {isCapturing && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                fontSize: "30px",
                color: "white",
                backgroundColor: "rgba(0,0,0,0.5)",
                padding: "10px",
                borderRadius: "5px"
              }}
            >
              Ready in {countdown}...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Login;
