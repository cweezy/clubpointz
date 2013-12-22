TeamResults = Backbone.Collection.extend(
  model: app.TeamResult

  forRace: (race) ->
    @filter (tr) ->
      tr.get('raceId') is race.('id') and
)
app.teamResults = new TeamResults()
