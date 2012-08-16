define(['can', './extended', './component', 'models/component', 'helpers/screen-utils',
        'helpers/errors', 'helpers/shared-models', 'helpers/utils', 'can.super',
        'jquery.ui'],
  function(can, ExtendedControl, ComponentControl, ComponentModel, screenUtils, errors,
           sharedModels, utils) {
    return ExtendedControl({
      dropOptions: {
        hoverClass: 'component-hover',
        accept: '.component'
      },

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
          });
      },

      render: function() {
        this.element.html(can.view('layout-template', this.screen));
        this.configureDropTargets();

        this.markComponentPositions();
        this.addAllComponents();
      },

      configureDropTargets: function() {
        if (screenUtils.isSharePage()) {
          // no drop targets on share page
          return;
        }

        var self = this;
        this.$('.component-location').each(function() {
          var $this = $(this);
          $this.droppable(self.dropOptions)
            // for convenience, apply padding here, as width is easily modifiable
            .css({ padding: '10px 15px' })
            .width($this.width() - 30);
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
        var self = this;

        if (self.cachedComponents) {
          // already have components; add each one
          self.addEachComponent();
        } else {
          ComponentModel.withRouteData()
            .findAll()
            .then(function(components) {
              self.cachedComponents = components;
              self.addEachComponent();
            }, function(xhr) {
              // TODO: handle error
            });
        }
      },

      addEachComponent: function() {
        var self = this;
        self.cachedComponents.each(function(component, index) {
          self.addComponent(component);
        });
      },

      addComponent: function(component) {
        // select the component via the data-position attribute added earlier
        var positionAttr = component.row + ':' + component.col;
        var $componentLocation = this.$('[data-position="' + positionAttr + '"]');

        if ($componentLocation.length === 0) {
          // invalid location; ignore this component
          return;
        }

        var componentControl = new ComponentControl($componentLocation,
          { component: component });
        this.setComponentControl($componentLocation, componentControl);
      },

      componentControls: {},
      getComponentControl: function($componentLocation) {
        var position = $componentLocation.data('position');
        var key = position.row + ':' + position.col;
        return this.componentControls[key];
      },

      setComponentControl: function($componentLocation, componentControl) {
        var self = this;
        var position = $componentLocation.data('position');
        var key = position.row + ':' + position.col;

        self.componentControls[key] = componentControl;
        can.bind.call(componentControl, 'destroyed', function() {
          delete self.componentControls[key];
        });
      },

      '.component-location drop': function($componentLocation, event, ui) {
        var self = this;
        var $component = $(ui.draggable);
        var componentType = $component.data('type');
        var existingControl = self.getComponentControl($componentLocation);

        // reset component position, since it was just dragged
        $component.css({ top: 0, left: 0 });

        if (existingControl) {
          // remove the existing component if its type is different from the
          // one being added; otherwise, simply focus the component
          if (existingControl.getType() === componentType) {
            existingControl.select();
          } else {
            existingControl.remove();
          }
        }

        // create new component and an associated control
        var component = new ComponentModel(can.extend({ type: componentType },
          $componentLocation.data('position')));

        component.withRouteData()
          .save()
          .then(function(component) {
            var componentControl = new ComponentControl($componentLocation,
              { component: component });
            self.setComponentControl($componentLocation, componentControl);
            componentControl.select();
          }, errors.tooltipHandler($component));
      }
    });
  });
