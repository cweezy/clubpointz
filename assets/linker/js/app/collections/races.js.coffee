Races = Backbone.Collection.extend({

  model: app.Race

  url: '/race'
})
app.races = new Races()