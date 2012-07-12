function NapkinClient(window, document, $, data, undefined) {
  var $window = $(window);

  var Component = Backbone.Model.extend({
    // TODO: validate a component's attributes
    validate: function(attrs) {

    }
  });

  var ComponentGroup = Backbone.Collection.extend({
    model: Component,
    url: '/projects/' + data.projectId + '/screens/' + data.screenId +
      '/components'
  });

  var Element = Backbone.Model.extend({
    // TODO: validate an element's attributes
    validate: function(attrs) {

    }
  });

  var ElementGroup = Backbone.Collection.extend({
    initialize: function(models, options) {
      this.url = '/projects/' + data.projectId + '/screens/' +
        data.screenId + '/components/' + options.componentId + '/elements';
      this.bind('add', this.incrementOrder, this);
      this.bind('reset', this.resetOrder, this);
    },

    comparator: function(element) {
      return element.get('order');
    }
  });

  var ComponentListView = Backbone.View.extend({
    tagName: 'div',
    template: _.template($('#component-list-template').html()),

    dragOptions: {
      revert: 'invalid'
    },

    render: function() {
      this.$el.html(this.template({}));
      this.$('.drag-element').draggable(this.dragOptions);
      return this;
    }
  });

  var ElementListView = Backbone.View.extend({
    tagName: 'div',
    className: 'elements',

    events: {
      'click .btn': 'createElement'
    },

    initialize: function() {
      var templateId = this.options.type + '-element-list';
      this.template = _.template($('#' + templateId).html());
      this.$el.addClass(this.options.type + '-elements');
    },

    render: function() {
      this.$el.html(this.template({}));
      return this;
    },

    // vertically center the add button 
    centerButtons: function() {
      this.$('.btn').each(function() {
        var $btn = $(this);
        var $element = $btn.siblings('.element');
        $btn.css('margin-top', ($element.height() - $btn.height()) / 2);
      });
    },

    createElement: function(event) {
      event.preventDefault();
      var $target = $(event.currentTarget);
      var $element = $target.siblings('.element').clone();

      $element.removeClass('element')
        .addClass('active-element');
      this.trigger('createElement', $element);
    }
  });

  var componentGroup = new ComponentGroup();
  var LayoutView = Backbone.View.extend({
    el: $('#content'),
    template: _.template($('#layout-template').html()),

    clickedActiveComponent: false,
    $componentClicked: null,

    events: {
      'click [class^="span"]': 'recordActiveComponentClick',
      'click': 'blurComponent'
    },

    selectComponent: function($component, model) {
      $component.data('model', model);
      $component.addClass(model.get('type') + '-container');
      $component.addClass('active');

      // trigger a selectComponent event which the AppView will handle
      this.$activeComponent = $component;
      this.trigger('selectComponent', $component);
    },

    resetComponent: function($component, type) {
      $component.removeClass(type + '-container');
      $component.removeClass('active');
      $component.empty();
    },

    getDropOptions: function(layoutView) {
      return {
        hoverClass: 'drop-hover',
        drop: function(event, ui) {
          var $this = $(this);
          var $component = $(ui.draggable);

          var componentType = $component.data('type');
          var existingModel = $this.data('model');

          // reset component position, since it was just dragged
          $component.css({ top: 0, left: 0 });

          // remove any existing component if its type is different from the
          // one being added; otherwise, simply select the component
          if (existingModel) {
            var existingType = existingModel.get('type');

            if (existingType === componentType) {
              layoutView.selectComponent($this, existingModel);
              return false;
            } else {
              existingModel.destroy();
              layoutView.resetComponent($this, existingType);
            }
          }

          componentGroup.create({
            layout: $this.data('position'),
            type: $component.data('type')
          }, {
            // TODO: handle error
            success: function(model) {
              layoutView.selectComponent($this, model);
            },

            // wait for server to respond to get id of component
            wait: true
          });

          // reset component position, since it was just dragged
          $component.css({
            top: 0,
            left: 0
          });
          return false;
        }
      };
    },

    initialize: function() {
      componentGroup.bind('add', this.addComponent, this);
      componentGroup.bind('reset', this.addAllComponents, this);
    },

    render: function() {
      var that = this;
      this.$el.html(this.template({}));

      this.$('.row').each(function(row) {
        $(this).children('[class^="span"]').each(function(col) {
          var position = {
            row: row,
            col: col
          };

          $(this).attr('data-position', position.row + ':' + position.col)
            .data('position', position);
        });
      });

      this.$('.drop-target').each(function() {
        var $dropTarget = $(this);
        $dropTarget.droppable(that.getDropOptions(that));

        $dropTarget.css({ padding: '10px 15px' });
        $dropTarget.width($dropTarget.width() - 30);
      });
      return this;
    },

    addComponent: function(componentModel) {
      var layout = componentModel.get('layout');
      var selector = '[data-position="' + layout.row + ':' + layout.col +'"]';
      var $component = this.$(selector);

      $component.data('model', componentModel);
      $component.data('type', componentModel.get('type'));
      $component.addClass(componentModel.get('type') + '-container');

      var elementGroup = new ElementGroup([], { componentId: componentModel.id });
      var that = this;

      // add and reset element handlers require both the element and
      // its corresponding parent component
      elementGroup.bind('add', function(element) {
        that.addElement(element, $component);
      }, this);

      elementGroup.bind('reset', function() {
        that.addAllElements($component);
      }, this);

      $component.data('elementGroup', elementGroup);
      elementGroup.fetch(); // get the elements for this component
    },

    addAllComponents: function() {
      var that = this;
      componentGroup.each(function(component) {
        that.addComponent(component);
      });
    },

    recordActiveComponentClick: function(event) {
      var $component = $(event.currentTarget);
      if ($component.is(this.$activeComponent)) {
        this.clickedActiveComponent = true;
      }

      this.$componentClicked = $component;
    },

    blurComponent: function(event) {
      // note that clickedActiveComponent will be set by the
      // recordComponentClick function due to event bubbling
      if (!this.clickedActiveComponent) {
        var $component = this.$componentClicked;

        // active component may not be defined if nothing is in focus
        if (this.$activeComponent) {
          this.$activeComponent.removeClass('active');
          this.trigger('blurComponent');
        }

        // if a component was clicked, put it in focus
        if ($component) {
          var type = $component.data('type');
          if (type) {
            this.trigger('selectComponent', $component);
            $component.addClass('active');
            this.$activeComponent = $component;
          } else {
            this.$activeComponent = null;
          }
        }
      }

      this.clickedActiveComponent = false;
      this.$componentClicked = null;
    },

    createElement: function($element) {
      var $component = this.$activeComponent;
      var model = $component.data('model');
      var elementGroup = $component.data('elementGroup');

      var level = $element.data('level');
      if (level) {
        level = parseInt(level, 10);
      }

      var elementAttrs = {
        type: $element.data('type'),
        next: null,
        name: $element.data('name'),
        required: false,
        src: $element.data('src'),
        text: $element.text(),
        level: level
      };

      // if there's no last element, this must be the head
      var last = elementGroup.where({ next: null })[0];
      if (!last) {
        elementAttrs.head = true;
      }

      elementGroup.create(elementAttrs, {
        // TODO: handle error
        success: function(model) {
          if (last) {
            last.set('next', model.id);
            last.save();
          }
        }
      });
    },

    addElement: function(element, $component) {
      var templateId = element.get('type') + '-element-template';
      var template = _.template($('#' + templateId).html());
      $(template(element.toJSON())).appendTo($component);
    },

    addAllElements: function($component) {
      var elementGroup = $component.data('elementGroup');
      var element = elementGroup.where({ head: true })[0];

      // go through each element in the linked list
      while (element) {
        this.addElement(element, $component);
        element = elementGroup.get(element.get('next'));
      }
    }
  });

  var AppView = Backbone.View.extend({
    el: $('body'),

    initialize: function() {
      this.componentListView = new ComponentListView();
      $('#sidebar').append(this.componentListView.render().$el);

      this.layoutView = new LayoutView();
      this.layoutView.render(); // already attached to #content
      componentGroup.fetch(); // fetch all components for the layout

      this.layoutView.bind('selectComponent', this.selectComponent, this);
      this.layoutView.bind('blurComponent', this.blurComponent, this);
    },

    selectComponent: function($component) {
      var type = $component.data('type');
      this.componentListView.$el.hide();

      this.elementListView = new ElementListView({
        type: type
      });
      this.elementListView.bind('createElement', this.layoutView.createElement,
        this.layoutView);

      $('#sidebar').append(this.elementListView.render().$el);
      this.elementListView.centerButtons();
    },

    blurComponent: function() {
      this.componentListView.$el.show();
      if (this.elementListView) {
        this.elementListView.unbind('addElement');
        this.elementListView.remove();
      }
    }
  });

  new AppView();
}
