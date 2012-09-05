define(['jquery', 'backbone'],
  function($, Backbone) {
    var ExtendedCollection = Backbone.Collection.extend({
      initialize: function(models, options) {
        this.options = options;
      },

      constructParent: function(args) {
        args = Array.prototype.slice.call(args, 0);
        ExtendedCollection.prototype.initialize.apply(this, args);
      }
    });

    return ExtendedCollection;
  });
