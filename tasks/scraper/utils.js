var _ = require('underscore');
var $ = require('jquery');
var constants = require('./constants').constants;
var logger = require('./../logger').logger;

/**
 * Utility functions for scraper
 */
var utils = {

    /**
     * Parses keys and labels for a list of text headings.
     * Also transforms and returns headingData by adding any new headings.
     */
    getHeadingData : function (headings, headingData) {
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
     *    dataTransforms : map of data keys to functions to be called
     *        if data needs transformation
     *    callback
     */
    parseResults : function (browser, race, resultKeys, rowSelector, maxResults, resultsPerPage, dataTransforms, callback) {
        if (race.name) {
            logger.infoGroup(true, 'Parsing results for ' + race.name);
        }
        var results = [];
        var allResultsParsed = false;
        var that = this;
        var parsePage = function (startIndex) {
            logger.infoGroup(false, 'Parsing results ' + startIndex + '-' + parseInt(startIndex + resultsPerPage, 10));

            var pageBody = browser.html();
            _.each($(pageBody).find(rowSelector), function (row, i) {
                results[startIndex + i] = {};
                results[startIndex + i][constants.DATA_KEYS.RACE_ID] = race.id;
                _.each($(row).find('td'), function (cell, j) {
                    var data = $(cell).html();
                    if (that.isTime(data)) {
                        data = that.timeToSeconds(data);
                    } else {
                        data = String(data);
                    }
                    var key = resultKeys[j];
                    if (dataTransforms[key]) {
                        results[startIndex + i][key] = dataTransforms[key](data);
                    } else {
                        results[startIndex + i][key] = data;
                    }
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
                logger.infoGroup(false, 'Parsed ' + results.length + ' results');
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
     *    isTeamChamps : whether race is a Team Championship race
     */
    makeRaceData : function (id, name, year, details, isClubPoints, isTeamChamps) {
        raceData = {};
        raceData[constants.DATA_KEYS.DB_ID] = id;                                                                           
        raceData[constants.DATA_KEYS.NAME] = name;                                                                     
        raceData[constants.DATA_KEYS.RACE.IS_CLUB_POINTS_MEN] = isClubPoints[0];                                                 
        raceData[constants.DATA_KEYS.RACE.IS_CLUB_POINTS_WOMEN] = isClubPoints[1];                                               
        raceData[constants.DATA_KEYS.YEAR] = year;                                                                          
        raceData[constants.DATA_KEYS.RACE.DETAILS] = details;
        raceData[constants.DATA_KEYS.RACE.IS_TEAM_CHAMPS] = isTeamChamps;

        return raceData;
    },

    isTime : function (value) {
        var matches = String(value.match(/([0-9]+:)([0-9]+:?)*/g));
        return matches === value;
    },

    timeToSeconds : function (time) {
        var values = (time.split(':').reverse());
        var seconds = 0;
        _.each(values, function (value, i) {
           var factor = Math.pow(60, i);
           seconds = seconds + parseInt(value, 10) * factor;
        });
        return seconds;
    }
};

exports.utils = utils;

