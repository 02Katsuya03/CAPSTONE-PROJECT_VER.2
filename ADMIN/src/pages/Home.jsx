import { useState } from "react";
import { Link } from "react-router-dom";
import "./css/App.css";

function Home() {
  const [showPopup, setShowPopup] = useState(true);

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {/* Video Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="close-btn" onClick={closePopup}>&times;</span>
            <video width="100%" controls autoPlay>
              <source src="/video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-container">
      <h1 className="title">ADMIN ONLY</h1>
        <h1 className="title">AVES CIVIL SOCIETY ORGANIZATION INC.</h1>

        <section className="intro-text">
          <p>
            Learn. Understand. Empower. We provide age-appropriate sex education for a better, safer future.
          </p>
        </section>

        <div className="button-grid">
          <Link to="/login" className="card-button">
            <img src="/images/login.png" alt="Login" className="card-image" />
            <span className="card-label">Login</span>
          </Link>
          <Link to="/register" className="card-button">
            <img src="/images/register.png" alt="Register" className="card-image" />
            <span className="card-label">Register</span>
          </Link>
        </div>
      </main>
    </>
  );
}

export default Home;