/**
 * RaceController
 */

module.exports = {

  index : function (req, res) {
    Race.find().done(function (err, races) {
      res.view({'races' : JSON.stringify(races)});
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to DataSaverController)
   */
  _config: {}

  
};
