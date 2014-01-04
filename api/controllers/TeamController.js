/**
 * TeamController
 */

var _ = require('underscore');
var Q = require('q');

module.exports = {

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to TeamController)
   */
  _config: {},

  find: function (req, res) {
    var teamId = req.param('id');
    if (!_.isUndefined(teamId)) {
      Team.findOne(teamId, function foundTeam(err, team) {
        TeamResult.find({teamId: teamId, isFullTeam: true}, function foundTeamResults(err2, trs) {
          team.teamResults = trs;

          var promises = [];
          _.each(trs, function (tr) {
            promises.push(Result.find({id: tr.resultIds}));
          });

          Q.allSettled(promises).then(function (results) {
            _.each(trs, function (tr, idx) {
              tr.results = results[idx].value;
            });

            res.json(team);
          });

        });
      });
    } else {
      Team.find().done(function (err, teams) {
        res.json(teams);
      });
    }
  }
};
