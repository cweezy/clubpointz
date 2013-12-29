var util = require('./../../tasks/scraper/util');
var constants = require('./../../tasks/scraper/constants').constants;
var logger = require('./../../tasks/logger');


describe('Scraper utility function', function () {

  it('removes a race from team results', function (done) {
    var originalResults = [{
      'raceId' : 'raceId1',
      'resultData' : {}
    }, {
      'raceId' : 'raceId2',
      'resultData' : {
        'data1' : 12,
        'data2' : true
      }
    }, {
      'raceId' : 'raceId3',
      'resultData' : {}
    }];
    var expectedResults = [{
      'raceId' : 'raceId1',
      'resultData' : {}
    }, {
      'raceId' : 'raceId3',
      'resultData' : {}
    }];

    var actualResults = util.removeRaceFromTeamResults(originalResults, 'raceId2');
    assert.deepEqual(expectedResults, actualResults);
    done();
  }),

  it('determines if race is team champs', function (done) {
    var teamNames = ['A Normal Race', 'A Team Championships Race'];
    var expectedResults = [false, true];
    _.each(teamNames, function (name, i) {
      assert.equal(expectedResults[i], util.getIsTeamChamps(name));
    });
    done();
  }),

  it('gets team name matches', function (done) {
    var teamNames = ['N.Y. Fire Dept.', 'Greater Long Island'];
    var expectedMatches = [
      ['New York Fire Dept.', 'N.Y. Fire Dept', 'N.Y. Fire Dept.'],
      ['Greater Long Island RC', 'Greater Long Island']
    ];
    _.each(teamNames, function (name, i) {
      assert.deepEqual(expectedMatches[i], util.getNameMatches(name));
    });
    done();
  }),

  it('gets small format date', function (done) {
    var inputs = ['October 4, 2013', 'September 26', 'January 6, 1999'];
    var expectedOutputs = ['10/4', '9/26', '1/6'];
    _.each(inputs, function (input, i) {
      assert.equal(expectedOutputs[i], util.getSmallDate(input));
    });

    var invalidInput = 'NotAMonth 4';
    var loggerMock = sinon.mock(logger);
    var expectation = loggerMock.expects('warning').once().withArgs(
      'no month found for NotAMonth');
    util.getSmallDate(invalidInput);
    loggerMock.verify();

    done();
  }),

  it('gets small format distances', function (done) {
    var inputs = ['5 miles, 7 kilometers', '1 mile, 3 kilometers', '2 kilometers, 6 miles'];
    var expectedOutputs = [['5M', '7K'], ['1M', '3K'], ['2K', '6M']];
    _.each(inputs, function (input, i) {
      assert.deepEqual(expectedOutputs[i], util.getSmallDistances(input));
    });

    var invalidInputs = ['4 inch, 7 miles', '5 cat, 8 bear'];
    var loggerMock = sinon.mock(logger);
    var expectation = loggerMock.expects('warning').thrice();
    _.each(invalidInputs, function (input) {
      util.getSmallDistances(input);
    });
    loggerMock.verify();

    done();
  }),

  it('gets race URL', function (done) {
    var baseURL = constants.RACE_PAGE_BASE_URL;
    var raceId = 'b31124a';
    var year = '2013';
    var expectedURL = baseURL + '?result.id=b31124a&result.year=2013';
    assert.equal(expectedURL, util.getRaceURL(raceId, year));
    done();
  }),

  it('parses URL parameters', function (done) {
    var inputs = ['www.some-website.com?param1=yeah&param2=yeah',
                  'www.w.com?a=1&b=2&c=3&d=4'];
    var expectedOutputs = [ { 'param1' : 'yeah', 'param2' : 'yeah' },
                            { 'a' : '1', 'b' : '2', 'c' : '3', 'd' : '4' }];
    _.each(inputs, function (input, i) {
      assert.deepEqual(expectedOutputs[i], util.parseURLParams(input));
    });
    done();
  }),

  it('gets heading data', function (done) {
    var headings = ['<span>Test Heading</span>', '<span>Another One</span>', '<span>a 3rd COOL heading</span>'];
    var expectedKeys = ['test_heading', 'another_one', 'a_3rd_cool_heading'];

    var headingData = {};
    var result = util.getHeadingData(headings, headingData);
    assert.deepEqual(expectedKeys, result.resultKeys);

    headings = ['<span>1 MoRe HeADInG</span>'];
    result = util.getHeadingData(headings, headingData);

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
    var details = {
      'Mock Detail' : 'blah blah blah',
      '123 Detail' : '1234!',
      'Distance' : '3.1 miles, 5 kilometers',
      'Date/Time' : 'January 1, 2013'
    };
    var expectedResult = {
      '_id' : 'mock_id',
      'name' : 'Team Championships-Men',
      'teamResultCountMen' : 10,
      'teamResultCountWomen' : 0,
      'year' : '2013',
      'details' : details,
      'label' : '1/1 5K'
    };
    var clubPointsData = {
      men: {
        raceLabel: '1/1 5K',
        isClubPoints: true
      },
      women: {
        raceLabel: '1/1 5K',
        isClubPoints: false
      }
    };
    var actualResult = util.makeRaceData(
      'mock_id', 'Team Championships-Men', '2013', details,
      clubPointsData, false
    );
    assert.deepEqual(expectedResult, actualResult);
    done();
  }),

  it('checks if values are times', function (done) {
    var validValues = ['4:4', '05:02', '01:04:30', '0:4', '5:0'];
    var invalidValues = ['55', 'abc4', 'a:5', 'a', '4:$', '%$'];

    _.each(validValues, function (val) {
      assert(util.isTime(val));
    });
    _.each(invalidValues, function (val) {
      assert.equal(false, util.isTime(val));
    });
    done();
  }),

  it('converts times to seconds', function (done) {
    var times = ['01:04:30', '1:00', '1:00:00', '24:59:59'];
    var expectedSeconds = [3870, 60, 3600, 89999];
    _.each(times, function (time, i) {
      assert.equal(expectedSeconds[i], util.timeToSeconds(time));
    });
    done();
  });
});
