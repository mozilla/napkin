define(['jquery', 'backbone', 'underscore', './extended', 'helpers/errors'],
  function($, Backbone, _, ExtendedView, errors) {
  return ExtendedView.extend({
    tagName: 'div',
    className: 'span3 screen',

    template: _.template($('#screen-template').html()),

    initialize: function(options) {
      this.constructParent(arguments);
      this.render();
    },

    render: function() {
      var templateData = this.model.toJSON();
      templateData.projectId = this.options.projectId;
      this.$el.html(this.template(templateData));
      return this;
    },

    events: {
      // to begin editing a screen
      'click .icon-pencil': function(event) {
        event.preventDefault();
        this.$el.addClass('editing');

        var $edit = this.$('.edit');
        $edit.focus();
        $edit.select();
      },

      // to edit a screen
      'keypress .edit': function(event) {
        // enter key pressed
        if (event.which === 13) {
          var self = this;
          var $edit = self.$('.edit');

          self.model.save({ title: $edit.val() }, {
            success: function(screen) {
              self.$el.removeClass('editing');
              self.render();
            },

            error: errors.tooltipHandler($edit),
            wait: true
          });
        }
      },

      // to stop editing a screen
      'click .icon-remove': function(event) {
        event.preventDefault();
        if (this.$el.hasClass('editing')) {
          this.$el.removeClass('editing');
          this.$('.edit').val(this.model.get('title'))
            .tooltip('hide');
        }
      },

      // to delete a screen
      'click .icon-trash': function(event) {
        event.preventDefault();
        this.model.destroy({
          error: errors.tooltipHandler($(event.currentTarget)),
          wait: true
        });
      }
    }
  });
});
