const { check, validationResult } = require("express-validator");
const customer = require("../model/customer");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { default: axios } = require("axios");
require('dotenv').config();
const twilio = require('twilio');

exports.loginpage = async function (req, res, next) {
  const error = req.session.error || req.query.error;
  req.session.error = null;
  req.session.user = {
    username: "divyesh",
  };
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.render("layout/login", { error });
  });
};

exports.login = async function (req, res, next) {
  const login = await customer.findOne({
    email: req.body.email,
    password: req.body.password,
  });

  const otp = Math.floor(1000 + Math.random() * 9000);
  // const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
  // client.messages
  //   .create({
  //     body: `Your OTP is: ${otp}`,
  //     from: process.env.TWILIO_PHONE_NUMBER,
  //     to: process.env.PERSONAL_PHONE_NUMBER || `+91${login?.phoneno}`,
  //   })
  //   .then((message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: login.email,
    subject: "Password Reset OTP",
    text: `Your OTP for two factor authencation is: ${otp}`,
  };
  transporter.sendMail(mailOptions, function (error) {
    if (error) {
      console.log(error);
    } else {

      console.log(otp);
      if (login) {
        req.session.user = {
          username: "divyesh",
          login,
          otp: otp
        };
        res.redirect("/2fa");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          secure: true,
          auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASSWORD,
          },
        });
        const mailOptions = {
          from: process.env.NODEMAILER_EMAIL,
          to: login?.email,
          subject: "Login Successfully",
          text: `Congratulations! You have successfully logged in to your account.\n\nand Enter Two factor authcation .\n\nWelcome back, ${login.firstname} ${login.lastname}!`,

        };
        transporter.sendMail(mailOptions, function (error) {
          if (error) {
            console.log(error);
          } else {
          }
        });
      } else {
        res.render("layout/login", { error: "Invalid email or password." });
      }
    }
  });
  // .catch((error) => {
  //   console.error('Error sending OTP:', error);
  // });


};

exports.homepage = async function (req, res, next) {
  let perPage = parseInt(req.query.perpage) || 5;
  let page = parseInt(req.query.page) || 1;
  let sort = req.query.sort || "asc";
  let sortByField = req.query.sortby;
  let searchterm = req.query.searchterm || "";
  const firstname = req.session.user.firstname;
  const lastname = req.session.user.lastname;
  const error = req.session.error;
  req.session.error = null;
  try {
    const sortDirection = sort === "asc" ? 1 : -1;

    let query = {};
    if (searchterm) {
      query.$or = [
        { firstname: { $regex: searchterm, $options: "i" } },
        { lastname: { $regex: searchterm, $options: "i" } },
        { email: { $regex: searchterm, $options: "i" } },
        { role: { $regex: searchterm, $options: "i" } },
        { status: { $regex: searchterm, $options: "i" } },
      ];
    }
    const count = await customer.countDocuments(query);
    const pages = Math.ceil(count / perPage);
    page = page > pages ? pages : page;

    const customers = await customer
      .aggregate([
        { $match: query },
        { $sort: { [sortByField]: sortDirection } },
      ])
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    res.render("customer/index", {
      customers,
      current: page,
      pages,
      sort,
      sortby: sortByField,
      perpage: perPage,
      searchterm,
      firstname: firstname,
      lastname: lastname,
      error, user: req.session.user
    });
  } catch (error) {
    console.log(error);
  }
};

exports.addcustomer = async function (req, res, next) {
  res.render("customer/adds");
};

exports.postcustomer = async function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const alert = errors.array();
    res.render("customer/adds", { alert });
  } else {
    try {
      const token = jwt.sign({ foo: "bar" }, "shhhhh");
      req.body.token = token;
      const firstName =
        req.body.fname.charAt(0).toUpperCase() + req.body.fname.slice(1);
      const lastName =
        req.body.lname.charAt(0).toUpperCase() + req.body.lname.slice(1);

      const newcustomer = new customer({
        firstname: firstName,
        lastname: lastName,
        email: req.body.email,
        role: req.body.role,
        phoneno: req.body.phoneno,
        status: req.body.status,
        password: req.body.password,
        confirmpassword: req.body.confirmpassword,
        token: token,

      });
      await customer.create(newcustomer);
      res.redirect("/home");
    } catch (error) {
      console.log(error);
    }
  }
};

exports.view = async function (req, res, next) {
  try {
    const customers = await customer.findOne({ _id: req.params.id });
    res.render("customer/views", { customers });
  } catch (error) {
    console.log(error);
  }
};

exports.edit = async function (req, res, next) {
  try {
    const customers = await customer.findOne({ _id: req.params.id });
    res.render("customer/edits", { customers });
  } catch (error) {
    console.log(error);
  }
};

exports.editpost = async function (req, res, next) {
  try {
    await customer.findByIdAndUpdate(req.params.id, {
      firstname: req.body.fname,
      lastname: req.body.lname,
      email: req.body.email,
      role: req.body.role,
      phoneno: req.body.phoneno,
      status: req.body.status,
      password: req.body.password,
      confirmpassword: req.body.confirmpassword,
    });
    res.redirect("/home");
  } catch (error) {
    console.log(error);
  }
};

exports.delete = async function (req, res, next) {
  try {
    await customer.findByIdAndDelete(req.params.id);
    res.redirect("/home");
  } catch (error) {
    console.log(error);
  }
};

exports.staff = async function (req, res, next) {
  let perpage = parseInt(req.query.perpages) || 10;
  let page = req.query.page || 1;
  let sort = req.query.sort || "asc";
  let sortby = req.query.sortby;
  req.session.user = {
    username: "divyesh",
  };

  if (req.query.perpage) {
    perpage = parseInt(req.query.perpage);
  }
  try {
    const sortDirection = sort === "asc" ? 1 : -1;
    let sortByField;
    switch (sortby) {
      case "firstname":
        sortByField = "firstname";
        break;
      case "lastname":
        sortByField = "lastname";
        break;
      case "email":
        sortByField = "email";
        break;
      case "role":
        sortByField = "role";
        break;
      case "createdon":
        sortByField = "createdAt";
        break;
      case "status":
        sortByField = "status";
        break;
    }

    let query = {};

    const customers = await customer
      .aggregate([
        { $match: query },
        { $sort: { [sortByField]: sortDirection } },
      ])
      .skip(perpage * page - perpage)
      .limit(perpage)
      .exec();
    const count = await customer.countDocuments(query);
    res.render("customer/staff", {
      customers,
      current: page,
      pages: Math.ceil(count / perpage),
      sort,
      sortby,
      perpage,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.profile = async function (req, res, next) {
  try {
    const userId = req.session.user.id;
    const customers = await customer.findById(userId);
    res.render("customer/Profile", { customers });
  } catch (error) {
    console.log(error);
  }
};

exports.profilereset = async function (req, res, next) {
  const firstname = req.session.user.firstname;
  const lastname = req.session.user.lastname;
  res.render("customer/resetpass", { error: null, firstname, lastname });
};

exports.profileresetpassword = async function (req, res, next) {
  try {
    const firstname = req.session.user.firstname;
    const lastname = req.session.user.lastname;
    const { oldpassword, newpassword, connewpassword } = req.body;

    if (oldpassword !== req.session.user.password) {
      return res.render("customer/resetpass", {
        error: "Invalid old password",
        firstname,
        lastname,
      });
    }
    if (newpassword !== connewpassword) {
      return res.render("customer/resetpass", {
        error: "New password and confirm password do not match",
        firstname,
        lastname,
      });
    }

    if (oldpassword === newpassword && newpassword === connewpassword) {
      return res.render("customer/resetpass", {
        error:
          "Old password, new password, and confirm password cannot be the same",
        firstname,
        lastname,
      });
    }

    const userId = req.session.user.id;
    await customer.findByIdAndUpdate(userId, {
      password: newpassword,
      confirmpassword: connewpassword,
    });

    req.session.user.password = newpassword;
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
};

exports.forgotpassowrd = async function (req, res, next) {
  req.session.user = {
    username: "divyesh"
  };
  res.render("layout/emailsend", { error: null, dataSiteKey: process.env.RECAPTCHA_SITE_KEY });
};

exports.emailsend = async function (req, res, next) {
  req.session.user = {
    username: "divyesh"
  };

  try {
    let data = await customer.findOne({ email: req.body.email });
    if (data) {
      let otp = Math.floor(Math.random() * 10000 + 1);
      let email = data.email;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASSWORD,
        },
      });
      const mailOptions = {
        from: process.env.NODEMAILER_EMAIL,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}`,
      };
      transporter.sendMail(mailOptions, function (error) {
        if (error) {
          console.log(error);
        } else {
          res.redirect("/changepassword?email=" + email + "&otp=" + otp);
        }
      });
    } else {
      res.render("layout/emailsend", { error: "Invalid email ." });
    }
  } catch (error) {
    console.log(error);
  }
};
exports.faPage = async function (req, res, next) {
  try {
    const email = req?.session?.user?.login?.email
    res.render("layout/2fa", { error: null, email, dataSiteKey: process.env.RECAPTCHA_SITE_KEY });
  } catch (error) {
    console.log(error);
  }
};
exports.fa = async function (req, res, next) {
  try {
    const login = req?.session?.user?.login
    const responseKey = req.body["g-recaptcha-response"];
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${responseKey}`;

    const { data } = await axios.post(verificationUrl);
    if (data.success) {
      if (parseInt(req?.session?.user?.otp) === parseInt(req?.body?.otp)) {
        if (login.role == "Management") {
          req.session.user = {
            id: login._id,
            email: login.email,
            password: login.password,
            username: "divyesh",
            firstname: login.firstname,
            lastname: login.lastname,
            token: login.token,
          };
          res.redirect("/home");
        } else if (login.role == "Staff") {
          if (login.status == "Active") {
            req.session.user = {
              username: "divyesh",
            };
            res.redirect("/staff");
          } else if (login.status == "Inactive") {
            res.render("layout/login", {
              error:
                "Your account has been blocked by the administrator. Please contact support.",
            });
          }
        }
      } else {
        res.render("layout/2fa", { error: 'OTP WAS WRONG... TRY LOGIN AGAIN', email: login?.email, dataSiteKey: process.env.RECAPTCHA_SITE_KEY });
      }
    } else {
      res.render("layout/2fa", { error: 'Enter reCAPTCHA verification.', email: login?.email, dataSiteKey: process.env.RECAPTCHA_SITE_KEY });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.changepassword = async function (req, res, next) {

  req.session.user = {
    username: "divyesh"
  };
  try {
    const { email, otp, error } = req.query;

    res.render("layout/changepassword.ejs", {
      email: email,
      otp: otp,
      error: error,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.resetpassword = async function (req, res, next) {
  req.session.user = {
    username: "divyesh"
  };

  try {
    const otp = req.body.otp;
    const otps = req.query.otp;
    const newPassword = req.body.newPassword;
    const newConPassword = req.body.newconPassword;

    if (parseInt(otp) !== parseInt(otps)) {
      let email = req.query.email;
      let invalidOtp = req.query.otp,
        error = "Invalid OTP";

      res.redirect("/changepassword?email=" + email + "&otp=" + invalidOtp + "&error=" + error);
      return;
    }

    if (newPassword !== newConPassword) {
      let email = req.query.email;
      let invalidOtp = req.query.otp,
        error = "Passwords do not match";
      res.redirect("/changepassword?email=" + email + "&otp=" + invalidOtp + "&error=" + error);
      return;
    }

    const email = req.query.email;
    const user = await customer.findOne({ email: email });

    if (!user) {
      return;
    }

    user.password = newPassword;
    user.confirmpassword = newPassword;
    await user.save();

    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/loginpage");
    });
  } catch (error) {
    console.log(error);
  }
};

exports.logout = async function (req, res, next) {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/loginpage");
  });
};
