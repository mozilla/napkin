define(['jquery', 'backbone', 'underscore', './extended', 'helpers/errors'],
  function($, Backbone, _, ExtendedView, errors) {
    return ExtendedView.extend({
      tagName: 'li',
      className: 'clearfix',

      template: _.template($('#project-template').html()),
      popoverTemplate: _.template($('#project-deletion-template').html()),

      render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        this.$('i').tooltip({ placement: 'bottom' });
        return this;
      },

      events: {
        'click': function(event) {
          event.preventDefault();
          this.navigate('#project/' + this.model.get('id'), { trigger: true });
        },

        // to begin editing a project
        'click .icon-pencil': function(event) {
          event.preventDefault();

          var $edit = this.$('.edit');
          this.$el.addClass('editing');

          $edit.focus()
            .select();
        },

        // to edit a project
        'keypress .edit': function(event) {
          var $edit = $(event.currentTarget);
          var self = this;

          // enter key pressed
          if (event.which === 13) {
            self.model.save({ title: $edit.val() }, {
              success: function(project) {
                self.$el.removeClass('editing');
                self.render();
              },

              error: errors.tooltipHandler($edit),
              wait: true
            });
          }
        },

        // to stop editing a project
        'click .icon-remove': function(event) {
          event.preventDefault();
          if (this.$el.hasClass('editing')) {
            this.$el.removeClass('editing');
            this.$('.edit').val(this.model.get('title'))
              .tooltip('hide');
          }
        },

        // to export a project
        'click .icon-inbox': function(event) {
          event.preventDefault();
          window.location.href = '/export/project/' + this.model.get('id');
        },

        // to delete a project
        'click .icon-trash': function(event) {
          event.preventDefault();
          event.stopPropagation();

          var $li = $(event.currentTarget).closest('li');
          var self = this;

          if (!this.$el.data('popover')) {
            this.$el.popover({
              title: 'Delete Project',
              trigger: 'manual',
              placement: 'bottom',
              content: this.popoverTemplate(this.model.toJSON())
            });
          }

          // open up a popover confirmation dialog
          this.publish('project:popover', this.$el);
        }
      },

      subscriptions: {
        // show the popover of the given $project element and hide all others
        'project:popover': function($project) {
          if (this.$el.is($project)) {
            this.$el.addClass('popover-active');
            this.$el.popover('show');
          } else if (this.$el.data('popover')) {
            this.$el.removeClass('popover-active');
            this.$el.popover('hide');
          }
        }
      },

      routeEvents: {
        'project': function(id) {
          id = parseInt(id, 10);
          if (this.model.get('id') === id) {
            this.$el.addClass('active');
          } else {
            this.$el.removeClass('active');
          }
        }
      },

      contextualEvents: {
        'click window | .popover-content .btn-danger': function(event) {
          event.preventDefault();
          if (this.$el.hasClass('popover-active')) {
            var self = this;
            // hide all popovers
            self.publish('project:popover', null);

            // user has confirmed they want to delete this project
            self.model
              .destroy({
                success: function(project) {
                  self.remove();
                },
                error: errors.tooltipHandler($(event.currentTarget))
              });
          }
        },

        'click window | .close-popover': function(event) {
          event.preventDefault();
          if (this.$el.hasClass('popover-active')) {
            // hide all popovers
            this.publish('project:popover', null);
            event.preventDefault();
          }
        }
      }
    });
  });
