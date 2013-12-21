var constants = function () {

  this.IRREGULAR_RACES = ['b31103', 'b30103', 'b30117', 'b30207', 'b30305', 'b30611',
                          'b30625', 'b30709', 'b30723'];
  // don't send warnings when these races can't be parsed
  this.IRREGULAR_RACES_IGNORE = ['b30103', 'b30117', 'b30207', 'b30305', 'b30611',
                                 'b30625', 'b30709', 'b30723'];

  this.TEAM_WEBSITES = {
    'NBR' : 'http://northbrooklynrunners.org/',
    'NYAC' : 'http://www.nyac.org/',
    'GCTR' : 'http://www.gothamcityrunners.com/',
    'WSX' : 'http://www.wsxnyc.org/',
    'CPTC' : 'http://www.centralparktc.org/',
    'VCTC' : 'http://www.vctc.org/',
    'NYH' : 'http://www.newyorkharriers.com/'
  };

  this.MAX_RACE_RESULTS = 200;
  this.RESULTS_PER_PAGE = 50;  // can be 50 or 500

  this.POINT_VALUES = [15, 12, 10, 8, 6, 5, 4, 3, 2];
  this.DEFAULT_POINT_VALUE = 1;

  this.MONGO_URI = 'mongodb://localhost:27017/clubpointz';
  this.DB_COLLECTIONS = {
    RACE : 'race',
    RESULT : 'result',
    HEADING : 'heading',
    RACE_OVERRIDE : 'race_override',
    TEAM : 'team',
    TEAM_RESULT : 'teamresult',
    DIVISION : 'division'
  };

  this.RESULT_MAIN_URL = 'http://web2.nyrrc.org/cgi-bin/htmlos.cgi/aes-programs/results/resultsarchive.htm';
  this.RACE_PAGE_BASE_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/aes-programs/results/startup.html';
  this.DIVISION_DATA_URL = 'http://www.nyrr.org/causes-and-community/local-clubs/club-standings-search/';
  this.EXPECTED_RESULT_MAIN_TITLE = 'NYRR Race Results';
  this.MARATHON_RESULT_URL = 'http://web2.nyrrc.org/cgi-bin/start.cgi/nyrrc/monitor/pages/postrace/postracestartup.html';
  this.EXPECTED_MARATHON_RESULT_TITLE = 'ING New York City Marathon';

  this.DIVISION_NON_RACE_LABELS = ['TEAM', 'TOTAL'];
  this.MENS_DIVISION_A = 'OPEN MEN A';
  this.WOMENS_DIVISION_A = 'OPEN WOMEN A';

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
      TEAM_RESULT_COUNT_WOMEN : 'teamResultCountWomen',
      LABEL : 'label'
    },
    HEADING : {
      TEXT : 'text'
    },
    OVERRIDE : {
      DATA : 'data'
    },
    DIVISION : {
      RACES : 'races',
      TEAMS : 'teams',
      SEX : 'sex',
      RACE : {
        DATE : 'date',
        DISTANCE : 'distance'
      }
    },
    TEAM_RESULT : {
      TEAM_ID : 'teamId',
      TEAM_TIME : 'teamTime',
      RESULT_IDS : 'resultIds',
      IS_FULL_TEAM : 'isFullTeam',
      SCORE : 'score',
      DIVISION : 'division'
    },
    TEAM : {
      WEBSITE : 'website'
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

  this.TEAM_NAME_TRANSFORMS = {
    '0Training' : ['0 Training'],
    'Adobo Social & Anti-Social Athletic' : ['Adobo Social & Athletic'],
    'Athletic Club' : ['AC'],
    'Columbia University Medical Center' : ['Columbia University Med.', 'Columbia Univ. Medicine'],
    'Girls' : ['GirDrop'],
    'Kills' : ['KilDrop'],
    ' In ' : [' in '],
    ' Running Team' : [' RT'],
    ' RT' : [' Running Team'],
    'Cortland' : ['Cortlandt', 'Cortlandt Park'],
    ' Track' : [' TC'],
    'NY ' : ['New York ', 'N.Y. '],
    'N.Y.' : ['New York'],
    'New York' : ['N.Y.', 'N. Y.', 'NY'],
    'Dept' : ['Dept.', 'Department'],
    'Dept.' : ['Dept', 'Department'],
    ' For ' : [' for '],
    'Road Runners Club' : ['RR'],
    'Runners' : ['Running'],
    'South Brooklyn' : ['So Brooklyn'],                                                                                                   
    'To The' : ['to the'],                                                                                                                
    'UNRR(United Nations Road Runne' : ['United Nations Road Runners', 'UNRR (United Nations Runne)'],                                    
    'University' : ['university'],                                                                                                        
    "Wall Street Alpha's" : ["Wall Street's Alpha"],                                                                                      
    'Westchester' : ['Westcherster'],                                                                                                     
    'Whippets Running Team' : ['Wippets RT']                                                                                              
  }; 

  return this;
};

exports.constants = constants();
