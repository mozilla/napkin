define(['backbone', 'models/screen', 'helpers/screen-utils'],
  function(Backbone, ScreenModel, screenUtils) {
    var mediator = _.extend({}, Backbone.Events);

    return {
      /* Gets the current screen model.
       * Returns: the current screen model
       */
      getCurrentScreen: function() {
        var urlData = screenUtils.getUrlData();

        var self = this;
        var deferred = $.Deferred();

        if (self.waitingForScreen) {
          // this method may be called while a screen is being fetched; in
          // this case, hook into the mediator's sharedModels:screen event,
          // which will hold the resultant string
          mediator.on('sharedModels:screen', function(screen) {
            deferred.resolve(screen);
          });
        } else if (self.cachedScreen) {
          deferred.resolve(self.cachedScreen);
        } else {
          // it takes time to get the screen, and we don't want two screen
          // requests; as a result, set a flag here indicating the screen is on
          // its way
          self.waitingForScreen = true;
          var screen = new ScreenModel({ id: urlData.screenId }, urlData);

          screen.fetch({
            success: function() {
              self.cachedScreen = screen;
              self.waitingForScreen = false;

              // trigger a sharedModels:screen event when the screen has
              // arrived for all others that may have called this method while
              // the screen was being fetched (see mediator.on() above)
              mediator.trigger('sharedModels:screen', screen);
              deferred.resolve(screen);
            }
          });
        }

        return deferred;
      }
    };
  });
