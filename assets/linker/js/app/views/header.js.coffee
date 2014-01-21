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
      that._showContactFormFooter()
      that._hideAllFieldNotes()
    )
    $('#contactModal .required').on('change keydown paste input', ->
      that._toggleSubmit()
      that._toggleFieldNote(@)
    )

  _submitContactForm: ->
    @_hideContactFormFooter()
    $.ajax({
      url: 'mail/send',
      data:
        name: $('#contact-name').val()
        email: $('#contact-email').val()
        message: $('#contact-message').val()
    }).done( (data) ->
      setTimeout( ->
        $('#contactModal').modal('hide')
      , 700)
    )

  _showContactFormFooter: ->
    $('.modal-footer').show()

  _hideContactFormFooter: ->
    $('.modal-footer').hide()

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

  _hideAllFieldNotes: ->
    $('.field-note').removeClass('active')
)
