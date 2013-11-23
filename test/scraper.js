var Browser = require('zombie');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var $ = require('jquery');
var _ = require('underscore');

var MARATHON_ID = 'b31103';

var RACE_RESULT_BASE = 'http://web2.nyrrc.org/cgi-bin/htmlos.cgi/aes-programs/results/resultsarchive.htm';
var EXPECTED_RACE_RESULT_BASE_TITLE = 'NYRR Race Results';

var BASE_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/aes-programs/results/startup.html';
var EXPECTED_PAGE_TITLE = 'NYRR Race Results Startup';

var RACE_ID_KEY = 'result.id';
var YEAR_KEY = 'result.year';

var TEMP_DATA_DIR = 'temp';
var TEMP_DATA_FILE = 'temp.json';

var browser = new Browser();
var races = [];
var raceData = {};

var RACE_NAME_KEY = "raceName";
var RESULTS_KEY = "results";
var HEADING_TO_KEY = {
    'Last Name' : 'lastName',
    'First Name' : 'firstName',
    'Sex/Age' : 'sexAge',
    'Bib' : 'bib',
    'Team' : 'team',
    'City' : 'city',
    'State' : 'state',
    'Country' : 'country',
    'OverallPlace' : 'overallPlace',
    'GenderPlace' : 'genderPlace',
    'AgePlace' : 'agePlace',
    'NetTime' : 'netTime',
    'FinishTime' : 'finishTime',
    'PaceperMile' : 'pacePerMile',
    'AGTime' : 'agTime',
    'AGGenderPlace' : 'agGenderPlace',
    'AG %' : 'agPercet',
    '10KSplit' : '10kSplit'
};

var getResultKeys = function (headings) {
    var resultKeys = [];
    _.each(headings, function (heading) {
        var key = HEADING_TO_KEY[$(heading).text()];
        if (key) {
            resultKeys.push(key);
        } else {
            // TODO: this should probably generate some kind of alert
            console.log('WARNING: unknown heading: ' + $(heading).text());
        }
    });
    return resultKeys;
};

var getUrl = function(raceId, year) {
    return BASE_URL + '?' + RACE_ID_KEY + '=' + raceId + '&' + YEAR_KEY + '=' + year;
};

var safeParse = function(str) {
    return str.replace('.', '\\.');
};

var parseResults = function (raceId, pageBody) {
    var results = {}; 
    var headings = $(pageBody).find('.heading');
    var resultKeys = getResultKeys(headings);
    var tbody  = $(pageBody).find('.heading').closest('tbody');

    results[RACE_NAME_KEY] = $(pageBody).find('.bighead').text();
    results[RESULTS_KEY] = []

    _.each($(tbody.find('tr')), function (row, i) {
        // Skip the first row cuz it's headings
        // TODO this could be done more elegantly
        if (i > 0) {
            results[RESULTS_KEY][i] = {};
            _.each($(row).find('td'), function (cell, j) {
                results[RESULTS_KEY][i][resultKeys[j]] = $(cell).html();
            });        
        }
    });
    raceData[raceId] = results;
};

var outputResults = function () {
    fs.mkdirSync(TEMP_DATA_DIR);
    fs.writeFileSync(TEMP_DATA_DIR + path.sep + TEMP_DATA_FILE, JSON.stringify(raceData));
};

describe('Scraper', function () {

    it('gets new race data', function (done) {
        browser.visit(RACE_RESULT_BASE, function () {
            assert.equal(EXPECTED_RACE_RESULT_BASE_TITLE, browser.text('title'));
            var linkHtml = browser.html('td[class="text"] a');
            var links = linkHtml.split('</a>');
            _.each(links, function (link) {
                var matches = link.match(/href="(.+)"/);
                if (matches !== null) {
                    var linkUrl = matches[1];             
                    if (linkUrl && linkUrl.indexOf(BASE_URL) !== -1) {
                        var raceId = linkUrl.match(new RegExp(safeParse(RACE_ID_KEY) + '=(.+)&'))[1];
                        var year = linkUrl.match(new RegExp(safeParse(YEAR_KEY) + '=(.+)$'))[1];
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
        var visitRacePage = function (i) {
            if (races[i]) {
                var race = races[i];
                var url = getUrl(race.id, race.year);
                browser.visit(url, function () {
                    var title = browser.html('span[class="bighead"]');
                    browser.pressButton('input[value="SEARCH"]');
                    browser.wait(function () {
                        parseResults(race.id, browser.html());
                        visitRacePage(i+1);
                    });
                });
            } else {
                // TODO have local vars for results instead of globals
                outputResults();
                done();
            }
        };
        visitRacePage(0);
    });
});
