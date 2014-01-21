app.Router = Backbone.Router.extend(
  routes:
    '': 'standings'
    'race_results/:id': 'raceResults'
    'team/:id': 'team'
  
  initialize: ->
    this.headerView = new app.HeaderView()
    $('#header').html(this.headerView.render().el)

  standings: ->
    this.standingsView or= new app.StandingsView()
    this.standingsView.delegateEvents()
    @_showView(this.standingsView)
  
  raceResults: (id) ->
    rrView = new app.RaceResultsView(model: app.races.get(id))
    @_showView(rrView)

  team: (id) ->
    team = app.teams.get(id)
    teamView = new app.TeamView(model: team)
    @_showView(teamView)

  _showView: (view) =>
    view.render()
    $('#content').html(view.el)
    $('#content').attr('class', view.contentClass) if view.contentClass
    $('body').attr('class', view.bodyClass) if view.bodyClass
    $(document).attr('title', view.title) if view.title
)

