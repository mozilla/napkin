define(['can', './extended', 'models/screen', './screen', 'helpers/errors', 'can.super'],
  function(can, ExtendedControl, ScreenModel, ScreenControl, errors) {
    return ExtendedControl({
      init: function($element, options) {
        this._super($element, options);
        this.element.hide();
      },

      'project/:projectId route': function(data) {
        this.element.show();
        this.projectId = data.projectId;
        this.renderAllScreens();
      },

      numScreens: 0,
      renderAllScreens: function() {
        var self = this;

        // create a ScreenControl for each project
        ScreenModel.findAll({ projectId: self.projectId })
          .then(function(screens) {
            self.cachedScreens = screens;
            self.clearScreens();
            self.renderEachScreen();
            self.bindListChangeEvents();
          });
      },

      // when the screen list changes, automatically re-render display
      bindListChangeEvents: function() {
        var self = this;
        var screens = self.cachedScreens;

        screens.bind('change', function(event, what, how, data) {
          if (how === 'add') {
            var index = parseInt(what, 10);
            var screen = data[0];

            if (index === screens.length - 1) {
              // added to end; simply render another screen
              self.renderScreen(screen);
            } else {
              // added somewhere in middle; rerender everything
              self.clearScreens();
              self.renderEachScreen();
            }
          } else if (how === 'remove') {
            self.clearScreens();
            self.renderEachScreen();
          }
        });
      },

      clearScreens: function() {
        this.numScreens = 0;
        this.element.children('.screen-row').remove();
      },

      renderEachScreen: function() {
        var self = this;
        self.cachedScreens.each(function(screen) {
          self.renderScreen(screen);
        });
      },

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

        self.numScreens++;
      },

      // to add a screen
      '#add-screen form submit': function($element, event) {
        event.preventDefault();
        var self = this;

        var $input = $('#screen-title');
        var screen = new ScreenModel({
          projectId: self.projectId,
          title: $input.val()
        });

        screen.save()
          .then(function(screen) {
            self.cachedScreens.push(screen);
            $input.val('');
          }, errors.tooltipHandler($input));
      }
    });
  });
