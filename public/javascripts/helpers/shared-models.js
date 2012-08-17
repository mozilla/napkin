define(['models/screen', 'helpers/screen-utils'],
  function(ScreenModel, screenUtils) {
    return {
      /* Gets the current screen model.
       * Returns: the current screen model
       */
      getCurrentScreen: function() {
        var urlData = screenUtils.getUrlData();
        var deferred = new can.Deferred();
        var self = this;

        if (self.cachedScreen) {
          deferred.resolve(self.cachedScreen);
        } else {
          ScreenModel.withRouteData()
            .findOne({ id: urlData.screenId })
            .then(function(screen) {
              self.cachedScreen = screen;
              deferred.resolve(screen);
            }, function(xhr) {
              deferred.reject(xhr);
            });
        }

        return deferred;
      }
    };
  });
