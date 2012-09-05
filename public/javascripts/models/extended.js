define(['backbone', 'underscore'], function(Backbone, _) {
  return Backbone.Model.extend({
    url: function() {
      // prioritize the collection URL first
      var baseUrl = _.result(this.collection, 'url') || _.result(this, 'urlRoot');

      if (this.isNew()) {
        return baseUrl;
      }

      // make baseUrl end with a trailing slash
      if (baseUrl.charAt(baseUrl.length - 1) !== '/') {
        baseUrl += '/';
      }
      return baseUrl + encodeURIComponent(this.id);
    },

    initialize: function(attributes, options) {
      this.options = options;
    }
  });
});
