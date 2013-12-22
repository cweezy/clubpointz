Teams = Backbone.Collection.extend(
  model: app.Team
  url: '/team'

  getMenDivisionTeams : (division) ->
    @filter (team) ->
      team.get('menDivision') is division      

)
app.teams = new Teams()
