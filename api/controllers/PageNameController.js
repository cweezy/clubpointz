/**
 * PageNameController
 */
var fs = require('fs');
var path = require('path');
var wrench = require('wrench');

var TEMP_DATA_DIR = 'temp';
var TEMP_DATA_FILE = 'temp.json';

module.exports = {
    
  index : function (req, res) {
      var tempDataPath = TEMP_DATA_DIR + path.sep + TEMP_DATA_FILE;
      if (fs.existsSync(tempDataPath)) {
          var temp = JSON.parse(fs.readFileSync(TEMP_DATA_DIR + path.sep + TEMP_DATA_FILE));
          PageName.create({'name' : temp.name}).exec(function (err, model) {
              if (err) return res.send(err, 500);
              res.view({'isNewData' : true, 'pageName' : model.name});
              model.save(function (err) {
                  // handle err
              });
              wrench.rmdirSyncRecursive(TEMP_DATA_DIR);
          });
      } else {
          res.view({'isNewData' : false});
      }
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to DataSaverController)
   */
  _config: {}

  
};
