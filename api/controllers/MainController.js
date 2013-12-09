module.exports = {
  index: function(req, res) {
    Race.find({
      year: (new Date()).getFullYear().toString()
    }).done(function (err, races) {
      Team.find().done(function (err, teams) {
        res.view({
          races: races,
          teams: teams
        });
      })
    });
  }

};