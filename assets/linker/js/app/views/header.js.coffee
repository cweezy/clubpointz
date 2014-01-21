app.HeaderView = Backbone.View.extend(

  events:
    "click #contact-submit": "_submitContactForm"
  
  render: ->
    @$el.html(@template('header'))
    @

  start: ->
    that = @
    $('#contactModal').on('hidden.bs.modal', (e) ->
      that._clearForm()
    )

  _submitContactForm: ->
    $.ajax({
      url: 'mail/send',
      data:
        name: $('#contact-name').val()
        email: $('#contact-email').val()
        message: $('#contact-message').val()
    }).done( (data) ->
      setTimeout( ->
        $('#contactModal').modal('hide')
      , 1000)
    )

  _clearForm: ->
    $('.modal-body input').val('')
    $('.modal-body textarea').val('')

)

