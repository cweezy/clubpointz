var Browser = require('zombie');
var assert = require('assert');
var $ = require('jquery');
var _ = require('underscore');
var constants = require('./constants').constants;
var lib = require('./lib').lib;


var MARATHON_RESULT_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/nyrrc/monitor/pages/postrace/postracestartup.html';
var EXPECTED_RESULT_PAGE_TITLE = 'ING New York City Marathon';
var RACE_ID = 'b31103';
var RACE_NAME = '2013 ING New York City Marathon';
var RACE_DATE = 'November 3, 2013';
var RACE_YEAR = '2013';
var RACE_DISTANCE = '26.2 miles, 42.16 kilometers';


var getRaceDetails = function () {
    return {
        'Distance' : RACE_DISTANCE,
        'Date/Time' : RACE_DATE
    };
};

var adjustHeadingData = function (data) {
    var originalField = 'state_country';
    var newFields = ['state', 'country'];

    delete data.headingData[originalField];
    _.each(newFields, function (key) {
        data.headingData[key] = {};
        data.headingData[key][constants.DATA_KEYS.HEADING.TEXT] = key.charAt(0).toUpperCase() + key.slice(1);
        data.headingData[key][constants.DATA_KEYS.DB_ID] = key;
    });
    var resultKeys = data.resultKeys;
    var i = resultKeys.indexOf(originalField);
    data.resultKeys = resultKeys.slice(0, i).concat(newFields).concat(resultKeys.slice(i+1));
    return data;
};

var parseTeamResults = function (browser, headingData, callback) {
    if (_.isEmpty(headingData)) { 
        var row = $(browser.html()).find('tr[bgcolor="#E0E0E0"] td');
        var data =  adjustHeadingData(lib.getHeadingData(row, {}));
        resultKeys = data.resultKeys;
        headingData = data.headingData;
    }
    var rowSelector = 'tr[bgcolor="#EEEEEE"]';
    var saveResults = function (results) {
        var team = results[0].team;
        console.log('Parsed team results for ' + team);
        callback(results, headingData);
    };

    lib.parseResults(browser, {id : RACE_ID, name : RACE_NAME}, resultKeys, rowSelector, 200, 100, saveResults);
};

var getTeamDropdown = function (browser) {
    return browser.queryAll('select[name="ft"]')[2];
};

var parseData = function (callback) {
    var browser = new Browser();
    browser.runScripts = false;
    browser.loadCSS = false;

    browser.visit(MARATHON_RESULT_URL, function () {
        assert.equal(EXPECTED_RESULT_PAGE_TITLE, browser.text('title'));
        var teamOptions = $(getTeamDropdown(browser)).find('option');

        // Remove 'Team' and unattached
        teamOptions.splice(0, 2);
      
        var data = {};
        data.headingData = {};
        data.results = [];
        data.raceData = lib.makeRaceData(RACE_ID, RACE_NAME, RACE_YEAR, getRaceDetails(), [true, true]);

        var visitTeamPage = function (i) {
            if (teamOptions[i]) {
                browser.visit(MARATHON_RESULT_URL, function () {
                    var dropdown = getTeamDropdown(browser);
                    browser.select(dropdown, $(teamOptions[i]).text());
                    browser.pressButton('input[type="submit"]');
                    browser.wait(function () {
                        parseTeamResults(browser, data.headingData, function (results, headingData) {
                            data.results = data.results.concat(results);
                            data.headingData = _.extend(data.headingData, headingData);
                            visitTeamPage(i+1);
                        });
                    });
                });
            } else {
                callback(data);
            }
        };
        visitTeamPage(0);
    });
};

exports.parseData = parseData;
