var alertMailer = require('./alertMailer').mailer;
var lib = require('./lib').lib;


var logger = {

    WARNING_PREFIX : 'WARNING: ',

    init : function () {
        this.noMail = lib.getEnvVar('NO_MAIL');
        return this;
    },

    warning : function (message) {
        console.log(this.WARNING_PREFIX + message);
        if (!this.noMail) {
            alertMailer.send(this.WARNING_PREFIX + message);
        }
    }
};

exports.logger = logger.init();
