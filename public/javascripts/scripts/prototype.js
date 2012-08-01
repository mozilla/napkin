require.config({
  baseUrl: '/javascripts/',
  paths: {
    can: 'lib/can.jquery.min',
    'can.super': 'lib/can.construct.super',
    'jquery.ui': 'lib/jquery.ui',
    'jquery.serialize': 'lib/jquery.serialize'
  }
});

require(['controllers/screen-actions', 'controllers/screen-layout',
         'controllers/window', 'helpers/screen-utils'],
  function(ScreenActionsControl, ScreenLayoutControl, WindowControl, screenUtils) {
    new WindowControl(window, {});
    new ScreenLayoutControl('#content', {});

    if (!screenUtils.isSharePage()) {
      // screen actions should only be present on the prototyping page
      new ScreenActionsControl('#screen-actions', {});
    } else {
      // adds BrowserID functionality to sign in buttons
      require(['scripts/share-login']);
    }
  });

require(['scripts/core', 'lib/bootstrap.min']);
