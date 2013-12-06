var Browser = require('zombie');
var assert = require('assert');
var $ = require('jquery');
var _ = require('underscore');
var constants = require('./constants').constants;
var utils = require('./utils').utils;
var logger = require('./../logger').logger;


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
                          {key : 'bib_no', replaceCount : 1}];
    var newFields = {'state' : {text : 'State'}, 'country' : {text : 'Country'}, 'sex_age' : {text : 'Sex/Age'},
                     'bib' : {text : 'Bib'}};

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

var parseTeamResults = function (browser, headingData, isFirstTeam, callback) {
    if (_.isEmpty(headingData)) { 
        var row = $(browser.html()).find('tr[bgcolor="#E0E0E0"] td');
        var data =  adjustHeadingData(utils.getHeadingData(row, {}));
        resultKeys = data.resultKeys;
        headingData = data.headingData;
    }
    var rowSelector = 'tr[bgcolor="#EEEEEE"]';
    var saveResults = function (results) {
        var team = results[0].team;
        logger.infoGroup(false, 'Parsed team results for ' + team);
        callback(results, headingData);
    };

    var raceInfo = {id : RACE_ID};
    // We only want to report the race name on first call
    if (isFirstTeam) {
        raceInfo.name = RACE_NAME;
    }

    var transformSexAge = function (data) {
        var sex = data.match(/M|F/);
        data = data.replace(sex, '');
        return sex + data;
    };
    var dataTransforms = {'sex_age' : transformSexAge};

    utils.parseResults(browser, raceInfo, resultKeys, rowSelector, 200, 100, dataTransforms, saveResults);
};

var getTeamDropdown = function (browser) {
    return browser.queryAll('select[name="ft"]')[2];
};

var parseData = function (callback) {
    var browser = new Browser();
    browser.runScripts = false;
    browser.loadCSS = false;

    browser.visit(constants.MARATHON_RESULT_URL, function () {
        assert.equal(constants.EXPECTED_MARATHON_RESULT_TITLE, browser.text('title'));
        var teamOptions = $(getTeamDropdown(browser)).find('option');

        // Remove 'Team' and unattached
        teamOptions.splice(0, 2);
      
        var data = {};
        data.headingData = {};
        data.results = [];
        data.raceData = utils.makeRaceData(RACE_ID, RACE_NAME, RACE_YEAR, getRaceDetails(), [true, true], false);

        var visitTeamPage = function (i) {
            if (teamOptions[i]) {
                browser.visit(MARATHON_RESULT_URL, function () {
                    var dropdown = getTeamDropdown(browser);
                    browser.select(dropdown, $(teamOptions[i]).text());
                    browser.pressButton('input[type="submit"]');
                    browser.wait(function () {
                        parseTeamResults(browser, data.headingData, i === 0, function (results, headingData) {
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
exports.getTeamDropdown = getTeamDropdown;
