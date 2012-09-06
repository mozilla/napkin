define(['jquery', 'backbone'],
  function($, Backbone) {
    var Router = Backbone.Router.extend({
      routes: {
        '': 'empty',
        'project/:id': 'project'
      }
    });

    var router = new Router();
    return router;
  });
