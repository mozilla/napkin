define(['jquery', 'backbone', './extended', 'models/screen'],
  function($, Backbone, ExtendedCollection, ScreenModel) {
    return ExtendedCollection.extend({
      url: function() {
        return '/projects/' + this.options.projectId + '/screens';
      },

      initialize: function(models, options) {
        this.constructParent(arguments);
      },

      model: ScreenModel,
      comparator: function(screen) {
        return screen.get('id');
      }
    });
  });
