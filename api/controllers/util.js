var util = {

  parseParams : function (params) {
    if (!params['id']) return {};

    var paramMap = {};
    var paramStrings = params['id'].split('&');
    _.each(paramStrings, function (str) {
      var parts = str.split('=');
      paramMap[parts[0]] = parts[1];
    });
    return paramMap;
  }
};

exports.util = util;
