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
    DIVISION : 'division',
    SCRAPE_DATA : 'scrapedata'
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
      DIVISION : 'division',
      IS_TEAM_CHAMPS : 'isTeamChamps'
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
    'Adobo Social & Anti-Social Athletic Club' : ['Adobo Social & Athletic Club', 'Adobo Social & Athletic'],
    'Asphalt Green Triathlon Club' : ['Asphalt Green Triathlon Club', 'Asphalt Green Triath'],
    'Athletic Club' : ['AC'],
    'Clifton Road Runners Club' : ['Clifton Road Runners Club', 'Clifton Road Runners'],
    'Columbia University Medical Center' : ['Columbia University Med.', 'Columbia Univ. Medicine'],
    'Cortland' : ['Cortlandt', 'Cortlandt Park'],
    ' For ' : [' for '],
    "Galloway's Training Team" : ["Galloway's Training", "Galloway's Training Team"],
    'Girls' : ['GirDrop'],
    'Greater Long Island RC' : ['Greater Long Island RC', 'Greater Long Island'],
    'Greater New York RT' : ['Greater New York RT', 'Greater NY RT'],
    'Henwood Hounds Racing Team' : ['Henwood Hounds', 'Henwood Hounds Racing Team'],
    'Hoboken Elysianettes Running Society' : ['Hoboken Elysianettes Running Society', 'Hoboken Elysianettes'],
    ' In ' : [' in '],
    'Kills' : ['KilDrop'],
    'New York Fire Dept.' : ['New York Fire Dept.', 'N.Y. Fire Dept.', 'N.Y. Fire Dept'],
    'New York Police Dept.' : ['New York Police Dept.', 'N. Y. Police Dept', 'N.Y. Police Dept.', 'N.Y. Police Department',
                               'NY Police Department', 'N.Y. Police Dept'],
    'POLSKA Running Team' : ['POLSKA Running Team', 'PODropKA Running Team'],
    'Road Runners Club' : ['RR'],
    ' RT' : [' Running Team'],
    'Runners' : ['Running'],
    ' Running Team' : [' RT'],
    'South Brooklyn' : ['So Brooklyn'],                                                                                                   
    'Taconic Road Runners Club' : ['Taconic Road Runners Club', 'Taconic RR', 'Taconic Road Runners'],
    'Team Boomer - Fighting Cystic Fibrosis' : ['Team Boomer - Fighting Cystic Fibrosis', 'Team Boomer'],
    'To The' : ['to the'],
    ' Track' : [' TC'],
    'UNRR(United Nations Road Runne' : ['United Nations Road Runners', 'UNRR (United Nations Runne)'],                                    
    'University' : ['university'],                                                                                                        
    "Wall Street Alpha's" : ["Wall Street's Alpha"],                                                                                      
    'Westchester' : ['Westcherster'],                                                                                                     
    'Whippets Running Team' : ['Wippets RT']                                                                                              
  }; 

  return this;
};

exports.constants = constants();
