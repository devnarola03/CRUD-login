const customercontroller = require("../controller/Customer_Contoller");
var express = require("express");
var router = express.Router();
var bodyparser = require("body-parser");
const urlencoded = bodyparser.urlencoded({ extended: false });
const { check, validationResult } = require("express-validator");
const session = require("express-session");
var jwt = require("jsonwebtoken");
const { token } = require("morgan");

router.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

function requireLogin(req, res, next) {
  if (req.path === "/loginpage") {
    if (req.session || req.session.user) {
      res.redirect("/home");
    } else {
      next();
    }
  } else if (req.session && req.session.user) {
    next();
  } else {
    req.session.error = "Please login to access this page.";
    res.redirect("/loginpage");
  }
}

function requireLogout(req, res, next) {

  if ((req.path === "/forgotpassword" || req.path === "/loginpage" || req.path === "/login" || req.path === "/resetpassword" || req.path === "/changepassword") && req.session.user) {
    req.session.error = "You are already logged in.";
    res.redirect("/home");
  } else {
    next();
  }
}

function webtoken(req, res, next) {
  console.log(req.session.user.token);
  const token = req.session.user.token;
  const decodedToken = jwt.verify(token, "shhhhh");
  console.log(decodedToken);
  next();
}

router.get("/forgotpassword", requireLogout, customercontroller.forgotpassowrd);
router.post("/email-send", requireLogout, customercontroller.emailsend);
router.get("/2fa", requireLogout, customercontroller.faPage);
router.post("/verify", requireLogout, customercontroller.fa);
router.post("/resendotp", requireLogout, customercontroller.resendotps);
router.get("/changepassword", customercontroller.changepassword);
router.post("/resetpassword", customercontroller.resetpassword);
router.get("/loginpage", requireLogout, customercontroller.loginpage);
router.post("/login", customercontroller.login);
router.get("/home", requireLogin, webtoken, customercontroller.homepage);
router.get("/add", requireLogin, customercontroller.addcustomer);

router.post(
  "/add",
  requireLogin,
  urlencoded,
  [
    check("password", "This password must be 6+ characters long")
      .exists()
      .isLength({ min: 6 }),
    check("fname", "Enter First Name").exists().isLength({ min: 1 }),
    check("lname", "Enter Last Name").exists().isLength({ min: 1 }),
    check("email", "Email is not valid").isEmail(),
    check("role", "Role is not valid").exists(),
    check("phoneno", "phone no is not valid(10 digit)").exists().isLength({ max: 10 }),
    check("status", "Enter Status").exists(),
    check("confirmpassword", "Passwords must be the same")
      .trim()
      .isLength({ min: 6 })
      .custom(async (confirmpassword, { req }) => {
        const password = req.body.password;
        if (password !== confirmpassword) {
          throw new Error("Passwords must be the same");
        }
      }),
  ],
  customercontroller.postcustomer
);
router.get("/view/:id", requireLogin, webtoken, customercontroller.view);
router.get("/edit/:id", requireLogin, webtoken, customercontroller.edit);
router.post("/edit/:id", requireLogin, webtoken, customercontroller.editpost);
router.post("/delete/:id", requireLogin, webtoken, customercontroller.delete);
router.get("/profile", requireLogin, webtoken, customercontroller.profile);
router.get(
  "/profilereset",
  requireLogin,
  webtoken,
  customercontroller.profilereset
);
router.post(
  "/profileresetpassword",
  requireLogin,
  webtoken,
  customercontroller.profileresetpassword
);
router.get("/logout", customercontroller.logout);
router.get("/errorpage", customercontroller.errorpage);
module.exports = router;
