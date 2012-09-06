define(['jquery', 'backbone', 'underscore', './extended', 'helpers/errors',
        'jquery.serialize'],
  function($, Backbone, _, ExtendedView, errors) {
    return ExtendedView.extend({
      initialize: function(options) {
        this.constructParent(arguments);
        this.setComponentModel(options.component);
        this.render();
      },

      dragOptions: {
        revert: 'invalid',
        // don't cancel if input is dragged
        cancel: ''
      },

      setComponentModel: function(component) {
        if (this.component !== component) {
          this.publish('screenActions:deactivateElementsInComponent', this.component);
          this.component = component;
        }
      },

      render: function() {
        var type = this.component.get('type');
        var templateId = type + '-element-list-template';

        var template = _.template($('#' + templateId).html());
        this.$el.html(template(this.component.toJSON()));

        this.$el.addClass('elements');
        this.$el.addClass(type + '-elements');
        this.centerAddButtons();

        // prevent links/inputs on sidebar from being tabbed to so that user
        // can edit elements in the main content area by hitting tab
        this.$('a, input').attr('tabindex', '-1');

        // add text to selection div inside select box
        var $select = this.$('.field select');
        $select.siblings('.selection')
          .text($select.find('option:selected').text());

        // elements can also be dragged into their component
        this.$('.element').draggable(this.dragOptions);
      },

      unrender: function() {
        if (this.component) {
          var type = this.component.get('type');
          this.$el.removeClass('elements');
          this.$el.removeClass(type + '-elements');
        }
      },

      centerAddButtons: function() {
        this.$('.btn').each(function() {
          var $btn = $(this);
          var $element = $btn.siblings('.element');

          if ($element.height() > $btn.height()) {
            // center each button vertically if the parent element is larger than it
            $btn.css('margin-top', ($element.height() - $btn.height()) / 2);
          }
        });
      },

      events: {
        'submit .component-config': function(event) {
          event.preventDefault();
          var $form = $(event.currentTarget);

          var $submit = $form.find('[type="submit"]');
          $submit.attr('disabled', 'disabled');

          var formData = $form.serializeObject();
          // merge form data with component attributes
          this.component.save(formData, {
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
        },

        'click li .btn-success': function(event) {
          event.preventDefault();
          var $btn = $(event.currentTarget);

          var $element = $btn.siblings('.element');
          this.publish('elementList:addElement', $element);
        }
      }
    });
  });
