app.HeaderView = Backbone.View.extend(

  events:
    "click #contact-submit": "_submitContactForm"
  
  render: ->
    @$el.html(@template('header'))
    @

  start: ->
    that = @
    $('#contactModal').on('hidden.bs.modal', (e) ->
      $('.modal-body-sent').hide() 
      $('.modal-body').show()
      that._clearForm()
    )

  _submitContactForm: ->
    $('.modal-body-sending').show()
    $('.modal-body').hide()
    $.ajax({
      url: 'mail/send',
      data:
        name: $('#contact-name').val()
        email: $('#contact-email').val()
        message: $('#contact-message').val()
    }).done( (data) ->
      $('.modal-body-sending').hide()
      $('.modal-body-sent').show()
      $('#contactModal').modal('hide')
    )

  _clearForm: ->
    $('.modal-body input').val('')
    $('.modal-body textarea').val('')

)

