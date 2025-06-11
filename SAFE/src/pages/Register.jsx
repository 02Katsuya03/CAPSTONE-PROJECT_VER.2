import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import "../pages/css/Register.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";


const Register = () => {
    const [emailChecking, setEmailChecking] = useState(false);
    const [emailValid, setEmailValid] = useState(null); // null = not checked yet
    const [emailError, setEmailError] = useState("");

    const [consentChecked, setConsentChecked] = useState(false);
    const [consentError, setConsentError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      sex: "",
      region: "",
      province: "",
      city: "",
      barangay: "",
      birthdate: "",
      age: "",
      password: "",
      confirmPassword: "",
      survey: {
        ageGroup: "",
        infoSource: "",
        learningSource: ""
      }
    });
    
    const checkEmailValidity = async (email) => {
        if (!email) return; // skip empty email
    
        setEmailChecking(true);
        setEmailError("");
        setEmailValid(null);
    
        try {
          // Call your backend proxy API on localhost
          const response = await fetch(`http://localhost:5001/validate-email?email=${encodeURIComponent(email)}`);
          const data = await response.json();
    
          if (data.deliverability === "DELIVERABLE") {
            setEmailValid(true);
          } else {
            setEmailValid(false);
            setEmailError("");
          }
        } catch (error) {
          setEmailValid(false);
          setEmailError("Error validating email.");
        } finally {
          setEmailChecking(false);
        }
      };
    const [recaptchaValue, setRecaptchaValue] = useState(null);
    const triviaItems = [
        { type: "disease", title: "HPV Fact", content: "HPV is the most common STI, with nearly all sexually active people getting it at some point. The HPV vaccine can prevent most cancer-causing types." },
        { type: "disease", title: "HIV Reality", content: "HIV can't be transmitted through casual contact. Modern treatment allows people with HIV to live long, healthy lives with undetectable viral loads." },
        { type: "disease", title: "Chlamydia Alert", content: "Chlamydia often has no symptoms but can cause permanent damage to reproductive systems. Regular testing is crucial." },
        { type: "disease", title: "Herpes Facts", content: "Herpes (HSV) affects about 1 in 6 people. While there's no cure, antiviral medications can reduce outbreaks." },
        { type: "disease", title: "Syphilis Warning", content: "Syphilis cases have been rising globally. It can cause severe complications but is completely curable with antibiotics." },
        { type: "disease", title: "Gonorrhea Resistance", content: "Some gonorrhea strains are now antibiotic-resistant. Safe sex and regular testing are key to prevention." },
        { type: "disease", title: "Hepatitis B Risk", content: "Hepatitis B is 100x more infectious than HIV but preventable with vaccination. It can cause liver cancer." },
        { type: "disease", title: "PID Danger", content: "Untreated STIs can lead to PID, a major cause of infertility in women. Early treatment prevents complications." },
        { type: "disease", title: "Trichomoniasis", content: "Trichomoniasis is a common curable STI that increases HIV risk. Many infected people show no symptoms." },
        { type: "disease", title: "STIs & Pregnancy", content: "Some STIs like syphilis can be passed to babies during pregnancy. Prenatal testing prevents complications." },
        { type: "misconception", title: "Myth Busted", content: "Pulling out isn't reliable - pre-ejaculate can contain sperm and doesn't protect against STIs." },
        { type: "misconception", title: "False Belief", content: "You can't get pregnant during menstruation. While less likely, it's possible due to early ovulation." },
        { type: "misconception", title: "Not True", content: "STIs always show obvious symptoms. Many infections can be silent for years while causing damage." },
        { type: "misconception", title: "Common Error", content: "Birth control pills protect against STIs. They only prevent pregnancy - condoms are needed for protection." },
        { type: "misconception", title: "Incorrect Assumption", content: "Virginity loss must involve penetration. Any intimate contact can potentially transmit STIs." },
        { type: "misconception", title: "False Safety", content: "Oral sex is 'safe' sex. Many STIs including herpes and HPV can be transmitted orally." },
        { type: "misconception", title: "Myth", content: "You can't get an STI from your first sexual partner. Previous exposures make this untrue." },
        { type: "misconception", title: "Wrong Idea", content: "Two condoms are better than one. Using multiple actually increases friction and breakage risk." },
        { type: "misconception", title: "False Notion", content: "STIs only affect 'promiscuous' people. Anyone sexually active can contract an STI." },
        { type: "misconception", title: "Myth", content: "You can tell if someone has an STI by appearance. Most show no visible signs early on." }
    ];

    const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);
    const navigate = useNavigate();

    const [parentConsent, setParentConsent] = useState({
      relationship: "",
      firstName: "",
      lastName: "",
      email: "",
      otp: "",
      otpSent: false,
      otpVerified: false
    });

    const [showOtpField, setShowOtpField] = useState(false);
    const [otpError, setOtpError] = useState("");

    useEffect(() => {
        const fetchRegions = async () => {
          try {
            const { data } = await axios.get('http://localhost:5001/api/users/regions');
            setRegions(data.regions);
          } catch (error) {
            console.error("Error fetching regions", error);
          }
        };
    
        fetchRegions();
    
        const interval = setInterval(() => {
          setCurrentTriviaIndex((prev) => getRandomIndex(prev));
        }, 5000);
        
        return () => clearInterval(interval);
    }, []);
    
    const getRandomIndex = (excludeIndex) => {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * triviaItems.length);
        } while (randomIndex === excludeIndex);
        return randomIndex;
    };
    
    const handleTriviaClick = () => {
        setCurrentTriviaIndex((prev) => getRandomIndex(prev));
    };
    
    const handleRegionChange = async (e) => {
        const region = e.target.value;
        setFormData({ ...formData, region });
        
        try {
            const { data } = await axios.get(`http://localhost:5001/api/users/provinces/${region}`);
            setProvinces(data.provinces);
            setFormData(prev => ({ ...prev, province: "", city: "", barangay: "" }));
            setCities([]);
            setBarangays([]);
        } catch (error) {
            console.error("Error fetching provinces", error);
        }
    };
    
    const handleProvinceChange = async (e) => {
        const province = e.target.value;
        setFormData({ ...formData, province });
        
        try {
            const { data } = await axios.get(`http://localhost:5001/api/users/cities/${province}`);
            setCities(data.cities);
            setFormData(prev => ({ ...prev, city: "", barangay: "" }));
            setBarangays([]);
        } catch (error) {
            console.error("Error fetching cities", error);
        }
    };
    
    const handleCityChange = async (e) => {
        const city = e.target.value;
        setFormData({ ...formData, city });
        
        try {
            const { data } = await axios.get(`http://localhost:5001/api/users/barangays/${city}`);
            setBarangays(data.barangays);
            setFormData(prev => ({ ...prev, barangay: "" }));
        } catch (error) {
            console.error("Error fetching barangays", error);
        }
    };
    
    const calculateAge = (birthdate) => {
        const today = dayjs();
        const birth = dayjs(birthdate);
        return today.diff(birth, "year");
    };
    
    const handleBirthdate = (e) => {
        const birthdate = e.target.value;
        const age = calculateAge(birthdate);
        setFormData({ ...formData, birthdate, age });
    };
    
    const sendOtp = async () => {
        try {
            const response = await axios.post("http://localhost:5001/api/users/send-otp", {
                email: parentConsent.email
            });
            if (response.data.success) {
                setParentConsent(prev => ({ ...prev, otpSent: true }));
                setShowOtpField(true);
                alert("OTP sent successfully!");
            }
        } catch (error) {
            alert("Failed to send OTP: " + (error.response?.data?.message || error.message));
        }
    };

    const verifyOtp = async () => {
        try {
            const response = await axios.post("http://localhost:5001/api/users/verify-otp", {
                email: parentConsent.email,
                otp: parentConsent.otp
            });
            if (response.data.success) {
                setParentConsent(prev => ({ ...prev, otpVerified: true }));
                setOtpError("");
                alert("OTP verified successfully!");
            }
        } catch (error) {
            setOtpError(error.response?.data?.message || "Invalid OTP");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!recaptchaValue) {
            alert("Please complete the reCAPTCHA!");
            return;
        }

        if (!consentChecked) {
            setConsentError(true);
            return;
          }

        const ageGroupMap = {
            "0-12": [0, 12],
            "13-17": [13, 17],
            "18-24": [18, 24],
            "25-44": [25, 44],
            "45-64": [45, 64],
            "65+": [65, 120]
        };

        const expectedRange = ageGroupMap[formData.survey.ageGroup];
        if (!expectedRange) {
            alert("Please select an age group!");
            return;
        }

        if (formData.age < expectedRange[0] || formData.age > expectedRange[1]) {
            alert("Your age does not match the selected age group!");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (formData.age < 18 && !parentConsent.otpVerified) {
            alert("Parental consent verification is required for users under 18!");
            return;
        }

        try {
            const registrationData = {
                ...formData,
                recaptchaValue,
                ...(formData.age < 18 && { parentConsent })
            };
            
            await axios.post("http://localhost:5001/api/users/register", registrationData);
            alert("Registration Successful!");
            navigate('/login');
        } catch (error) {
            alert("Registration Failed: " + (error.response?.data?.message || error.message));
        }
    };

    const nextStep = () => {
        if (step === 6 && formData.age < 18) {
            setStep(7); // Go to parental consent step
        } else if (step === 7) {
            setStep(8); // Final review step after consent
        } else if (step < 6) {
            setStep(prev => prev + 1);
        } else {
            setStep(8); // Skip to final review if over 18
        }
    };

    const prevStep = () => {
      if (step === 8) {
        if (formData.age < 18) {
          setStep(7); // Back to parental consent
        } else {
          setStep(6); // Skip consent if 18+
        }
      } else if (step > 1) {
        setStep(step - 1); // Normal back
      }
    };
    
    
    const handleBack = () => {
        navigate('/home');
    };

    const getPasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 6) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 1) return { label: "Weak", color: "red", width: "33%" };
        if (score === 2) return { label: "Medium", color: "orange", width: "66%" };
        return { label: "Strong", color: "green", width: "100%" };
      };
      

      useEffect(() => {
        if (!formData.userId) {
          const year = new Date().getFullYear();
          const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 random digits
          setFormData((prev) => ({
            ...prev,
            userId: `${year}${randomDigits}`,
          }));
        }
      }, []);

      const formatToPhone = (value) => {
        const raw = value.replace(/\D/g, "").slice(0, 10); // limit to 10 digits
        const part1 = raw.slice(0, 3);
        const part2 = raw.slice(3, 6);
        const part3 = raw.slice(6, 10);
      
        return [part1, part2, part3].filter(Boolean).join(" ");
      };
      
      
      
    return (
        <div className="register-page-container">
            <div className="back-button" onClick={handleBack}>
                <i className='bx bx-arrow-back'></i>
            </div>

            <div className="register-wrapper">
                <TriviaComponent currentTrivia={triviaItems[currentTriviaIndex]} handleTriviaClick={handleTriviaClick} />
                <div className="form-container" onClick={(e) => { e.stopPropagation(); handleTriviaClick(); }} style={{ cursor: 'pointer' }}>
                    <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${(step / 8) * 100}%` }}></div>
                    </div>
                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="step step-age-group">
                                <h2>Select Your Age Group</h2>
                                <div className="age-group-options">
                                    {["0-12", "13-17", "18-24", "25-44", "45-64", "65+"].map(option => {
                                        const label = {
                                            "0-12": "Children (0-12 years old)",
                                            "13-17": "Teenagers (13-17 years old)",
                                            "18-24": "Young Adults (18-24 years old)",
                                            "25-44": "Adults (25-44 years old)",
                                            "45-64": "Middle-aged Adults (45-64 years old)",
                                            "65+": "Seniors (65+ years old)"
                                        }[option];

                                        return (
                                            <label
                                                key={option}
                                                className={`age-option ${formData.survey.ageGroup === option ? 'active' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    value={option}
                                                    checked={formData.survey.ageGroup === option}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            survey: { ...formData.survey, ageGroup: e.target.value }
                                                        })
                                                    }
                                                />
                                                {label}
                                            </label>
                                        );
                                    })}
                                </div>
                                <button type="button" onClick={nextStep}>Next</button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="step step-info-source">
                                <h2>Information Source</h2>
                                <div className="age-group-options">
                                    {["school", "family", "friends", "social_media", "internet", "others"].map(option => (
                                        <label
                                            key={option}
                                            className={`age-option ${formData.survey.infoSource === option ? 'active' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                value={option}
                                                checked={formData.survey.infoSource === option}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        survey: { ...formData.survey, infoSource: e.target.value }
                                                    })
                                                }
                                            />
                                            {option.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                                        </label>
                                    ))}
                                </div>
                                <div className="navigation-buttons">
                                    <button type="button" onClick={prevStep}>Back</button>
                                    <button type="button" onClick={nextStep}>Next</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="step step-learning-source">
                                <h2>Where do you learn about sex education?</h2>
                                <div className="age-group-options">
                                    {["school", "internet", "socialMedia", "healthProfessional", "family", "friends", "other"].map(option => (
                                        <label
                                            key={option}
                                            className={`age-option ${formData.survey.learningSource === option ? 'active' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                value={option}
                                                checked={formData.survey.learningSource === option}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        survey: { ...formData.survey, learningSource: e.target.value }
                                                    })
                                                }
                                            />
                                            {option === "healthProfessional"
                                                ? "Healthcare Professionals"
                                                : option.replace(/([A-Z])/g, " $1").replace(/\b\w/g, l => l.toUpperCase())}
                                        </label>
                                    ))}
                                </div>
                                <div className="navigation-buttons">
                                    <button type="button" onClick={prevStep}>Back</button>
                                    <button type="button" onClick={nextStep}>Next</button>
                                </div>
                            </div>
                        )}

{step === 4 && (
  <div className="step">
    <h2>Personal Information</h2>

    {/* User ID - read-only */}
    <div className="input-wrapper">
      <input
        type="text"
        id="user-id"
        placeholder=" "
        required
        value={formData.userId}
        readOnly
      />
      <label htmlFor="user-id">User ID</label>
    </div>

    <div className="input-wrapper">
      <input
        type="text"
        id="first-name"
        placeholder=" "
        required
        value={formData.firstName}
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
      />
      <label htmlFor="first-name">First Name</label>
    </div>

    <div className="input-wrapper">
      <input
        type="text"
        id="last-name"
        placeholder=" "
        required
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
      />
      <label htmlFor="last-name">Last Name</label>
    </div>

    <div className="input-wrapper" style={{ position: "relative" }}>
      <input
        type="email"
        id="email"
        placeholder=" "
        required
        value={formData.email}
        onChange={(e) => {
          setFormData({ ...formData, email: e.target.value });
          setEmailError("");
          setEmailValid(null);
        }}
        onBlur={() => checkEmailValidity(formData.email)}
      />
      <label htmlFor="email">Email</label>

      {/* Icons */}
      {emailChecking && (
        <span
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          ⏳
        </span>
      )}
      {emailValid === true && (
        <span
          style={{
            color: "green",
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          ✅
        </span>
      )}
      {emailValid === false && (
        <span
          style={{
            color: "red",
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          ❌
        </span>
      )}

      {/* Error Message */}
      {emailError && <p className="text-sm text-red-500">{emailError}</p>}
    </div>

    
    <div className="input-wrapper">
      <input
        type="text"
        id="username"
        placeholder=" "
        required
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
      />
      <label htmlFor="username">Username</label>
    </div>

    <div className="input-wrapper" style={{ display: "flex", gap: "5px" }}>
  {/* Static +63 prefix */}
  <div style={{ display: "flex", alignItems: "center" }}>
    <input
      type="text"
      value="+63"
      disabled
      style={{
        width: "70px",
        textAlign: "center",
        backgroundColor: "#f0f0f0",
        border: "1px solid black",
        borderRadius: "8px",
        height: "100%",
        fontWeight: "bold"
      }}
    />
  </div>

  {/* User input field with formatting */}
  <div style={{ position: "relative", flex: 1 }}>
    <input
      type="tel"
      id="phone"
      placeholder=" "
      required
      value={formData.phoneNumber}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, "").slice(0, 10); // max 10 digits
        const formatted = formatToPhone(raw);
        setFormData({ ...formData, phoneNumber: formatted });
      }}
    />
    <label htmlFor="phone">Phone Number</label>
  </div>
</div>

    <div className="navigation-buttons">
      <button type="button" onClick={prevStep}>Back</button>
      <button type="button" onClick={nextStep}>Next</button>
    </div>
  </div>
)}


                        {step === 5 && (
                            <div className="step">
                                <h2>Address & Birth Info</h2>
                                <div className="input-wrapper">
                                    <select
                                        id="sex"
                                        required
                                        value={formData.sex}
                                        onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                    >
                                        <option value=""> </option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    <label htmlFor="sex">Sex</label>
                                </div>

                                <div className="input-wrapper">
                                    <select
                                        id="region"
                                        required
                                        value={formData.region}
                                        onChange={handleRegionChange}
                                    >
                                        <option value="">Select Region</option>
                                        {regions.map((region) => (
                                            <option key={region} value={region}>{region}</option>
                                        ))}
                                    </select>
                                    <label htmlFor="region">Region</label>
                                </div>

                                <div className="input-wrapper">
                                    <select
                                        id="province"
                                        required
                                        value={formData.province}
                                        onChange={handleProvinceChange}
                                        disabled={!formData.region}
                                    >
                                        <option value="">Select Province</option>
                                        {provinces.map((province) => (
                                            <option key={province} value={province}>{province}</option>
                                        ))}
                                    </select>
                                    <label htmlFor="province">Province</label>
                                </div>

                                <div className="input-wrapper">
                                    <select
                                        id="city"
                                        required
                                        value={formData.city}
                                        onChange={handleCityChange}
                                        disabled={!formData.province}
                                    >
                                        <option value="">Select City</option>
                                        {cities.map((city) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    <label htmlFor="city">City</label>
                                </div>

                                <div className="input-wrapper">
                                    <select
                                        id="barangay"
                                        required
                                        value={formData.barangay}
                                        onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                                        disabled={!formData.city}
                                    >
                                        <option value="">Select Barangay</option>
                                        {barangays.map((barangay) => (
                                            <option key={barangay._id} value={barangay.barangay}>
                                                {barangay.barangay}
                                            </option>
                                        ))}
                                    </select>
                                    <label htmlFor="barangay">Barangay</label>
                                </div>

                                <div className="input-wrapper">
                                    <input
                                        type="date"
                                        id="birthdate"
                                        required
                                        value={formData.birthdate}
                                        onChange={handleBirthdate}
                                    />
                                    <label htmlFor="birthdate">Birthdate</label>
                                </div>

                                <div className="input-wrapper">
                                    <input
                                        type="number"
                                        id="age"
                                        value={formData.age}
                                        readOnly
                                    />
                                    <label htmlFor="age">Age</label>
                                </div>

                                <div className="navigation-buttons">
                                    <button type="button" onClick={prevStep}>Back</button>
                                    <button type="button" onClick={nextStep}>Next</button>
                                </div>
                            </div>
                        )}

{step === 6 && (
     <div className="step">
     <h2>Create Password</h2>

     <div className="input-wrapper">
       <input
         type={showPassword ? "text" : "password"}
         id="password"
         placeholder=" "
         required
         value={formData.password}
         onChange={(e) => setFormData({ ...formData, password: e.target.value })}
       />
       <label htmlFor="password">Password</label>

       <span className="toggle-password" onClick={() => setShowPassword((prev) => !prev)}>
         {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
       </span>

       {formData.password && (
         <div className="password-strength">
           <div
             className="strength-bar"
             style={{
               backgroundColor: getPasswordStrength(formData.password).color,
               width: getPasswordStrength(formData.password).width,
             }}
           ></div>
           <span className="strength-label">
             {getPasswordStrength(formData.password).label}
           </span>
         </div>
       )}
     </div>

     <div className="input-wrapper">
       <input
         type={showConfirmPassword ? "text" : "password"}
         id="confirm-password"
         placeholder=" "
         required
         value={formData.confirmPassword}
         onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
       />
       <label htmlFor="confirm-password">Confirm Password</label>

       <span className="toggle-password" onClick={() => setShowConfirmPassword((prev) => !prev)}>
         {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
       </span>
     </div>

     <div className="navigation-buttons">
       <button type="button" onClick={prevStep}>Back</button>
       <button type="button" onClick={nextStep}>Next</button>
     </div>
   </div>
)}


                        {step === 7 && formData.age < 18 && (
                            <div className="step step-parent-consent">
                                <h2>Parent/Guardian Consent</h2>
                                <p>Since you're under 18, we need consent from a parent or guardian.</p>
                                
                                <div className="input-wrapper">
                                    <select
                                        value={parentConsent.relationship}
                                        onChange={(e) => setParentConsent({...parentConsent, relationship: e.target.value})}
                                        required
                                    >
                                        <option value="">Relationship</option>
                                        <option value="mother">Mother</option>
                                        <option value="father">Father</option>
                                        <option value="guardian">Guardian</option>
                                    </select>
                                    <label>Relationship</label>
                                </div>

                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={parentConsent.firstName}
                                        onChange={(e) => setParentConsent({...parentConsent, firstName: e.target.value})}
                                        required
                                    />
                                    <label>First Name</label>
                                </div>

                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={parentConsent.lastName}
                                        onChange={(e) => setParentConsent({...parentConsent, lastName: e.target.value})}
                                        required
                                    />
                                    <label>Last Name</label>
                                </div>

                                <div className="input-wrapper with-button">
                                    <input
                                        type="email"
                                        placeholder=" "
                                        value={parentConsent.email}
                                        onChange={(e) => setParentConsent({...parentConsent, email: e.target.value})}
                                        required
                                    />
                                    <label>Email Address</label>
                                    <button 
                                       
                                        type="button" 
                                        onClick={sendOtp}
                                        disabled={!parentConsent.email || parentConsent.otpSent}
                                    >
                                        {parentConsent.otpSent ? "OTP Sent" : "Send OTP"}
                                    </button>
                                </div>

                                {showOtpField && (
                                    <div className="input-wrapper with-button">
                                        <input
                                            type="text"
                                            placeholder=" "
                                            value={parentConsent.otp}
                                            onChange={(e) => setParentConsent({...parentConsent, otp: e.target.value})}
                                            required
                                        />
                                        <label>OTP Code</label>
                                        <button 
                                            type="button" 
                                            onClick={verifyOtp}
                                            disabled={parentConsent.otpVerified}
                                        >
                                            {parentConsent.otpVerified ? "Verified" : "Verify"}
                                        </button>
                                        {otpError && <p className="error-message">{otpError}</p>}
                                    </div>
                                )}

                                <div className="navigation-buttons">
                                    <button type="button" onClick={prevStep}>Back</button>
                                    <button 
                                        type="button" 
                                        onClick={nextStep}
                                        disabled={!parentConsent.otpVerified}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

{step === 8 && (
  <div className="step">
    <h2>Review & Submit</h2>
    <div className="review-section">
      <h3>Personal Information</h3>
      <p><strong>First Name:</strong> {formData.firstName}</p>
      <p><strong>Last Name:</strong> {formData.lastName}</p>
      <p><strong>Email:</strong> {formData.email}</p>
      <p><strong>Username:</strong> {formData.username}</p>
      <p><strong>Sex:</strong> {formData.sex}</p>

      <h3>Address Information</h3>
      <p><strong>Region:</strong> {formData.region}</p>
      <p><strong>Province:</strong> {formData.province}</p>
      <p><strong>City:</strong> {formData.city}</p>
      <p><strong>Barangay:</strong> {formData.barangay}</p>

      <h3>Birth Information</h3>
      <p><strong>Birthdate:</strong> {formData.birthdate}</p>
      <p><strong>Age:</strong> {formData.age}</p>

      <h3>Survey Information</h3>
      <p><strong>Age Group:</strong> {formData.survey.ageGroup}</p>
      <p><strong>Information Source:</strong> {formData.survey.infoSource}</p>
      <p><strong>Learning Source:</strong> {formData.survey.learningSource}</p>

      {formData.age < 18 && (
        <>
          <h3>Parent/Guardian Consent</h3>
          <p><strong>Relationship:</strong> {parentConsent.relationship}</p>
          <p><strong>Name:</strong> {parentConsent.firstName} {parentConsent.lastName}</p>
          <p><strong>Email:</strong> {parentConsent.email}</p>
          <p><strong>Status:</strong> {parentConsent.otpVerified ? "Verified" : "Not Verified"}</p>
        </>
      )}
    </div>
  {/* ✅ Consent Checkbox */}
  <div className="consent-checkbox mb-4">
        <label className="block text-sm text-gray-700">
          <input
            type="checkbox"
            name="consentChecked"
            checked={consentChecked}
            onChange={(e) => {
              setConsentChecked(e.target.checked);
              setConsentError(false);
            }}
            className="mr-2"
          />
          {formData.age < 18 ? (
            <>
              I confirm that I have obtained parental or guardian consent to access this platform, and I agree to the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">terms of use</a> and{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">privacy policy</a>.
            </>
          ) : (
            <>
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">terms of use</a> and{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">privacy policy</a>, and I understand that this platform contains sex education content.
            </>
          )}
        </label>
        {consentError && (
          <p className="text-red-600 text-sm mt-1">You must check this box to proceed.</p>
        )}
      </div>


    <div className="recaptcha-container">
      <ReCAPTCHA
        sitekey="6Ld-0T8rAAAAAM8nkPkez_GP2NxXGyN4dSx_2gSp"
        onChange={(value) => setRecaptchaValue(value)}
      />
    </div>

    <div className="navigation-buttons">
      <button type="button" onClick={prevStep}>Back</button>
      <button type="submit" disabled={!consentChecked || !recaptchaValue}>Submit</button>
    </div>
  </div>
)}

                    </form>
                </div>
            </div>
        </div>
    );
};

const TriviaComponent = ({ currentTrivia, handleTriviaClick }) => {
    return (
        <div className="trivia-container" onClick={handleTriviaClick} style={{ cursor: 'pointer' }}>
            <div className="trivia-inner">
                <h1 className="trivia-header">Did you know?</h1>
                <h2 className="trivia-title">{currentTrivia.title}</h2>
                <p className={`trivia-content ${currentTrivia.type}`}>{currentTrivia.content}</p>
            </div>
        </div>
    );
};

export default Register;