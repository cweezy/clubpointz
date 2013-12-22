app.TitleView = Backbone.View.extend(

  render: ->
    @$el.html(@template('title'))
    @
)

