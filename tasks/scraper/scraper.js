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

var determineIfClubPoints = function (pageBody) {
    var awardSections = $(pageBody).find('pre');
    return awardSections.length > 100;
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

var parseResults = function (raceId, browser, callback) {
    var pageBody = browser.html();
    var headings = $(pageBody).find(constants.SELECTORS.HEADING);
    var raceName = $(pageBody).find(constants.SELECTORS.RACE_NAME).text();
    var resultKeys = getResultKeys(headings);
    var isClubPoints = false;

    console.log('\nParsing results for ' + raceName);

    var results = [];
    var parsePage = function (startIndex, callback) {
        console.log('Parsing results ' + startIndex + '-' + parseInt(startIndex + resultsPerPage));

        var pageBody = browser.html();
        var tbody  = $(pageBody).find(constants.SELECTORS.HEADING).closest('tbody');
        _.each($(tbody.find('tr:not(:has(' + constants.SELECTORS.HEADING + '))')), function (row, i) {
            results[startIndex + i] = {};
            results[startIndex + i][constants.DATA_KEYS.RACE_ID] = raceId;
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
                isClubPoints = determineIfClubPoints(browser.html());
                callback(); 
            });
        }
    };

    var storeRaceData = function () {
        if (!raceData[raceId]) {
            raceData[raceId] = {};
        }
        raceData[raceId][constants.DATA_KEYS.RACE.ID] = raceId;
        raceData[raceId][constants.DATA_KEYS.DB_ID] = raceId;
        raceData[raceId][constants.DATA_KEYS.RACE.NAME] = raceName;
        raceData[raceId][constants.DATA_KEYS.RACE.IS_CLUB_POINTS] = isClubPoints;
        raceResults = raceResults.concat(results);

        raceData[raceId] = overrideRaceData(raceData[raceId]);

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
                })
                console.log('\nFound ' + races.length + ' races on web');
                done();
            });
        } else {
            console.log('\nFound ' + races.length + ' races in file');
            done();
        }
    }),

    it('finds saved races', function (done) {
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

    it('parses and saves data', function (done) {
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
                            parseResults(race.id, browser, visitNextPage);
                        });
                    });
                } else {
                    visitRacePage(i+1);
                }
            } else {
                var raceCount = _.keys(raceData).length;
                if (raceCount === 0) {
                    console.log('\nNo new data to save\n');
                } else {
                    console.log('\nSaving new data for ' + raceCount + ' race' + (raceCount === 1 ? '' : 's') + '\n');
                }
                done();
            }
        };

        visitRacePage(0);
    }),

    it('saves results', function (done) {
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
            var collection = db.collection(constants.DB_COLLECTIONS.HEADING);
            _.each(headingData, function (heading, key) {
                var query = {};
                query[constants.DATA_KEYS.DB_ID] = heading[constants.DATA_KEYS.DB_ID];
                collection.update(query, heading, {upsert:true}, onDbError);
            });
            var collection = db.collection(constants.DB_COLLECTIONS.RESULT);
            _.each(raceResults, function (result) {
                collection.insert(result, {w:1}, onDbError);
            });

            done();
        } else { 
            done();
        }
    });
});
