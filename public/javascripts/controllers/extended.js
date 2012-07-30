define(['can', 'helpers/utils'], function(can, utils) {
  return can.Control({
    init: function($element, options) {
      this.$ = utils.bind($element.find, $element);
    },

    setElement: function($element) {
      this.off();

      // can uses the element's controls data internally
      $element.data('controls', this.element.data('controls'));
      this.element.removeData('controls');

      // reset the element and re-bind handlers
      this.element = $element;
      this.on();

      // re-add the shortcut find function
      this.$ = utils.bind($element.find, $element);
    }
  });
});
