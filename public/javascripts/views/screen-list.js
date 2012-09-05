define(['jquery', 'backbone', 'underscore', './extended', 'collections/screen',
        './screen', 'helpers/errors'],
  function($, Backbone, _, ExtendedView, ScreenCollection, ScreenView, errors) {
    return ExtendedView.extend({
      rowTemplate: _.template($('#screen-row-template').html()),

      initialize: function(options) {
        this.constructParent(arguments);
        this.$el.hide();
      },

      render: function() {
        this.setEventHandlers('on');
        this.Screens.fetch();
      },

      addAllScreens: function() {
        this.numScreens = 0;
        this.$el.children('.screen-row').remove();
        this.Screens.each(_.bind(this.addScreen, this));
      },

      addScreen: function(screen) {
        var $screenRow;

        // insert a new row for every four screens
        if (this.numScreens % 4 === 0) {
          this.$el.append(this.rowTemplate());
        }

        $screenRow = this.$el.children().last();
        var view = new ScreenView({ model: screen,
          projectId: this.Screens.options.projectId });

        $screenRow.append(view.render().el);
        this.numScreens++;
      },

      setEventHandlers: function(action) {
        if (this.Screens) {
          this.Screens[action]('add', this.addScreen, this);
          this.Screens[action]('reset', this.addAllScreens, this);
          this.Screens[action]('remove', this.addAllScreens, this);
        }
      },

      events: {
        // to add a screen
        'submit #add-screen form': function(event) {
          event.preventDefault();
          var self = this;

          var $input = $('#screen-title');
          this.Screens.create({ title: $input.val() }, {
            success: function() {
              $input.val('');
            },

            error: errors.tooltipHandler($input),
            wait: true
         });
        }
      },

      routeEvents: {
        'project': function(id) {
          id = parseInt(id, 10);

          this.$el.show();
          // remove prior event handlers
          this.setEventHandlers('off');

          this.Screens = new ScreenCollection([], { projectId: id });
          this.render();
        },

        'empty': function(data) {
          // revert to hidden state when empty route is triggered
          this.$el.hide();

          // remove prior event handlers
          this.setEventHandlers('off');
          this.Screens = null;
        }
      }
    });
  });
