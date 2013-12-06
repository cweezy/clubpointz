/**
 * TeamController
 */

var util = require('./util').util;


module.exports = {

  find : function (req, res) {
    var params = util.parseParams(req.params);
    Team.find(params, function (err, result) {
      res.json(result);
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to TeamController)
   */
  _config: {}
  
};
