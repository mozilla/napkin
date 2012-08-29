define(['can', './extended', 'helpers/errors', 'can.super'], function(can, ExtendedControl, errors) {
  return ExtendedControl({
    init: function($element, options) {
      this._super($element, options);
      this.viewData = new can.Observe(options);
      this.screen = this.viewData.screen;
      this.screen.attr('projectId', this.options.projectId);

      $element.append(can.view('screen-template', this.viewData));
      this.setElement($element.find('.screen').last());
    },

    // to begin editing a project
    '.icon-pencil click': function($element, event) {
      event.preventDefault();
      this.viewData.attr('editing', 'editing');

      var $edit = this.$('.edit');
      $edit.focus();
      $edit.select();
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

    // to stop editing a screen
    '.icon-remove click': function($element, event) {
      event.preventDefault();
      if (this.viewData.attr('editing')) {
        this.viewData.removeAttr('editing');
        this.$('.edit').val(this.screen.attr('title'));
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
