define(['jquery', 'backbone', 'underscore', './extended', './component-list',
        './element-list'],
  function($, Backbone, _, ExtendedView, ComponentListView, ElementListView) {
    return ExtendedView.extend({
      initialize: function(options) {
        this.constructParent(arguments);
        
        // for caching purposes
        this.$back = $('#back');

        // by default, the component list should be shown
        this.activateComponentList();
      },

      activateComponentList: function() {
        if (this.elementListView) {
          this.elementListView.unrender();
          this.elementListView.undelegateEvents();
        }

        this.$back.find('span').text('project page');
        if (this.componentListView) {
          this.elementListView.unrender();
          this.componentListView.delegateEvents();
          this.componentListView.render();
        } else {
          this.componentListView = new ComponentListView({ el: this.el });
        }
      },

      activateElementList: function(component) {
        if (this.componentListView) {
          this.componentListView.unrender();
          this.componentListView.undelegateEvents();
        }

        this.$back.find('span').text('component list');

        if (this.elementListView) {
          this.elementListView.unrender();
          this.elementListView.setComponentModel(component);

          this.elementListView.delegateEvents();
          this.elementListView.render();
        } else {
          this.elementListView = new ElementListView({ el: this.el,
            component: component });
        }
      },

      contextualEvents: {
        'click #sidebar | #back': function(event) {
          if (this.elementListView && this.elementListView.isActive()) {
            event.preventDefault();
            // back button should go to component list
            this.activateComponentList();
          } else {
            // back button should link to project page, as it normally does; no
            // need to do anything
          }
        }
      },

      subscriptions: {
        'component:selected': function(component) {
          this.activateElementList(component);
        },

        'component:deselectedAll': function(event, component) {
          this.activateComponentList();
        }
      }
    });
  });
