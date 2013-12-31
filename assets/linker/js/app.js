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

  $(document).ajaxSend(function() {
    $('#content').hide();
    $('#loading').show();
  });
  $(document).ajaxComplete(function() {
    $('#loading').hide();
    $('#content').show();
  });
});
