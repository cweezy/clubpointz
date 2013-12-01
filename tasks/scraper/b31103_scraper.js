var Browser = require('zombie');
var assert = require('assert');
var $ = require('jquery');
var _ = require('underscore');
var constants = require('./constants').constants;
var getHeadingData = require('./lib').getHeadingData;
var parseResultsPage = require('./lib').parseResultsPage;


var MARATHON_RESULT_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/nyrrc/monitor/pages/postrace/postracestartup.html';
var EXPECTED_RESULT_PAGE_TITLE = 'ING New York City Marathon';
var RACE_ID = 'b31103';
var RACE_NAME = '2013 ING New York City Marathon';

var resultKeys;
var headingData;

var adjustHeadingData = function (data) {
    var originalField = 'state_country';
    var newFields = ['state', 'country'];

    delete data.headingData[originalField];
    _.each(newFields, function (key) {
        data.headingData[key] = {};
        data.headingData[key][constants.DATA_KEYS.HEADING.TEXT] = key.charAt(0).toUpperCase() + key.slice(1);
        data.headingData[key][constants.DATA_KEYS.ID] = key;
        data.headingData[key][constants.DATA_KEYS.DB_ID] = key;
    });
    var resultKeys = data.resultKeys;
    var i = resultKeys.indexOf(originalField);
    data.resultKeys = resultKeys.slice(0, i).concat(newFields).concat(resultKeys.slice(i));
    return data;
};

var parseTeamResults = function (browser, data, callback) {
    if (_.isUndefined(headingData)) {
        var row = $(browser.html()).find('tr[bgcolor="#E0E0E0"] td');
        var headingData =  adjustHeadingData(getHeadingData(row, {}));
        resultKeys = headingData.resultKeys;
        headingData = headingData.headingData;
    }
    var rowSelector = 'tr[bgcolor="#EEEEEE"]';
    var results = parseResultsPage(browser, {id : RACE_ID, name : RACE_NAME}, resultKeys, rowSelector, 200, 100);
    var team = results[0].team;
    console.log('Parsed team results for ' + team);

    data.results = data.results.concat(results);
    callback();
};

var parseData = function (callback) {
    var browser = new Browser();
    browser.runScripts = false;
    browser.loadCSS = false;

    browser.visit(MARATHON_RESULT_URL, function () {
        assert.equal(EXPECTED_RESULT_PAGE_TITLE, browser.text('title'));
        var dropdown = $(browser.html()).find('option:contains(Team)').parent();
        var teamOptions = $(dropdown).find('option');

        // Remove 'Team' and unattached
        teamOptions.splice(0, 2);
      
        var data = {};
        data.results = [];
        var visitTeamPage = function (i) {
            if (i < 4 && teamOptions[i]) {
                browser.visit(MARATHON_RESULT_URL, function () {
                    var pageBody = browser.html();
                    var dropdown = browser.queryAll('select[name="ft"]')[2];
                    browser.select(dropdown, $(teamOptions[i]).text());
                    browser.pressButton('input[type="submit"]');
                    browser.wait(function () {
                        pageBody = browser.html();
                        parseTeamResults(browser, data, function () {
                            visitTeamPage(i+1);
                        });
                    });
                });
            } else {
                callback(data);
            };
        };
        visitTeamPage(0);
    });
};

exports.parseData = parseData;
