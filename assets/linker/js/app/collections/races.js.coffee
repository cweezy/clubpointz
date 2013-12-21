Races = Backbone.Collection.extend({

  model: app.Race

  url: '/race'

  getMensClubPointsRaces: ->
    @filter (race) ->
      race.get('teamResultCountMen') > 0

  getWomensClubPointsRaces: ->
    @filter (race) ->
      race.get('teamResultCountWomen') > 0
})
app.races = new Races()
