define(['jquery', 'can', './switch', 'helpers/screen-utils', 'models/screen',
        'can.super', 'jquery.serialize', 'jquery.ui'],
  function($, can, SwitchControl, screenUtils, ScreenModel) {
    return SwitchControl({
      init: function($element, options) {
        this._super($element, options);
        var self = this;
        var urlData = screenUtils.getUrlData();

        ScreenModel.withRouteData()
          .findOne({ id: urlData.screenId })
          .then(function(screen) {
            self.screen = screen;
            self.activate();
          }, function() {
            // TODO: handle error
          });
      },

      dragOptions:  {
        revert: 'invalid',
        // don't cancel if input is dragged
        cancel: ''
      },

      render: function() {
        var urlData = screenUtils.getUrlData();
        this.element.html(can.view('component-list-template', this.screen));
        this.$('.component').draggable(this.dragOptions);
      },

      '#screen-config submit': function($form, event) {
        event.preventDefault();
        var $submit = $form.find('[type="submit"]');
        $submit.attr('disabled', 'disabled');

        var formData = $form.serializeObject();
        // secure will not be set to false if the checkbox is not checked;
        // instead, it will remain undefined; in this case, set it manually
        if (!formData.secure) {
          formData.secure = false;
        }

        // merge form data with screen attributes
        this.screen.attr(formData);
        this.screen.withRouteData()
          .save()
          .then(function(screen) {
            // visual feedback with a check icon
            var $check = $form.find('.icon-ok');
            $check.show();

            $submit.removeAttr('disabled');
            setTimeout(function() {
              $check.hide();
            }, 1000);
          }, function(xhr) {
            // TODO: handle error
          });
      }
    });
  });
