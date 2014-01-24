var constants = {

  IRREGULAR_RACES : ['b31103', 'b30103', 'b30117', 'b30207', 'b30305', 'b30611',
                     'b30625', 'b30709', 'b30723', 'b30922', 'b31231'],
  IRREGULAR_RACES_IGNORE : ['b30103', 'b30117', 'b30207', 'b30305', 'b30611',
                            'b30625', 'b30709', 'b30723', 'b31231'],
  FIFTH_AVE_MILE_2013 : 'b30922',

  TEAM_WEBSITES : {
    'NBR' : 'http://northbrooklynrunners.org/',
    'NYAC' : 'http://www.nyac.org/',
    'GCTR' : 'http://www.gothamcityrunners.com/',
    'WSX' : 'http://www.wsxnyc.org/',
    'CPTC' : 'http://www.centralparktc.org/',
    'VCTC' : 'http://www.vctc.org/',
    'NYH' : 'http://www.newyorkharriers.com/'
  },

  POINT_VALUES : [15, 12, 10, 8, 6, 5, 4, 3, 2],
  DEFAULT_POINT_VALUE : 1,

  DB_COLLECTIONS : {
    RACE : 'race',
    RESULT : 'result',
    HEADING : 'heading',
    RACE_OVERRIDE : 'race_override',
    TEAM : 'team',
    TEAM_RESULT : 'teamresult',
    DIVISION : 'division',
    SCRAPE_DATA : 'scrapedata'
  },

  RESULT_MAIN_URL : 'http://web2.nyrrc.org/cgi-bin/htmlos.cgi/aes-programs/results/resultsarchive.htm',
  RACE_PAGE_BASE_URL : 'http://web2.nyrrc.org/cgi-bin/start.cgi/aes-programs/results/startup.html',
  DIVISION_DATA_URL : 'http://www.nyrr.org/causes-and-community/local-clubs/club-standings-search/',
  EXPECTED_RESULT_MAIN_TITLE : 'NYRR Race Results',
  MARATHON_RESULT_URL : 'http://web2.nyrrc.org/cgi-bin/start.cgi/nyrrc/monitor/pages/postrace/postracestartup.html',
  EXPECTED_MARATHON_RESULT_TITLE : 'ING New York City Marathon',

  DIVISION_NON_RACE_LABELS : ['TEAM', 'TOTAL'],
  MENS_DIVISION_A : 'OPEN MEN A',
  WOMENS_DIVISION_A : 'OPEN WOMEN A',

  KEY_DELIMITER : '-',
  TEAM_CHAMPS_NAME_MEN : 'Team Championships-Men',
  TEAM_CHAMPS_NAME_WOMEN : 'Team Championships-Women',
  TEAM_RESULT_COUNT : {
    TEAM_CHAMPS : 10,
    MARATHON : 3,
    DEFAULT : 5
  },

  NEXT_BTN_TEXT : 'NEXT',
  SELECTORS : {
    RACE_DETAILS : 'span.text b',
    RACE_NAME : '.bighead',
    RACE_LINK : 'td[class="text"] a',
    HEADING : '.heading',
    SEARCH_BUTTON : 'input[value="SEARCH"]',
    AWARD_WINNERS_URL : 'a:contains("Award Winners")',
    RESULT_ROW : 'table:eq(3) tr[bgcolor!="EEEEEE"]'
  },

  URL_KEYS : {
    RACE_ID : 'result.id',
    YEAR : 'result.year'
  },

  DATA_KEYS : {
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
      LABEL : 'label',
      URL : 'url'
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
      IS_TEAM_CHAMPS : 'isTeamChamps',
      RANK : 'rank'
    },
    TEAM : {
      WEBSITE : 'website'
    }
  },

  MONTH_TO_INDEX : {
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
  },

  UNIT_TO_ABBR : {
    'miles' : 'M',
    'mile' : 'M',
    'kilometers' : 'K'
  },

  TEAM_NAME_TRANSFORMS : {
    '0Training' : ['0 Training'],
    '10 to the End' : ['10 To The End'],
    'Adobo Social & Athletic Club' : ['Adobo Social & Anti-Social Athletic Club', 'Adobo Social & Athletic'],
    'Adobo Social & Athletic' : ['Adobo Social & Anti-Social Athletic Club', 'Adobo Social & Athletic Club'],
    'Asphalt Green Triath' : ['Asphalt Green Triathlon Club'],
    'Black GirDrop Run' : ['Black Girls Run'],
    'Clifton Road Runners' : ['Clifton Road Runners Club'],
    'Columbia Univ. Medicine' : ['Columbia University Medical Center', 'Columbia University Med.'],
    'Columbia University Med.' : ['Columbia University Medical Center', 'Columbia Univ. Medicine'],
    'Columbia university RR' : ['Columbia University RR'],
    'Dashing Whippets Running Team' : ['Dashing Whippets RT', 'Dashing Whippets Running Team', 'Dashing Wippets RT'],
    'Dashing Wippets RT' : ['Dashing Whippets RT', 'Dashing Whippets Running Team', 'Dashing Wippets RT'],
    "Galloway's Training" : ["Galloway's Training Team"],
    'Great KilDrop Gateway RC' : ['Great Kills Gateway RC'],
    'Greater Long Island' : ['Greater Long Island RC'],
    'Greater NY RT' : ['Greater New York RT'],
    'Green City Running' : ['Green City Runners'],
    'Henwood Hounds' : ['Henwood Hounds Racing Team'],
    'Hoboken Elysianettes' : ['Hoboken Elysianettes Running Society'],
    'Jersey GirDrop RR' : ['Jersey Girls RR'],
    'Jersey GirDrop SS' : ['Jersey Girls SS'],
    'N.Y. Fire Dept.' : ['New York Fire Dept.', 'N.Y. Fire Dept'],
    'N.Y. Fire Dept' : ['New York Fire Dept.', 'N.Y. Fire Dept.'],
    'New York Police Dept.' : ['NY Police Department', 'N.Y. Police Dept', 'N. Y. Police Dept', 'New York Police Dept.',
        'N.Y. Police Dept.', 'N.Y. Police Department'],
    'N.Y. Police Dept' : ['NY Police Department', 'N.Y. Police Dept', 'N. Y. Police Dept', 'New York Police Dept.',
        'N.Y. Police Dept.', 'N.Y. Police Department'],
    'N.Y. Police Dept.' : ['NY Police Department', 'N.Y. Police Dept', 'N. Y. Police Dept', 'New York Police Dept.',
        'N.Y. Police Dept.', 'N.Y. Police Department'],
    'N. Y. Police Dept' : ['NY Police Department', 'N.Y. Police Dept', 'N. Y. Police Dept', 'New York Police Dept.',
        'N.Y. Police Dept.', 'N.Y. Police Department'],    
    'N.Y. Police Department' : ['NY Police Department', 'N.Y. Police Dept', 'N. Y. Police Dept', 'New York Police Dept.',
        'N.Y. Police Dept.', 'N.Y. Police Department'],
    'PODropKA Running Team' : ['POLSKA Running Team'],
    'Prospect Park Track' : ['Prospect Park TC'],
    'Rabbits' : ['RRF Rabbits'],
    'RRF Ps 46' : ['RRF PS 46'],
    'RRF Rabbits' : ['RRF Rabbits', 'Rabbits'],
    'Shore AC' : ['Shore Athletic Club'],
    'So Brooklyn Running Club' : ['South Brooklyn Running Club'],
    'Taconic RR' : ['Taconic Road Runners', 'Taconic Road Runners Club'],
    'Taconic Road Runners Club' : ['Taconic Road Runners', 'Taconic RR'],
    'Team Boomer' : ['Team Boomer - Fighting Cystic Fibrosis'],
    'Team for Kids' : ['Team For Kids'],
    'Team in Training' : ['Team In Training'],
    'UNRR (United Nations Runne)' : ['United Nations Road Runners', 'UNRR(United Nations Road Runne'],
    'UNRR(United Nations Road Runne' : ['United Nations Road Runners', 'UNRR (United Nations Runne)'],
    'Van Cortland TC' : ['Van Cortlandt TC', 'Van Cortland TC', 'Van Cortlandt Park TC'],
    "Wall Street Alpha's Road Runners" : ["Wall Street's Alpha Road Runners"]
  }, 

  NAMELESS_TEAMS : {
    '15' : 'RRF MS/PS 15',
    '321' : 'RRF PS 321',
    '46' : 'RRF PS 46',
    'NEST' : 'RRF Nest+m (m539)'
  },

  TEAM_ID_TRANSFORMS : {
    'RRFT' : 'Y130'
  }
};

module.exports = constants;
