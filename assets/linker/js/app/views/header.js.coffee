app.HeaderView = Backbone.View.extend(

  events:
    "click #contact-submit": "_submitContactForm"
  
  render: ->
    @$el.html(@template('header'))
    @

  _submitContactForm: ->
    $.ajax({
      url: 'mail/send',
      data:
        name: $('#contact-name').val()
        email: $('#contact-email').val()
        message: $('#contact-message').val()
    }).done( (data) ->
      alert(JSON.stringify(data))
    )
)

