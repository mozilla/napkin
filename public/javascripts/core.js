(function(window, document, $, undefined) {
  $(function() {
    var $window = $(window);
    var $body = $('body');
    var $sidebar = $('#sidebar');

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
  });
})(window, document, jQuery);
