define(['jquery', 'backbone', './extended', 'models/project'],
  function($, Backbone, ExtendedCollection, ProjectModel) {
    return ExtendedCollection.extend({
      url: '/projects',
      model: ProjectModel,

      comparator: function(project) {
        return project.get('id');
      }
    });
  });
