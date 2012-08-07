require.config({
  baseUrl: '/javascripts/',
  paths: {
    can: 'lib/can.jquery.min',
    'can.super': 'lib/can.construct.super',
    'can.sort': 'lib/can.observe.list.sort'
  }
});

require(['controllers/project-list', 'controllers/screen-list'],
  function(ProjectListControl, ScreenListControl) {
    new ProjectListControl('#sidebar', {});
    new ScreenListControl('#content', {});
  });

require(['scripts/core']);
