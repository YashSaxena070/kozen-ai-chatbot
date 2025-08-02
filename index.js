const express = require("express");
const mongoose = require("mongoose");

const cookieParser=require("cookie-parser")

const path = require("path");


const cors = require("cors");

const userRoute = require("./route");
const app = express();
const PORT = 8000;
// Serve static files from the Images directory
app.use('/Images', express.static(path.join(__dirname, 'Images')));

// ✅ Enable CORS for all routes
app.use(cors());


const session = require("express-session");

app.use(session({
  secret: 'your-secret-key', // use a strong secret in production
  resave: false,
  saveUninitialized: false
}));


// ✅ Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(express.static("public"));


// ✅ Set view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// ✅ MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/chatbot")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo error", err));

// ✅ Serve static files if needed (e.g., CSS/JS)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Routes
app.get("/user/login", (req, res) => {
  return res.render("login");
});

app.use("/user", userRoute);

app.get("/", (req, res) => {
  res.render("home", {  username: req.session.user });
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
