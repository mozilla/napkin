require(['jquery', 'https://login.persona.org/include.js'], function($) {
  $(function() {
    var $window = $(window);
    var $body = $('body');
    var $sidebar = $('#sidebar');

    // Persona login
    /* Authenticatication for Persona */
    $sidebar.on('click', 'a.login', function(event) {
      event.preventDefault();
      navigator.id.request();
    });

    $sidebar.on('click', 'a.log-out', function(event) {
      event.preventDefault();
      navigator.id.logout();
    });

    navigator.id.watch({
      loggedInEmail: currentUser,
      onlogin: function(assertion) {
        $.ajax({
          type: 'POST',
          url: '/log-in',
          data: { assertion: assertion },
          success: function(res, status, xhr) {
            window.location = redirectUrl;
          },
          error: function(res, status, xhr) {
            alert('login failure ' + res);
          }
        });
      },
      onlogout: function() {
        $.ajax({
          type: 'POST',
          url: '/log-out',
          success: function(res, status, xhr) {
            window.location.reload();
          },
          error: function(res, status, xhr) {
            console.log('logout failure ' + res);
          }
        });
      }
    });

    // placeholder polyfill
    var input = document.createElement('input');
    if (!('placeholder' in input)) {
      $('input[placeholder]').each(function() {
        var $this = $(this);
        var placeholder = $this.attr('placeholder');

        if ($this.val() === '') {
          $this.val(placeholder);
        }

        $this.focus(function() {
          if ($this.val() === placeholder) {
            $this.val('');
          }
        });

        $this.blur(function() {
          if ($this.val() === '') {
            $this.val(placeholder);
          }
        });
      });
    }

    // extend sidebar to full window height
    $window.resize(function() {
      $sidebar.height(Math.max($window.height(), $body.height()));
    }).resize(); // initial call

    // periodically refresh sidebar
    setTimeout(function resizeSidebar() {
      $window.resize();
      setTimeout(resizeSidebar, 500);
    }, 500);

    // display selected option in plain text to allow for easier select styling
    $window.on('change', '.field select', function() {
      var $this = $(this);
      $this.siblings('.selection').text($this.find('option:selected').text());
    });
  });
});
