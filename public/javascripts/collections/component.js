define(['jquery', 'backbone', './extended', 'models/component'],
  function($, Backbone, ExtendedCollection, ComponentModel) {
    return ExtendedCollection.extend({
      url: function() {
        return '/projects/' + this.options.projectId + '/screens/' +
          this.options.screenId + '/components';
      },

      model: ComponentModel
    });
  });
