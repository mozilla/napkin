require.config({
  baseUrl: '/javascripts/',
  paths: {
    backbone: 'lib/backbone.min',
    underscore: 'lib/underscore.min',
    router: 'routers/project-page',
    'jquery.ui': 'lib/jquery.ui',
    'jquery.serialize': 'lib/jquery.serialize'
  }
});

require(['jquery', 'views/key-manager', 'views/screen-layout',
         'views/screen-actions', 'helpers/screen-utils'],
  function($, KeyManagerView, ScreenLayoutView, ScreenActionsView, screenUtils) {
    new KeyManagerView({ el: window });
    new ScreenLayoutView({ el: $('#content') });

    if (!screenUtils.isSharePage()) {
      // screen actions should only be present on the prototyping page
      new ScreenActionsView({ el: $('#screen-actions') });
    } else {
      // adds BrowserID functionality to sign in buttons
      require(['scripts/share-login']);
    }
  });

require(['scripts/core', 'lib/bootstrap.min']);
