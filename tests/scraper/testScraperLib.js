var lib = require('./../../tasks/scraper/scraperLib').lib;
var assert = require('assert');
var _ = require('underscore');


describe('ScraperLib', function () {

    it('checks if values are times', function (done) {
        var validValues = ['4:4', '05:02', '01:04:30', ':4', '5:'];
        var invalidValues = ['abc4', 'a:5', 'a', '4:$', '%$'];

        _.each(validValues, function (val) {
            assert(lib.isTime(val));
        });
        _.each(invalidValues, function (val) {
            assert.equal(false, lib.isTime(val));
        });
        done();
    }),

    it('converts times to seconds', function (done) {
        var times = ['01:04:30', '1:00', '1:00:00', '24:59:59'];
        var expectedSeconds = [3870, 60, 3600, 89999];
        _.each(times, function (time, i) {
            assert.equal(expectedSeconds[i], lib.timeToSeconds(time));
        });
        done();
    });
});
