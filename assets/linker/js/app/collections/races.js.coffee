Races = Backbone.Collection.extend({

  model: app.Race

  url: '/race'

  getDivisionRaces: (division) ->
    divisionSex = division.get('sex')
    if divisionSex == 'M'
      possibleRaces = @_getMensClubPointsRaces()
    else if divisionSex == 'F'
      possibleRaces = @_getWomensClubPointsRaces()

    _.filter(possibleRaces, (race) ->
      _.find(division.get('races'), (divisionRace) ->
        divisionRace['date'] + ' ' + divisionRace['distance'] == race.get('label')
      )
    ) if possibleRaces

  _getMensClubPointsRaces: ->
    @filter (race) ->
      race.get('teamResultCountMen') > 0

  _getWomensClubPointsRaces: ->
    @filter (race) ->
      race.get('teamResultCountWomen') > 0
})
app.races = new Races()
