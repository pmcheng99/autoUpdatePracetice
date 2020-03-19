var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require(path.join(__dirname, 'routes/index'));
var usersRouter = require(path.join(__dirname, 'routes/users'));
var statusRouter = require(path.join(__dirname, 'routes/checkStatus'));

//文件上傳router
var docUploadRouter = require(path.join(__dirname, 'routes/docUpload'));

var app = express();
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// static content. images, css etc...
app.use(express.static(path.join(__dirname, 'public')));

//router, handle url path
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/docUpload', docUploadRouter);
app.use('/status', statusRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
