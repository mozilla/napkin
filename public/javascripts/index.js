require.config({
  paths: {
    can: 'lib/can.jquery.min'
  }
});

require(['controllers/project-list', 'controllers/screen-list'],
  function(ProjectListControl, ScreenListControl) {
    new ProjectListControl('#sidebar', {});
    new ScreenListControl('#content', {});
  });

require(['scripts/core']);
