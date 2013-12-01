var Browser = require('zombie');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var $ = require('jquery');
var _ = require('underscore');
var constants = require('./constants').constants;


var maxResults = constants.MAX_RESULTS;
var resultsPerPage = constants.RESULTS_PER_PAGE;

var db;
var races = [];
var raceResults = [];
var clubPointsRaces = [];
var raceData = {};
var headingData = {};
var savedRaces = {};
var raceOverrideData = {};

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

var getResultKeys = function (headings) {
    var resultKeys = [];
    _.each(headings, function (heading) {
        var text = $(heading).html().replace(/\<br \/\>/g, ' ');
        var key = text.replace(/\s/g, '_').replace(/\//, '').toLowerCase();
        resultKeys.push(key);
        if (!headingData[key]) {
            headingData[key] = {};
            headingData[key][constants.DATA_KEYS.HEADING.TEXT] = text;
            headingData[key][constants.DATA_KEYS.DB_ID] = key;
        }
    });
    return resultKeys;
};

// Converts large date format to small
// Ex: 'November 1' becomes '11/1'
var getSmallDate = function (dateStr) {
    var dateStr = dateStr.split(',')[0];
    var dateParts = dateStr.split(' ');
    return constants.MONTH_TO_INDEX[dateParts[0]] + '/' + dateParts[1];
};

// Converts distance string to small format distances
// Ex: '18 miles, 29 kilometers' becomes ['18M', '29k']
var getSmallDistances = function (distanceStr) {
    var smallDistances = [];
    var distanceParts = distanceStr.split(',');
    _.each(distanceParts, function (distance) {
        distance = $.trim(distance);
        var parts = distance.split(' ');
        var smallUnit = constants.UNIT_TO_ABBR[parts[1]];
        if (!smallUnit) {
            console.log('\nWARNING: no unit found for ' + parts[1]);
        } else {
            smallDistances.push(parts[0] + smallUnit);
        }
    });
    return smallDistances;
};

var determineIfClubPoints = function (pageBody, raceId, raceYear) {
    // All team results are reported for club points races
    var allTeamsShown = $(pageBody).find('pre').length > 100;
    var isClubPointsMen = false;
    var isClubPointsWomen = false;

    // If all teams are shown, also check that race date/distance matches a club points race
    if (allTeamsShown) {
        var raceDate = getSmallDate(raceData[raceId].details['Date/Time']);
        var raceDistances = getSmallDistances(raceData[raceId].details['Distance']);

        _.each(raceDistances, function (distance) {
            _.each(clubPointsRaces, function (race) {
                if (race[constants.DATA_KEYS.CLUB_POINTS.DATE] === raceDate &&
                        race[constants.DATA_KEYS.YEAR] === raceYear &&
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
    if (!raceData[raceId]) {
        raceData[raceId] = {};
    }
    raceData[raceId][constants.DATA_KEYS.RACE.DETAILS] = raceDetails;
};

var parseResults = function (race, browser, callback) {
    var pageBody = browser.html();
    var headings = $(pageBody).find(constants.SELECTORS.HEADING);
    var raceName = $(pageBody).find(constants.SELECTORS.RACE_NAME).text();
    var resultKeys = getResultKeys(headings);
    var isClubPointsMen = false;
    var isClubPointsWomen = false;

    console.log('\nParsing results for ' + raceName);

    var results = [];
    var parsePage = function (startIndex, callback) {
        console.log('Parsing results ' + startIndex + '-' + parseInt(startIndex + resultsPerPage));

        var pageBody = browser.html();
        var tbody  = $(pageBody).find(constants.SELECTORS.HEADING).closest('tbody');
        _.each($(tbody.find('tr:not(:has(' + constants.SELECTORS.HEADING + '))')), function (row, i) {
            results[startIndex + i] = {};
            results[startIndex + i][constants.DATA_KEYS.RACE_ID] = race.id;
            _.each($(row).find('td'), function (cell, j) {
                results[startIndex + i][resultKeys[j]] = $(cell).html();
            });        
        });
        var nextButton = $(pageBody).find('a:contains("' + constants.NEXT_BTN_TEXT + ' ' + resultsPerPage + '")')
        if (results.length < maxResults && nextButton) {
            var nextUrl = $(nextButton).attr('href');
            browser.visit(nextUrl, function () {
                parsePage(startIndex + resultsPerPage, callback);
            });
        } else {
            var awardWinnersUrl = $(pageBody).find('a:contains("Award Winners")').attr('href');
            browser.visit(awardWinnersUrl, function () {
                var isClubPoints = determineIfClubPoints(browser.html(), race.id, race.year);
                isClubPointsMen = isClubPoints[0];
                isClubPointsWomen = isClubPoints[1];
           
                callback(); 
            });
        }
    };

    var storeRaceData = function () {
        if (!raceData[race.id]) {
            raceData[race.id] = {};
        }
        raceData[race.id][constants.DATA_KEYS.RACE.ID] = race.id;
        raceData[race.id][constants.DATA_KEYS.DB_ID] = race.id;
        raceData[race.id][constants.DATA_KEYS.RACE.NAME] = raceName;
        raceData[race.id][constants.DATA_KEYS.RACE.IS_CLUB_POINTS_MEN] = isClubPointsMen;
        raceData[race.id][constants.DATA_KEYS.RACE.IS_CLUB_POINTS_WOMEN] = isClubPointsWomen;
        raceData[race.id][constants.DATA_KEYS.YEAR] = race.year;
        raceResults = raceResults.concat(results);

        raceData[race.id] = overrideRaceData(raceData[race.id]);

        console.log('Parsed ' + results.length + ' results');
        callback();
    };

    parsePage(0, storeRaceData);
};

var overrideRaceData = function (raceData) {
    var overrideData = raceOverrideData[raceData[constants.DATA_KEYS.RACE.ID]];
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
            if (err) throw err;
            db = database;
            done();
        });
    }),

    it('sets max race results', function (done) {
        maxResults = process.env.MAX_RESULTS ? parseInt(process.env.MAX_RESULTS) : maxResults;
        // resultsPerPage = maxResults >= 500 ? 500 : resultsPerPage;
        done();
    }),

    it('gets new race data', function (done) {
        races = eval(process.env.RACES);
        if (!races || _.isEmpty(races)) {
            races = [];
            var browser = new Browser();
            browser.runScripts = false;
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
                            // Skip the marathon because it's an irregular page
                            if (!_.contains(constants.IRREGULAR_RACES, raceId)) {
                                races.push({
                                    'id' : raceId,
                                    'year' : year
                                });
                            }
                        }
                    }
                });
                console.log('\nFound ' + races.length + ' races on web');
                done();
            });
        } else {
            console.log('\nFound ' + races.length + ' races in file');
            done();
        }
    }),

    it('finds saved data', function (done) {
        var collection = db.collection(constants.DB_COLLECTIONS.RACE);
        _.each(races, function (race, i) {
            var raceId = race[constants.DATA_KEYS.RACE.ID];
            var queryData = {};
            queryData[constants.DATA_KEYS.RACE.ID] = raceId;
            collection.find(queryData).toArray(function (err, docs) {
                if (err) throw err;
                savedRaces[raceId] = docs.length > 0;
                if (_.keys(savedRaces).length === races.length) {
                    done();
                }
            });
        });
        var collection = db.collection(constants.DB_COLLECTIONS.CLUB_POINTS_RACE);
        collection.find().toArray(function (err, docs) {
            clubPointsRaces = docs;
        });
    }),

    it('finds club points race info', function (done) {
        if (_.isEmpty(clubPointsRaces)) {
            var browser = new Browser();
            browser.runScripts = false;

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

                    console.log('Parsed club points race info for ' + year);
                    if (i === years.length - 1) {
                        done();
                    }
                });
            });
        } else {
            done();
        }
    });

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

        var visitRacePage = function (i) {
            if (races[i]) {
                var race = races[i];
                if (!savedRaces[race.id]) {
                    var url = getRaceUrl(race.id, race.year);
                    browser.visit(url, function () {
                        parseRaceDetails(race.id, browser.html());
                        browser.choose('input[value="' + resultsPerPage + '"]');
                        browser.pressButton(constants.SELECTORS.SEARCH_BUTTON);
                        browser.wait(function () {
                            var visitNextPage = function () {
                                visitRacePage(i+1);
                            };
                            parseResults(race, browser, visitNextPage);
                        });
                    });
                } else {
                    visitRacePage(i+1);
                }
            } else {
                var raceCount = _.keys(raceData).length;
                if (raceCount > 0) {
                    console.log('\nParsed new data for ' + raceCount + ' race' + (raceCount === 1 ? '' : 's') + '\n');
                }
                done();
            }
        };

        visitRacePage(0);
    }),

    it('saves data', function (done) {
        if (!_.isEmpty(raceData)) {
            var createDate = new Date();
            var onDbError = function (err, objects) {
                if (err) console.log(err);
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

            console.log('All new data saved');
            done();
        } else {
            console.log('\nNo new data saved');
            done();
        }
    });
});
