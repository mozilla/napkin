define(['jquery', 'backbone', 'underscore', './extended', 'collections/component',
        './component', 'helpers/screen-utils', 'helpers/errors',
        'helpers/shared-models', 'jquery.ui'],
  function($, Backbone, _, ExtendedView, ComponentCollection, ComponentView,
           screenUtils, errors, sharedModels) {
    return ExtendedView.extend({
      template: _.template($('#layout-template').html()),

      initialize: function(options) {
        var self = this;
        self.constructParent(arguments);

        self.Components = new ComponentCollection([], screenUtils.getUrlData());
        self.Components.on('add', self.addComponent, self);
        self.Components.on('reset', self.addAllComponents, self);

        // remove is handled in component.js; no need to deal with it here
        // self.Components.on('remove', self.addAllComponents, self);

        sharedModels.getCurrentScreen()
          .then(function(screen) {
            self.screen = screen;
            self.render();
            self.Components.fetch();
 
            self.screen.on('change:layout', function() {
              self.render();
              self.removeComponentViews();
              self.Components.trigger('reset');
            }, self);
          });
      },

      dropOptions: {
        hoverClass: 'component-hover',
        accept: '.component, .element'
      },

      render: function() {
        this.$el.html(this.template(this.screen.toJSON()));
        this.configureDropTargets();
        this.markComponentPositions();
      },

      configureDropTargets: function() {
        if (screenUtils.isSharePage()) {
          // no drop targets on share page
          return;
        }

        var self = this;
        this.$('.component-location').each(function() {
          var $this = $(this);
          $this.droppable(self.dropOptions);
        });
      },

      markComponentPositions: function() {
        this.$('.row').each(function(rowIndex) {
          var $row = $(this);

          $row.find('[class^="span"]').each(function(colIndex) {
            var $col = $(this);

            // associate a row # and a col # with each column
            $col.data('position', {
              row: rowIndex,
              col: colIndex
            });

            // add in an attribute with the same data for easy access
            $col.attr('data-position', rowIndex + ':' + colIndex);
          });
        });
      },

      addAllComponents: function() {
        this.$('.component-location').empty();
        this.Components.each(_.bind(this.addComponent, this));
      },

      addComponent: function(component) {
        // select the component via the data-position attribute added earlier
        var positionAttr = component.get('row') + ':' + component.get('col');
        var $componentLocation = this.$('[data-position="' + positionAttr + '"]');

        if ($componentLocation.length === 0) {
          // invalid location; ignore this component
          return;
        }

        var view = new ComponentView({
          el: $componentLocation,
          model: component
        });
        this.setComponentView($componentLocation, view);
      },

      componentViews: {},
      getComponentView: function($componentLocation) {
        var position = $componentLocation.data('position');
        var key = position.row + ':' + position.col;
        return this.componentViews[key];
      },

      setComponentView: function($componentLocation, componentView) {
        var self = this;
        var position = $componentLocation.data('position');

        var key = position.row + ':' + position.col;
        self.componentViews[key] = componentView;

        componentView.on('remove', function() {
          delete self.componentViews[key];
        });
      },

      removeComponentViews: function() {
        _.each(this.componentViews, function(component) {
          component.undelegateEvents();
          component.off();
        });

        this.componentViews = {};
      },

      events: {
        'drop .component-location': function(event, ui) {
          var self = this;
          var $componentLocation = $(event.currentTarget);
          var $component = $(ui.draggable);
          var componentType = $component.data('type');
          var existingView = self.getComponentView($componentLocation);

          if (!$component.is('.component')) {
            // a component was not dragged; perhaps this is an element?
            return;
          }

          // reset component position, since it was just dragged
          $component.css({ top: 0, left: 0 });

          if (existingView) {
            // remove the existing component if its type is different from the
            // one being added; otherwise, simply focus the component
            if (existingView.model.get('type') === componentType) {
              existingView.select();
            } else {
              existingView.undelegateEvents();
              existingView.off();
            }
          }

          // create new component and an associated control
          self.Components.create(_.extend({ type: componentType },
            $componentLocation.data('position')), {
              success: function(component) {
                self.publish('screenLayout:selectComponent', component);
              },

              error: errors.tooltipHandler($component),
              wait: true
            });
        }
      }
    });
  });
