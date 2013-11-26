/**
 * ResultController
 */

module.exports = {

  index : function (req, res) {
    Result.find().done(function (err, results) {
      res.view({'results' : JSON.stringify(results)});
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to DataSaverController)
   */
  _config: {}

  
};
