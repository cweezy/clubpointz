app.RaceResultsView = Backbone.View.extend(

  events:
    "click .nav-team-results": "_showTeamResults"
    "click .nav-indiv-results": "_showIndivResults"
 
  initialize : ->
    @results = new app.Results()
    @results.fetch(data: raceId: @model.id)
    @idToDiv = {}
    @menAResults = app.teamResults.getResultsForRaceDivision(@model, 'OPEN MEN A-2013')
    @womenAResults = app.teamResults.getResultsForRaceDivision(@model, 'OPEN WOMEN A-2013')
    @listenTo(@results, 'sync', @_renderResults)

  render: ->
    @$el.html(@template('race_results',
      race: @model
      menAResults: @menAResults
      womenAResults: @womenAResults
    ))

    menAResultsBox = @$('.men-a-results')
    for tr, idx in @menAResults
      trDiv = $(@template 'race_results_team', {tr: tr, idx: idx + 1})
      menAResultsBox.append trDiv
      for resId in tr.get('resultIds')
        @idToDiv[resId] = trDiv

    @$('.indiv-results').hide()
    @

  _renderResults: ->
    table = @$('.indiv-results')
    str = ""
    @results.each( (result, idx) =>
      resDiv = @template('race_results_row',
        result: result
        place: idx + 1
      )
      str += resDiv
      trDiv = @idToDiv[result.id]
      if trDiv?
        trDiv.append resDiv
    )
    table.append(str)

  _showTeamResults: ->
    @$('.nav-team-results').addClass('active')
    @$('.team-results').show()
    @$('.nav-indiv-results').removeClass('active')
    @$('.indiv-results').hide()

  _showIndivResults: ->
    @$('.nav-indiv-results').addClass('active')
    @$('.indiv-results').show()
    @$('.nav-team-results').removeClass('active')
    @$('.team-results').hide()
)
