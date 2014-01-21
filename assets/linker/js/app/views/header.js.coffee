app.HeaderView = Backbone.View.extend(

  events:
    "click #contact-submit": "_submitContactForm"
    "blur #contactModal .required": "_toggleFieldNote"
  
  render: ->
    @$el.html(@template('header'))
    @

  start: ->
    that = @
    $('#contactModal').on('hidden.bs.modal', (e) ->
      that._clearForm()
      that._toggleSubmit()
    )
    $('#contactModal .required').on('change keydown paste input', ->
      that._toggleSubmit()
      that._toggleFieldNote(@)
    )

  _submitContactForm: ->
    $('.modal-footer').hide()
    $.ajax({
      url: 'mail/send',
      data:
        name: $('#contact-name').val()
        email: $('#contact-email').val()
        message: $('#contact-message').val()
    }).done( (data) ->
      setTimeout( ->
        $('#contactModal').modal('hide')
        $('.modal-footer').show()
      , 700)
    )

  _clearForm: ->
    $('.modal-body input').val('')
    $('.modal-body textarea').val('')

  _toggleSubmit: ->
    emptyInput = _.find($('.modal-body .required'), (input) ->
      return $(input).val() == ''
    )
    if emptyInput
      $('#contact-submit').attr('disabled', 'disabled')
    else
      $('#contact-submit').removeAttr('disabled')

  _toggleFieldNote: (event) ->
    if event.type == 'focusout'
      inputId = $(event.target).attr('id')
      if $(event.target).val() == ''
        $('#' + inputId + '-note').addClass('active')
      else
        $('#' + inputId + '-note').removeClass('active')
    else
      if $(event).val() != ''
        $('#' + $(event).attr('id') + '-note').removeClass('active')
)
