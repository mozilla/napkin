$(function() {
  // persona login
  $('.login-form a').click(function(event) {
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
