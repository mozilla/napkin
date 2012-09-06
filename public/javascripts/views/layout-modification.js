define(['jquery', 'backbone', 'underscore', './extended', 'helpers/shared-models',
        'lib/bootstrap.min'],
  function($, Backbone, _, ExtendedView, sharedModels) {
    return ExtendedView.extend({
      tagName: 'div',
      id: 'layout-modifications',

      className: 'clearfix',
      template: _.template($('#screen-layout-template').html()),

      initialize: function(options) {
        this.constructParent(arguments);
        this.screen = options.screen;

        this.screen.on('change:layout', function() {
          this.render();
        }, this);
      },

      render: function() {
        this.$el.html(this.template(this.screen.toJSON()));
        // activate dropdown
        this.$('.dropdown-toggle').dropdown();
        return this;
      },

      events: {
        // to add a row
        'click .layout-actions a': function(event) {
          event.preventDefault();
          var layout = this.screen.get('layout');

          layout = layout.slice(0); // duplicate array so save() fires change event
          layout.push([ 4, 4, 4 ]);
          this.screen.save({ 'layout': layout }, { wait: true });
        },

        // to modify a row
        'click .dropdown-menu .layout-row': function(event) {
          event.preventDefault();
          var $row = $(event.currentTarget);
          var layout = this.screen.get('layout');
          layout = layout.slice(0); // duplicate array so save() fires change event

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
            this.publish('layoutModification:deleteComponent', {
              row: rowIndex,
              col: colIndex
            });
          }

          layout[rowIndex] = newRow;
          this.screen.save({ 'layout': layout }, { wait: true });
        },

        // to delete a row
        'click .delete-row': function(event) {
          event.preventDefault();
          var $link = $(event.currentTarget);
          var layout = this.screen.get('layout');
          layout = layout.slice(0); // duplicate array so save() fires change event

          // parent .layout-row contains a data-row attribute with row index
          var rowIndex = $link.closest('.layout-row')
            .data('row');

          rowIndex = parseInt(rowIndex, 10);
          this.publish('layoutModification:deleteRow', rowIndex);

          layout.splice(rowIndex, 1);
          this.screen.save({ 'layout': layout }, { wait: true });

          /* TODO: is this wait necessary?
          var self = this;
          // wait slightly to update screen so that components are fully deleted/
          // updated; this way, the screen layout will be refreshed after components
          // are ready to be placed; although this may not work in all cases, it
          // is a simple solution and functions in most situations
          setTimeout(function() {
            layout.splice(rowIndex, 1);
            self.saveScreen();
          }, 100);
          */
        }
      }
    });
  });
