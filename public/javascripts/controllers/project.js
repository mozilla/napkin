define(['can', './extended', 'helpers/errors', 'can.super'], function(can, ExtendedControl, errors) {
  return ExtendedControl({
    init: function($element, options) {
      this._super($element, options);
      this.viewData = new can.Observe(options);
      this.project = this.viewData.project;

      $element.append(can.view('project-template', this.viewData));
      this.setElement($element.children().last());
      
      // for event handlers
      this.sidebar = $('#sidebar');
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
    '{sidebar} .icon-trash click': function($element, event) {
      event.preventDefault();
      event.stopPropagation();

      var $li = $element.closest('li');
      if ($li.is(this.element)) {
        // if this project's trash icon was clicked, open up a popover
        // confirmation dialog
        var self = this;

        if (!this.element.data('popover')) {
          this.element.popover({
            title: 'Delete Project',
            trigger: 'manual',
            placement: 'bottom',
            content: can.view.render('#project-deletion-template', {})
          });
        }

        this.element.popover('show');
        this.element.addClass('popover-active');
      } else if (this.element.hasClass('popover-active')) {
        // otherwise, if this project's trash icon was not clicked and it has
        // a popover currently active, hide it
        this.element.popover('hide');
        this.element.removeClass('popover-active');
      }
    },

    '{window} .popover-content .btn-danger click': function($element, event) {
      if (this.element.hasClass('popover-active')) {
        var self = this;

        // user has confirmed they want to delete this project
        self.project.destroy()
          .then(function(project) {
            self.element.popover('hide');
            self.element.remove();
          }, errors.tooltipHandler($element));
      }
    },

    '{window} .close-popover click': function($element, event) {
      if (this.element.hasClass('popover-active')) {
        event.preventDefault();
        this.element.popover('hide');
      }
    },

    '{window} click': function($element, event) {
      if (this.element.hasClass('popover-active')) {
        var $target = $(event.target);
        
        // if the click occurred outside the popover hide it
        if ($target.closest('.popover').length === 0) {
          this.element.popover('hide');
        }
      }
    }
  });
});
