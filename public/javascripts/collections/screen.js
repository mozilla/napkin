define(['jquery', 'backbone', './extended', 'models/screen'],
  function($, Backbone, ExtendedCollection, ScreenModel) {
    return ExtendedCollection.extend({
      url: function() {
        return '/projects/' + this.options.projectId + '/screens';
      },

      model: ScreenModel,
      comparator: function(screen) {
        return screen.get('id');
      }
    });
  });
