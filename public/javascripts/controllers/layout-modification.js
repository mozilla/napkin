define(['jquery', 'can', './extended', 'helpers/shared-models', 'helpers/utils',
        'lib/bootstrap.min'],
  function($, can, ExtendedControl, sharedModels, utils) {
    return ExtendedControl({
      init: function($element, options) {
        this._super($element, options);
        var self = this;

        sharedModels.getCurrentScreen()
          .then(function(screen) {
            self.screen = screen;
            self.render();

            // change could be called in rapid succession if, say, a splice
            // call both removes and adds an element; because this can cause
            // issues, debounce the callback
            screen.layout.bind('change', utils.debounce(function() {
              self.render();
            }, self, 50));
          }, function() {
            // TODO: handle error
          });

        // for triggering events
        this.content = $('#content');
      },

      render: function() {
        // activate dropdown
        this.$('.dropdown-toggle').dropdown();
      },

      saveScreen: function() {
        this.screen.withRouteData()
          .save()
          .then(function(screen) {
          }, function(xhr) {
            // TODO: handle error
          });
      },

      // to add a row
      '.layout-actions a click': function($element, event) {
        event.preventDefault();
        var layout = this.screen.attr('layout');

        layout.push([ 4, 4, 4 ]);
        this.saveScreen();
      },

      // to modify a row
      '.dropdown-menu .layout-row click': function($row, event) {
        event.preventDefault();
        var layout = this.screen.attr('layout');

        // parent .layout-row contains a data-row attribute with row index
        var rowIndex = $row.parent()
          .closest('.layout-row')
          .data('row');
        rowIndex = parseInt(rowIndex, 10);

        // get the new column lengths for this row based off of the child elements
        var newRow = [];
        $row.children().each(function() {
          var $col = $(this);
          var length = $col.data('length');

          length = parseInt(length, 10);
          newRow.push(length);
        });

        var oldRow = layout[rowIndex];
        // if the number of columns has been reduced, delete all excess components
        for (var colIndex = newRow.length; colIndex < oldRow.length; colIndex++) {
          this.content.trigger('deleteComponentRequested', {
            row: rowIndex,
            col: colIndex
          });
        }

        // use splice instead of layout[row] = newRow so that live binding kicks in
        layout.splice(rowIndex, 1, newRow);
        this.saveScreen();
      },

      // to delete a row
      '.delete-row click': function($link, event) {
        event.preventDefault();
        var layout = this.screen.attr('layout');

        // parent .layout-row contains a data-row attribute with row index
        var rowIndex = $link.closest('.layout-row')
          .data('row');

        rowIndex = parseInt(rowIndex, 10);
        this.content.trigger('deleteRowRequested', rowIndex);

        var self = this;
        // wait slightly to update screen so that components are fully deleted/
        // updated; this way, the screen layout will be refreshed after components
        // are ready to be placed; although this may not work in all cases, it
        // is a much simpler solution than other options and works in most cases
        setTimeout(function() {
          layout.splice(rowIndex, 1);
          self.saveScreen();
        }, 100);
      }
    });
  });
