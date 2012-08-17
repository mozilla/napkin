define(function() {
  return {
    /* Binds the context to the given function.
     * Requires: function, context
     * Returns: function that calls the originally given function with this set
     *  to the given context
     */
    bind: function(fn, context) {
      return function() {
        return fn.apply(context, Array.prototype.slice.call(arguments, 0));
      };
    },

    /* Debounces the given function on the trailing edge, preventing it from
     * being called until at least the given time in ms has elapsed since the
     * last call of the function.
     * Requires: function, context, debouncing time
     * Returns: debounced function
     */
    debounce: function(fn, context, time) {
      var timeoutToCall;

      return function() {
        var parentArgs = arguments;

        // if there is an active timeout, clear it and set a new one, waiting
        // until the given time has elapsed since the last call of this function
        if (timeoutToCall) {
          clearTimeout(timeoutToCall);
        }

        timeoutToCall = setTimeout(function() {
          // call fn with the arguments to the debounced function
          fn.apply(context, Array.prototype.slice.call(parentArgs, 0));
          timeoutToCall = null;
        }, time);
      };
    }
  };
});
