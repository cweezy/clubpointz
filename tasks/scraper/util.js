var _ = require('underscore');
var $ = require('jquery');
var constants = require('./constants').constants;
var logger = require('./../logger');
var genericUtils = require('./../util');
var scrapeReporter = require('./scrapeReporter');


var getIsTeamChamps = function (raceName) {
  return raceName.indexOf('Team Championships') !== -1;
};

var getNameMatches = function (name) {
  var nameMatches = [name, name.trim()];
  _.each(constants.TEAM_NAME_TRANSFORMS, function (replacements, key) {
    if (name.indexOf(key) !== -1) {
      _.each(replacements, function (replacement) {
        nameMatches.push(name.replace(key, replacement));
      });
    }
  });
  return nameMatches;
};
exports.getNameMatches = getNameMatches;


/**
 * Get the URL for a race's results from its race id and year.
 */
exports.getRaceURL = function (raceId, year) {                                                                                                 
  return constants.RACE_PAGE_BASE_URL + '?' +                                                                                           
    constants.URL_KEYS.RACE_ID + '=' +                                                                                             
    raceId + '&' + constants.URL_KEYS.YEAR +                                                                                       
    '=' + year;                                                                                                                    
}; 


exports.getDivisionSex = function (divisionId) {
  if (divisionId.indexOf('WOMEN') !== -1 || divisionId.indexOf('Women') !== -1) {
    return 'F';
  } else if (divisionId.indexOf('MEN') !== -1 || divisionId.indexOf('Men') !== -1) {
    return 'M';
  }
  logger.warning('No sex found for division ' + divisionId);
};


/**
 * Get the request parameters from a URL string and return as
 * an object.
 */
exports.parseURLParams = function (url) {                                                                                                     
  var params = {};                                                                                                                      
  var rawParams = url.split('?')[1].split('&');                                                                                     
  _.each(rawParams, function (param) {                                                                                                  
    var paramParts = param.split('=');                                                                                                
    params[paramParts[0]] = paramParts[1];                                                                                            
  });                                                                                                                                   
  return params;                                                                                                                        
}; 

/**
 * Converts large date format to small
 * Ex: 'November 1' becomes '11/1'
 */
exports.getSmallDate = function (dateStr) {
  dateStr = dateStr.split(',')[0];
  var dateParts = dateStr.split(' ');
  if (!constants.MONTH_TO_INDEX[dateParts[0]]) logger.warning('no month found for ' + dateParts[0]);
  return constants.MONTH_TO_INDEX[dateParts[0]] + '/' + dateParts[1];
};

/**
 * Converts distance string to small format distances
 * Ex: '18 miles, 29 kilometers' becomes ['18M', '29K']
 */
exports.getSmallDistances = function (distanceStr) {
  var smallDistances = [];
  var distanceParts = distanceStr.split(',');
  _.each(distanceParts, function (distance) {
    distance = $.trim(distance);
    var parts = distance.split(' ');
    var smallUnit = constants.UNIT_TO_ABBR[parts[1]];
    if (!smallUnit) {
      logger.warning('no unit found for ' + parts[1]);
    } else {
      smallDistances.push(parts[0] + smallUnit);
    }
  });
  return smallDistances;
};

/**
 * Parses keys and labels for a list of text headings.
 * Also transforms and returns headingData by adding any new
 * headings.
 */
exports.getHeadingData = function (headings, headingData) {
  var resultKeys = [];                                                                                                                  
  headingData = headingData || {};
  _.each(headings, function (heading) {
    var text = $(heading).html().replace(/<br \/>/g, ' ').replace('&nbsp;', ' ');
    // TODO clean this up
    var key = text.replace(/\s/g, '_').replace('__', '_').replace('.', '').replace(/\//, '').toLowerCase();
    resultKeys.push(key);
    if (!headingData[key]) {
      headingData[key] = {};
      headingData[key][constants.DATA_KEYS.HEADING.TEXT] = text;
      headingData[key][constants.DATA_KEYS.DB_ID] = key;
    }
  });

  var returnData = {};
  returnData.headingData = headingData;
  returnData.resultKeys = resultKeys;
  return returnData; 
};

/**
 * Parses all results of a race, page by page
 * Arguments:
 *    browser: browser instance
 *    race: race date object
 *    data: object containing all data that has been scraped so far
 *    resultKeys: list of data keys we're concerned with parsing
 *    rowSelector: CSS selector for a table row of data
 *    maxResults: maximum number of results to parse
 *    resultsPerPage: number of results to parse per page
 *    dataTransforms: map of data keys to functions to be called
 *      if data needs transformation
 *    callback
 */
exports.parseResults = function (browser, race, data, resultKeys, rowSelector, maxResults, resultsPerPage, dataTransforms, callback) {
  if (race[constants.DATA_KEYS.NAME]) {
    logger.infoGroup('Parsing results for ' + race[constants.DATA_KEYS.NAME] +
       (race[constants.DATA_KEYS.YEAR] ? ' ' + race[constants.DATA_KEYS.YEAR] : ''), true);
  }
  var results = {};
  var teamResults = {};
  results = {};

  var that = this;
  var teamResultKeys = [];
  var parsePage = function (startIndex) {
    logger.infoGroup('Parsing results ' + startIndex + '-' + parseInt(startIndex + resultsPerPage, 10));

    var pageBody = browser.html();
    _.each($(pageBody).find(rowSelector), function (row, i) {
      var result = {};
      _.each($(row).find('td'), function (cell, j) {
        var data = $(cell).html();
        if (that.isTime(data)) {
          data = that.timeToSeconds(data);
        } else {
          data = String(data);
        }
        var key = resultKeys[j];
        if (dataTransforms[key]) {
          result[key] = dataTransforms[key](data);
        } else {
          result[key] = data;
        }
      });
      var resultId = race[constants.DATA_KEYS.DB_ID] + constants.KEY_DELIMITER + result.bib;
      result[constants.DATA_KEYS.DB_ID] = resultId;
      result[constants.DATA_KEYS.RACE_ID] = race[constants.DATA_KEYS.DB_ID];
      results[resultId] = result;

      var team = _.find(data.teamData, function (team) {
        return team[constants.DATA_KEYS.DB_ID] === result.team;
      });

      if (team) {
        var resultSex = result.sex_age[0];

        // Find division for result (if any)
        var sexYearDivisions = _.filter(data.divisionData, function (div) {
          return div[constants.DATA_KEYS.DB_ID].indexOf('OPEN') !== -1 &&
                 div[constants.DATA_KEYS.DIVISION.SEX] === resultSex &&
                 div[constants.DATA_KEYS.YEAR] === race[constants.DATA_KEYS.YEAR];
        });

        
        var division = _.find(sexYearDivisions, function (div) {
          return _.find(div[constants.DATA_KEYS.DIVISION.TEAMS], function (testTeam) {
            return _.find(getNameMatches(testTeam), function (testName) {
              return _.find(team[constants.DATA_KEYS.NAME], function (teamName) {
                return testName === teamName;
              });
            });
          });
        });

        // Add result to team results
        if (!_.isUndefined(division) && (race[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_MEN] > 0 ||
            race[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_WOMEN] > 0)) {
          var resultCount = { M : race[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_MEN],
                              F : race[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_WOMEN]};
          var teamResultKey = race[constants.DATA_KEYS.DB_ID] + constants.KEY_DELIMITER + result.team + constants.KEY_DELIMITER + resultSex;
          teamResultKeys.push(teamResultKey);

          if (!teamResults[teamResultKey]) {
            teamResults[teamResultKey] = {};
            teamResults[teamResultKey][constants.DATA_KEYS.DB_ID] = teamResultKey;
            teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.TEAM_ID] = result.team;
            teamResults[teamResultKey][constants.DATA_KEYS.RACE_ID] = race[constants.DATA_KEYS.DB_ID];
            teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.SCORE] = 0;
            teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.DIVISION] = division[constants.DATA_KEYS.DB_ID];
            teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.IS_TEAM_CHAMPS] = getIsTeamChamps(race[constants.DATA_KEYS.NAME]);
          }

          if (resultCount[resultSex] > 0) {
            if (!teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS]) {
              teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS] = [];
              teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS].push(resultId);
              teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.TEAM_TIME] = result.net_time;
              teamResults[teamResultKey][constants.DATA_KEYS.RACE_ID] = race[constants.DATA_KEYS.DB_ID];
              teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.IS_FULL_TEAM] = (1 === resultCount[resultSex]);
            } else if (teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS].length < resultCount[resultSex]) {
              teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS].push(resultId);
              teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.TEAM_TIME] += parseInt(result.net_time, 10);
              teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.IS_FULL_TEAM] =
                 (teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS].length === resultCount[resultSex]);
            }
          }
        }
      }
    });

    var nextButton = $(pageBody).find('a:contains("' + constants.NEXT_BTN_TEXT + ' ' + resultsPerPage + '")');
    var resultLength = _.keys(results).length;
    if (resultLength < maxResults && $(nextButton).length > 0) {
      var nextUrl = $(nextButton).attr('href');
      browser.visit(nextUrl, function () {
        parsePage(startIndex + resultsPerPage);
      });
      browser.wait();
    } else {
      var parseMessage = 'Parsed ' + resultLength + ' ' + genericUtils.getSingularOrPlural('result', resultLength);
      logger.infoGroup(parseMessage);
      if (race[constants.DATA_KEYS.NAME]) {
        parseMessage += ' for ' + race[constants.DATA_KEYS.NAME];
        parseMessage += race[constants.DATA_KEYS.YEAR] ? ' ' + race[constants.DATA_KEYS.YEAR] : '';
      }
      scrapeReporter.addResultInfo(parseMessage);
      callback(results, teamResults);
    }
  };
  parsePage(0);
};

exports.getScoredTeamResults = function (teamResults) {
  var divisionGroupedTeamResults = _.groupBy(teamResults, function (result) {
    return result[constants.DATA_KEYS.TEAM_RESULT.DIVISION];
  });

  var allResults = {};
  _.each(divisionGroupedTeamResults, function (teamResults) {
    // calculate team scores
    var groupedTeamResults = _.groupBy(teamResults, function (result) {
      return result[constants.DATA_KEYS.TEAM_RESULT.IS_FULL_TEAM];
    });
    var sortedTeamResults = _.sortBy(groupedTeamResults[true], function (result) {
      return result[constants.DATA_KEYS.TEAM_RESULT.TEAM_TIME];
    });

    // assign point values to the top teams, default points to any full team
    _.each(sortedTeamResults, function (result, i) {
      var scoreFactor = result[constants.DATA_KEYS.TEAM_RESULT.IS_TEAM_CHAMPS] ? 2 : 1;
      if (constants.POINT_VALUES[i]) {
        result[constants.DATA_KEYS.TEAM_RESULT.SCORE] = constants.POINT_VALUES[i] * scoreFactor;
      } else {
        result[constants.DATA_KEYS.TEAM_RESULT.SCORE] = constants.DEFAULT_POINT_VALUE;
      }
      allResults[result[constants.DATA_KEYS.DB_ID]] = result;
    });

    _.each(groupedTeamResults[false], function (result) {
      allResults[result[constants.DATA_KEYS.DB_ID]] = result;
    });
  });
  return allResults;
};

/**
 * Returns an object of data describing a race
 * Arguments:
 *  id : race id
 *  name : race name
 *  details : object of race details
 *  isClubPoints : object
 *  isMarathon (optional) : default false
 */
exports.makeRaceData = function (id, name, year, details, clubPointsData, isMarathon) {
  raceData = {};
  raceData[constants.DATA_KEYS.DB_ID] = id;                                                                           
  raceData[constants.DATA_KEYS.NAME] = name;                                                                     
  raceData[constants.DATA_KEYS.YEAR] = year;                                                                          
  raceData[constants.DATA_KEYS.RACE.DETAILS] = details;

  var teamResultCounts = {
    men : 0,
    women : 0
  };
  var isTeamChamps = {
    men : (name === constants.TEAM_CHAMPS_NAME_MEN ? true : false),
    women : (name === constants.TEAM_CHAMPS_NAME_WOMEN ? true : false)
  };

  _.each(clubPointsData, function (clubPointsData, key) {
    if (clubPointsData.isClubPoints) {
      raceData[constants.DATA_KEYS.RACE.LABEL] = clubPointsData.raceLabel;
      if (isTeamChamps[key]) {
        teamResultCounts[key] = constants.TEAM_RESULT_COUNT.TEAM_CHAMPS;
      } else if (isMarathon) {
        teamResultCounts[key] = constants.TEAM_RESULT_COUNT.MARATHON;
      } else {
        teamResultCounts[key] = constants.TEAM_RESULT_COUNT.DEFAULT;
        if (getIsTeamChamps(name)) teamResultCounts[key] = 0;
      }
    }
  });

  raceData[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_MEN] = teamResultCounts.men;
  raceData[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_WOMEN] = teamResultCounts.women;
  return raceData;
};

/**
 * Returns true if value represents a time, i.e. "01:02:03"
 */
exports.isTime = function (value) {
  var matches = String(value.match(/([0-9]+:)([0-9]+:?)*/g));
  return matches === value;
};

/**
 * Converts time value to seconds, i.e. "1:00" becomes 60 seconds
 */
exports.timeToSeconds = function (time) {
  var values = (time.split(':').reverse());
  var seconds = 0;
  _.each(values, function (value, i) {
    var factor = Math.pow(60, i);
    seconds = seconds + parseInt(value, 10) * factor;
  });
  return seconds;
};
