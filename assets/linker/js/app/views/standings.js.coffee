app.StandingsView = Backbone.View.extend(

  HEADINGS: [
    {text: 'Rank'},
    {text: 'Club Name'},
    {text: 'Total Points'}
  ]

  title: 'ClubPointz'
  bodyClass: 'main'
  contentClass: 'standings'

  initialize: ->
    @divisions = app.divisions.getOpenDivisions()

  render: ->
    @$el.html(@template('standings'))
    @_appendTables()
    @

  _appendTables: ->
    _.each(@divisions, (division) ->
      @_appendDivisionTable(division)
    , @)

  _appendDivisionTable: (division) ->
    tableId = division.get('id').replace(/\s/g, '_')
    labelText = division.get('id') + ' Standings'

    @$el.find('#division-tables').append(
      @template('standings_division_table', {
        id : tableId,
        labelText : labelText
      })
    )
    table = @$el.find('#' + tableId)

    races = app.races.getDivisionRaces(division)
    teams = app.teams.getDivisionTeams(division)
    @_appendTableHeadings(table, races)
    @_appendTeamRows(table, teams, races, division)

  _appendTableHeadings: (table, races) ->
    headings = @HEADINGS.concat(
      _.map(races, (race) ->
        {text: race.get('label'), cssClass: 'race-link', raceName: race.get('name')}
      )
    )
    @$(table).find('thead').append(@template('standings_heading_row', {headings : headings}));

    # Add race tooltips
    _.each(@$(table).find('.race-link'), (link) ->
      @$(link).find('span').tooltip(
        title: @$(link).attr('raceName')
      )
    )

  _appendTeamRows: (table, teams, races, division) ->
    sortedTeams = @_getSortedTeams(teams, races, division)
    _.each(sortedTeams, (team, i) ->
      cells = []
      cells.push({text :(i + 1)})
      cells.push({text : team.team.get('name')[0], cellClass : 'team-name'})
      cells.push({text : team.scoreSum})
      _.each(team.raceScores, (score) ->
        cells.push({text : score})
      )
      @$(table).find('tbody').append(@template('standings_team_row', {cells : cells}))
    , @)

  _getSortedTeams: (teams, races, division) ->
    sortedTeams = {}
    _.each(teams, (team) ->
      teamId = team.get('id')
      sortedTeams[teamId] =
        team : team
        scoreSum : 0
        raceScores : []
      _.each(races, (race) ->
        teamResult = app.teamResults.getResultsForRaceTeamDivision(race.get('id'), teamId, division.get('id'))
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
