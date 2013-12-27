Divisions = Backbone.Collection.extend({

  model: app.Division

  ORDERED_DIVISIONS: [
    'OPEN MEN A',
    'OPEN WOMEN A',
    'OPEN MEN B',
    'OPEN WOMEN B'
  ]

  getDivisionsForYear: (year) ->
    divisions = @filter (division) ->
      division.get('year') is year and _.contains(@ORDERED_DIVISIONS, division.get('name'))
    , @
    _.sortBy(divisions, (division) ->
      @ORDERED_DIVISIONS.indexOf(division.get('name'))
    , @)

})
app.divisions = new Divisions()
