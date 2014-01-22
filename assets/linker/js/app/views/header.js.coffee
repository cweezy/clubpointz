app.HeaderView = Backbone.View.extend(

  events:
    "click #contact-modal .submit-button": "_submitContactForm"
    "blur #contact-modal .required": "_toggleFieldNote"
  
  render: ->
    @$el.html(@template('header'))
    @_appendModals()
    @

  start: ->
    that = @
    $('#contact-modal').on('hidden.bs.modal', (e) ->
      that._clearForm()
      that._toggleSubmit()
      that._showContactFormFooter()
      that._hideAllFieldNotes()
    )
    $('#contact-modal .required').on('change keydown paste input', ->
      that._toggleSubmit()
      that._toggleFieldNote(@)
    )
    $('#info-modal .submit-button').hide()

  _appendModals: ->
    @$el.append(@template('modal',
      modalId: 'contact-modal'
      modalTitle: 'Contact'
      modalBody: @template('contact_form_body')
    ))  
    @$el.append(@template('modal',
      modalId: 'info-modal'
      modalTitle: 'Info'
      modalBody: @template('info_body')
    ))

  _submitContactForm: ->
    @_hideContactFormFooter()
    $.ajax({
      url: 'mail/send',
      data:
        name: $('#contact-name').val()
        email: $('#contact-email').val()
        message: $('#contact-message').val()
    }).done( (sent) ->
      if sent
        setTimeout( ->
          $('#contact-modal').modal('hide')
        , 700)
      else
        alert('error sending message')
    )

  _showContactFormFooter: ->
    $('#contact-modal .modal-footer').show()

  _hideContactFormFooter: ->
    $('#contact-modal .modal-footer').hide()

  _clearForm: ->
    $('#contact-modal input').val('')
    $('#contact-modal textarea').val('')

  _toggleSubmit: ->
    emptyInput = _.find($('#contact-modal .required'), (input) ->
      return $(input).val() == ''
    )
    if emptyInput
      $('#contact-modal .submit-button').attr('disabled', 'disabled')
    else
      $('#contact-modal .submit-button').removeAttr('disabled')

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
    $('#contact-modal .field-note').removeClass('active')
)
