const express = require("express");
const router= express.Router();
const {handleUserSignin,handleUserSignup}= require("./userController")

router.post('/login',handleUserSignin);
router.post('/signup',handleUserSignup);

module.exports = router;