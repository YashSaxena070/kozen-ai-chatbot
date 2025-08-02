require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const validator = require("validator");

const userRoute = require("./route");
const apiRoute = require("./api");
const app = express();

// Security: Environment variables
const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chatbot";
const SESSION_SECRET = process.env.SESSION_SECRET || "fallback-secret-change-in-production";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8000";

// Security: Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Security: CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security: Session configuration
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
}));

// Security: Input validation middleware
const validateInput = (req, res, next) => {
  const { username, password } = req.body;
  
  if (username && !validator.isLength(username, { min: 3, max: 30 })) {
    return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
  }
  
  if (password && !validator.isLength(password, { min: 6 })) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Sanitize inputs
  if (username) req.body.username = validator.escape(username);
  
  next();
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Security: Serve static files with proper headers
app.use('/Images', express.static(path.join(__dirname, 'Images'), {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Security: MongoDB connection with error handling
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected securely"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Security: Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/user/login');
  }
  next();
};

// Routes with security
app.get("/user/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  return res.render("login");
});

app.get("/user/signup", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  return res.render("signup");
});

// Apply input validation to user routes
app.use("/user", validateInput, userRoute);

// API routes
app.use("/api", apiRoute);

// Protected home route
app.get("/", requireAuth, (req, res) => {
  res.render("home", { username: req.session.user });
});

// Security: Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
    }
    res.redirect("/user/login");
  });
});

// Security: Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message 
  });
});

// Security: 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Start server with security logging
app.listen(PORT, () => {
  console.log(`🚀 Server started securely on http://localhost:${PORT}`);
  console.log(`🔒 Security features enabled: Helmet, Rate Limiting, CORS, Input Validation`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
