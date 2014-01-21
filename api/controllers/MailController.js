var mailer = require('./../../tasks/alertMailer').mailer;

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
      callback(count);
    }
    count += 1;
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
    waitForMessage(function (waitTime) {
      res.send({waitTime : waitTime});
    });
  }
};
