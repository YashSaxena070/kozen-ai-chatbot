const User = require("./models");
const bcrypt = require("bcrypt");
const validator = require("validator");

// Security: Password hashing utility
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Security: Password verification utility
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

async function handleUserSignup(req, res) {
  try {
    const { username, password } = req.body;

    // Security: Additional validation
    if (!username || !password) {
      return res.render("signup", {
        error: "Username and password are required"
      });
    }

    // Security: Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render("signup", {
        error: "Username already exists"
      });
    }

    // Security: Hash password before storing
    const hashedPassword = await hashPassword(password);

    // Security: Create user with hashed password
    await User.create({
      username: validator.escape(username),
      password: hashedPassword,
    });

    // Security: Save username to session
    req.session.user = username;
    console.log(`✅ New user registered: ${username}`);
    return res.redirect("/");
  } catch (error) {
    console.error("❌ Signup error:", error);
    return res.render("signup", {
      error: "Registration failed. Please try again."
    });
  }
}

async function handleUserSignin(req, res) {
  try {
    const { username, password } = req.body;

    // Security: Input validation
    if (!username || !password) {
      return res.render("login", {
        error: "Username and password are required"
      });
    }

    // Security: Find user and verify password
    const user = await User.findOne({ username: validator.escape(username) });
    
    if (!user) {
      return res.render("login", {
        error: "Invalid username or password"
      });
    }

    // Security: Verify password hash
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.render("login", {
        error: "Invalid username or password"
      });
    }

    // Security: Save username to session
    req.session.user = user.username;
    console.log(`✅ User logged in: ${user.username}`);
    return res.redirect("/");
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.render("login", {
      error: "Login failed. Please try again."
    });
  }
}

// Security: Logout function
async function handleUserLogout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      console.log("✅ User logged out successfully");
      res.redirect("/user/login");
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
}

module.exports = {
  handleUserSignin,
  handleUserSignup,
  handleUserLogout,
};
