var alertMailer = require('./alertMailer').mailer;
var util = require('./util');
var _ = require('underscore');

var WARNING_PREFIX = 'WARNING: ';
var ERROR_PREFIX = 'ERROR: ';

var noMail = util.getEnvVar('NO_MAIL');
var reportMessages = [];

var report = function (message, readyToSend) {
  if (_.isUndefined(readyToSend)) readyToSend = false;
  if (readyToSend && !noMail) {
    // last report message is used as email subject
    alertMailer.send(reportMessages.join('\n'), message);
  } else {
    reportMessages.push(message);
  }
};

exports.warning = function (message) {
  console.log(WARNING_PREFIX + message);
  if (!noMail) {
    alertMailer.send(WARNING_PREFIX + message);
  }
};

exports.error = function (message) {
  console.log(message);
  if (!noMail) {
    alertMailer.send(ERROR_PREFIX + message);
  }
};

exports.info = function (message) {
  console.log('\n' + message);
};

exports.infoGroup = function (isFirst, message) {
  console.log((isFirst ? '\n' : '') + message);
};

exports.report = report;

exports.reportOut = function (message, readyToSend) {
  // report message and print to console
  report(message, readyToSend);
  console.log('\n' + message);
};

exports.reportOutGroup = function (message, readyToSend, isFirst) {
  if (_.isUndefined(isFirst)) isFirst = false;
  message = (isFirst ? '\n' : '') + message;
  report(message, readyToSend);
  console.log(message);
};
