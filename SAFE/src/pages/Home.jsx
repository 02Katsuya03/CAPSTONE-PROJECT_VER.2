import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./css/Home.css";
import { useEffect, useState } from "react";

function Home() {
  const { t, i18n } = useTranslation();
  const [languageChanged, setLanguageChanged] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    setLanguageChanged(true);
    setTimeout(() => setLanguageChanged(false), 1000); // reset animation flag
  };

  return (
    <main className="main-container">
      <div className={`language-switcher ${languageChanged ? "fade" : ""}`}>
        <label htmlFor="lang-select" className="lang-label">
          <i className='bx bx-globe'></i> Language:
        </label>
        <select
          id="lang-select"
          value={i18n.language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="lang-dropdown"
        >
          <option value="en">English</option>
          <option value="fil">Filipino</option>
        </select>
      </div>

      <h1 className="title">{t("title")}</h1>
      <section className="intro-text">
        <p>{t("subtitle")}</p>
      </section>

      <div className="button-grid">
        <Link to="/login" className="card-button">
          <img src="/images/login.png" alt="Login" className="card-image" />
          <span className="card-label">{t("login")}</span>
        </Link>
        <Link to="/register" className="card-button">
          <img src="/images/register.png" alt="Register" className="card-image" />
          <span className="card-label">{t("register")}</span>
        </Link>
      </div>
    </main>
  );
}

export default Home;
