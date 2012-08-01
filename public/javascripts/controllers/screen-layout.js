define(['can', './extended', './component', 'models/component', 'helpers/screen-utils',
        'can.super', 'jquery.ui'],
  function(can, ExtendedControl, ComponentControl, ComponentModel, screenUtils) {
    return ExtendedControl({
      dropOptions: {
        hoverClass: 'component-hover',
        accept: '.component'
      },

      init: function($element, options) {
        this._super($element, options);
        $element.html(can.view('layout-template', {}));

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

        ComponentModel.withRouteData()
          .findAll()
          .then(function(components) {
            // add each component
            components.each(function(component, index) {
              self.addComponent(component);
            });
          }, function(xhr) {
            // TODO: handle error
          });
      },

      addComponent: function(component) {
        // select the component via the data-position attribute added earlier
        var positionAttr = component.layout.row + ':' + component.layout.col;
        var $componentLocation = this.$('[data-position="' + positionAttr + '"]');

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
        var component = new ComponentModel({
          type: componentType,
          layout: $componentLocation.data('position')
        });

        component.withRouteData()
          .save()
          .then(function(component) {
            var componentControl = new ComponentControl($componentLocation,
              { component: component });
            self.setComponentControl($componentLocation, componentControl);
            componentControl.select();
          }, function(xhr) {
            // TODO: handle error
          });
      }
    });
  });
