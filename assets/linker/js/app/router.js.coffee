app.Router = Backbone.Router.extend(
  routes:
    '': 'standings'
    'race_results/:id': 'raceResults'
  
  initialize: ->
    this.headerView = new app.HeaderView()
    $('#header').html(this.headerView.render().el)

  standings: ->
    this.standingsView or= new app.StandingsView()
    @_showView(this.standingsView)
  
  raceResults: (id) ->
    rrView = new app.RaceResultsView()
    @_showView(rrView)

  _showView: (view) =>
    view.render()
    $('#content').html(view.el)
)

