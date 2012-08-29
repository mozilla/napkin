define(['jquery', 'can', './extended'], function($, can, ExtendedControl) {
  return ExtendedControl({
    'keydown': function($element, event) {
      if ($('input:focus, textarea:focus').length === 0) {
        // isolatedKeyDown refers to the fact that this keydown is not meant
        // for a focused element on the page; rather, it is an isolated event
        this.element.trigger('isolatedKeyDown', event);
      }
    }
  });
});
