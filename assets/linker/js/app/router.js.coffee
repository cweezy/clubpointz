app.Router = Backbone.Router.extend(
  routes:
    '': 'standings'
    'race_results/:id': 'raceResults'
  
  initialize: ->
    this.headerView = new app.HeaderView()
    this.titleView = new app.TitleView()
    $('#header').html(this.headerView.render().el)
    $('#title').html(this.titleView.render().el)

  standings: ->
    this.standingsView or= new app.StandingsView()
    @_showView(this.standingsView, 'main')
  
  raceResults: (id) ->
    rrView = new app.RaceResultsView(model: app.races.get(id))
    @_showView(rrView)

  _showView: (view, bodyClass) =>
    view.render()
    $('body').addClass(bodyClass) if bodyClass
    $('#content').html(view.el)
    $('#content').addClass(view.cssClass)
)

