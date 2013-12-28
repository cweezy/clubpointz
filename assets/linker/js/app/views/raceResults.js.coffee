app.RaceResultsView = Backbone.View.extend(

  bodyClass: 'results'

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
    headingData = @_getHeadings()
    headings = @template('race_results_table_headings',
      headings : headingData
    )
    table.append(headings)
    @$('.team-result').append(headings)

    str = ""
    results = @_filterResults()
    results.each( (result, idx) =>
      resRow = @template('race_results_row',
        result: result.attributes
        place: idx + 1
      )
      str += resRow
      trDiv = @idToDiv[result.id]
      if trDiv?
        $(trDiv[2]).append resRow
    )
    table.append(str)

  _filterResults: ->
    # remove attributes we don't have headings for
    results = _.clone(@results)
    _.each(results.models, (result) ->
      filteredAttributes = {}
      _.each(result.attributes, (attr, key) ->
        if app.headings.get(key)
          filteredAttributes[key] = attr
      )
      result.attributes = filteredAttributes
    )
    results 

  _getHeadings: ->
    _.map(_.keys(this.results.first().attributes), (key) ->
      app.headings.get(key)
    )

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
