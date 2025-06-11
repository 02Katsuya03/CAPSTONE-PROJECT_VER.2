// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Your User model
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin'; // Ensure this is imported for social login security

const router = express.Router();

// --- Login Attempt Limiter Constants ---
const MAX_LOGIN_ATTEMPTS = 3; // Maximum allowed failed attempts
const LOCKOUT_DURATION_MINUTES = 5; // Lockout duration in minutes
// ------------------------------------

// Configure logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Helper function to get Philippine time (Modified for month name, hour, and minute)
function getPhilippineTime() {
  return new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Logging function
function logAuthAttempt(identifier, success, message, method = 'Username/Password') {
  const logEntry = `[${getPhilippineTime()}] ${success ? 'SUCCESS' : 'FAILURE'} - Method: ${method} - Identifier: ${identifier} - ${message}\n`;
  const logFile = path.join(logsDir, 'auth.log');

  fs.appendFile(logFile, logEntry, (err) => {
    if (err) console.error('Failed to write to auth log:', err);
  });
}

// Helper to generate and send response after successful authentication
const sendAuthResponse = (res, userDoc, logIdentifier, loginMethod) => {
    const token = jwt.sign(
      { id: userDoc._id, role: userDoc.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userPayload = {
        _id: userDoc._id,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        email: userDoc.email,
        role: userDoc.role,
        profilePicture: userDoc.profilePicture,
        isSocialUser: userDoc.isSocialUser,
        username: userDoc.username || null // Ensure username is always included
    };

    logAuthAttempt(logIdentifier, true, `Login - Role: ${userDoc.role}`, loginMethod);
    res.json({
        status: 'success',
        token,
        redirectTo: userDoc.role === 'admin' ? 'Admin_Base' : 'User_Base',
        user: userPayload
    });
};

// POST /login (Username/Password)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      logAuthAttempt(username || 'unknown', false, 'Missing credentials', 'Username/Password');
      return res.status(400).json({ status: 'error', message: 'Please provide both username and password' });
    }

    // ⭐ Master Admin Login (Bypass lockout for master admin) ⭐
    if (username === process.env.MASTER_USERNAME && password === process.env.MASTER_PASSWORD) {
      const masterUser = {
        _id: 'master-admin',
        username: process.env.MASTER_USERNAME,
        role: 'admin',
        firstName: 'Master Admin'
      };
      sendAuthResponse(res, masterUser, username, 'Master Admin');
      return;
    }

    const user = await User.findOne({ username });

    if (!user) {
      logAuthAttempt(username, false, 'User not found', 'Username/Password');
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // ⭐ Check for Lockout ⭐
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const timeLeft = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / 1000); // Time left in seconds
      logAuthAttempt(username, false, `Account locked out for ${timeLeft} seconds`, 'Username/Password');
      return res.status(403).json({
        status: 'error',
        message: `Account locked. Please try again in ${Math.ceil(timeLeft / 60)} minutes.`,
        lockout: true, // Signal to frontend that it's a lockout
        timeLeftSeconds: timeLeft
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // ⭐ Successful Login: Reset attempts and lockout ⭐
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      await user.save();
      sendAuthResponse(res, user, username, 'Username/Password');
    } else {
      // ⭐ Failed Login: Increment attempts ⭐
      user.failedLoginAttempts += 1;
      logAuthAttempt(username, false, `Incorrect password. Attempt ${user.failedLoginAttempts}/${MAX_LOGIN_ATTEMPTS}`, 'Username/Password');

      if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000); // Lock for N minutes
        logAuthAttempt(username, false, `Account locked out for ${LOCKOUT_DURATION_MINUTES} minutes`, 'Username/Password');
        await user.save();
        return res.status(403).json({
          status: 'error',
          message: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
          lockout: true,
          timeLeftSeconds: LOCKOUT_DURATION_MINUTES * 60
        });
      } else {
        await user.save(); // Save the updated attempt count
        return res.status(401).json({
          status: 'error',
          message: `Invalid credentials. You have ${MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts} attempts remaining.`
        });
      }
    }

  } catch (err) {
    console.error(err);
    logAuthAttempt(req.body.username || 'unknown', false, `Server error: ${err.message}`, 'Username/Password');
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// POST /api/social-login (Handles both Google and Facebook Login)
// This route does not need lockout logic as Firebase handles social login attempts
router.post('/social-login', async (req, res) => {
    try {
        const { email, firstName, lastName, firebaseUid, profilePicture, loginMethod } = req.body;

        // ⭐ CRITICAL SECURITY STEP: Verify the Firebase ID Token from the client. ⭐
        // The client-side (Login.jsx) needs to send this token in the request headers
        // (e.g., Authorization: Bearer <idToken>).
        // Without this, your backend could be vulnerable to spoofed requests.
        // Uncomment and implement this section:

        /*
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            logAuthAttempt(email || firebaseUid, false, 'Firebase ID Token missing', loginMethod);
            return res.status(401).json({ status: 'error', message: 'Firebase ID Token missing. Unauthorized.' });
        }
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            // Ensure the UID from the token matches the one sent from the client
            if (decodedToken.uid !== firebaseUid) {
                logAuthAttempt(email || firebaseUid, false, 'Firebase UID mismatch', loginMethod);
                return res.status(401).json({ status: 'error', message: 'Firebase UID mismatch or token invalid. Unauthorized.' });
            }
            // Optional: You might also want to check decodedToken.email against the provided email
            // if (decodedToken.email && decodedToken.email !== email) {
            //     console.warn(`Email mismatch for UID ${firebaseUid}: Token email ${decodedToken.email}, Req email ${email}`);
            //     // Decide how to handle this: reject, or prioritize token's email
            // }
        } catch (tokenError) {
            console.error('Firebase ID Token verification failed:', tokenError);
            logAuthAttempt(email || firebaseUid, false, `Firebase ID Token verification failed: ${tokenError.message}`, loginMethod);
            return res.status(401).json({ status: 'error', message: 'Invalid Firebase ID Token. Unauthorized.' });
        }
        */

        // Try to find user by firebaseUid first
        let user = await User.findOne({ firebaseUid });

        // If not found by firebaseUid, try to find by email
        if (!user) { // User with this firebaseUid not found
            user = await User.findOne({ email }); // Try finding by email

            if (user) { // User found by email, but not linked to this Firebase UID yet.
                user.firebaseUid = firebaseUid;
                user.isSocialUser = true;
                user.firstName = firstName || user.firstName;
                user.lastName = lastName || user.lastName;
                user.profilePicture = profilePicture || user.profilePicture;
                await user.save();
                logAuthAttempt(email, true, 'Existing user linked via social login', loginMethod);
            } else { // Truly a new user, create a new one
                user = new User({
                    username: email,
                    email,
                    firstName,
                    lastName,
                    firebaseUid,
                    profilePicture,
                    role: 'user',
                    isSocialUser: true
                });
                await user.save();
                logAuthAttempt(email, true, 'New user registered via social login', loginMethod);
            }
        } else { // User found by firebaseUid (existing social login user)
            user.firstName = firstName || user.firstName;
            user.lastName = lastName || user.lastName;
            user.profilePicture = profilePicture || user.profilePicture;
            await user.save();
            logAuthAttempt(email, true, 'Existing user logged in via social login', loginMethod);
        }

        // Send backend's own token and user data
        sendAuthResponse(res, user, email, loginMethod);

    } catch (err) {
        console.error('Social login backend error:', err);

        if (err.name === 'MongoServerError' && err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            const value = err.keyValue[field];
            logAuthAttempt(req.body.email || 'unknown', false, `Duplicate ${field} value: ${value}`, loginMethod);
            return res.status(409).json({ status: 'error', message: `An account with that ${field} already exists.` });
        } else if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message);
            logAuthAttempt(req.body.email || 'unknown', false, `Validation failed: ${errors.join(', ')}`, loginMethod);
            return res.status(400).json({ status: 'error', message: `Validation error: ${errors.join(', ')}` });
        } else {
            logAuthAttempt(req.body.email || 'unknown', false, `Server error: ${err.message}`, loginMethod);
            return res.status(500).json({ status: 'error', message: 'Server error during social login. Please try again.' });
        }
    }
});

export default router;