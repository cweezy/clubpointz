var Browser = require('zombie');
var assert = require('assert');
var $ = require('jquery');
var _ = require('underscore');
var constants = require('./constants').constants;
var util = require('./util');
var logger = require('./../logger');
var scrapeReporter = require('./scrapeReporter');


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
    // Original field data; replaceCount is the number of fields that will replace the original
    var originalFields = [{key : 'state_country', replaceCount : 2}, {key : 'age', replaceCount : 1},
                          {key : 'bib_no', replaceCount : 1}, {key : 'finish_time', replaceCount : 1}];
    var newFields = {'state' : {text : 'State'}, 'country' : {text : 'Country'}, 'sex_age' : {text : 'Sex/Age'},
                     'bib' : {text : 'Bib'}, 'net_time' : {text : 'Net Time'}};

    newFields = _.map(newFields, function (field, key) {
        var data = {};
        data[constants.DATA_KEYS.HEADING.TEXT] = field.text;
        data[constants.DATA_KEYS.DB_ID] = key;
        return data;
    });

    var i = 0;
    _.each(originalFields, function (field) {
        delete data.headingData[field.key];
        var replacementFields = [];
        for (var j = 0; j < field.replaceCount; j++) {
            var newId = newFields[i+j][constants.DATA_KEYS.DB_ID];
            replacementFields.push(newId);
            data.headingData[newId] = newFields[i+j];
        }
        var resultKeys = data.resultKeys;
        var k = resultKeys.indexOf(field.key);
        data.resultKeys = resultKeys.slice(0, k).concat(replacementFields).concat(resultKeys.slice(k+1)); 
        i = i + field.replaceCount;
    });

    return data;
};

var parseTeamResults = function (browser, teamData, headingData, isFirstTeam, callback) {
    if (_.isEmpty(headingData)) { 
        var row = $(browser.html()).find('tr[bgcolor="#E0E0E0"] td');
        var data =  adjustHeadingData(util.getHeadingData(row, {}));
        resultKeys = data.resultKeys;
        headingData = data.headingData;
    }
    var rowSelector = 'tr[bgcolor="#EEEEEE"]';
    var saveResults = function (results, teamResults) {
        var team = _.values(results)[0].team;
        logger.infoGroup('Parsed team results for ' + team);
        callback(results, teamResults, headingData);
    };

    var raceInfo = {};
    raceInfo[constants.DATA_KEYS.DB_ID] = RACE_ID;
    raceInfo[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_MEN] = constants.TEAM_RESULT_COUNT.MARATHON;
    raceInfo[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_WOMEN] = constants.TEAM_RESULT_COUNT.MARATHON;

    // We only want to report the race name on first call
    if (isFirstTeam) {
        raceInfo[constants.DATA_KEYS.NAME] = RACE_NAME;
    }

    var transformSexAge = function (data) {
        var sex = data.match(/M|F/);
        data = data.replace(sex, '');
        return sex + data;
    };
    var dataTransforms = {'sex_age' : transformSexAge};

    util.parseResults(browser, raceInfo, teamData, resultKeys, rowSelector, 200, 100, dataTransforms, saveResults);
};

var getTeamDropdown = function (browser) {
    return browser.queryAll('select[name="ft"]')[2];
};

var parseData = function (teamData, callback) {
    var browser = new Browser();
    browser.runScripts = false;
    browser.loadCSS = false;

    browser.visit(constants.MARATHON_RESULT_URL, function () {
        assert.equal(constants.EXPECTED_MARATHON_RESULT_TITLE, browser.text('title'));
        var teamOptions = $(getTeamDropdown(browser)).find('option');

        // Remove 'Team' and unattached
        teamOptions.splice(0, 2);

        var clubPointsData = {
          men: {
            isClubPoints: true,
            raceLabel : '11/3 26.2M'
          },
          women : {
            isClubPoints: true,
            raceLabel : '11/3 26.2M'
          }
        };

        var data = {};
        data.headingData = {};
        data.results = [];
        data.raceData = util.makeRaceData(RACE_ID, RACE_NAME, RACE_YEAR, getRaceDetails(), clubPointsData, true);

        var visitTeamPage = function (i) {
            if (i < 4 && teamOptions[i]) {
                browser.visit(MARATHON_RESULT_URL, function () {
                    var dropdown = getTeamDropdown(browser);
                    browser.select(dropdown, $(teamOptions[i]).text());
                    browser.pressButton('input[type="submit"]');
                    browser.wait(function () {
                        parseTeamResults(browser, teamData, data.headingData, i === 0, function (results, teamResults, headingData) {
                            data.results = _.extend({}, data.results, results);
                            data.teamResults = _.extend({}, data.teamResults, teamResults);
                            data.headingData = _.extend(data.headingData, headingData);
                            visitTeamPage(i+1);
                        });
                    });
                });
            } else {
                data.teamResults = util.getScoredTeamResults(data.teamResults);
                callback(data);
            }
        };
        visitTeamPage(0);
    });
};

exports.parseData = parseData;
exports.getTeamDropdown = getTeamDropdown;
