define(['jquery', 'backbone', './extended', 'models/element'],
  function($, Backbone, ExtendedCollection, ElementModel) {
    return ExtendedCollection.extend({
      url: function() {
        return '/projects/' + this.options.projectId + '/screens/' +
          this.options.screenId + '/components/' + this.options.componentId +
          '/elements';
      },

      model: ElementModel
    });
  });
