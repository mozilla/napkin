define(['can', './extended', 'helpers/errors', 'can.super'], function(can, ExtendedControl, errors) {
  return ExtendedControl({
    init: function($element, options) {
      this._super($element, options);
      this.viewData = new can.Observe(options);
      this.project = this.viewData.project;

      $element.append(can.view('project-template', this.viewData));
      this.setElement($element.children().last());
    },

    'project/:projectId route': function(data) {
      var projectId = parseInt(data.projectId, 10);
      if (this.project.attr('id') === projectId) {
        this.viewData.attr('active', 'active');
      } else {
        this.viewData.removeAttr('active');
      }
    },

    // to begin editing a project
    '.icon-pencil click': function($element, event) {
      event.preventDefault();
      this.viewData.attr('editing', 'editing');
      
      var $edit = this.$('.edit');
      $edit.focus();
      $edit.select();
    },

    // to edit a project
    '.edit keypress': function($element, event) {
      var self = this;

      // enter key pressed
      if (event.which === 13) {
        self.project.attr('title', $element.val());
        self.project.save()
          .then(function(project) {
            self.viewData.removeAttr('editing');
          }, errors.tooltipHandler($element));
      }
    },

    // to stop editing a project
    '.icon-remove click': function($element, event) {
      event.preventDefault();
      if (this.viewData.attr('editing')) {
        this.viewData.removeAttr('editing');
        this.$('.edit').val(this.project.attr('title'));
      }
    },

    // to delete a project
    '.icon-trash click': function($element, event) {
      event.preventDefault();
      var self = this;

      self.project.destroy()
        .then(function(project) {
          self.element.remove();
        }, errors.tooltipHandler($element));
    }
  });
});
