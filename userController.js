const User = require("./models");

async function handleUserSignup(req, res) {
  try {
    const { username, password } = req.body;
    await User.create({
      username,
      password,
    });
    // ✅ Save username to session
    req.session.user = username;
    return res.redirect("/");
  } catch (error) {
    console.log("===============", error);
  }
}

async function handleUserSignin(req, res) {
  try {
    console.log("++++++++++++++++++++++++++", req.body);
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    console.log(user);
    if (!user) {
      // return res.redirect("/user/signup");
      return res.render("signup", {
        error: "invalid username or password",
      });
    }

    // ✅ Save username to session
    req.session.user = user.username;
    return res.redirect("/");
  } catch (error) {
    console.log("==============", error);
  }
}

module.exports = {
  handleUserSignin,
  handleUserSignup,
};
