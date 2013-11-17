app.StandingsView = Backbone.View.extend(
  
  initialize: ->
    x = 5

  render: ->
    @$el.html(@template('standings', myVar: 12345))
    @
)
