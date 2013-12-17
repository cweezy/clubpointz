var alertMailer = require('./alertMailer').mailer;
var util = require('./util');
var _ = require('underscore');

var WARNING_PREFIX = 'WARNING: ';
var ERROR_PREFIX = 'ERROR: ';

var noMail = util.getEnvVar('NO_MAIL');


exports.warning = function (message) {
  console.log(WARNING_PREFIX + message);
  if (!noMail) {
    alertMailer.send({text : WARNING_PREFIX + message});
  }
};

exports.error = function (message) {
  console.log(message);
  if (!noMail) {
    alertMailer.send({text : ERROR_PREFIX + message});
  }
};

exports.info = function (message) {
  console.log('\n' + message);
};

exports.infoGroup = function (message, isFirst) {
  if (_.isUndefined(isFirst)) isFirst = false;
  console.log((isFirst ? '\n' : '') + message);
};
