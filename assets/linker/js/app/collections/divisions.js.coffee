Divisions = Backbone.Collection.extend({

  model: app.Division

  getOpenDivisions: ->
    @filter (division) ->
      division.get('id').indexOf('OPEN') != -1

})
app.divisions = new Divisions()
