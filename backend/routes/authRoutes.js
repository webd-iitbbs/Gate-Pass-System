const express = require("express");
const passport = require("passport");
const router = express.Router();
const { ensureAuth, ensureGuest } = require("../middleware/auth");

router.get("/", (req, res) => {
  res.render("main");
});

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

router.get(
  "/login/google",
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/user/profile-page",
    failureRedirect: "http://localhost:3000/",
  })
);

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("http://localhost:3000");
});
module.exports = router;
