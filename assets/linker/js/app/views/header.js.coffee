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
    $('#contactModal .required').on('change keydown paste input', ->
      that._enableDisableSubmit()
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

  _enableDisableSubmit: ->
    emptyInput = _.find($('.modal-body .required'), (input) ->
      return $(input).val() == ''
    )
    if emptyInput
      $('#contact-submit').attr('disabled', 'disabled')
    else
      $('#contact-submit').removeAttr('disabled')
)

