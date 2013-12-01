var constants = function () {

    this.IRREGULAR_RACES = ['b31103'];

    this.MAX_RACE_RESULTS = 200;
    this.RESULTS_PER_PAGE = 50;  // can be 50 or 500

    this.MONGO_URI = 'mongodb://localhost:27017/clubpointz';
    this.DB_COLLECTIONS = {
        RACE : 'race',
        RESULT : 'result',
        HEADING : 'heading',
        RACE_OVERRIDE : 'race_override',
        CLUB_POINTS_RACE : 'club_points_race'
    };

    this.RESULT_MAIN_URL = 'http://web2.nyrrc.org/cgi-bin/htmlos.cgi/aes-programs/results/resultsarchive.htm';
    this.RACE_PAGE_BASE_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/aes-programs/results/startup.html';
    this.CLUB_POINTS_DATA_URL = 'http://www.nyrr.org/causes-and-community/local-clubs/club-standings-search/2013';
    this.EXPECTED_RESULT_MAIN_TITLE = 'NYRR Race Results';

    this.CLUB_POINTS_TYPES = ['OPEN MEN A', 'OPEN WOMEN A'];
    this.CLUB_POINTS_NON_RACE_LABELS = ['OPEN MEN A', 'OPEN WOMEN A', 'TEAM', 'TOTAL'];
    this.CLUB_POINTS_KEYS = {
        MEN : 'men',
        WOMEN : 'women'
    };
    this.CLUB_POINTS_TYPE_TO_KEY = {
        'OPEN MEN A' : this.CLUB_POINTS_KEYS.MEN,
        'OPEN WOMEN A' : this.CLUB_POINTS_KEYS.WOMEN
    };
    this.CLUB_POINTS_DATA_KEYS = {
        'DATE' : 'date',
        'DISTANCE' : 'distance'
    };

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
        RACE_ID : 'raceId',
        RACE : {
            ID : 'id',
            NAME : 'name',
            DETAILS : 'details',
            IS_CLUB_POINTS : 'isClubPoints'
        },
        HEADING : {
            TEXT : 'text'
        },
        OVERRIDE : {
            DATA : 'data'
        }
    };

    return this;
};

exports.constants = constants();
