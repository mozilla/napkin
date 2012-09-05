define(['backbone', './extended'], function(Backbone, ExtendedModel) {
  return ExtendedModel.extend({
    urlRoot: function() {
      return '/projects/' + this.options.projectId + '/screens';
    }
  });
});
