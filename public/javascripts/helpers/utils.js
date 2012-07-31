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
    }
  };
});
