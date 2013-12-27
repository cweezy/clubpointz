app.TeamResult = Backbone.Model.extend({
  
  getTeamTime: ->
    totalSecs = @get('teamTime')
    hours = Math.floor totalSecs / 3600
    minutes = Math.floor (totalSecs % 3600) / 60
    seconds = totalSecs % 60

    str = ""
    str += hours + ":" if hours > 0
    str += 0 if minutes < 10
    str += minutes + ":"
    str += 0 if seconds < 10
    str += seconds
    str
})
