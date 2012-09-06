define(['jquery', 'backbone', 'underscore', './extended', 'helpers/shared-models',
        'helpers/errors', './layout-modification', 'jquery.serialize', 'jquery.ui'],
  function($, Backbone, _, ExtendedView, sharedModels, errors, LayoutModificationView) {
    return ExtendedView.extend({
      template: _.template($('#component-list-template').html()),

      initialize: function(options) {
        this.constructParent(arguments);
        var self = this;

        sharedModels.getCurrentScreen()
          .then(function(screen) {
            self.screen = screen;
            self.render();
          });
      },

      dragOptions:  {
        revert: 'invalid',
        // don't cancel if input is dragged
        cancel: ''
      },

      render: function() {
        this.$el.html(this.template(this.screen.toJSON()));
        this.$('.component').draggable(this.dragOptions);

        // to control screen layout modifications
        var view = new LayoutModificationView({ screen: this.screen });
        this.$el.append(view.render().el);
      },

      unrender: function() {
        // nothing to do
      },

      events: {
        'submit #screen-config': function(event) {
          event.preventDefault();
          var $form = $(event.currentTarget);

          var $submit = $form.find('[type="submit"]');
          $submit.attr('disabled', 'disabled');

          var formData = $form.serializeObject();
          // secure will not be set to false if the checkbox is not checked;
          // instead, it will remain undefined; in this case, set it manually
          if (!formData.secure) {
            formData.secure = false;
          }

          // merge form data with screen attributes
          this.screen.save(formData, {
            success: function() {
              // visual feedback with a check icon
              var $check = $form.find('.icon-ok');
              $check.show();

              $submit.removeAttr('disabled');
              setTimeout(function() {
                $check.hide();
              }, 1000);
            },

            error: function() {
              var args = Array.prototype.slice.call(arguments, 0);
              $submit.removeAttr('disabled');
              errors.tooltipHandler($submit).apply(errors, args);
            },

            wait: true
          });
        }
      }
    });
  });
