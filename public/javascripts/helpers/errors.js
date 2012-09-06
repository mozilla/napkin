define(['lib/bootstrap.min'], function() {
  return {
    /* Returns a tooltip error handler for a create/save call.
     * Requires: element to create a tooltip on
     * Returns: an error handler that displays a tooltip if a problem arises
     */
    tooltipHandler: function($element, placement, howLong) {
      var self = this;
      return function(model, xhr) {
        self.displayTooltip($element, xhr.responseText, placement, howLong);
        $element.focus();
      };
    },

    /* Display a tooltip on the given element.
     * Requires: element, message of tooltip, placement, how long to display for
     */
    displayTooltip: function($element, message, placement, howLong) {
      placement = placement || 'bottom';
      howLong = howLong || 3000;

      var tooltip = $element.data('tooltip');
      if (tooltip) {
        // if the element already has a tooltip, reset its properties
        clearTimeout($element.data('timeout'));
        tooltip.options.title = message;
        tooltip.options.placement = placement;
        $element.tooltip('show'); // call show to update content
      } else {
        // otherwise create its tooltip
        $element.tooltip({
          trigger: 'manual',
          title: message,
          placement: placement
        }).tooltip('show');
      }

      // make the tooltip hide after the given display time has elapsed
      var timeout = setTimeout(function() {
        $element.tooltip('hide');
      }, howLong);
      $element.data('timeout', timeout);
    }
  };
});
