require.config({
  baseUrl: '/javascripts/'
});

require(['jquery', 'lib/bootstrap.min', 'https://browserid.org/include.js'], function($) {
  $(function() {
    var $body = $('body');
    var $loginForm = $('header .login-form');
    var $sidebar = $('#sidebar');

    // Browser ID login
    $loginForm.on('click', 'a', function(event) {
      event.preventDefault(); 
      navigator.id.getVerifiedEmail(function(assertion) {
        if (assertion) {
          $loginForm.find('input[name="bid_assertion"]').val(assertion);
          $loginForm.submit();
        }
      });
    });
  });
});

require(['scripts/core', 'lib/bootstrap.min']);
