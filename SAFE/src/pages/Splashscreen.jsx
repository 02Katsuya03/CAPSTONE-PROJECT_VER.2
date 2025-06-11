import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/SplashScreen.css';

const changingWords = ['Empowering', 'Educating', 'Enlightening', 'Encouraging'];

const SplashScreen = () => {
  const [progress, setProgress] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate('/home'), 300);
          return 100;
        }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % changingWords.length);
    }, 1500);
    return () => clearInterval(wordInterval);
  }, []);

  return (
    <div className="splash-container1">
      <h1 className="title1">SAFE</h1>
      <section className="intro-text1">
        <p className="changing-text1">
          {changingWords[wordIndex]} <span>Sex Awareness & Facts for Everyone</span>
        </p>
      </section>
      <div className="progress-bar1">
        <div className="progress" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default SplashScreen;
