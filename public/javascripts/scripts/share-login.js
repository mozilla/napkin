require(['jquery', 'https://login.persona.org/include.js'], function($) {
  $(function() {
    var $content = $('#content');

    /* Authenticatication for Persona */
    $content.on('click', 'a.login', function(event) {
      event.preventDefault();
      redirectUrl = $(this).data('redirect');
      navigator.id.request();
    });

    $content.on('click', 'a.log-out', function(event) {
      event.preventDefault();
      navigator.id.logout();
    });
  });
});
