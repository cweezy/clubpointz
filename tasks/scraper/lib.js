var _ = require('underscore');
var $ = require('jquery');
var constants = require('./constants').constants;


var lib = {

    /**
     * Parses keys and labels for a list of text headings.
     * Also transforms and returns headingData by adding any new headings.
     */
    getHeadingData : function (headings, headingData) {
        var resultKeys = [];                                                                                                                  
        headingData = headingData || {};
        _.each(headings, function (heading) {
            var text = $(heading).html().replace(/<br \/>/g, ' ');
            // TODO clean this up
            var key = text.replace(/\s/g, '_').replace('&nbsp;', '_').replace('__', '_').replace('.', '').replace(/\//, '').toLowerCase();
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
    },

    /**
     * Parses all results of a race, page by page
     * Arguments:
     *    browser: browser instance
     *    race: race object {id : 'id', name : 'name'}
     *    resultKeys : list of data keys we're concerned with parsing
     *    rowSelector : CSS selector for a table row of data
     *    maxResults : maximum number of results to parse
     *    resultsPerPage : number of results to parse per page
     */
    parseResults : function (browser, race, resultKeys, rowSelector, maxResults, resultsPerPage, callback) {
        if (race.name) {
            console.log('\nParsing results for ' + race.name);
        }
        var results = [];
        var allResultsParsed = false;
        var parsePage = function (startIndex) {
            console.log('Parsing results ' + startIndex + '-' + parseInt(startIndex + resultsPerPage));

            var pageBody = browser.html();
            _.each($(pageBody).find(rowSelector), function (row, i) {
                results[startIndex + i] = {};
                results[startIndex + i][constants.DATA_KEYS.RACE_ID] = race.id;
                _.each($(row).find('td'), function (cell, j) {
                    results[startIndex + i][resultKeys[j]] = $(cell).html();
                });
            });

            var nextButton = $(pageBody).find('a:contains("' + constants.NEXT_BTN_TEXT + ' ' + resultsPerPage + '")');
            if (results.length < maxResults && $(nextButton).length > 0) {
                var nextUrl = $(nextButton).attr('href');
                browser.visit(nextUrl, function () {                                                                                          
                    parsePage(startIndex + resultsPerPage);                
                });
                browser.wait();
            } else {
                console.log('Parsed ' + results.length + ' results');
                callback(results);
            }
        };
        parsePage(0);
    },

    /**
     * Returns an object of data describing a race
     * Arguments:
     *    id : race id
     *    name : race name
     *    details : object of race details
     *    isClubPoints : list of boolean values [isClubPointsMen, isClubPointsWomen]
     */
    makeRaceData : function (id, name, year, details, isClubPoints) {
        raceData = {};
        raceData[constants.DATA_KEYS.RACE.ID] = id;                                                                         
        raceData[constants.DATA_KEYS.DB_ID] = id;                                                                           
        raceData[constants.DATA_KEYS.RACE.NAME] = name;                                                                     
        raceData[constants.DATA_KEYS.RACE.IS_CLUB_POINTS_MEN] = isClubPoints[0];                                                 
        raceData[constants.DATA_KEYS.RACE.IS_CLUB_POINTS_WOMEN] = isClubPoints[1];                                               
        raceData[constants.DATA_KEYS.YEAR] = year;                                                                          
        raceData[constants.DATA_KEYS.RACE.DETAILS] = details;

        return raceData;
    }
};

exports.lib = lib;

