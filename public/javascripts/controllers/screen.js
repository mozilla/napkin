define(['can', './extended', 'helpers/errors'], function(can, ExtendedControl, errors) {
  return ExtendedControl({
    init: function($element, options) {
      this.viewData = new can.Observe(options);
      this.screen = this.viewData.screen;
      this.screen.attr('projectId', this.options.projectId);

      $element.append(can.view('screen-template', this.viewData));
      this.setElement($element.find('.screen').last());
      window.sc = this;
    },

    // to begin editing a project
    '.icon-pencil click': function($element, event) {
      event.preventDefault();
      this.viewData.attr('editing', 'editing');
      this.$('.edit').focus();
    },

    // to edit a screen
    '.edit keypress': function($element, event) {
      var self = this;

      // enter key pressed
      if (event.which === 13) {
        self.screen.attr('title', $element.val());
        self.screen.save({ projectId: this.projectId })
          .then(function(screen) {
            self.viewData.removeAttr('editing');
          }, errors.tooltipHandler($element));
      }
    },

    // to delete a screen
    '.icon-trash click': function($element, event) {
      event.preventDefault();
      this.screen.destroy()
        .then(function(screen) {
        }, errors.tooltipHandler($element));
    }
  });
});
