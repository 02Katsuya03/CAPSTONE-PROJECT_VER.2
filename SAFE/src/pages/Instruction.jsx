// src/pages/Instruction.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Instruction = () => {
  const navigate = useNavigate();

  const handleProceed = () => {
    navigate("/face-capture");
    // 👈 Navigate to your face registration page
  };

  return (
    <div className="instruction-page">
      <h2>📸 Face Registration Instructions</h2>
      <p>✅ Make sure your face is clearly visible in the camera.</p>
      <p>✅ Avoid hats, masks, or sunglasses.</p>
      <p>✅ Use good lighting for accurate detection.</p>
      <p>✅ The system will automatically capture your face once it's detected and verified for liveness.</p>

      <button onClick={handleProceed} style={{
        background: '#8DAEED',
        color: '#fff',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
      }}>
        Proceed to Registration
      </button>
    </div>
  );
};

export default Instruction;
