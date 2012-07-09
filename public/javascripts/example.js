(function(window, document, $, undefined) {
  $(function() {
    var $window = $(window);
    var $body = $('body');
    var $sidebar = $('#sidebar');
    var $loginForm = $('#login-form');

    // extend sidebar to full window height
    $window.resize(function() {
      $sidebar.height(Math.max($window.height(), $body.height()));
    }).resize(); // initial call

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

    // add faded overlay on top of sidebar and main content area
    $('<div/>').css({
      position: 'absolute',
      top: 70,
      left: 0,
      // outerWidth/outerHeight = width/height with padding/border
      width: $sidebar.outerWidth(),
      height: $sidebar.outerHeight() - 70,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    }).appendTo('body');

    $('<div/>').css({
      position: 'absolute',
      top: 0,
      left: $sidebar.outerWidth(),
      // outerWidth/outerHeight = width/height with padding/border
      width: $body.outerWidth() - $sidebar.outerWidth(),
      height: $sidebar.outerHeight(),
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    }).appendTo('body');

    $loginForm.children('a').popover({
      title: 'Ready to prototype?',
      content: 'Sign in with Browser ID to get started.',
      trigger: 'manual',
      placement: 'bottom'
    }).popover('show');
  });
})(window, document, jQuery);
