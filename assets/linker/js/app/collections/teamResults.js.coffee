TeamResults = Backbone.Collection.extend(
  model: app.TeamResult

  getResultsForRaceTeamDivision: (raceId, teamId, division) ->
    @find (result) ->
      result.get('raceId') is raceId and result.get('teamId') is teamId and result.get('division') is division

)

app.teamResults = new TeamResults()
