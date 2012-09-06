define(['jquery', 'backbone', 'underscore', './extended'],
  function($, Backbone, _, ExtendedView) {
  return ExtendedView.extend({
    events: {
      'keydown': function(event) {
        if ($('input:focus, textarea:focus').length === 0) {
          // key down should only trigger when it is not meant for a focused element
          this.publish('keyManager:keyDown', event);
        }
      }
    }
  });
});
