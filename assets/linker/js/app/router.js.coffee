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
    @_showView(this.standingsView)
  
  raceResults: (id) ->
    rrView = new app.RaceResultsView(model: app.races.get(id))
    @_showView(rrView)

  _showView: (view) =>
    view.render()
    $('#content').html(view.el)
    $('#content').addClass(view.cssClass) if view.cssClass
    $('body').addClass(view.bodyClass) if view.bodyClass
    $(document).attr('title', view.title) if view.title
)

