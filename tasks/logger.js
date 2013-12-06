var alertMailer = require('./alertMailer').mailer;
var utils = require('./utils').utils;


var logger = {

    WARNING_PREFIX : 'WARNING: ',

    init : function () {
        this.noMail = utils.getEnvVar('NO_MAIL');
        return this;
    },

    warning : function (message) {
        console.log(this.WARNING_PREFIX + message);
        if (!this.noMail) {
            alertMailer.send(this.WARNING_PREFIX + message);
        }
    },

    info : function (message) {
        console.log('\n' + message);
    },

    infoGroup : function (isFirst, message) {
        console.log((isFirst ? '\n' : '') + message);
    }
};

exports.logger = logger.init();
