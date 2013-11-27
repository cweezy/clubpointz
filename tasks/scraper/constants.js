var constants = function () {

    this.IRREGULAR_RACES = ['b31103'];

    this.MAX_RACE_RESULTS = 200;
    this.RESULTS_PER_PAGE = 50;  // can be 50 or 500

    this.MONGO_URI = 'mongodb://localhost:27017/clubpointz';
    this.DB_COLLECTIONS = {
        RACE : 'race',
        RESULT : 'result',
        HEADING : 'heading'
    };

    this.RESULT_MAIN_URL = 'http://web2.nyrrc.org/cgi-bin/htmlos.cgi/aes-programs/results/resultsarchive.htm';
    this.RACE_PAGE_BASE_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/aes-programs/results/startup.html';
    this.EXPECTED_RESULT_MAIN_TITLE = 'NYRR Race Results';

    this.NEXT_BTN_TEXT = 'NEXT';
    this.SELECTORS = {
        RACE_DETAILS : 'span.text b',
        RACE_NAME : '.bighead',
        RACE_LINK : 'td[class="text"] a',
        HEADING : '.heading',
        SEARCH_BUTTON : 'input[value="SEARCH"]'
    };

    this.URL_KEYS = {
        RACE_ID : 'result.id',
        YEAR : 'result.year'
    };

    this.DATA_KEYS = {
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

    return this;
};

exports.constants = constants();
