/**
 * HeadingController
 */

module.exports = {

  index : function (req, res) {
    var raceId = 'b31102';
    var headingData;
    var raceData;
    var resultsData;

    var getHeadingData = function (callback) {
      Heading.find().done(function (err, headings) {
        if (err) throw err;
        headingData = headings;
        callback();
      });
    };
    var getRaceData = function (callback) {
      Race.findOne({'id' : raceId}).done(function (err, race) {
        if (err) throw err;
        raceData = race;
        callback();
      });
    };
    var getResultData = function (callback) {
      Result.find({'raceId' : raceId}).done(function (err, results) {
        if (err) throw err;
        resultsData = results;
        callback();
      });
    };

    var renderView = function () {
      if (!_.isUndefined(headingData) && !_.isUndefined(raceData) && !_.isUndefined(resultsData)) {

        var headingMap = {};
        _.each(headingData, function (heading) {
            headingMap[heading.id] = heading.text;
        });

        res.view({
          'headingMap' : headingMap,
          'race' : raceData,
          'results' : resultsData
        });   
      };
    };    
    
    getHeadingData(renderView);
    getRaceData(renderView);
    getResultData(renderView);
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to DataSaverController)
   */
  _config: {}

  
};
