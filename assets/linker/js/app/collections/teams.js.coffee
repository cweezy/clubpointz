Teams = Backbone.Collection.extend(
  model: app.Team
  url: '/team'
)
app.teams = new Teams()