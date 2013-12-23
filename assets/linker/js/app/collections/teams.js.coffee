Teams = Backbone.Collection.extend(
  model: app.Team
  url: '/team'

  getDivisionTeams : (division) ->
    @filter (team) ->
      _.find(division.get('teams'), (divisionTeam) ->
        _.contains(team.get('name'), divisionTeam)
      )
)
app.teams = new Teams()
