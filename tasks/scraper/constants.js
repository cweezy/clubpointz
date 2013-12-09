var constants = function () {

  this.IRREGULAR_RACES = ['b31103', 'b30103', 'b30117', 'b30207', 'b30305', 'b30611',
                          'b30625', 'b30709', 'b30723'];

  this.MAX_RACE_RESULTS = 200;
  this.RESULTS_PER_PAGE = 50;  // can be 50 or 500

  this.MONGO_URI = 'mongodb://localhost:27017/clubpointz';
  this.DB_COLLECTIONS = {
    RACE : 'race',
    RESULT : 'result',
    HEADING : 'heading',
    RACE_OVERRIDE : 'race_override',
    CLUB_POINTS_RACE : 'clubpointsrace',
    TEAM : 'team',
    TEAM_RESULT : 'teamresult'
  };

  this.RESULT_MAIN_URL = 'http://web2.nyrrc.org/cgi-bin/htmlos.cgi/aes-programs/results/resultsarchive.htm';
  this.RACE_PAGE_BASE_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/aes-programs/results/startup.html';
  this.CLUB_POINTS_DATA_URL = 'http://www.nyrr.org/causes-and-community/local-clubs/club-standings-search/';
  this.EXPECTED_RESULT_MAIN_TITLE = 'NYRR Race Results';
  this.MARATHON_RESULT_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/nyrrc/monitor/pages/postrace/postracestartup.html';
  this.EXPECTED_MARATHON_RESULT_TITLE = 'ING New York City Marathon';

  this.CLUB_POINTS_TYPES = ['OPEN MEN A', 'OPEN WOMEN A'];
  this.CLUB_POINTS_NON_RACE_LABELS = ['OPEN MEN A', 'OPEN WOMEN A', 'TEAM', 'TOTAL'];
  this.CLUB_POINTS_RACE_TYPES = {
    MEN : 'OPEN MEN A',
    WOMEN : 'OPEN WOMEN A'
  };

  this.KEY_DELIMITER = '-';
  this.TEAM_CHAMPS_NAME_MEN = 'Team Championships-Men';
  this.TEAM_CHAMPS_NAME_WOMEN = 'Team Championships-Women';
  this.TEAM_RESULT_COUNT = {
    TEAM_CHAMPS : 10,
    MARATHON : 3,
    DEFAULT : 5
  };

  this.NEXT_BTN_TEXT = 'NEXT';
  this.SELECTORS = {
    RACE_DETAILS : 'span.text b',
    RACE_NAME : '.bighead',
    RACE_LINK : 'td[class="text"] a',
    HEADING : '.heading',
    SEARCH_BUTTON : 'input[value="SEARCH"]',
    AWARD_WINNERS_URL : 'a:contains("Award Winners")'
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
    YEAR : 'year',
    NAME : 'name',
    RACE : {
      DETAILS : 'details',
      TEAM_RESULT_COUNT_MEN : 'teamResultCountMen',
      TEAM_RESULT_COUNT_WOMEN : 'teamResultCountWomen'
    },
    HEADING : {
      TEXT : 'text'
    },
    OVERRIDE : {
      DATA : 'data'
    },
    CLUB_POINTS : {
      DATE : 'date',
      DISTANCE : 'distance',
      TYPE : 'type'
    },
    TEAM_RESULT : {
      TEAM_ID : 'teamId',
      TEAM_TIME : 'teamTime',
      RESULT_IDS : 'resultIds'
    }
  };

  this.MONTH_TO_INDEX = {
    'January' : '1',
    'February' : '2',
    'March' : '3',
    'April' : '4',
    'May' : '5',
    'June' : '6',
    'July' : '7',
    'August' : '8',
    'September' : '9',
    'October' : '10',
    'November' : '11',
    'December' : '12'
  };

  this.UNIT_TO_ABBR = {
    'miles' : 'M',
    'mile' : 'M',
    'kilometers' : 'K'
  };

  return this;
};

exports.constants = constants();
