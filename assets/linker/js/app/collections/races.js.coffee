Races = Backbone.Collection.extend({

  model: app.Race

  url: '/race'

  getMensClubPointsRaces: ->
    @find (race) ->
      race.get('teamResultCountMen') > 0

  getWomensClubPointsRaces: ->
    @find (race) ->
      race.get('teamResultCountWomen') > 0
})
app.races = new Races()