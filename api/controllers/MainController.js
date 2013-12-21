var _ = require('underscore');

_addDivisionsToTeam = function(teams, divisions) {
  menATeams = _.findWhere(divisions, {id: 'OPEN MEN A'}).teams;
  womenATeams = _.findWhere(divisions, {id: 'OPEN WOMEN A'}).teams;

  _.each(teams, function (team) {
    team.menDivision = _.contains(menATeams, team.name) ? 'A' : 'B';
    team.womenDivision = _.contains(womenATeams, team.name) ? 'A' : 'B';
  });
}

module.exports = {
  index: function(req, res) {
    Race.find({
      year: (new Date()).getFullYear().toString()
    }).done(function (err, races) {
      Team.find().done(function (err, teams) {
        Division.find().done(function (err, divisions) {
          _addDivisionsToTeam(teams, divisions);

          res.view({
            races: races,
            teams: teams
          });
        })
      })
    });
  },

};