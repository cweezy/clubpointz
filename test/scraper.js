var Browser = require('zombie');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var $ = require('jquery');
var _ = require('underscore');

// to be skipped, TODO figure out better way to do this
var MARATHON_ID = 'b31103';

var MAX_RACE_RESULTS = 2500;
var RESULTS_PER_PAGE = 500;  // can be 50 or 500

var DB_CONNECTION = 'mongodb://localhost:27017/clubpointz';
var RESULT_MAIN_URL = 'http://web2.nyrrc.org/cgi-bin/htmlos.cgi/aes-programs/results/resultsarchive.htm';
var RACE_PAGE_BASE_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/aes-programs/results/startup.html';
var EXPECTED_RESULT_MAIN_TITLE = 'NYRR Race Results';

var URL_KEYS = {
    RACE_ID : 'result.id',
    YEAR : 'result.year'
};

var DATA_KEYS = {
    DB_ID : '_id',
    CREATED_AT : 'createdAt',
    UPDATED_AT : 'updatedAt',
    RACE : {
        ID : 'id',
        NAME : 'name',
        DETAILS : 'details'
    },
    HEADING : {
        TEXT : 'text'
    },
    RESULT : {
        RACE_ID : 'raceId'
    }
};

var races = [];
var raceResults = [];
var raceData = {};
var headingData = {};

var getRaceUrl = function(raceId, year) {
    return RACE_PAGE_BASE_URL + '?' + URL_KEYS.RACE_ID + '=' + raceId + '&' + URL_KEYS.YEAR + '=' + year;
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
            headingData[key][DATA_KEYS.HEADING.TEXT] = text;
            headingData[key][DATA_KEYS.DB_ID] = key;
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
    raceData[raceId][DATA_KEYS.RACE.DETAILS] = raceDetails;
};

var parseResults = function (raceId, pageBody, browser, callback) {
    var headings = $(pageBody).find('.heading');
    var resultKeys = getResultKeys(headings);
    var tbody  = $(pageBody).find('.heading').closest('tbody');
    var raceName = $(pageBody).find('.bighead').text();

    console.log('Parsing results for ' + raceName);

    var results = [];
    var parsePage = function (startIndex, callback) {
        console.log('Parsing results ' + startIndex + '-' + parseInt(startIndex + RESULTS_PER_PAGE));
        _.each($(tbody.find('tr:not(:has(.heading))')), function (row, i) {
            results[startIndex + i] = {};
            results[startIndex + i][DATA_KEYS.RESULT.RACE_ID] = raceId;
            _.each($(row).find('td'), function (cell, j) {
                results[startIndex + i][resultKeys[j]] = $(cell).html();
            });        
        });
        if (results.length < MAX_RACE_RESULTS && $(pageBody).find('a:contains("NEXT ' + RESULTS_PER_PAGE + '")').length > 0) {
            $(pageBody).find('a:contains("NEXT ' + RESULTS_PER_PAGE + '")').click();
            browser.wait(function () {
                parsePage(startIndex + RESULTS_PER_PAGE, callback);
            });
        } else {
            callback();
        }
    };

    var storeRaceData = function () {
        if (!raceData[raceId]) {
            raceData[raceId] = {};
        }
        raceData[raceId][DATA_KEYS.RACE.ID] = raceId;
        raceData[raceId][DATA_KEYS.DB_ID] = raceId;
        raceData[raceId][DATA_KEYS.RACE.NAME] = raceName;
        raceResults = raceResults.concat(results);

        console.log('Parsed ' + results.length + ' results');
        callback();
    };

    parsePage(0, storeRaceData);
};

var getSavedRaces = function (callback) {
    var resultsSaved = {};
    MongoClient.connect(DB_CONNECTION, function (err, db) {
        if (err) throw err;
        var collection = db.collection('race');
        _.each(races, function (race, i) {
            var raceId = race[DATA_KEYS.RACE.ID];
            var queryData = {};
            queryData[DATA_KEYS.RACE.ID] = raceId;
            collection.find(queryData).toArray(function (err, docs) {
                if (err) throw err;
                resultsSaved[raceId] = docs.length > 0;
                if (_.keys(resultsSaved).length === _.keys(races).length) {
                   db.close();
                   callback(resultsSaved);
                }
            });
        });
    });
};

var saveResults = function (done) {
    if (!_.isEmpty(raceData)) {
        MongoClient.connect(DB_CONNECTION, function (err, db) {
            if (err) throw err;
            var onDbError = function (err, objects) {
                if (err) console.warn(err.message);
            }
            var createDate = new Date();

            var collection = db.collection('race');
            _.each(raceData, function (race, key) {
                race[DATA_KEYS.CREATED_AT] = createDate;
                race[DATA_KEYS.UPDATED_AT] = createDate;
                collection.insert(race, {w:1}, onDbError); 
            });
            var collection = db.collection('heading');
            _.each(headingData, function (heading, key) {
                heading[DATA_KEYS.CREATED_AT] = createDate;
                heading[DATA_KEYS.UPDATED_AT] = createDate;
                collection.insert(heading, {w:1}, onDbError);
            });
            var collection = db.collection('result');
            _.each(raceResults, function (result) {
                collection.insert(result, {w:1}, onDbError);
            });

            db.close();
            done();
        });
    } else {
        done();
    }
};

describe('Scraper', function () {

    it('gets new race data', function (done) {
        var browser = new Browser();
        browser.visit(RESULT_MAIN_URL, function () {
            assert.equal(EXPECTED_RESULT_MAIN_TITLE, browser.text('title'));
            var linkHtml = browser.html('td[class="text"] a');
            var links = linkHtml.split('</a>');
            _.each(links, function (link) {
                var matches = link.match(/href="(.+)"/);
                if (matches !== null) {
                    var linkUrl = matches[1];             
                    if (linkUrl && linkUrl.indexOf(RACE_PAGE_BASE_URL) !== -1) {
                        var urlParams = parseUrlParams(linkUrl);
                        var raceId = urlParams[URL_KEYS.RACE_ID];
                        var year = urlParams[URL_KEYS.YEAR];
                        // Skip the marathon because it's an irregular page
                        if (raceId !== MARATHON_ID) {
                            races.push({
                                'id' : raceId,
                                'year' : year
                            });
                        }
                    }
                }
            });
            done();
        });
    }),

    it('parses and saves data', function (done) {
        var browser = new Browser();
        var visitRacePage = function (i, savedRaces) {
            if (races[i]) {
                var race = races[i];
                if (!savedRaces[race.id]) {
                    var url = getRaceUrl(race.id, race.year);
                    browser.visit(url, function () {
                        parseRaceDetails(race.id, browser.html());
                        browser.choose('input[value="' + RESULTS_PER_PAGE + '"]');
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
                console.log('Saving results for ' + _.keys(raceData).length + ' race(s)');
                saveResults(done);
            }
        };
        var getNewResults = function (savedRaces) {
            visitRacePage(0, savedRaces);
        }
        getSavedRaces(getNewResults);
    });
});
