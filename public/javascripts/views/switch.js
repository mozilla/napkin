define(['can', './extended', 'can.super'], function(can, ExtendedControl) {
  return ExtendedControl({
    activate: function() {
      if (!this.activated) {
        this.activated = true;
        // user-defined render function
        this.render();
        this.on();
      }
    },

    deactivate: function() {
      if (this.activated) {
        this.activated = false;
        this.off();
      }
    },

    isActive: function() {
      return this.activated;
    }
  });
});
