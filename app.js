const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const indexRouter = require('./server/router/index');
const app = express();
const mongoose = require('mongoose');
const authRouter = require('./server/middleware/oauth');
const passport = require('passport');

app.use(passport.initialize());
passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});
app.get('/', (req, res) => {
  res.render('auth');
});

app.use('/auth/google', authRouter);

mongoose.connect(process.env.MONGODB_CONNECTION_URL)
  .then(() => console.log('Connected!'))
  .catch((err) => {
    console.log(err.message);
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set layout for "/login" route
app.use('/loginpage/', (req, res, next) => {
  app.set('layout', 'layout/login');
  next();
});

app.use('/forgotpassword/', (req, res, next) => {
  app.set('layout', 'layout/emailsend');
  next();
});
app.use('/email-send/', (req, res, next) => {
  app.set('layout', 'layout/emailsend');
  next();
});
app.use('/2fa/', (req, res, next) => {
  app.set('layout', 'layout/2fa');
  next();
});

app.use('/changepassword', (req, res, next) => {
  app.set('layout', 'layout/changepassword');
  next();
});
app.use('/resetpassword', (req, res, next) => {
  app.set('layout', 'layout/changepassword');
  next();
});

// Set layout for "/home" route
app.use(expressLayouts);
app.use('/home/', (req, res, next) => {
  app.set('layout', 'layout/main');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
