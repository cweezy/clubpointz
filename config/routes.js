module.exports.routes = {

  '/': {
    controller: 'main'
  },
  
  '/raceResults?raceId=:raceId' : {
    controller : 'raceResultsController',
    action : 'index'
  }

}
