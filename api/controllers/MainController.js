var _ = require('underscore');
var $ = require('jquery');
var Q = require('q');

_addDivisionsToTeam = function (teams, divisions) {
  var menATeams = _.findWhere(divisions, {id: 'OPEN MEN A-2013'}).teams;
  var womenATeams = _.findWhere(divisions, {id: 'OPEN WOMEN A-2013'}).teams;
  var menBTeams = _.findWhere(divisions, {id: 'OPEN MEN B-2013'}).teams;
  var womenBTeams = _.findWhere(divisions, {id: 'OPEN WOMEN B-2013'}).teams;

  _.each(teams, function (team) {
    _.each(team.name, function (name) {
      if (_.contains(menATeams, name)) {
        team.menDivision = 'A';
      } else if (_.contains(menBTeams, name)) {
        team.menDivision = 'B';
      }

      if (_.contains(womenATeams, name)) {
        team.womenDivision = 'A';
      } else if (_.contains(womenBTeams, name)) {
        team.womenDivision = 'B';
      }
    });
  });
};

module.exports = {
  index: function (req, res) {
    var promises = [
      Race.find({year: '2013'}).sort('_id'),
      Team.find(),
      Division.find(),
      TeamResult.find(),
      Heading.find()
    ];

    Q.allSettled(promises).then(function (results) {
      races = results[0].value;
      teams = results[1].value;
      divisions = results[2].value;
      teamResults = results[3].value;
      headings = results[4].value;

      _addDivisionsToTeam(teams, divisions);
      res.view({
        races: races,
        teams: teams,
        teamResults: teamResults,
        headings: headings,
        divisions: divisions
      });
    });
  }
};
