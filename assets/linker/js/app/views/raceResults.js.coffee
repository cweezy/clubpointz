
PAGE_SIZE = 500

app.RaceResultsView = Backbone.View.extend(

  bodyClass: 'results'

  events:
    "click .nav-team-results": "_showTeamResults"
    "click .nav-indiv-results": "_showIndivResults"
    "click .pagination .backward": "_pageBack"
    "click .pagination .forward": "_pageNext"
    "click .pagination .num": "_pageNum"
 
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

    indivResults = @$('.indiv-results')
    results = @_filterResults()
    headingData = @_getHeadings(results[0])
    headings = @template('results_table_headings',
      headings : headingData
    )
    @$('.team-result').append(headings)

    @numPages = Math.ceil results.length / PAGE_SIZE
    indivResults.append(@template('race_results_pagination', {numPages: @numPages}))

    str = ""
    currentPage = null

    _.each(results, (result, idx) =>
      if idx % PAGE_SIZE is 0
        indivResults.append currentPage if currentPage?
        currentPage = $(@template('race_results_page', {idx: idx / PAGE_SIZE}))
        currentPage.append headings

      resRow = @template('race_results_row',
        result: result.attributes
        place: idx + 1
      )
      currentPage.append(resRow)
      trDiv = @idToDiv[result.id]
      if trDiv?
        $(trDiv.find('.team-result')).append resRow
    )
    indivResults.append currentPage if currentPage?

    @pageIdx = 0 # initialize to page 1

    # pagination jquery objects
    @pageBack = @$('.pagination .backward')
    @pageForward = @$('.pagination .forward')
    @pageNums = @$('.pagination .num')
    @resultsPages = @$('.results-page')


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
    @$('.team-results').css('display', 'block')
    @$('.nav-indiv-results').removeClass('active')
    @$('.indiv-results').css('display', 'none')

  _showIndivResults: ->
    @$('.nav-indiv-results').addClass('active')
    @$('.indiv-results').css('display', 'block')
    @$('.nav-team-results').removeClass('active')
    @$('.team-results').css('display', 'none')
    @_showPage()

  _pageBack: ->
    @pageIdx--
    @_showPage()

  _pageNext: ->
    @pageIdx++
    @_showPage()

  _pageNum: (event) ->
    @pageIdx = $(event.currentTarget).data('val')
    @_showPage()

  _showPage: ->
    @pageBack.toggleClass('disabled', @pageIdx is 0)
    @pageForward.toggleClass('disabled', @pageIdx is @numPages - 1)
    @pageNums.removeClass('active').eq(@pageIdx).addClass('active')
    @resultsPages.css('display', 'none').eq(@pageIdx).css('display', 'table')
)
