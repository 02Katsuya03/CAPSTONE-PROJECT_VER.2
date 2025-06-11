import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Location from '../models/location.js';
import ParentConsent from '../models/ParentConsent.js';
import nodemailer from 'nodemailer';
import { check, validationResult } from 'express-validator';
import { RecaptchaV2 as Recaptcha } from 'express-recaptcha';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize recaptcha
const recaptcha = new Recaptcha(
  process.env.RECAPTCHA_SITE_KEY,
  process.env.RECAPTCHA_SECRET_KEY
);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// @route   GET api/users/regions
// @desc    Get all regions
router.get('/regions', async (req, res) => {
  try {
    console.log('Fetching all regions');
    const locations = await Location.distinct('region');
    if (!locations || locations.length === 0) {
      console.error('No regions found in database');
      return res.status(404).json({ msg: 'No regions found' });
    }
    res.json({ regions: locations });
  } catch (err) {
    console.error('Error in GET /regions:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/provinces/:region
// @desc    Get provinces by region
router.get('/provinces/:region', async (req, res) => {
  try {
    const region = req.params.region;
    console.log(`Fetching provinces for region: ${region}`);
    
    const provinces = await Location.distinct('province', { region });
    if (!provinces || provinces.length === 0) {
      console.error(`No provinces found for region: ${region}`);
      return res.status(404).json({ msg: 'Region not found or no provinces available' });
    }
    
    res.json({ provinces });
  } catch (err) {
    console.error('Error in GET /provinces/:region:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/cities/:province
// @desc    Get cities by province
router.get('/cities/:province', async (req, res) => {
  try {
    const province = req.params.province;
    console.log(`Fetching cities for province: ${province}`);
    
    const cities = await Location.distinct('city', { province });
    if (!cities || cities.length === 0) {
      console.error(`No cities found for province: ${province}`);
      return res.status(404).json({ msg: 'Province not found or no cities available' });
    }
    
    res.json({ cities });
  } catch (err) {
    console.error('Error in GET /cities/:province:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/barangays/:city
// @desc    Get barangays by city
router.get('/barangays/:city', async (req, res) => {
  try {
    const city = req.params.city;
    console.log(`Fetching barangays for city: ${city}`);
    
    const barangays = await Location.find({ city })
      .select('barangay -_id')
      .distinct('barangay');
    
    if (!barangays || barangays.length === 0) {
      console.error(`No barangays found for city: ${city}`);
      return res.status(404).json({ msg: 'City not found or no barangays available' });
    }
    
    const formattedBarangays = barangays.map(b => ({
      _id: b.toLowerCase().replace(/\s+/g, '-'),
      barangay: b
    }));
    
    res.json({ barangays: formattedBarangays });
  } catch (err) {
    console.error('Error in GET /barangays/:city:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/send-otp
// @desc    Send OTP to parent's email
router.post('/send-otp', async (req, res) => {
    try {
      const { email } = req.body;
      
      // Validate email input
      if (!email || !email.includes('@')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Valid email is required' 
        });
      }
  
      console.log(`Attempting to send OTP to: ${email}`);
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Generated OTP: ${otp}`);
      
      // Save OTP to database
      const otpRecord = await ParentConsent.findOneAndUpdate(
        { email },
        { 
          otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
          verified: false
        },
        { 
          upsert: true,
          new: true
        }
      );
  
      if (!otpRecord) {
        throw new Error('Failed to create OTP record');
      }
  
      // Configure email options using environment variables
      const mailOptions = {
        from: `"Parental Consent" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your OTP for Parental Consent',
        text: `Your verification code is: ${otp}\nThis code expires in 10 minutes.`,
        html: `
          <div>
            <h2>Parental Consent Verification</h2>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `
      };
  
      // Send email
      await transporter.sendMail(mailOptions);
      console.log(`OTP successfully sent to ${email}`);
      
      res.json({ 
        success: true,
        message: 'OTP sent successfully',
        email: email
      });
  
    } catch (err) {
      console.error('OTP sending failed:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });
  
// @route   POST api/users/verify-otp
// @desc    Verify OTP from parent's email
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(`Verifying OTP for email: ${email}`);
    
    // Find the OTP record
    const record = await ParentConsent.findOne({ email });
    
    if (!record) {
      console.error(`No OTP record found for email: ${email}`);
      return res.status(400).json({ success: false, message: 'No OTP request found for this email' });
    }
    
    // Check if OTP is expired
    if (record.expiresAt < new Date()) {
      console.error(`OTP expired for email: ${email}`);
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }
    
    // Verify OTP
    if (record.otp !== otp) {
      console.error(`Invalid OTP provided for email: ${email}`);
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Mark as verified
    record.verified = true;
    await record.save();
    console.log(`OTP verified successfully for email: ${email}`);
    
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Error in POST /verify-otp:', err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/register', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('survey.ageGroup', 'Age group is required').not().isEmpty(),
  check('birthdate', 'Birthdate is required').not().isEmpty(),
  check('age', 'Age is required').not().isEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors in registration:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      userId,
      firstName,
      lastName,
      email,
      username,
      sex,
      region,
      province,
      city,
      barangay,
      birthdate,
      age,
      password,
      survey,
      parentConsent,
      phoneNumber, // <-- ADD THIS
    } = req.body;
    

    console.log(`Starting registration for email: ${email}`);

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      console.error(`User already exists with email: ${email}`);
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Check username availability
    if (username) {
      user = await User.findOne({ username });
      if (user) {
        console.error(`Username already taken: ${username}`);
        return res.status(400).json({ errors: [{ msg: 'Username already taken' }] });
      }
    }

    // For users under 18, verify parent consent
    if (age < 18) {
      console.log(`User under 18 detected (age: ${age}), verifying parent consent`);
      if (!parentConsent || !parentConsent.otpVerified) {
        console.error('Parental consent verification missing for underage user');
        return res.status(400).json({ errors: [{ msg: 'Parental consent verification required for users under 18' }] });
      }

      // Verify the consent record exists and is verified
      const consentRecord = await ParentConsent.findOne({ 
        email: parentConsent.email,
        verified: true
      });

      if (!consentRecord) {
        console.error(`No verified consent record found for email: ${parentConsent.email}`);
        return res.status(400).json({ errors: [{ msg: 'Parental consent not verified' }] });
      }
    }

    // Create location record
    const location = new Location({
      region,
      province,
      city,
      barangay
    });
    await location.save();
    console.log(`Location record created for user: ${email}`);

    // Remove all non-digit characters and ensure it's 10 digits
    const cleanNumber = phoneNumber.replace(/\D/g, "").slice(0, 10);

    // Combine with +63
    const fullPhoneNumber = "+63" + cleanNumber;

    user = new User({
      userId,
      firstName,
      lastName,
      email,
      username: username || email.split('@')[0],
      sex,
      location: location._id,
      birthdate,
      age,
      region,
      province,
      city,
      barangay,
      password,
      survey,
      parentConsent: age < 18 ? parentConsent : null,
      role: 'user',
      status: 'active',
      phoneNumber: fullPhoneNumber,
    });
    

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    console.log(`User registered successfully: ${email}`);

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) {
          console.error('JWT generation error:', err.message);
          throw err;
        }
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Error in POST /register:', err.message);
    res.status(500).send('Server error');
  }
});


export default router;