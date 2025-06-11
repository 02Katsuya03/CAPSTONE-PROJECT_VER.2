import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import moment from "moment-timezone";
import userRoutes from "./routes/User.js";
import loginRoute from "./routes/Login.js";
import forgotpasswordRoutes from "./routes/ForgotPassword.js";
import resetPasswordRoute from "./routes/ResetPassword.js";
import logoutRoute from "./routes/Logout.js";
import User from "./models/User.js"; // Optional unless you use it directly in server.js



dotenv.config();
const app = express();
app.use(express.json());

/* -----------------------------------
   CORS SETUP (Only allow frontend)
----------------------------------- */
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173"; // Default fallback

console.log(`🌍 Allowed CORS Origin: ${allowedOrigin}`);

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// Add COOP and COEP headers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

/* -----------------------------------
   Timezone (for logging/timestamps)
----------------------------------- */
moment.tz.setDefault("Asia/Manila");
/* -----------------------------------
   FUNCTION
----------------------------------- */
// API Routes
app.get('/api/all', async (req, res) => {
  try {
    const { search, sort, hasParentConsent } = req.query;

    let query = {};

    // Search filters
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { username: searchRegex },
        { region: searchRegex },
        { province: searchRegex },
        { city: searchRegex },
        { barangay: searchRegex },
        { 'survey.ageGroup': searchRegex },
        { status: searchRegex }
      ];
    }

    // Filter only users with parent consent
    if (hasParentConsent === 'true') {
      query['parentConsent.email'] = { $exists: true, $ne: null };
    }

    // Sorting
    let sortOption = {};
    if (sort) {
      const [key, direction] = sort.split(':');
      const sortDirection = direction === 'desc' ? -1 : 1;
      sortOption[key] = sortDirection;
    }

    const users = await User.find(query)
      .sort(sortOption)
      .select('-password -resetToken -resetTokenExpires'); // DO NOT populate location

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY;

app.get("/validate-email", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Email parameter is required." });
  }

  try {
    const apiRes = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`
    );

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: "Error from AbstractAPI." });
    }

    const data = await apiRes.json();
    return res.json(data);
  } catch (error) {
    console.error("Error validating email:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


/* -----------------------------------
   ROUTES
----------------------------------- */
app.use("/api/users", userRoutes);       // For /api/users/*
app.use("/api", loginRoute);             // For /api/login
app.use('/logout', logoutRoute);
app.use("/password", forgotpasswordRoutes);
app.use("/password", resetPasswordRoute);

/* -----------------------------------
   DATABASE CONNECTION
----------------------------------- */
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB.");

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is now running at:`);
      console.log(`   🌐 Local:     http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  });
