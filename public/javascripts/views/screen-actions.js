define(['jquery', 'can', './extended', './component-list', './element-list', 'can.super'],
  function($, can, ExtendedControl, ComponentListControl, ElementListControl) {
    return ExtendedControl({
      init: function($element, options) {
        this._super($element, options);
        
        // used for event handlers
        this.off();
        this.options.content = $('#content');
        this.options.back = $('#back');
        this.on();

        // by default, the component list should be shown
        this.activateComponentList();
      },

      activateComponentList: function() {
        if (this.elementListControl) {
          this.elementListControl.deactivate();
        }

        this.options.back.find('span').text('project page');
        if (this.componentListControl) {
          this.componentListControl.activate();
        } else {
          this.componentListControl = new ComponentListControl(this.element, {});
        }
      },

      activateElementList: function(component) {
        if (this.componentListControl) {
          this.componentListControl.deactivate();
        }

        this.options.back.find('span').text('component list');
        if (this.elementListControl) {
          this.elementListControl.activate();
          this.elementListControl.setComponentModel(component);
        } else {
          this.elementListControl = new ElementListControl(this.element, { component: component });
        }
      },

      '{content} .component-location selected': function($element, event, component) {
        this.activateElementList(component);
      },

      '{content} deselectedAll': function($element, event, component) {
        this.activateComponentList();
      },

      '{back} click': function($element, event) {
        if (this.elementListControl && this.elementListControl.isActive()) {
          event.preventDefault();
          // back button should go to component list
          this.activateComponentList();
        } else {
          // back button should link to project page, as it normally does; no
          // need to do anything
        }
      }
    });
  });
