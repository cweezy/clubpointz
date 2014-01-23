app.HeaderView = Backbone.View.extend(

  events:
    "click #contact-link": "_showContactModal"
    "click #info-link": "_showInfoModal"
    "click #contact-modal .submit-button": "_submitContactForm"
    "click #info-contact-link": "_showContactModal"
    "blur #contact-modal .required": "_toggleFieldNote"
  
  render: ->
    @$el.html(@template('header'))
    @_appendModals()
    @

  start: ->
    @contactModal = $('#contact-modal')
    @infoModal = $('#info-modal')
    that = @
    @contactModal.on('hidden.bs.modal', (e) ->
      that._clearContactForm()
      that._toggleSubmit()
      that._showContactFormFooter()
      that._hideAllFieldNotes()
    )
    @contactModal.find('.required').on('change keydown paste input', ->
      that._toggleSubmit()
      that._toggleFieldNote(@)
    )

  _appendModals: ->
    @$el.append(@template('modal',
      modalId: 'contact-modal'
      modalTitle: 'Contact'
      modalBody: @template('contact_form_body')
      showSubmitButton: true
    ))  
    @$el.append(@template('modal',
      modalId: 'info-modal'
      modalTitle: 'Info'
      modalBody: @template('info_body')
      showSubmitButton: false
    ))

  _showContactModal: ->
    $('.modal.active').modal('hide')
    $('.modal').removeClass('active')
    @contactModal.modal('show')
    @contactModal.addClass('active')

  _showInfoModal: ->
    $('.modal.active').modal('hide')
    $('.modal').removeClass('active')
    @infoModal.modal('show')
    @infoModal.addClass('active')

  _submitContactForm: ->
    @_hideContactFormFooter()
    that = @
    $.ajax({
      url: 'mail/send',
      data:
        name: $('#contact-name').val()
        email: $('#contact-email').val()
        message: $('#contact-message').val()
    }).done( (sent) ->
      if sent
        setTimeout( ->
          that.contactModal.modal('hide')
        , 700)
      else
        alert('error sending message')
    )

  _showContactFormFooter: ->
    @contactModal.find('.modal-footer').show()

  _hideContactFormFooter: ->
    @contactModal.find('.modal-footer').hide()

  _clearContactForm: ->
    @contactModal.find('input').val('')
    @contactModal.find('textarea').val('')

  _toggleSubmit: ->
    emptyInput = _.find(@contactModal.find('.required'), (input) ->
      return $(input).val() == ''
    )
    if emptyInput
      @contactModal.find('.submit-button').attr('disabled', 'disabled')
    else
      @contactModal.find('.submit-button').removeAttr('disabled')

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
    @contactModal.find('.field-note').removeClass('active')
)
