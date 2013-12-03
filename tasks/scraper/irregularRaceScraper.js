var parse_b31103 = require('./b31103_scraper').parseData; 
var alertMailer = require('./../alertMailer').mailer;

parseData = function (race, callback) {
    switch (race.id) {
        case 'b31103':
            return parse_b31103(callback);
            break;
        default:
            var warning = 'WARNING: no scraper file for race ' + race.id;
            console.log(warning);
            alertMailer.mail(warning);
            callback();
    }
};

exports.parseData = parseData;
