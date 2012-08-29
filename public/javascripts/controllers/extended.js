define(['can', 'helpers/utils', 'helpers/screen-utils'],
  function(can, utils, screenUtils) {
  return can.Control({
    init: function($element, options) {
      this.$ = utils.bind($element.find, $element);

      if (screenUtils.isSharePage()) {
        // no event handlers on share page
        this.off();
      }
    },

    setElement: function($element) {
      var curControls = this.element.data('controls');
      var newControls = $element.data('controls');

      this.off();

      // can uses the element's controls data internally to tell what
      // controllers are attached
      if (newControls) {
        newControls.push(this);
      } else {
        $element.data('controls', [ this ]);
      }
      curControls.splice(can.inArray(this, curControls), 1);

      // reset the element and re-bind handlers
      this.element = $element;
      if (!screenUtils.isSharePage()) {
        this.on();
      }

      // re-add the shortcut find function
      this.$ = utils.bind($element.find, $element);
    }
  });
});
