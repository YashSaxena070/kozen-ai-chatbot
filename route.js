const express = require("express");
const { handleUserSignin, handleUserSignup, handleUserLogout } = require("./userController");

const router = express.Router();

// Security: Input validation middleware for routes
const validateUserInput = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  next();
};

// Routes with security validation
router.post("/signup", validateUserInput, handleUserSignup);
router.post("/login", validateUserInput, handleUserSignin);
router.get("/logout", handleUserLogout);

module.exports = router;