var nodemailer = require('nodemailer');
var _ = require('underscore');

var TEXT_SUFFIX = '\n\n\n\nMessage generated by CLUBPOINTZ';
var DEFAULT_SUBJECT = 'CLUBPOINTZ Alert';
var FROM_NAME = 'CLUBPOINTZ';


var AlertMailer = {

    init : function () {
       this.emailUser = this.getEnvVar('EMAIL_USER');
       this.emailPass = this.getEnvVar('EMAIL_PASS');
       this.recipients = JSON.parse(this.getEnvVar('RECIPIENTS'));
       this.from = FROM_NAME + '<' + this.emailUser + '>';
       this.pendingMessages = 0;

       return this;
    },

    getEnvVar : function (key) {
        if (process.env[key]) {
            return process.env[key];
        }
        console.log('WARNING: no environment variable ' + key);
    },

    getTransport : function () {
        return nodemailer.createTransport('SMTP', {
            auth : {
                user : this.emailUser,
                pass : this.emailPass
            }
        });
    },

    getMailOptions : function (user, subject, text) {
        return {
            from : this.from,
            to : user,
            subject : subject,
            text : text + TEXT_SUFFIX,
            html : ''
        };
    },

    sendMessages : function (mailOptions) {
        var transport = this.getTransport();
        _.each(mailOptions, function (options) {
            this.pendingMessages = this.pendingMessages + 1;
            var that = this;
            transport.sendMail(options, function (error, response) {
                if (error) {
                    console.log(error);
                }
                that.pendingMessages = that.pendingMessages - 1;
            });
        }, this);
    },

    mail : function (text, subject) {
        var subject = subject || DEFAULT_SUBJECT;
        var allMailOptions = [];

        _.each(this.recipients, function (user) {
            var mailOptions = this.getMailOptions(user, subject, text);
            allMailOptions.push(mailOptions);
        }, this);
        this.sendMessages(allMailOptions);
    },

    getPendingMessages : function () {
        return this.pendingMessages;
    }
};

exports.mailer = AlertMailer.init();
