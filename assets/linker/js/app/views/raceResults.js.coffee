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
    @results = @results.sortBy( (result) ->
      parseInt(result.get('overall_place'), 10)
    )

    table = @$('.indiv-results')
    results = @_filterResults()
    headingData = @_getHeadings(results[0])
    headings = @template('race_results_table_headings',
      headings : headingData
    )
    table.append(headings)
    @$('.team-result').append(headings)

    str = ""
    _.each(results, (result, idx) =>
      resRow = @template('race_results_row',
        result: result.attributes
        place: idx + 1
      )
      str += resRow
      trDiv = @idToDiv[result.id]
      if trDiv?
        $(trDiv.find('.team-result')).append resRow
    )
    table.append(str)

  _filterResults: ->
    # remove attributes we don't have headings for
    results = _.clone(@results)
    _.each(results, (result) ->
      filteredAttributes = {}
      _.each(result.attributes, (attr, key) ->
        if app.headings.get(key) && key != 'overall_place'
          if key == 'net_time'
            attr = result.getTime()
          filteredAttributes[key] = attr
      )
      result.attributes = filteredAttributes
    )
    results 

  _getHeadings: (result) ->
    _.map(_.keys(result.attributes), (key) ->
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
