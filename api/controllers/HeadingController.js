/**
 * HeadingController
 */

module.exports = {

  index : function (req, res) {
    Heading.find().done(function (err, headings) {
      res.view({'headings' : JSON.stringify(headings)});
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to DataSaverController)
   */
  _config: {}

  
};
