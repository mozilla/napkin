define(['jquery', 'backbone', './extended', 'models/project'],
  function($, Backbone, ExtendedCollection, ProjectModel) {
    return ExtendedCollection.extend({
      url: 'projects',
      model: ProjectModel,

      initialize: function(models, options) {
        this.constructParent(arguments);
      },

      comparator: function(project) {
        return project.get('id');
      }
    });
  });
