var _ = require('underscore');
var $ = require('jquery');
var constants = require('./constants').constants;

/**
 * Parses keys and labels for a list of text headings.
 * Also transfrom and return headingData by adding any new headings.
 */
var getHeadingData = function (headings, headingData) {
    var headingData = headingData || {};
    var resultKeys = [];                                                                                                                  
    _.each(headings, function (heading) {
        var text = $(heading).html().replace(/\<br \/\>/g, ' ');
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
};

var parseResultsPage = function (browser, race, resultKeys, rowSelector, maxResults, resultsPerPage) {
    if (race.name) {
        console.log('\nParsing results for ' + race.name);
    }
    var results = [];
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
        } else {
            console.log('Parsed ' + results.length + ' results');
            return results;
        }
    };
    return parsePage(0);
};

exports.getHeadingData = getHeadingData;
exports.parseResultsPage = parseResultsPage;


