$(function() {
  // Browser ID login
  $('#content').on('click', '.login-form a', function(event) {
    event.preventDefault(); 
    var $form = $(this).parent();

    navigator.id.getVerifiedEmail(function(assertion) {
      if (assertion) {
        $form.find('input[name="bid_assertion"]').val(assertion);
        $form.submit();
      }
    });
  });
});
