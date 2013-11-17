app.RaceResultsView = Backbone.View.extend(
  
  initialize: ->
    x = 5

  render: ->
    @$el.html(@template('race_results', myVar: 12345))
    @
)
