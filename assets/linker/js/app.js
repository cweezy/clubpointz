// global
app = {};

// adding custom template function to Backbone.View
Backbone.View.prototype.template = function (viewName, data) {
  return JST['assets/linker/templates/' + viewName + '.html'](data);
}

$(function() {
  new app.Router();
  app.races.reset(sailsExports.racesJson);
  app.teams.reset(sailsExports.teamsJson);
  app.teamResults.reset(sailsExports.teamResultsJson);
  app.headings.reset(sailsExports.headingsJson);
  app.divisions.reset(sailsExports.divisionsJson);
  Backbone.history.start();

  getContentHolder = function (url) {
    if (url.indexOf('mail/send') > -1) {
      return $('.modal-body');
    }
    return $('#content');
  };
  getLoadingHolder = function (url) {
    if (url.indexOf('mail/send') > -1) {
      return $('.modal-body-loading');
    }
    return $('#loading');
  };
  getCompleteMessage = function (url) {
    if (url.indexOf('mail/send') > -1) {
      return $('.modal-body-sent');
    }
  };

  $(document).ajaxSend(function(event, request, settings) {
    getContentHolder(settings.url).hide();
    getLoadingHolder(settings.url).show();
  });
  $(document).ajaxComplete(function(event, xhr, settings) {
    getLoadingHolder(settings.url).hide();
    var completeMessage = getCompleteMessage(settings.url);
    if (completeMessage) {
      completeMessage.show();
      setTimeout(function () {
        completeMessage.hide();
        getContentHolder(settings.url).show();
      }, 1000);
    } else {
      getContentHolder(settings.url).show();
    }
  });
});
