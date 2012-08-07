require.config({
  baseUrl: '/javascripts/'
});

require(['jquery', 'https://browserid.org/include.js'], function($) {
  $(function() {
    var $loginForm = $('#login-form');

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

require(['scripts/core']);
