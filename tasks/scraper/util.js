var _ = require('underscore');
var $ = require('jquery');
var constants = require('./constants').constants;
var logger = require('./../logger');
var genericUtils = require('./../util');


/**
 * Get the URL for a race's results from its race id and year.
 */
exports.getRaceURL = function (raceId, year) {                                                                                                 
  return constants.RACE_PAGE_BASE_URL + '?' +                                                                                           
    constants.URL_KEYS.RACE_ID + '=' +                                                                                             
    raceId + '&' + constants.URL_KEYS.YEAR +                                                                                       
    '=' + year;                                                                                                                    
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
 *    resultKeys : list of data keys we're concerned with parsing
 *    rowSelector : CSS selector for a table row of data
 *    maxResults : maximum number of results to parse
 *    resultsPerPage : number of results to parse per page
 *    dataTransforms : map of data keys to functions to be called
 *      if data needs transformation
 *    callback
 */
exports.parseResults = function (browser, race, resultKeys, rowSelector, maxResults, resultsPerPage, dataTransforms, callback) {
  if (race[constants.DATA_KEYS.NAME]) {
    logger.infoGroup(true, 'Parsing results for ' + race[constants.DATA_KEYS.NAME] +
       (race[constants.DATA_KEYS.YEAR] ? ' ' + race[constants.DATA_KEYS.YEAR] : ''));
  }
  var results = {};
  var teamResults = {};
  results = {};

  var that = this;
  var parsePage = function (startIndex) {
    logger.infoGroup(false, 'Parsing results ' + startIndex + '-' + parseInt(startIndex + resultsPerPage, 10));

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

      // Add result to team results
      if (race[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_MEN] > 0 || race[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_WOMEN] > 0) {
      var resultCount = { M : race[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_MEN],
                          F : race[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_WOMEN]};
      var teamResultKey = race[constants.DATA_KEYS.DB_ID] + constants.KEY_DELIMITER + result.team;
      var resultSex = result.sex_age[0];

        if (!teamResults[teamResultKey]) {
          teamResults[teamResultKey] = {};
          teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.TEAM_ID] = result.team;
          teamResults[teamResultKey][constants.DATA_KEYS.RACE_ID] = race[constants.DATA_KEYS.DB_ID];
        }

        if (resultCount[resultSex] > 0) {
          if (!teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS]) {
            teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS] = [];
            teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS].push(resultId);
            teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.TEAM_TIME] = result.net_time;
            teamResults[teamResultKey][constants.DATA_KEYS.RACE_ID] = race[constants.DATA_KEYS.DB_ID];
          } else if (teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS].length < resultCount) {
            teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.RESULT_IDS].push(resultId);
            teamResults[teamResultKey][constants.DATA_KEYS.TEAM_RESULT.TEAM_TIME] += parseInt(result.net_time, 10);
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
      logger.infoGroup(false, 'Parsed ' + resultLength + ' ' + genericUtils.getSingularOrPlural('result', resultLength));
      callback(results, teamResults);
    }
  };
  parsePage(0);
};

/**
 * Returns an object of data describing a race
 * Arguments:
 *  id : race id
 *  name : race name
 *  details : object of race details
 *  isClubPoints : list of boolean values [isClubPointsMen, isClubPointsWomen]
 *  isMarathon (optional) : default false
 */
exports.makeRaceData = function (id, name, year, details, isClubPoints, isMarathon) {
  raceData = {};
  raceData[constants.DATA_KEYS.DB_ID] = id;                                                                           
  raceData[constants.DATA_KEYS.NAME] = name;                                                                     
  raceData[constants.DATA_KEYS.YEAR] = year;                                                                          
  raceData[constants.DATA_KEYS.RACE.DETAILS] = details;

  // Get team result counts for [men, women]
  var teamResultCounts = [0, 0];
  var isTeamChamps = [];
  isTeamChamps[0] = name === constants.TEAM_CHAMPS_NAME_MEN ? true : false;
  isTeamChamps[1] = name === constants.TEAM_CHAMPS_NAME_WOMEN ? true : false;

  _.each(isClubPoints, function (clubPoints, i) {
    if (clubPoints) {
      if (isTeamChamps[i]) {
        teamResultCounts[i] = constants.TEAM_RESULT_COUNT.TEAM_CHAMPS;
      } else if (isMarathon) {
        teamResultCounts[i] = constants.TEAM_RESULT_COUNT.MARATHON;
      } else {
        teamResultCounts[i] = constants.TEAM_RESULT_COUNT.DEFAULT;
      }
    }
  });

  raceData[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_MEN] = teamResultCounts[0];
  raceData[constants.DATA_KEYS.RACE.TEAM_RESULT_COUNT_WOMEN] = teamResultCounts[1];
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
