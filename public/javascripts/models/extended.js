define(['can', 'helpers/screen-utils'], function(can, screenUtils) {
  return can.Model({
    // run findAll/findOne with URL data from screenUtils
    withRouteData: function() {
      var self = this;
      var urlData = screenUtils.getUrlData();

      return {
        findAll: function(params) {
          var args = Array.prototype.slice.call(arguments, 0);
          args.unshift('findAll');
          return this.run.apply(this, args);
        },

        findOne: function(params) {
          var args = Array.prototype.slice.call(arguments, 0);
          args.unshift('findOne');
          return this.run.apply(this, args);
        },

        run: function(name, params) {
          var args = Array.prototype.slice.call(arguments, 2);
          params = can.extend({}, urlData, params);
          args.unshift(params);
          return self[name].apply(self, args);
        }
      };
    },

    findAllAndCache: function(params, element) {
      var self = this;
      var args = Array.prototype.slice.call(arguments, 0);

      self.findAll(params) 
        .then(function(models) {
          // cache models for further use
          self.cachedModels = models;
        }, function(xhr) {
          // TODO: error handler
        });
    },

    // calls filterFn on each cached model, returning the ones that make
    // filterFn return a truthy value
    filter: function(filterFn) {
      var models = [];

      self.cachedModels.each(function(model) {
        if (filterFn(model)) {
          models.push(model);
        }
      });
      return models;
    }
  }, {
    // run save/destory with URL data from screenUtils
    withRouteData: function(params) {
      var urlData = screenUtils.getUrlData();
      if (urlData) {
        this.attr(urlData);
      }

      // extra optional data provided by the user
      if (params) {
        this.attr(params);
      }
      // for chaining purposes
      return this;
    }
  });
});
