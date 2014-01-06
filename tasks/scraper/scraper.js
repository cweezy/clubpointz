var Browser = require('zombie');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var $ = require('jquery');
var _ = require('underscore');
var constants = require('./constants').constants;
var parseIrregularRaceData = require('./irregularRaceScraper').parseData;
var util = require('./util');
var genericUtils = require('./../util');
var alertMailer = require('./../alertMailer').mailer;
var logger = require('./../logger');
var scrapeReporter = require('./scrapeReporter');

var maxResults = constants.MAX_RESULTS;
var resultsPerPage = constants.RESULTS_PER_PAGE;

var db;
var data = {};
var startTime;


/**
 * longName format: 'North Brooklyn Runners (NBR)'
 * shortName format: 'North Brooklyn Runners'
 *
 * Strips parenthetical from longName and returns true
 * if shortName matches the result.
 */
var getIsNameMatch = function (longName, shortName) {
  if (longName.indexOf('(') !== -1) {
    var fullName = longName.match(/.* \(/g)[0];
    fullName = fullName.substring(0, fullName.length - 1);
    return fullName.trim() === shortName.trim();
  }
};

/**
 * Add information to the scrape report about teams encountered in
 * results for which we do not have division data.
 */
var reportUnfoundTeams = function () {
  var divisionTeams = [];
  var foundDivisionTeams = [];

  _.each(data.divisionData, function (division) {
    _.each(division.teams, function (team) {
      divisionTeams.push(util.getNameMatches(team)[0]);
    });
  });
  divisionTeams = _.uniq(divisionTeams);

  _.each(data.foundTeams, function (teamNames) {
    _.each(teamNames, function (name) {
      if (_.contains(divisionTeams, name)) foundDivisionTeams.push(name);
    });
  });

  var unfoundTeams = _.uniq(_.difference(divisionTeams, foundDivisionTeams));
  if (unfoundTeams) {
    scrapeReporter.addTeamInfo('Unfound teams' +
      ' (' + unfoundTeams.length + '):<br>' +
      unfoundTeams.join('<br>'));
  }
};

/**
 * Wait for any pending email messages to finish sending.
 */
var waitForMessages = function (callback) {
  var count = 0;
  var checkMessages = function () {
    var pendingMessages = alertMailer.getPendingMessages();
    if (pendingMessages === 0) {
      callback();
    } else {
      logger.infoGroup('Waiting for ' + pendingMessages + ' pending ' +
                       genericUtils.getSingularOrPlural('message', pendingMessages),
                       count === 0);
    }
    count += 1;
  };
  setInterval(checkMessages, 1000);
};

/**
 * Log error and force scrape to stop running.
 */
var bail = function (errorMessage, callback) {
  logger.error(errorMessage);
  var forceFail = function () {
    assert(false);
    callback();
  };
  waitForMessages(forceFail);
};

/**
 * Returns an object containing data about whether a race counts for
 * club points (for both men and women) and the label for the race
 * (indicating its date and distance, i.e. 6/1 5K)
 */ 
var getClubPointsData = function (race, details, browser, callback) {
  var clubPointsData = {
    men : {
      isClubPoints : false,
      raceLabel : ''
    },
    women : {
      isClubPoints : false,
      raceLabel : ''
    }
  };

  var raceDate = util.getSmallDate(details['Date/Time']);
  var raceDistances = util.getSmallDistances(details['Distance']);
  var divisions = {
    men : data.divisionData[constants.MENS_DIVISION_A +
          constants.KEY_DELIMITER + race.year],
    women : data.divisionData[constants.WOMENS_DIVISION_A +
            constants.KEY_DELIMITER  + race.year]
  };

  var awardWinnersUrl = $(browser.html()).find(
      constants.SELECTORS.AWARD_WINNERS_URL).attr('href');

  browser.visit(awardWinnersUrl, function () {
    // it is likely that a race counts towards club points if more than
    // 50 teams are displayed on the awards page
    var allTeamsShown = $(browser.html()).find('pre').length > 50;
    if (!allTeamsShown) {
      callback(clubPointsData);
      return;
    }
    _.each(divisions, function (division, key) {
      _.each(division[constants.DATA_KEYS.DIVISION.RACES], function (divisionRace) {
        // now check if the race date and distance match a division race
        var distanceMatch = _.find(raceDistances, function (distance) {
          return distance === divisionRace[constants.DATA_KEYS.DIVISION.RACE.DISTANCE];
        });
        if (distanceMatch && divisionRace[constants.DATA_KEYS.DIVISION.RACE.DATE] === raceDate) {
          clubPointsData[key].isClubPoints = true;
          clubPointsData[key].raceLabel = raceDate + ' ' + distanceMatch;
        }
      });
    });
    callback(clubPointsData);
  });
};

var parseRaceDetails = function (raceId, pageBody) {
  var details = $($(pageBody).find(constants.SELECTORS.RACE_DETAILS).parent()).text().split('\r');
  var raceDetails = {};
  _.each(details, function (detail) {
    var i = detail.indexOf(':');
    var detailParts = [detail.slice(0, i), detail.slice(i+1)]; 
    if (detailParts && detailParts.length > 1 && detailParts[0] !== '') {
      raceDetails[$.trim(detailParts[0])] = $.trim(detailParts[1]);
    }
  });

  // parse race teams
  data.teamData = data.teamData || {};
  data.foundTeams = data.foundTeams || [];
  var teamDropdown = $(pageBody).find('select[name="team_code"]');
  _.each($(teamDropdown).find('option'), function (team) {
    var id = String($(team).attr('value'));
    if (!data.teamData[id]) {
      var name = $(team).text();
      if (name.indexOf('(unnamed team)') !== -1) {
        name = constants.NAMELESS_TEAMS[id];
      } else {
        // TODO find this character in a better way
        var delimiterIndex = name.indexOf('�');
        name = name.substring(0, delimiterIndex);
      }
      if (id && name && !data.teamData[id]) {
        data.teamData[id] = {};
        data.teamData[id][constants.DATA_KEYS.DB_ID] = id;
        data.teamData[id][constants.DATA_KEYS.NAME] = util.getNameMatches(name.trim())[0];
        data.teamData[id][constants.DATA_KEYS.TEAM.WEBSITE] = constants.TEAM_WEBSITES[id];
        data.foundTeams.push(util.getNameMatches(name.trim()));
      }
    }
  });
  return raceDetails;
};

var parseRaceData = function (race, details, browser, callback) {
  getClubPointsData(race, details, browser, function (clubPointsData) {
    if (!data.raceData) data.raceData = {};
    data.raceData[race.id] = util.makeRaceData(race.id, race.name, race.year, details, clubPointsData);

    data.raceData[race.id] = overrideRaceData(data.raceData[race.id]);
    callback();
  });
};

var parseResults = function (raceURL, race, browser, callback) {
  browser.visit(raceURL, function () {
    browser.choose('input[value="' + resultsPerPage + '"]');
    browser.pressButton(constants.SELECTORS.SEARCH_BUTTON);
    browser.wait(function () {
      var headings = $(browser.html()).find(constants.SELECTORS.HEADING);
      var headingData = util.getHeadingData(headings);
      data.headingData = _.extend({}, data.headingData, headingData.headingData);

      util.parseResults(browser, race, data, headingData.resultKeys, constants.SELECTORS.RESULT_ROW,
                        maxResults, resultsPerPage, {}, function (results, teamResults) {
        teamResults = util.getScoredTeamResults(teamResults);
        callback(results, teamResults);
      });
    });
  });
};

var overrideRaceData = function (raceData) {
  var overrideData = data.raceOverrideData[raceData[constants.DATA_KEYS.DB_ID]];
  if (overrideData) {
   _.each(overrideData, function (item, key) {
     raceData[key] = item;
   });
  }
  return raceData;
};

describe('Scraper', function () {

    it('sets up db connection', function (done) {
        startTime = new Date();
        scrapeReporter.addGeneralInfo('Scrape start time ' + startTime.toString());

        MongoClient.connect(constants.MONGO_URI, function (err, database) {
            if (err) {
                bail('Error establishing MongoDB connection - ' + err, done);
            } else {
                db = database;
                done();
            }
        });
    }),

    it('sets max race results', function (done) {
        maxResults = process.env.MAX_RESULTS ? parseInt(process.env.MAX_RESULTS, 10) : maxResults;
        // resultsPerPage = maxResults >= 500 ? 500 : resultsPerPage;
        done();
    }),

    it('gets new race data', function (done) {
        if (genericUtils.getEnvVar('RACES')) {
            try {
                data.races = JSON.parse(genericUtils.getEnvVar('RACES'));
            } catch (e) {
                bail('Error parsing races.json - ' + e, done);
            }
        } else {
            data.races = [];
        }

        var reportRaces = function (regularRaces, irregularRaces, raceSource) {
            var raceCount = _.uniq(regularRaces.concat(irregularRaces)).length;
            var message = 'Found ' + raceCount + ' ' + genericUtils.getSingularOrPlural('race', raceCount) +
                    ' ' + raceSource;
            logger.info(message);
            scrapeReporter.addRaceInfo(message);
            scrapeReporter.addRaceInfo('Regular races found: ' + _.pluck(regularRaces, 'id').join(', '));
            scrapeReporter.addRaceInfo('Irregular races found: ' + _.pluck(irregularRaces, 'id').join(', '));
            return;
        };

        if (_.isEmpty(data.races)) {
            var browser = new Browser();
            browser.runScripts = false;
            browser.loadCSS = false;

            browser.visit(constants.RESULT_MAIN_URL, function () {
                assert.equal(constants.EXPECTED_RESULT_MAIN_TITLE, browser.text('title'));
                var links = $(browser.html()).find('td.text a[target!=_top]');
                _.each(links, function (link) {
                    var url = $(link).attr('href');
                    if (url && url.indexOf(constants.RACE_PAGE_BASE_URL) !== -1) {
                        var urlParams = util.parseURLParams(url);
                        var raceId = urlParams[constants.URL_KEYS.RACE_ID];
                        var year = urlParams[constants.URL_KEYS.YEAR];
                        var raceData = {
                            'id' : raceId,
                            'year' : year
                        };
                        if (_.contains(constants.IRREGULAR_RACES, raceId)) {
                            data.irregularRaces = data.irregularRaces || [];
                            data.irregularRaces.push(raceData);
                        } else {
                            data.races.push(raceData);
                        }
                    }
                });
                reportRaces(data.races, data.irregularRaces, 'on web');
                done();
            });
        } else {
            var regularRaces = [];
            data.irregularRaces = data.irregularRaces || [];
            _.each(data.races, function (race) {
                if (_.contains(constants.IRREGULAR_RACES, race.id)) {
                    data.irregularRaces.push(race);
                    if (race.id === constants.FIFTH_AVE_MILE_2013) {
                        // Fifth Ave Mile gets parsed regularly and separately
                        regularRaces.push(race);
                    }
                } else {
                    regularRaces.push(race);
                }
            });
            data.races = regularRaces;
            reportRaces(data.races, data.irregularRaces, 'in file');
            done();
        }
    }),

    it('finds saved data', function (callback) {
        var collectionCount = 3;
        var count = 0;
        var done = function () {
            count += 1;
            if (count === collectionCount) callback();
        };

        var collection = db.collection(constants.DB_COLLECTIONS.RACE);
        var allRaces = _.uniq(data.races.concat(data.irregularRaces));
        _.each(allRaces, function (race, i) {
            var raceId = race.id;
            var queryData = {};
            queryData[constants.DATA_KEYS.DB_ID] = raceId;
            if (!data.savedRaces) data.savedRaces = {};
            collection.find(queryData).toArray(function (err, docs) {
                if (err) throw err;
                data.savedRaces[raceId] = docs.length > 0;
                if (_.keys(data.savedRaces).length === allRaces.length) {
                    done();
                }
            });
        });

        data.divisionData = {};
        collection = db.collection(constants.DB_COLLECTIONS.DIVISION);
        collection.find().toArray(function (err, docs) {
            if (err) throw err;
            _.each(docs, function (doc) {
                data.divisionData[doc[constants.DATA_KEYS.DB_ID]] = doc;
            });
            done();
        });

        collection = db.collection(constants.DB_COLLECTIONS.TEAM);
        collection.find().toArray(function (err, docs) {
            if (err) throw err;
            if (!_.isEmpty(docs)) data.teamData = docs;
            done();
        });
    }),

    it('parses division info', function (done) {
        var allRaces = data.races.concat(data.irregularRaces);
        var years = [];
        _.each(allRaces, function (race) {
            years.push(race.year);
        });
        years = _.uniq(years);

        var isMissingData = function () {
            isMissingData = false;
            _.each(years, function (year) {
                var match = _.find(data.divisionData, function (division) {
                    return division[constants.DATA_KEYS.YEAR] === year;
                });
                if (!match) isMissingData = true;
            });
            return isMissingData;
        };

        if (_.isEmpty(data.divisionData) || isMissingData()) {
            data.isNewDivisionData = true;
            var browser = new Browser();
            browser.runScripts = false;
            browser.loadCSS = false;

            if (!data.divisionData) data.divisionData = {};
            _.each(years, function (year, i) {
                browser.visit(constants.DIVISION_DATA_URL + year, function () {
                    var pageJSON = JSON.parse(browser.text());

                    _.each(pageJSON.data, function (item) {
                        var divisionId = item.type + constants.KEY_DELIMITER + year;
                        if (!data.divisionData[divisionId]) {
                            data.divisionData[divisionId] = {};
                            data.divisionData[divisionId][constants.DATA_KEYS.DB_ID] = divisionId;
                            data.divisionData[divisionId][constants.DATA_KEYS.NAME] = item.type;
                            data.divisionData[divisionId][constants.DATA_KEYS.YEAR] = year;
                            data.divisionData[divisionId][constants.DATA_KEYS.DIVISION.SEX] = util.getDivisionSex(divisionId);
                        }
                        if (item.is_label === '1') {
                            _.each(item.data, function (label) {
                                if (constants.DIVISION_NON_RACE_LABELS.indexOf(label) === -1 &&
                                        item.type !== label) {
                                    var parts = label.split('-');
                                    var raceData = {};
                                    raceData[constants.DATA_KEYS.DIVISION.RACE.DATE] = parts[0];
                                    raceData[constants.DATA_KEYS.DIVISION.RACE.DISTANCE] = parts[1];
                                    
                                    if (!data.divisionData[divisionId][constants.DATA_KEYS.DIVISION.RACES]) {
                                        data.divisionData[divisionId][constants.DATA_KEYS.DIVISION.RACES] = [];
                                    }
                                    data.divisionData[divisionId][constants.DATA_KEYS.DIVISION.RACES].push(raceData);
                                }
                            });
                        } else if (item.name !== '') {
                            if (!data.divisionData[divisionId][constants.DATA_KEYS.DIVISION.TEAMS]) {
                                data.divisionData[divisionId][constants.DATA_KEYS.DIVISION.TEAMS] = [];
                            }
                            data.divisionData[divisionId][constants.DATA_KEYS.DIVISION.TEAMS].push(util.getNameMatches(item.name.trim())[0]);
                        }
                    });

                    var message = 'Parsed division info for ' + year;
                    logger.info(message);
                    scrapeReporter.addDivisionInfo(message);
                    if (i === years.length - 1) {
                        done();
                    }
                });
            });
        } else {
            done();
        }
    }),

    it('finds manual race override data', function (done) {
        var collection = db.collection(constants.DB_COLLECTIONS.RACE_OVERRIDE);
        data.raceOverrideData = {};
        collection.find().toArray(function (err, docs) {
            _.each(docs, function (item) {
                data.raceOverrideData[item[DATA_KEYS.RACE_ID]] = item[DATA_KEYS.OVERRIDE.DATA];
            });
            done();
        });
    }),

    it('parses race data', function (done) {
        var browser = new Browser();
        browser.runScripts = false;
        browser.loadCSS = false;

        var parseRace = function (i) {
            if (data.races[i]) {
                var race = data.races[i];
                if (!data.savedRaces[race.id]) {
                    var url = util.getRaceURL(race.id, race.year);
                    browser.visit(url, function () {
                        raceDetails = parseRaceDetails(race.id, browser.html());
                        browser.wait(function () {
                            race.name = $(browser.html()).find(constants.SELECTORS.RACE_NAME).text();
                            parseRaceData(race, raceDetails, browser, function () {
                                parseResults(url, data.raceData[race.id], browser, function (results, teamResults) {
                                    data.raceResults = _.extend({}, data.raceResults, results);
                                    data.teamResults = _.extend({}, data.teamResults, teamResults);
                                    parseRace(i+1);
                                });
                            });
                        });
                    });
                } else {
                    parseRace(i+1);
                }
            } else {
                done();
            }
        };

        parseRace(0);
    }),

    it('parses irregular race data', function (done) {
        if (data.irregularRaces.length > 0) {
            var parseRace = function (i) {
                if (data.irregularRaces[i]) {
                    if (!data.savedRaces[data.irregularRaces[i].id]) {
                        parseIrregularRaceData(data.irregularRaces[i], data, function (resultData) {
                            if (resultData) {
                                data.raceResults = _.extend({}, data.raceResults, resultData.results);
                                data.teamResults = _.extend({}, data.teamResults, util.getScoredTeamResults(resultData.teamResults));
                                if (resultData.raceData) {
                                    if (!data.raceData) data.raceData = {}; 
                                    data.raceData[resultData.raceData[constants.DATA_KEYS.DB_ID]] = resultData.raceData;
                                }
                                data.headingData = _.extend({}, data.headingData, resultData.headingData);
                            }
                            parseRace(i+1);
                        });
                    } else {
                        parseRace(i+1);
                    }
                } else {
                    done();
                }
            };
            parseRace(0);
        } else {
            done();
        }
    }),

    it('saves data', function (done) {
        var createDate = new Date();
        var onDbError = function (err, objects) {
            if (err) throw (err);
        };
        var getQuery = function (item) {
            var query = {};
            query[constants.DATA_KEYS.DB_ID] = item[constants.DATA_KEYS.DB_ID];
            return query;
        };

        var collection;
        var message;
        if (data.isNewDivisionData) {
            collection = db.collection(constants.DB_COLLECTIONS.DIVISION);
            _.each(data.divisionData, function (division, key) {
                collection.update(getQuery(division), division, {upsert:true}, onDbError);
            });
            message = 'Division data saved';
        } else {
            message = 'No new division data saved';
        }
        logger.info(message);
        scrapeReporter.addDataInfo(message);

        if (!_.isEmpty(data.raceData)) {
            reportUnfoundTeams();

            collection = db.collection(constants.DB_COLLECTIONS.RACE);
            _.each(data.raceData, function (race, key) {
                race[constants.DATA_KEYS.CREATED_AT] = createDate;
                race[constants.DATA_KEYS.UPDATED_AT] = createDate;
                collection.insert(race, {w:1}, onDbError); 
            });

            collection = db.collection(constants.DB_COLLECTIONS.TEAM);
            _.each(data.teamData, function (team) {
                collection.update(getQuery(team), team, {upsert:true}, onDbError);
            });

            collection = db.collection(constants.DB_COLLECTIONS.HEADING);
            _.each(data.headingData, function (heading) {
                collection.update(getQuery(heading), heading, {upsert:true}, onDbError);
            });

            collection = db.collection(constants.DB_COLLECTIONS.RESULT);
            _.each(data.raceResults, function (result) {
                collection.update(getQuery(result), result, {upsert:true}, onDbError);
            });

            collection = db.collection(constants.DB_COLLECTIONS.TEAM_RESULT);
            _.each(data.teamResults, function (data) {
                collection.insert(data, {w:1}, onDbError);
            });

            message = 'New race data saved';
            logger.info(message);
            scrapeReporter.addDataInfo(message);
            done();
        } else {
            message = 'No new race data saved';
            logger.info(message);
            scrapeReporter.addDataInfo(message);
            done();
        }
    }),

    it ('sends scrape report and waits for any pending messages to finish sending', function (done) {
        var endTime = new Date();
        scrapeReporter.addGeneralInfo('Scrape end time: ' + endTime.toString());
        scrapeReporter.addGeneralInfo('Duration: ' + ((endTime - startTime) / 1000).toString() + ' seconds');
        scrapeReporter.sendReport();
        waitForMessages(done);
    });
});

