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
        .addClass('live-element');
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
      'click [class^="span"]': 'recordComponentClick',
      'click .live-element': 'recordElementClick',
      'click': 'switchFocus'
    },

    initialize: function() {
      componentGroup.bind('add', this.addComponent, this);
      componentGroup.bind('reset', this.addAllComponents, this);

      this.bind('closePopover', this.resetActiveElement, this);
      this.bind('applyEdits', this.applyEdits, this);
      this.bind('removeElement', this.removeElement, this);
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
      // get the elements for this component
      elementGroup.fetch({
        // TODO: handle error
        success: function(collection, response) {
          if (collection.models.length === 0) {
            $component.addClass('empty');
            $component.text(componentModel.get('type'));
          }
        }
      });
    },

    addAllComponents: function() {
      var that = this;
      componentGroup.each(function(component) {
        that.addComponent(component);
      });
    },

    recordComponentClick: function(event) {
      var $target = $(event.currentTarget);
      this.$componentClicked = $target;

      if ($target.is(this.$activeComponent)) {
        this.clickedActiveComponent = true;
      }
    },

    recordElementClick: function(event) {
      var $target = $(event.currentTarget);
      this.$elementClicked = $target;

      if ($target.is(this.$activeElement)) {
        this.clickedActiveElement = true;
      }
    },

    switchFocus: function(event) {
      // note that clickedActiveComponent will be set by the
      // recordComponentClick function due to event bubbling
      if (!this.clickedActiveComponent) {
        var $component = this.$componentClicked;

        // active component may not be defined if nothing is in focus
        if (this.$activeComponent) {
          this.$activeComponent.removeClass('active');
          this.trigger('blurComponent');
          this.$activeComponent = null;
        }

        // if a component was clicked, put it in focus
        if ($component) {
          var type = $component.data('type');
          if (type) {
            this.trigger('selectComponent', $component);
            $component.addClass('active');
            this.$activeComponent = $component;
          }
        }
      }

      if (!this.clickedActiveElement) {
        var $element = this.$elementClicked;

        // active element may not be defined if nothing is in focus
        this.resetActiveElement();

        // if an element was clicked, put it in focus
        if ($element) {
          this.setActiveElement($element);
        }
      }

      // reset click data
      this.clickedActiveComponent = false;
      this.clickedActiveElement = false;
      this.$componentClicked = null;
      this.$elementClicked = null;
    },

    setActiveElement: function($element) {
      $element.popover('show');
      $element.addClass('active');
      this.$activeElement = $element;
    },

    resetActiveElement: function() {
      var $element = this.$activeElement;
      if ($element) {
        $element.popover('hide');
        $element.removeClass('active');
      }

      this.$activeElement = null;
      this.clickedActiveElement = false;
      this.$elementClicked = null;
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
        nextId: null,
        name: $element.data('name'),
        required: false,
        src: $element.data('src'),
        text: $element.text(),
        level: level
      };

      // if there's no last element, this must be the head
      var last = elementGroup.where({ nextId: null })[0];
      if (!last) {
        elementAttrs.head = true;
      }

      elementGroup.create(elementAttrs, {
        // TODO: handle error
        success: function(model) {
          if (last) {
            last.set('nextId', model.id);
            last.save();
          }
        }
      });
    },

    addElement: function(element, $component) {
      // if component has empty class, nothing has been added to it yet
      if ($component.hasClass('empty')) {
        $component.removeClass('empty');
        // clear out the type label that exists as text inside the component
        $component.text('');
      }

      var templateId = element.get('type') + '-element-template';
      var elementTemplate = _.template($('#' + templateId).html());

      templateId = element.get('type') + '-popover-template';
      var popoverTemplate = _.template($('#' + templateId).html());

      var $element = $(elementTemplate(element.toJSON()));
      var row = $component.data('position').row;

      var placement = 'right';
      if (row === 0) {
        placement = 'bottom';
      } else if (row === 2) {
        placement = 'top';
      }

      $element.appendTo($component);
      $element.data('model', element);

      $element.popover({
          title: 'Edit Element',
          trigger: 'manual',
          placement: placement,
          content: popoverTemplate(element.toJSON())
        });
    },

    addAllElements: function($component) {
      // clear out any leftover elements
      $component.empty();

      var elementGroup = $component.data('elementGroup');
      var element = elementGroup.where({ head: true })[0];

      // go through each element in the linked list
      while (element) {
        this.addElement(element, $component);
        element = elementGroup.get(element.get('nextId'));
      }
    },

    applyEdits: function() {
      var $element = this.$activeElement;

    },

    removeElement: function() {
      var $element = this.$activeElement;
      this.resetActiveElement();
      var model = $element.data('model');

      var $component = $element.parent();
      var elementGroup = $component.data('elementGroup');

      var previous = elementGroup.where({ nextId: model.id })[0];
      var nextId = model.get('nextId');

      model.destroy({
        success: function() {
          if (previous) {
            // rearrange links in the linked list
            previous.set('nextId', nextId);
            previous.save();
          } else {
            // removing the first element, so reset the head
            var next = elementGroup.get(nextId);
            if (next) {
              next.set('head', true);
              next.save();
            } else {
              // this is also the last element; add the empty class to the
              // component and the type label
              $component.addClass('empty');
              $component.text($component.data('model').get('type'));
            }
          }

          $element.remove();
        }
      });
    }
  });

  var AppView = Backbone.View.extend({
    el: $('body'),

    events: {
      'click .close-popover': 'closePopover',
      'click .popover-content .btn-primary': 'applyEdits',
      'click .popover-content .btn-danger': 'removeElement',
      'keydown': 'processKeyShortcuts'
    },

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
    },

    // close popover when close popover link is clicked
    closePopover: function(event) {
      event.preventDefault();
      this.layoutView.trigger('closePopover');
    },

    // apply edits to element when apply button is clicked
    applyEdits: function(event) {
      this.layoutView.trigger('applyEdits');
    },

    // remove element when delete button is clicked
    removeElement: function(event) {
      this.layoutView.trigger('removeElement');
    },

    // process key presses for shortcuts; e.g. backspace deletes an element
    processKeyShortcuts: function(event) {
      // ignore key presses in input fields
      if ($('input[type="text"]:focus, textarea:focus').length === 0) {
        // if the user hit backspace and has an element focused, remove it
        if (event.which === 8 && this.layoutView.$activeElement) {
          this.layoutView.trigger('removeElement');
          event.preventDefault();
        }
      }
    }
  });

  new AppView();
}
