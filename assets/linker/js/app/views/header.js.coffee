app.HeaderView = Backbone.View.extend(
  
  initialize: ->
    x = 5

  render: ->
    @$el.html(@template('header', myVar: 12345))
    @
)

