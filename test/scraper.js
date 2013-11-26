var Browser = require('zombie');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var $ = require('jquery');
var _ = require('underscore');

// to be skipped, TODO figure out better way to do this
var MARATHON_ID = 'b31103';

var DB_CONNECT = 'mongodb://localhost:27017/clubpointz';
var RESULT_MAIN_URL = 'http://web2.nyrrc.org/cgi-bin/htmlos.cgi/aes-programs/results/resultsarchive.htm';
var RACE_PAGE_BASE_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/aes-programs/results/startup.html';
var EXPECTED_RESULT_MAIN_TITLE = 'NYRR Race Results';

var URL_KEYS = {
    RACE_ID : 'result.id',
    YEAR : 'result.year'
};

var DATA_KEYS = {
    DB_ID : '_id',
    CREATE_DATE : 'create_date',
    RACE : {
        ID : 'id',
        NAME : 'name',
        RESULTS : 'results'
    },
    HEADING : {
        TEXT : 'text'
    }
};

var races = [];
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
        var key = text.replace(/\s/g, '_').toLowerCase();
        resultKeys.push(key);
        if (!headingData[key]) {
            headingData[key] = {};
            headingData[key][DATA_KEYS.HEADING.TEXT] = text;
            headingData[key][DATA_KEYS.DB_ID] = key;
        }
    });
    return resultKeys;
};

var parseResults = function (raceId, pageBody) {
    var results = {}; 
    var headings = $(pageBody).find('.heading');
    var resultKeys = getResultKeys(headings);
    var tbody  = $(pageBody).find('.heading').closest('tbody');

    results = [];
    _.each($(tbody.find('tr').not('.heading')), function (row, i) {
        results[i] = {};
        _.each($(row).find('td'), function (cell, j) {
            results[i][resultKeys[j]] = $(cell).html();
        });        
    });
    raceData[raceId] = {};
    raceData[raceId][DATA_KEYS.RACE.ID] = raceId;
    raceData[raceId][DATA_KEYS.RACE.RESULTS] = results;
    raceData[raceId][DATA_KEYS.RACE.NAME] = $(pageBody).find('.bighead').text();
    raceData[raceId][DATA_KEYS.DB_ID] = raceId;
};

var outputResults = function () {
    fs.mkdirSync(TEMP_DATA_DIR);
    fs.writeFileSync(TEMP_DATA_DIR + path.sep + TEMP_DATA_FILE, JSON.stringify(raceData));
};

var getSavedRaces = function (callback) {
    var resultsSaved = {};
    MongoClient.connect(DB_CONNECT, function (err, db) {
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
        MongoClient.connect(DB_CONNECT, function (err, db) {
            if (err) throw err;
            var createDate = new Date();

            var collection = db.collection('race');
            _.each(raceData, function (race, key) {
                race[DATA_KEYS.CREATE_DATE] = createDate;
                collection.insert(race, {w:1}, function (err, objects) {
                    if (err) console.warn(err.message);
                });
            });
            var collection = db.collection('heading');
            _.each(headingData, function (heading, key) {
                heading[DATA_KEYS.CREATE_DATE] = createDate;
                collection.insert(heading, {w:1}, function (err, objects) {
                    if (err) console.warn(err.message);
                });
            }); 

            db.close();
            done();
        });
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
                        console.log(raceId + " / " + year);
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

    it('gets data', function (done) {
        var browser = new Browser();
        var visitRacePage = function (i, savedRaces) {
            if (races[i]) {
                var race = races[i];
                if (!savedRaces[race.id]) {
                    var url = getRaceUrl(race.id, race.year);
                    browser.visit(url, function () {
                        var title = browser.html('span[class="bighead"]');
                        browser.pressButton('input[value="SEARCH"]');
                        browser.wait(function () {
                            var html = browser.html();
                            parseResults(race.id, html);
                            visitRacePage(i+1, savedRaces);
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
