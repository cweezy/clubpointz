var Browser = require('zombie');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var $ = require('jquery');
var _ = require('underscore');
var constants = require('./constants').constants;
var parseIrregularRaceData = require('./irregularRaceScraper').parseData;
var utils = require('./utils');
var genericUtils = require('./../utils');
var alertMailer = require('./../alertMailer').mailer;
var logger = require('./../logger');
var getTeamDropdown = require('./b31103_scraper').getTeamDropdown;

var maxResults = constants.MAX_RESULTS;
var resultsPerPage = constants.RESULTS_PER_PAGE;

var db;
var races = [];
var irregularRaces = [];
var raceResults = [];
var clubPointsRaces = [];
var raceData = {};
var headingData = {};
var savedRaces = {};
var raceOverrideData = {};
var teamData = [];

var waitForMessages = function (callback) {
    var checkMessages = function () {
        var pendingMessages = alertMailer.getPendingMessages();
        if (pendingMessages === 0) {
            callback();
        } else {
            logger.info('Waiting for ' + pendingMessages + ' pending ' +
                        genericUtils.getSingularOrPlural('message', pendingMessages));
        }
    };
    setInterval(checkMessages, 1000);
};

var bail = function (errorMessage, callback) {
    logger.error(errorMessage);
    var forceFail = function () {
        assert(false);
        callback();
    };
    waitForMessages(forceFail);
};

var getRaceUrl = function(raceId, year) {
    return constants.RACE_PAGE_BASE_URL + '?' +
           constants.URL_KEYS.RACE_ID + '=' +
           raceId + '&' + constants.URL_KEYS.YEAR +
           '=' + year;
};

var parseUrlParams = function (url) {
    var params = {};
    var rawParams = url.split('?')[1].split('&amp;');
    _.each(rawParams, function (param) {
        var paramParts = param.split('=');
        params[paramParts[0]] = paramParts[1];
    });
    return params;
};

// Converts large date format to small
// Ex: 'November 1' becomes '11/1'
var getSmallDate = function (dateStr) {
    dateStr = dateStr.split(',')[0];
    var dateParts = dateStr.split(' ');
    return constants.MONTH_TO_INDEX[dateParts[0]] + '/' + dateParts[1];
};

// Converts distance string to small format distances
// Ex: '18 miles, 29 kilometers' becomes ['18M', '29K']
var getSmallDistances = function (distanceStr) {
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

var determineIfTeamChamps = function (raceName) {
    return raceName.indexOf(constants.TEAM_CHAMPS_NAME) !== -1;
};

var determineIfClubPoints = function (pageBody, race, details) {
    // All team results are reported for club points races
    var allTeamsShown = $(pageBody).find('pre').length > 50;
    var isClubPointsMen = false;
    var isClubPointsWomen = false;

    // If all teams are shown, also check that race date/distance matches a club points race
    if (allTeamsShown) {
        var raceDate = getSmallDate(details['Date/Time']);
        var raceDistances = getSmallDistances(details['Distance']);

        _.each(raceDistances, function (distance) {
            _.each(clubPointsRaces, function (race) {
                if (race[constants.DATA_KEYS.CLUB_POINTS.DATE] === raceDate &&
                        race[constants.DATA_KEYS.YEAR] === race.year &&
                        race[constants.DATA_KEYS.CLUB_POINTS.DISTANCE] === distance) {
                    if (race[constants.DATA_KEYS.CLUB_POINTS.TYPE] === constants.CLUB_POINTS_RACE_TYPES.MEN) {
                        isClubPointsMen = true;
                    } else if (race[constants.DATA_KEYS.CLUB_POINTS.TYPE] === constants.CLUB_POINTS_RACE_TYPES.WOMEN) {
                        isClubPointsWomen = true;
                    }
                }
            });
        });
    } 
    return [isClubPointsMen, isClubPointsWomen];
};

var parseRaceDetails = function (raceId, pageBody) {
    var detailText = $($(pageBody).find(constants.SELECTORS.RACE_DETAILS).parent()).text();
    var details = detailText.split('\r');
    var raceDetails = {};
    _.each(details, function (detail) {
        var i = detail.indexOf(':');
        var detailParts = [detail.slice(0, i), detail.slice(i+1)]; 
        if (detailParts && detailParts.length > 1 && detailParts[0] !== '') {
            raceDetails[$.trim(detailParts[0])] = $.trim(detailParts[1]);
        }
    });
    return raceDetails;
};

var parseRaceData = function (race, details, browser, callback) {
    var pageBody = browser.html();

    var awardWinnersUrl = $(pageBody).find(constants.SELECTORS.AWARD_WINNERS_URL).attr('href');
    browser.visit(awardWinnersUrl, function () {
        var isClubPoints = determineIfClubPoints(browser.html(), race, details);
        var isTeamChamps = determineIfTeamChamps(race.name);

        raceData[race.id] = utils.makeRaceData(race.id, race.name, race.year, details, isClubPoints, isTeamChamps);
        raceData[race.id] = overrideRaceData(raceData[race.id]);
        callback();
    });
};

var parseResults = function (race, browser, callback) {
    var headings = $(browser.html()).find(constants.SELECTORS.HEADING);
    var headingData = utils.getHeadingData(headings);
    var resultKeys = headingData.resultKeys;
    headingData = headingData.headingData;

    var rowSelector = 'table:eq(3) tr[bgcolor!="EEEEEE"]';
    var results = utils.parseResults(browser, race, resultKeys, rowSelector, maxResults, resultsPerPage, {}, callback);
};

var overrideRaceData = function (raceData) {
    var overrideData = raceOverrideData[raceData[constants.DATA_KEYS.DB_ID]];
    if (overrideData) {
       _.each(overrideData, function (item, key) {
           raceData[key] = item;
       });
    }
    return raceData;
};

describe('Scraper', function () {

    it('sets up db connection', function (done) {
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
                races = JSON.parse(genericUtils.getEnvVar('RACES'));
            } catch (e) {
                bail('Error parsing races.json - ' + e, done);
            }
        }

        if (_.isEmpty(races)) {
            var browser = new Browser();
            browser.runScripts = false;
            browser.loadCSS = false;

            browser.visit(constants.RESULT_MAIN_URL, function () {
                assert.equal(constants.EXPECTED_RESULT_MAIN_TITLE, browser.text('title'));
                var linkHtml = browser.html(constants.SELECTORS.RACE_LINK);
                var links = linkHtml.split('</a>');
                _.each(links, function (link) {
                    var matches = link.match(/href="(.+)"/);
                    if (matches !== null) {
                        var linkUrl = matches[1];             
                        if (linkUrl && linkUrl.indexOf(constants.RACE_PAGE_BASE_URL) !== -1) {
                            var urlParams = parseUrlParams(linkUrl);
                            var raceId = urlParams[constants.URL_KEYS.RACE_ID];
                            var year = urlParams[constants.URL_KEYS.YEAR];
                            var raceList = races;
                            if (_.contains(constants.IRREGULAR_RACES, raceId)) {
                                raceList = irregularRaces;
                            }
                            raceList.push({
                                'id' : raceId,
                                'year' : year
                            });
                        }
                    }
                });
                var allRacesLength = races.concat(irregularRaces).length;
                logger.info('Found ' + allRacesLength + ' ' + genericUtils.getSingularOrPlural('race', allRacesLength) +
                            ' on web');
                done();
            });
        } else {
            var regularRaces = [];
            _.each(races, function (race) {
                var raceList = regularRaces;
                if (_.contains(constants.IRREGULAR_RACES, race.id)) {
                    raceList = irregularRaces;
                }
                raceList.push(race);
            });
            logger.info('Found ' + races.length + ' ' + genericUtils.getSingularOrPlural('race', races.length) + ' in file');
            races = regularRaces;
            done();
        }
    }),

    it('finds saved data', function (done) {
        var collection = db.collection(constants.DB_COLLECTIONS.RACE);
        var allRaces = races.concat(irregularRaces);
        _.each(allRaces, function (race, i) {
            var raceId = race.id;
            var queryData = {};
            queryData[constants.DATA_KEYS.DB_ID] = raceId;
            collection.find(queryData).toArray(function (err, docs) {
                if (err) throw err;
                savedRaces[raceId] = docs.length > 0;
                if (_.keys(savedRaces).length === allRaces.length) {
                    done();
                }
            });
        });
        collection = db.collection(constants.DB_COLLECTIONS.CLUB_POINTS_RACE);
        collection.find().toArray(function (err, docs) {
            clubPointsRaces = docs;
        });
    }),

    it('finds team info', function (done) {
        var browser = new Browser();
        browser.runScripts = false;
        browser.loadCSS = false;

        browser.visit(constants.MARATHON_RESULT_URL, function () {
            assert.equal(constants.EXPECTED_MARATHON_RESULT_TITLE, browser.text('title'));
            var teamDropdown = getTeamDropdown(browser);
            _.each($(teamDropdown).find('option'), function (teamOption) {
                var key = $(teamOption).attr('value');
                var name = $(teamOption).text();
                var data = {};
                data[constants.DATA_KEYS.NAME] = name;
                data[constants.DATA_KEYS.DB_ID] = key;
                teamData.push(data);
            });
            done(); 
        }); 
    }),

    it('finds club points race info', function (done) {
        if (_.isEmpty(clubPointsRaces)) {
            var browser = new Browser();
            browser.runScripts = false;
            browser.loadCSS = false;

            var years = [];
            _.each(races, function (race) {
                years.push(race.year);
            });
            years = _.uniq(years);

            _.each(years, function (year, i) {
                browser.visit(constants.CLUB_POINTS_DATA_URL + year, function () {
                    var pageBody = browser.text();
                    var pageJson = JSON.parse(pageBody);

                    _.each(constants.CLUB_POINTS_TYPES, function (type) {
                        var labels = _.find(pageJson.data, function (item) {
                            if (item.type === type && item.is_label === '1') {
                                return item;
                            }
                        });
                        _.each(labels.data, function (label) {
                            if (constants.CLUB_POINTS_NON_RACE_LABELS.indexOf(label) === -1) {
                                var parts = label.split('-');
                                var raceData = {};
                                raceData[constants.DATA_KEYS.CLUB_POINTS.DATE] = parts[0];
                                raceData[constants.DATA_KEYS.CLUB_POINTS.DISTANCE] = parts[1];
                                raceData[constants.DATA_KEYS.YEAR] = year;
                                raceData[constants.DATA_KEYS.CLUB_POINTS.TYPE] = type;
                                clubPointsRaces.push(raceData);
                            }
                        });
                    });

                    logger.info('Parsed club points race info for ' + year);
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
        collection.find().toArray(function (err, docs) {
            _.each(docs, function (item) {
                raceOverrideData[item[DATA_KEYS.RACE_ID]] = item[DATA_KEYS.OVERRIDE.DATA];
            });
            done();
        });
    }),

    it('parses data', function (done) {
        var browser = new Browser();
        browser.runScripts = false;
        browser.loadCSS = false;

        var parseRace = function (i) {
            if (races[i]) {
                var race = races[i];
                if (!savedRaces[race.id]) {
                    var url = getRaceUrl(race.id, race.year);
                    browser.visit(url, function () {
                        raceDetails = parseRaceDetails(race.id, browser.html());
                        browser.choose('input[value="' + resultsPerPage + '"]');
                        browser.pressButton(constants.SELECTORS.SEARCH_BUTTON);
                        browser.wait(function () {
                            var parseNextRace = function () {
                                parseRace(i+1);
                            };
                            race.name = $(browser.html()).find(constants.SELECTORS.RACE_NAME).text();
                            var saveResults = function (results) {
                                raceResults = raceResults.concat(results);
                                parseRaceData(race, raceDetails, browser, parseNextRace);
                            };
                            parseResults(race, browser, saveResults);
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
        if (irregularRaces.length > 0) {
            var parseRace = function (i) {
                var saveRaceData = function (data) {
                    if (data) {
                        raceResults = raceResults.concat(data.results);
                        raceData[data.raceData[constants.DATA_KEYS.DB_ID]] = data.raceData;
                        _.extend(headingData, data.headingData);
                    }
                    parseRace(i+1);
                };
                if (irregularRaces[i]) {
                    if (!savedRaces[irregularRaces[i][DATA_KEYS.DB_ID]]) {
                        parseIrregularRaceData(irregularRaces[i], saveRaceData);
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
        if (!_.isEmpty(raceData)) {
            var createDate = new Date();
            var onDbError = function (err, objects) {
                if (err) throw (err);
            };

            var collection = db.collection(constants.DB_COLLECTIONS.RACE);
            _.each(raceData, function (race, key) {
                race[constants.DATA_KEYS.CREATED_AT] = createDate;
                race[constants.DATA_KEYS.UPDATED_AT] = createDate;
                collection.insert(race, {w:1}, onDbError); 
            });

            collection = db.collection(constants.DB_COLLECTIONS.HEADING);
            _.each(headingData, function (heading, key) {
                var query = {};
                query[constants.DATA_KEYS.DB_ID] = heading[constants.DATA_KEYS.DB_ID];
                collection.update(query, heading, {upsert:true}, onDbError);
            });

            collection = db.collection(constants.DB_COLLECTIONS.RESULT);
            _.each(raceResults, function (result) {
                collection.insert(result, {w:1}, onDbError);
            });

            collection = db.collection(constants.DB_COLLECTIONS.CLUB_POINTS_RACE);
            _.each(clubPointsRaces, function (data, key) {
                if (!data[constants.DATA_KEYS.DB_ID]) {
                    collection.insert(data, {w:1}, onDbError);
                }
            });

            collection = db.collection(constants.DB_COLLECTIONS.TEAM);
            _.each(teamData, function (team, key) {
                collection.insert(team, {w:1}, onDbError);
            });

            logger.info('All new data saved');
            done();
        } else {
            logger.info('No new data saved');
            done();
        }
    }),

    it ('waits for any pending messages to finish sending', function (done) {
        waitForMessages(done);
    });
});

