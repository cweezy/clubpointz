Teams = Backbone.Collection.extend(
  model: app.Team
  url: '/team'

  getDivisionTeams : (division) ->
    @filter (team) ->
      _.find(division.get('teams'), (divisionTeam) ->
        team.get('name') == divisionTeam
      )
)
app.teams = new Teams()
