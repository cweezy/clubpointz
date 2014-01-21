var mailer = require('./../../tasks/alertMailer').mailer;
var logger = require('./../../tasks/logger');

TIMEOUT = 10;
EMAIL_SUBJECT = 'ClubPointz Feedback';
  
getEmailText = function (email, name, message) {
  var text = 'Email: ' + email;
  text += '\nName: ' + name;
  text += '\n\nMessage:\n' + message;
  return text;
};

waitForMessage = function (callback) {
  var count = 0;
  var checkMessages = function () {
    var pendingMessages = mailer.getPendingMessages();
    if (pendingMessages === 0) {
      clearInterval(checkInterval); 
      callback({'status' : 'success', 'waitTime' : count});
    }
    count += 1;
    if (count >= TIMEOUT) {
      clearInterval(checkInterval)
      callback({'status' : 'timeout'});
    }
  };
  var checkInterval = setInterval(checkMessages, 1000);
};

module.exports = {

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to MailController)
   */
  _config: {},

  send: function (req, res) {
    var options = {
      text: getEmailText(req.param('email'),
                         req.param('name'),
                         req.param('message')),
      subject: EMAIL_SUBJECT
    };
    mailer.sendFeedback(options);
    waitForMessage(function (response) {
      if (response.status === 'success') {
        logger.info('Sent feedback in ' + response.waitTime + ' seconds');
        res.send(true);
      } else if (response.status === 'timeout') {
        logger.error('Timed out sending feedback');
        res.send(false);
      }
    });
  }
};
