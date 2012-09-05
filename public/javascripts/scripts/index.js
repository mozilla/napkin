require.config({
  baseUrl: '/javascripts/',
  paths: {
    backbone: 'lib/backbone.min',
    underscore: 'lib/underscore.min',
    router: 'routers/project-page'
  }
});

require(['jquery', 'views/project-list', 'views/screen-list'],
  function($, ProjectListView, ScreenListView) {
    new ProjectListView({ el: $('#sidebar') });
    new ScreenListView({ el: $('#content') });
  });

require(['scripts/core']);
