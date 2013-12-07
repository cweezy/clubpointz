/**
 * HeadingController
 */

var util = require('./util').util;


module.exports = {
    
  find : function (req, res) {
    var params = util.parseParams(req.params);
    Heading.find(params, function (err, result) {
      res.json(result);
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to HeadingController)
   */
  _config: {}
  
};
