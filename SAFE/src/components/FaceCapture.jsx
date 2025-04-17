import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";

const FaceCapture = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Look UP");
  const [confirmationCount, setConfirmationCount] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const REQUIRED_CONFIRMATIONS = 3;
  const steps = ["Look UP", "Look DOWN", "Tilt or Turn Head", "Prepare to Capture"];
  const lastNose = useRef(null);
  const [noFaceDetected, setNoFaceDetected] = useState(false);

  useEffect(() => {
    const loadModelsAndStartVideo = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert("Error accessing your camera: " + err.message);
      }
    };
    loadModelsAndStartVideo();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (!detection || detection.detection.score < 0.5) {
        setNoFaceDetected(true);
        setConfirmationCount(0);
        return;
      } else {
        setNoFaceDetected(false);
      }

      const { landmarks } = detection;
      const nose = landmarks.getNose()[3];
      const centerX = videoRef.current.videoWidth / 2;
      const centerY = videoRef.current.videoHeight / 2;

      if (step === steps.length - 1) {
        if (countdown > 0) {
          setCountdown(prev => prev - 1);
        } else {
          const { file, dataUrl } = captureFrame();
          const confirmProceed = window.confirm(
            "✅ Your face image is ready for registration.\nDo you want to proceed?"
          );

          if (confirmProceed) {
            navigate("/register", { state: { faceImageFile: file, faceImagePreview: dataUrl } });
          } else {
            alert("You can try again if you wish.");
          }
        }
        return;
      }

      const checks = [
        () => nose.y < centerY - 20,
        () => nose.y > centerY + 20,
        () => Math.abs(nose.x - centerX) > 30
      ];

      if (checks[step]()) {
        setConfirmationCount(prev => prev + 1);
        if (confirmationCount + 1 >= REQUIRED_CONFIRMATIONS) {
          setStep(prev => prev + 1);
          setProgress(((step + 1) / steps.length) * 100);
          setStatus(steps[step + 1]);
          lastNose.current = { x: nose.x, y: nose.y };
          setConfirmationCount(0);
        }
      } else {
        if (confirmationCount !== 0) {
          setConfirmationCount(0);
          lastNose.current = { x: nose.x, y: nose.y };
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [step, confirmationCount, countdown]);

  const captureFrame = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    const file = dataURLtoFile(dataUrl, "face_capture.jpg");
    return { file, dataUrl };
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Face Verification Process</h2>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="400"
        height="300"
        style={{ border: "2px solid black", borderRadius: "10px" }}
      />
      <div style={{ marginTop: "10px" }}>
        <p><strong>{status}</strong></p>
        {step === steps.length - 1 ? (
          <p>Counting down... {countdown}s</p>
        ) : (
          <p>Confirming... {confirmationCount}/{REQUIRED_CONFIRMATIONS}</p>
        )}
        <div style={{ width: "100%", height: "10px", backgroundColor: "#ccc", borderRadius: "5px", marginTop: "20px" }}>
          <div style={{ height: "100%", width: `${progress}%`, backgroundColor: "#4CAF50", borderRadius: "5px" }} />
        </div>
        {noFaceDetected && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            No face detected! Please stay visible to the camera.
          </p>
        )}
      </div>
    </div>
  );
};

export default FaceCapture;
