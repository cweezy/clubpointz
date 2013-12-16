var parse_b31103 = require('./b31103_scraper').parseData; 
var constants = require('./constants').constants;
var logger = require('./../logger');
var _ = require('underscore');

exports.parseData = function (race, callback) {
    switch (race.id) {
        case 'b31103':
            return parse_b31103(callback);
            break;
        default:
            if (!_.contains(constants.IRREGULAR_RACES_IGNORE, race.id)) {
              logger.warning('no scraper file for race ' + race.id);
            }
            callback();
    }
};
