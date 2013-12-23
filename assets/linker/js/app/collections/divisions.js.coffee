Divisions = Backbone.Collection.extend({

  model: app.Division

  SORT_ORDER: [
    'OPEN MEN A-2013',
    'OPEN WOMEN A-2013',
    'OPEN MEN B-2013',
    'OPEN WOMEN B-2013'
  ]

  getOpenDivisions: ->
    openDivisions = @filter (division) ->
      division.get('id').indexOf('OPEN') != -1
    _.sortBy(openDivisions, (division) ->
      @SORT_ORDER.indexOf(division.get('id'))
    , @)

})
app.divisions = new Divisions()
