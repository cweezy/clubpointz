var alertMailer = require('./alertMailer').mailer;


var logger = {

    WARNING_PREFIX : 'WARNING: ',

    warning : function (message) {
        console.log(this.WARNING_PREFIX + message);
        alertMailer.send(this.WARNING_PREFIX + message);
    }
};

exports.logger = logger;
