app.TeamView = Backbone.View.extend(
  events:
    "click .nav-men": "_showMen"
    "click .nav-women": "_showWomen"

  bodyClass: 'results'
  contentClass: 'team'

  initialize: ->
    @model.fetch()
    @listenTo(@model, 'sync', @_renderResults)

  render: ->
    @$el.html(@template('team', {team: @model}))
    @$('.team-team-results .women').hide()

  _renderResults: ->
    teamResults = @model.get('teamResults')
    menResults = _.filter(teamResults, (tr) ->
      tr.division.indexOf('WOMEN') is -1
    )
    womenResults = _.filter(teamResults, (tr) ->
      tr.division.indexOf('WOMEN') isnt -1
    )
    @$('.team-team-results .men').append(@_renderGenderResults(menResults))
    @$('.team-team-results .women').append(@_renderGenderResults(womenResults))

  _renderGenderResults: (teamResults) ->
    teamResults = teamResults.sort (a, b) ->
      if a.raceId > b.raceId then 1 else -1

    allDivs = []
    for tr in teamResults
      race = app.races.get(tr.raceId)
      trDiv = $(@template('team_team_result', {
        tr: new app.TeamResult(tr)
        race: race
      }))
      results = tr.results.sort (a, b) ->
        if parseInt(a.overall_place) > parseInt(b.overall_place) then 1 else -1
      for r in results
        $(trDiv).find('.table').append(@template('race_results_row',
          result: r
          place: r.overall_place
        ))
      allDivs.push trDiv
    allDivs

  _showMen: ->
    @$('.nav-men').addClass 'active'
    @$('.nav-women').removeClass 'active'
    @$('.team-team-results .men').show()
    @$('.team-team-results .women').hide()

  _showWomen: ->
    @$('.nav-men').removeClass 'active'
    @$('.nav-women').addClass 'active'
    @$('.team-team-results .men').hide()
    @$('.team-team-results .women').show()
)
