module.exports = {
  ensureAuth: (req, res, next) => {
    if (req.isAuthenticated()) return next();
    else res.redirect("http://localhost:3000/");
  },
  ensureGuest: (req, res, next) => {
    if (req.isAuthenticated()) res.redirect("http://localhost:3000/user/profile-page");
    else return next();
  },
  isAdmin: (req, res, next) => {
    if (req.session.isAdmin) return next();
    else res.redirect("http://localhost:3000/");
  },
  notAdmin: (req, res, next) => {
    // if (req.session.isAdmin) res.redirect("/request/admin");
    // else return next();
    next();
  },
};
