var parse_b31103 = require('./b31103_scraper').parseData; 

parseData = function (race, callback) {
    switch (race.id) {
        case 'b31103':
            return parse_b31103(callback);
            break;
        default:
            console.log('WARNING: no scraper file for race ' + race.id);
    }
};

exports.parseData = parseData;
