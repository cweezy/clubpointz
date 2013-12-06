var utils = require('./../../tasks/scraper/utils');
var assert = require('assert');
var _ = require('underscore');


describe('Scraper utility function', function () {

    it('gets heading data', function (done) {
        var headings = ['<span>Test Heading</span>', '<span>Another One</span>', '<span>a 3rd COOL heading</span>'];
        var expectedKeys = ['test_heading', 'another_one', 'a_3rd_cool_heading'];

        var headingData = {};
        var result = utils.getHeadingData(headings, headingData);
        assert.deepEqual(expectedKeys, result.resultKeys);

        headings = ['<span>1 MoRe HeADInG</span>'];
        result = utils.getHeadingData(headings, headingData);

        var expectedHeadingData = {
            'test_heading' : { 'text' : 'Test Heading', '_id' : 'test_heading'  },
            'another_one' : { 'text' : 'Another One', '_id' : 'another_one'  },
            'a_3rd_cool_heading' : { 'text' : 'a 3rd COOL heading', '_id' : 'a_3rd_cool_heading'  },
            '1_more_heading' : { 'text' : '1 MoRe HeADInG', '_id' : '1_more_heading'  }
        };

        assert.deepEqual(expectedHeadingData, result.headingData);
        done();
    }),

    it('makes race data', function (done) {
        var expectedResult = {
            '_id' : 'mock_id',
            'name' : 'A Race!',
            'isClubPointsMen' : false,
            'isClubPointsWomen' : true,
            'year' : '2013',
            'details' : {
                'Mock Detail' : 'blah blah blah',
                '123 Detail' : '1234!'
            },
            'isTeamChamps' : false
        };
        assert.deepEqual(expectedResult, utils.makeRaceData(
            'mock_id', 'A Race!', '2013', { 'Mock Detail' : 'blah blah blah', '123 Detail' : '1234!'},
            [false, true], false)
        );
        done();
    }),

    it('checks if values are times', function (done) {
        var validValues = ['4:4', '05:02', '01:04:30', '0:4', '5:0'];
        var invalidValues = ['55', 'abc4', 'a:5', 'a', '4:$', '%$'];

        _.each(validValues, function (val) {
            assert(utils.isTime(val));
        });
        _.each(invalidValues, function (val) {
            assert.equal(false, utils.isTime(val));
        });
        done();
    }),

    it('converts times to seconds', function (done) {
        var times = ['01:04:30', '1:00', '1:00:00', '24:59:59'];
        var expectedSeconds = [3870, 60, 3600, 89999];
        _.each(times, function (time, i) {
            assert.equal(expectedSeconds[i], utils.timeToSeconds(time));
        });
        done();
    });
});
