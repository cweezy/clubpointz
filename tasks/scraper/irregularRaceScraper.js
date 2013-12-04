var parse_b31103 = require('./b31103_scraper').parseData; 
var logger = require('./../logger').logger;

parseData = function (race, callback) {
    switch (race.id) {
        case 'b31103':
            return parse_b31103(callback);
            break;
        default:
            logger.warning('no scraper file for race ' + race.id);
            callback();
    }
};

exports.parseData = parseData;
