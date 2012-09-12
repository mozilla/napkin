require.config({
  baseUrl: '/javascripts/'
});

require(['scripts/core', 'lib/bootstrap.min']);

require(['jquery', 'lib/bootstrap.min'], function($) {
  $(function() {
    var $sidebar = $('#sidebar');

    /* Authenticatication for Persona */
    $sidebar.on('click', 'a.login', function(event) {
      event.preventDefault();
      navigator.id.request();
    });

    $sidebar.on('click', 'a.log-out', function(event) {
      event.preventDefault();
      navigator.id.logout();
    });
  });
});
