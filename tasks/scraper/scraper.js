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

var parseRaceDetails = function (raceId, pageBody) {
    var detailText = $($(pageBody).find('span.text b').parent()).text();
    var details = detailText.split('\r');
    var raceDetails = {};
    _.each(details, function (detail) {
        // TODO don't split times
        var detailParts = detail.split(':');
        if (detailParts.length > 1) {
            raceDetails[$.trim(detailParts[0])] = $.trim(detailParts[1]);
        }
    });
    if (!raceData[raceId]) {
        raceData[raceId] = {};
    }
    raceData[raceId][constants.DATA_KEYS.RACE.DETAILS] = raceDetails;
};

var parseResults = function (raceId, pageBody, browser, callback) {
    var headings = $(pageBody).find('.heading');
    var resultKeys = getResultKeys(headings);
    var tbody  = $(pageBody).find('.heading').closest('tbody');
    var raceName = $(pageBody).find('.bighead').text();

    console.log('\nParsing results for ' + raceName);

    var results = [];
    var parsePage = function (startIndex, callback) {
        console.log('Parsing results ' + startIndex + '-' + parseInt(startIndex + resultsPerPage));
        _.each($(tbody.find('tr:not(:has(.heading))')), function (row, i) {
            results[startIndex + i] = {};
            results[startIndex + i][constants.DATA_KEYS.RESULT.RACE_ID] = raceId;
            _.each($(row).find('td'), function (cell, j) {
                results[startIndex + i][resultKeys[j]] = $(cell).html();
            });        
        });
        if (results.length < maxResults && $(pageBody).find('a:contains("NEXT ' + resultsPerPage + '")').length > 0) {
            $(pageBody).find('a:contains("NEXT ' + resultsPerPage + '")').click();
            browser.wait(function () {
                parsePage(startIndex + resultsPerPage, callback);
            });
        } else {
            callback();
        }
    };

    var storeRaceData = function () {
        if (!raceData[raceId]) {
            raceData[raceId] = {};
        }
        raceData[raceId][constants.DATA_KEYS.RACE.ID] = raceId;
        raceData[raceId][constants.DATA_KEYS.DB_ID] = raceId;
        raceData[raceId][constants.DATA_KEYS.RACE.NAME] = raceName;
        raceResults = raceResults.concat(results);

        console.log('Parsed ' + results.length + ' results');
        callback();
    };

    parsePage(0, storeRaceData);
};

var getSavedRaces = function (callback) {
    var resultsSaved = {};
    var collection = db.collection('race');
    _.each(races, function (race, i) {
        var raceId = race[constants.DATA_KEYS.RACE.ID];
        var queryData = {};
        queryData[constants.DATA_KEYS.RACE.ID] = raceId;
        collection.find(queryData).toArray(function (err, docs) {
            if (err) throw err;
            resultsSaved[raceId] = docs.length > 0;
            if (_.keys(resultsSaved).length === races.length) {
                callback(resultsSaved);
            }
        });
    });
};

var saveResults = function (done) {
    if (!_.isEmpty(raceData)) {
        var createDate = new Date();
        var onDbError = function (err, objects) {
            if (err) console.log(err);
        };

        var collection = db.collection('race');
        _.each(raceData, function (race, key) {
            race[constants.DATA_KEYS.CREATED_AT] = createDate;
            race[constants.DATA_KEYS.UPDATED_AT] = createDate;
            collection.insert(race, {w:1}, onDbError); 
        });
        var collection = db.collection('heading');
        _.each(headingData, function (heading, key) {
            collection.update(heading, {upsert:true}, onDbError);
        });
        var collection = db.collection('result');
        _.each(raceResults, function (result) {
            collection.insert(result, {w:1}, onDbError);
        });

        done();
    } else {
        done();
    }
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
                var linkHtml = browser.html('td[class="text"] a');
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

    it('parses and saves data', function (done) {
        var browser = new Browser();
        browser.runScripts = false;
        var visitRacePage = function (i, savedRaces) {
            if (races[i]) {
                var race = races[i];
                if (!savedRaces[race.id]) {
                    var url = getRaceUrl(race.id, race.year);
                    browser.visit(url, function () {
                        parseRaceDetails(race.id, browser.html());
                        browser.choose('input[value="' + resultsPerPage + '"]');
                        browser.pressButton('input[value="SEARCH"]');
                        browser.wait(function () {
                            var visitNextPage = function () {
                                visitRacePage(i+1, savedRaces);
                            };
                            parseResults(race.id, browser.html(), browser, visitNextPage);
                        });
                    });
                } else {
                    visitRacePage(i+1, savedRaces);
                }
            } else {
                var raceCount = _.keys(raceData).length;
                if (raceCount === 0) {
                    console.log('\nNo new data to save\n');
                } else {
                    console.log('\nSaving new data for ' + raceCount + ' race' + (raceCount === 1 ? '' : 's') + '\n');
                }
                saveResults(done);
            }
        };
        var getNewResults = function (savedRaces) {
            visitRacePage(0, savedRaces);
        }
        getSavedRaces(getNewResults);
    });
});
