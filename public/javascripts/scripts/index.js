require.config({
  baseUrl: '/javascripts/',
  paths: {
    can: 'lib/can.jquery.min',
    'can.super': 'lib/can.construct.super'
  }
});

require(['controllers/project-list', 'controllers/screen-list'],
  function(ProjectListControl, ScreenListControl) {
    new ProjectListControl('#sidebar', {});
    new ScreenListControl('#content', {});
  });

require(['scripts/core']);
