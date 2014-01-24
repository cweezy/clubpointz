var config = {

  MONGO_URI: 'mongodb://localhost:27017/clubpointz',
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

  MAX_RACE_RESULTS: 200,
  RESULTS_PER_PAGE: 50

};

module.exports = config;
