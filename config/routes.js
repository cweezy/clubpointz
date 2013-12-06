module.exports.routes = {

  '/raceResults?raceId=:raceId' : {
    controller : 'raceResultsController',
    action : 'index'
  },

  'get /result/raceId/:id' : {
    controller : 'result',
    action : 'findRaceId'
  }

}
