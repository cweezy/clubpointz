var _ = require('underscore');
var $ = require('jquery');
var Q = require('q');

_addDivisionsToTeam = function (teams, divisions) {
  menATeams = _.findWhere(divisions, {id: 'OPEN MEN A-2013'}).teams;
  womenATeams = _.findWhere(divisions, {id: 'OPEN WOMEN A-2013'}).teams;

  _.each(teams, function (team) {
    team.menDivision = _.contains(menATeams, team.name) ? 'A' : 'B';
    team.womenDivision = _.contains(womenATeams, team.name) ? 'A' : 'B';
  });
}

module.exports = {
  index: function (req, res) {
	var promises = [
      Race.find({year: (new Date()).getFullYear().toString()}),
	  Team.find(),
      Division.find(),
      TeamResult.find()
    ];

	Q.allSettled(promises).then(function (results) {
	  races = results[0].value;
	  teams = results[1].value;
	  divisions = results[2].value;
      teamResults = results[3].value;
		 
      _addDivisionsToTeam(teams, divisions);
	  res.view({
        races: races,
        teams: teams,
        teamResults: teamResults
      });
    });
  },

};
