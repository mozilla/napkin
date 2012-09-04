define(['jquery', 'can', './switch', 'helpers/errors', 'can.super', 'jquery.serialize'],
  function($, can, SwitchControl, errors) {
    return SwitchControl({
      init: function($element, options) {
        this._super($element, options);
        this.setComponentModel(options.component);
      },

      deactivate: function() {
        this.unrender();
        this._super();
      },

      setComponentModel: function(component) {
        if (this.component !== component) {
          this.deactivate();
          this.component = component;
          this.activate();
        }
      },

      render: function() {
        var type = this.component.attr('type');
        this.element.html(can.view(type + '-element-list-template', this.component));

        this.element.addClass('elements');
        this.element.addClass(type + '-elements');
        this.centerAddButtons();

        // prevent links/inputs on sidebar from being tabbed to so that user
        // can edit elements in the main content area by hitting tab
        this.$('a, input').attr('tabindex', '-1');

        // add text to selection div inside select box
        var $select = this.$('.field select');
        $select.siblings('.selection')
          .text($select.find('option:selected').text());
      },

      unrender: function() {
        if (this.component) {
          var type = this.component.attr('type');
          this.element.removeClass('elements');
          this.element.removeClass(type + '-elements');
        }
      },

      centerAddButtons: function() {
        this.$('.btn').each(function() {
          var $btn = $(this);
          var $element = $btn.siblings('.element');

          if ($element.height() > $btn.height()) {
            // center each button vertically if the parent element is larger
            // than it
            $btn.css('margin-top', ($element.height() - $btn.height()) / 2);
          }
        });
      },

      '.component-config submit': function($form, event) {
        event.preventDefault();
        var $submit = $form.find('[type="submit"]');
        $submit.attr('disabled', 'disabled');

        var formData = $form.serializeObject();
        // merge form data with component attributes
        this.component.attr(formData);

        this.component.withRouteData()
          .save()
          .then(function(component) {
            // visual feedback with a check icon
            var $check = $form.find('.icon-ok');
            $check.show();

            $submit.removeAttr('disabled');
            setTimeout(function() {
              $check.hide();
            }, 1000);
          }, function(xhr) {
            $submit.removeAttr('disabled');
            errors.tooltipHandler($submit)(xhr);
          });
      },

      'li .btn-success click': function($btn, event) {
        event.preventDefault();
        var $element = $btn.siblings('.element');
        $element.trigger('addRequested');
      }
    });
  });
