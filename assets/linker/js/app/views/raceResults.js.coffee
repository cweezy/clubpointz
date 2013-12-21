app.RaceResultsView = Backbone.View.extend(
 
  initialize : ->
    @results = new app.Results()
    @results.fetch(data: raceId: @model.id)
    @listenTo(@results, 'sync', @_showResults)

  render: ->
    @$el.html(@template('race_results', race: @model))
    @

  _showResults: ->
    table = @$('.results-table')
    @results.each( (result, idx) =>
      table.append(@template('race_results_row',
        result: result
        place: idx + 1
      ))
    )
)
