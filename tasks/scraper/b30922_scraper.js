var Browser = require('zombie');
var assert = require('assert');
var util = require('./util');
var constants = require('./constants').constants;
var logger = require('./../logger');
var scrapeReporter = require('./scrapeReporter');
var _ = require('underscore');
var $ = require('jquery');


var RACE_ID = constants.FIFTH_AVE_MILE_2013;
var EXPECTED_TITLE = 'NYRR Fifth Avenue Mile Presented by Nissan';
var DATA_KEYS = [
  'overall_place',
  'bib',
  'first_name',
  'last_name',
  'sex_age',
  'city',
  'state',
  'country',
  'team',
  'net_time'
];
var ALL_SORTED_DATA_KEYS = [
  'last_name',
  'first_name',
  'sex_age',
  'bib',
  'team',
  'city',
  'state',
  'country',
  'overall_place',
  'gender_place',
  'age_place',
  'net_time',
  'pace_per_mile',
  'ag_time',
  'ag_gender_place',
  'ag_%'
];
var unfoundTeams = [];

var getFormattedResult = function (result) {
  var formattedResult = {};
  _.each(ALL_SORTED_DATA_KEYS, function (key) {
    formattedResult[key] = result[key] || '';
  });
  return formattedResult;
};

var getDivisionSex = function (divisionText) {
  if (divisionText.indexOf('Women') !== -1) {
    return 'F';
  }
  return 'M';
};

var findTeamId = function (name, data) {
  var team = _.find(data.teamData, function (teamData) {
    return teamData.name === name.trim();
  });
  if (!team) {
    unfoundTeams.push(name);
  } else {
    return team[constants.DATA_KEYS.DB_ID];
  }
};

exports.parseData = function (data, callback) {
  var raceData = {
    results: data.raceResults || {}
  };

  var race = data.raceData[RACE_ID];
  logger.info('Parsing pro results for ' + race[constants.DATA_KEYS.NAME]);

  var browser = new Browser();
  browser.runScripts = false;
  browser.loadCSS = false;

  teamResults = {};
  browser.visit(util.getRaceURL(RACE_ID, '2013'), function () {
    assert.equal(EXPECTED_TITLE, browser.text('title'));
    var link = $(browser.html()).find('nobr')[3];
    var url = $(link).find('a').attr('href');
    browser.visit(url, function () { 
      var rows = $(browser.html()).find('#07InvitationalResults_32676 tr');
      var sex;
      _.each(rows, function (row) {
        var result = {};
        var columns = $(row).find('td');
        if (columns.length === 12) {
          _.each(columns, function (cell, i) {
            if (DATA_KEYS[i]) {
              var val = $(cell).text();
              if (DATA_KEYS[i] === 'sex_age') {
                val = sex + val;
              } else if (DATA_KEYS[i] === 'team') {
                val = findTeamId(val, data);
              } else if (DATA_KEYS[i] === 'net_time') {
                val = util.timeToSeconds(val);
              }
              result[DATA_KEYS[i]] = val;
            }
          });
        } else {
          var divisionCell = $(row).find('td')[0];
          sex = getDivisionSex($(divisionCell).text());
        }
        result = getFormattedResult(result);
        if (result.bib) {
          result[constants.DATA_KEYS.DB_ID] = RACE_ID + constants.KEY_DELIMITER + result.bib;
          result[constants.DATA_KEYS.RACE_ID] = RACE_ID;
          raceData.results[RACE_ID + constants.KEY_DELIMITER + result.bib] = result;
        }
      });

      // Recreate this race's team results
      data.teamResults = util.removeRaceFromTeamResults(data.teamResults, RACE_ID);
      raceData.teamResults = util.createTeamResults(raceData.results, race, data);

      scrapeReporter.addTeamInfo('Unfound Fifth Ave. Mile teams:<br>' +
                                 unfoundTeams.join('<br>'));
      callback(raceData);
    });
  });
};
