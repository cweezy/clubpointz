app.StandingsView = Backbone.View.extend(

  HEADINGS:
    RANK : 'Rank'
    CLUB_NAME : 'Club Name'
    TOTAL_POINTS : 'Total Points'

  initialize: ->
    @division = 'OPEN MEN A-2013'
    @races = app.races.getMensClubPointsRaces()
    @teams = app.teams.getMenDivisionTeams('A')

  render: ->
    @$el.html(@template('standings',
      division : @division
    ))
    @$('.table-label').text(@division + ' Standings')
    @_appendHeadings()
    @_appendTeamRows()
    @

  _appendHeadings: ->
    headings = _.values(@HEADINGS)
    _.each(@races, (race) ->
      headings.push(race.get('label'))
    )
    @$('.standings-table thead').append(@template('standings_heading_row', {headings : headings}))

  _appendTeamRows: ->
    sortedTeams = @_getSortedTeams()
    rows = []
    _.each(sortedTeams, (team, i) ->
      cells = []
      cells.push(i + 1)
      cells.push(team.team.get('name')[0])
      cells.push(team.scoreSum)
      _.each(team.raceScores, (score) ->
        cells.push(score)
      )
      rows += @template('standings_team_row', {cells : cells})
    , @)
    @$('.standings-table tbody').append(rows)

  _getSortedTeams: ->
    sortedTeams = {}
    _.each(@teams, (team) ->
      teamId = team.get('id')
      sortedTeams[teamId] =
        team : team
        scoreSum : 0
        raceScores : []
      _.each(@races, (race) ->
        teamResult = app.teamResults.getResultsForRaceTeamDivision(race.get('id'), teamId, @division)
        if teamResult
          sortedTeams[teamId].raceScores.push(teamResult.get('score'))
          sortedTeams[teamId].scoreSum += parseInt(teamResult.get('score'), 10)
        else
          sortedTeams[teamId].raceScores.push('')
      , @)
    , @)
    _.sortBy(sortedTeams, (result) ->
      0 - result.scoreSum
    )
)
