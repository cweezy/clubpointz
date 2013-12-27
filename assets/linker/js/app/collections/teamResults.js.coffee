TeamResults = Backbone.Collection.extend(
  model: app.TeamResult

  getResultsForRaceDivision: (race, division) ->
    count = if division.match(/WOMEN/)? then race.get('teamResultCountWomen') else race.get('teamResultCountMen')
    results = @filter (result) ->
      result.get('raceId') is race.id and result.get('division') is division and result.get('resultIds').length is count

    results.sort (a, b) ->
      a.get('teamTime') - b.get('teamTime')

  getResultsForRaceTeamDivision: (raceId, teamId, division) ->
    @find (result) ->
      result.get('raceId') is raceId and result.get('teamId') is teamId and result.get('division') is division
)

app.teamResults = new TeamResults()
