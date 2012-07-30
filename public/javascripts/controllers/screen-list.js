define(['can', './extended', 'models/screen', './screen', 'helpers/errors'],
  function(can, ExtendedControl, ScreenModel, ScreenControl, errors) {
    return ExtendedControl({
      init: function($element, options) {
        var $screenRow;
      },

      'project/:projectId route': function(data) {
        this.projectId = data.projectId;
        this.renderAllScreens();
      },

      renderAllScreens: function() {
        var self = this;

        // create a ScreenControl for each project
        ScreenModel.findAll({ projectId: self.projectId })
          .then(function(screens) {
            // clear out any old screens
            self.numScreens = 0;
            self.element.children('.screen-row').remove();

            can.each(screens, function(screen) {
              self.renderScreen(screen);
            });
          });
      },

      numScreens: 0,
      renderScreen: function(screen) {
        var self = this;
        var $screenRow;

        // insert a new row for every four screens
        if (self.numScreens % 4 === 0) {
          self.element.append(can.view('screen-row-template'), {});
        }

        $screenRow = self.element.children().last();
        new ScreenControl($screenRow,
          { screen: screen, projectId: self.projectId });

        screen.unbind('destroyed');
        screen.bind('destroyed', function() {
          self.renderAllScreens();
        });

        self.numScreens++;
      },

      // to add a screen
      '#add-screen form submit': function($element, event) {
        event.preventDefault();
        var self = this;

        var $input = $('#screen-title');
        var screen = new ScreenModel({ projectId: self.projectId, title: $input.val() });

        screen.save()
          .then(function(screen) {
            self.renderScreen(screen);
            $input.val('');
          }, errors.tooltipHandler($input));
      }
    });
  });
