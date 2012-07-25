function NapkinClient(window, document, $, data, undefined) {
  var $window = $(window);

  // given a form element, serialize its inputs into a JavaScript object ready
  // to be JSON-ified
  $.fn.serializeObject = function() {
    var object = {};
    var array = this.serializeArray();

    // serializeArray returns an array in the form:
    // [
    //  {
    //    name: 'inputName',
    //    value: 'inputValue'
    //  },
    //  {
    //    name: 'input2Name',
    //    value: 'inpu2Value'
    //  },
    //  ...
    // ];
    // convert this to the form:
    // {
    //  inputName: 'inputValue',
    //  input2Name: 'input2Value
    // }
    $.each(array, function() {
        if (object[this.name] !== undefined) {
            if (!object[this.name].push) {
                object[this.name] = [ object[this.name] ];
            }
            object[this.name].push(this.value || '');
        } else {
            object[this.name] = this.value || '';
        }
    });

    return object;
  }; 

  var Component = Backbone.Model.extend({});
  var ComponentGroup = Backbone.Collection.extend({
    model: Component,
    url: '/projects/' + data.projectId + '/screens/' + data.screenId +
      '/components'
  });

  var Element = Backbone.Model.extend({});
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
      if (!data.sharing) {
        this.$('.drag-element').draggable(this.dragOptions);
      }
      return this;
    }
  });

  var ElementListView = Backbone.View.extend({
    tagName: 'div',
    className: 'elements',

    events: {
      'click a.btn': 'createElement'
    },

    initialize: function() {
      if (data.sharing) {
        this.events = {};
      }

      var templateId = this.options.type + '-element-list-template';
      this.template = _.template($('#' + templateId).html());
      this.$el.addClass(this.options.type + '-elements');
    },

    render: function() {
      this.$el.html(this.template(this.options.component.toJSON()));
      return this;
    },

    // vertically center the add button 
    centerButtons: function() {
      this.$('.btn').each(function() {
        var $btn = $(this);
        var $element = $btn.siblings('.element');

        if ($element.height() > $btn.height()) {
          $btn.css('margin-top', ($element.height() - $btn.height()) / 2);
        }
      });
    },

    populateSelectText: function() {
      // change event will populate .selection div with text
      this.$('select').change();
    },

    createElement: function(event) {
      event.preventDefault();
      var $target = $(event.currentTarget);
      this.trigger('createElement', $target.siblings('.element'));
    }
  });

  var componentGroup = new ComponentGroup();
  var LayoutView = Backbone.View.extend({
    el: $('#content'),
    template: _.template($('#layout-template').html()),

    clickedActiveComponent: false,
    $componentClicked: null,

    // IDs of form components already on the page
    usedIds: {
      'name': 1,
      'text': 1,
      'levels': 1
    },

    events: {
      'click [class^="span"]': 'recordComponentClick',
      'click .live-element': 'recordElementClick',
      'click': 'switchFocus'
    },

    initialize: function() {
      if (data.sharing) {
        // no need for events when sharing
        this.events = {};
      } else {
        this.bind('closePopover', this.resetActiveElement, this);
        this.bind('applyComponentConfig', this.applyComponentConfig, this);
        this.bind('applyElementEdits', this.applyElementEdits, this);
        this.bind('removeElement', this.removeElement, this);
      }

      componentGroup.bind('add', this.addComponent, this);
      componentGroup.bind('reset', this.addAllComponents, this);
    },

    getDropOptions: function(layoutView) {
      return {
        hoverClass: 'drop-hover',
        accept: '.drag-element',
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
            if (existingModel.get('type') === componentType) {
              layoutView.bindComponentModel($this, existingModel);
              return false;
            } else {
              layoutView.unbindComponentModel($this);
            }
          }

          componentGroup.create({
            layout: $this.data('position'),
            type: $component.data('type')
          }, {
            success: function(model) {
              layoutView.bindComponentModel($this, model);
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
          var $this = $(this);
          var position = {
            row: row,
            col: col
          };

          $this.attr('data-position', position.row + ':' + position.col)
            .data('position', position);

          if (data.sharing) {
            // remove all classes except span*, since no other functionality is
            // needed to share this screen
            var match = /span\d/.exec($this.attr('class'));
            $this.attr('class', match[0]);
          }
        });
      });

      this.$('.drop-target').each(function() {
        var $dropTarget = $(this);

        if (data.sharing) {
          $dropTarget.css({ border: 'none' });
        } else {
          $dropTarget.droppable(that.getDropOptions(that));
          $dropTarget.css({ padding: '10px 15px' });
          $dropTarget.width($dropTarget.width() - 30);
        }
      });
      return this;
    },

    bindComponentModel: function($component, model) {
      $component.data('model', model);
      $component.addClass(model.get('type') + '-container');
      $component.addClass('active');

      // trigger a setActiveComponent event to focus this component
      this.$activeComponent = $component;
      this.trigger('setActiveComponent', $component);
    },

    unbindComponentModel: function($component) {
      var model = $component.data('model');
      model.destroy();
      $component.removeClass(model.get('type') + '-container');

      $component.removeData('model');
      $component.removeData('type');

      this.resetActiveComponent($component);
      $component.addClass('empty');
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

        if (data.sharing) {
          var templateId = componentModel.get('type') + '-wrapper-template';
          var $templateElement = $('#' + templateId);

          var template;
          var templateData;

          if ($templateElement.length === 1) {
            template = _.template($templateElement.html());
            templateData = componentModel.toJSON();

            templateData.html = $component.html();
            $component.html(template(templateData));
          }
        }
      }, this);

      $component.data('elementGroup', elementGroup);
      // get the elements for this component
      elementGroup.fetch({
        success: function(collection) {
          if (collection.models.length === 0) {
            if (!data.sharing) {
              $component.text(componentModel.get('type'));
            }
          } else {
            $component.removeClass('empty');
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
        this.resetActiveComponent();

        // if a component was clicked, put it in focus
        if ($component) {
          this.setActiveComponent($component);
        }
      }

      if (!this.clickedActiveElement) {
        var $element = this.$elementClicked;
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

    setActiveComponent: function($component) {
      var type = $component.data('type');
      if (type) {
        this.trigger('setActiveComponent', $component);
        $component.addClass('active');
        this.$activeComponent = $component;
      }
    },

    resetActiveComponent: function() {
      // active component may not be defined if nothing is in focus
      if (this.$activeComponent) {
        this.$activeComponent.removeClass('active');
        this.trigger('blurComponent');
      }

      this.$activeComponent = null;
      this.clickedActiveComponent = false;
      this.$componentClicked = null;
    },

    setActiveElement: function($element) {
      $element.popover('show');
      $element.addClass('active');
      this.$activeElement = $element;
    },

    resetActiveElement: function() {
      var $element = this.$activeElement;

      // active element may not be defined if nothing is in focus
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
        src: $element.data('src'),
        level: level
      };

      if ($element.text()) {
        elementAttrs.text = $element.text();
      }

      // if there's no last element, this must be the head
      var last = elementGroup.where({ nextId: null })[0];
      if (!last) {
        elementAttrs.head = true;
      }

      elementGroup.create(elementAttrs, {
        success: function(model) {
          if (last) {
            last.set('nextId', model.id);
            last.save({}, { wait: true });
          }
        },
        wait: true
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

      var elementData = element.toJSON();
      if ($component.data('model').get('type') === 'form') {
        elementData.elementId = this.generateId(element);
      }

      var $element = $(elementTemplate(elementData));
      var row = $component.data('position').row;

      // TODO: change row === 2 to row === numRows when implementing layouts
      var placement = 'bottom';
      if (row === 2) {
        placement = 'top';
      }

      $element.appendTo($component);
      $element.data('model', element);

      if (!data.sharing) {
        templateId = element.get('type') + '-popover-template';
        var popoverTemplate = _.template($('#' + templateId).html());

        $element.popover({
          title: 'Edit Element',
          trigger: 'manual',
          placement: placement,
          content: popoverTemplate(element.toJSON())
        });
      }
    },

    addAllElements: function($component) {
      var that = this;

      // clear out any leftover elements
      $component.empty();

      var elementGroup = $component.data('elementGroup');
      var element = elementGroup.where({ head: true })[0];

      // go through each element in the linked list
      while (element) {
        this.addElement(element, $component);
        element = elementGroup.get(element.get('nextId'));
      }

      var $oldPreviousElement;
      var $oldNextElement;

      // checking the data attribute asserts whether the sortable plugin has
      // been activated on this element
      if (!$component.data('sortable') && !data.sharing) {
        $component.sortable({
          items: '.live-element',

          // set the correct focus when sorting starts and stops
          start: function(event, ui) {
            var $element = $(ui.item);
            var $component = $element.parent();
            var $placeholder = $(ui.placeholder);

            // make this component active if it isn't already
            if (!that.$activeComponent ||
                !that.$activeComponent.is($component)) {
              that.resetActiveComponent();
              that.setActiveComponent($component);
            }

            // previous element is before the current element; next element is
            // after the placeholder
            $oldPreviousElement = $element.prev();
            $oldNextElement = $placeholder.next();

            that.resetActiveElement();
          },

          stop: function(event, ui) {
            that.setActiveElement($(ui.item));
          },

          // modify the linked list appropriately when the order has been updated
          update: function(event, ui) {
            var $element = $(ui.item);
            var model = $element.data('model');

            var $newPreviousElement = $element.prev();
            var $newNextElement = $element.next();

            var oldPreviousModel;
            var oldNextModel;

            var newPreviousModel;
            var newNextModel;

            if ($oldPreviousElement.length === 1) {
              // old previous element exists; update its next
              oldPreviousModel = $oldPreviousElement.data('model');
              oldPreviousModel.set({ nextId: model.get('nextId') });
            } else {
              // no old previous element; the old next element is now the head
              // old next element must exist; otherwise, list order could not update
              window.$oldNextElement = $oldNextElement;
              oldNextModel = $oldNextElement.data('model');
              oldNextModel.set({ head: true });
              model.set({ head: false });
            }

            if ($newPreviousElement.length === 1) {
              // new previous element exists; rearrange next IDs
              newPreviousModel = $newPreviousElement.data('model');
              model.set({ nextId: newPreviousModel.get('nextId') });
              newPreviousModel.set({ nextId: model.id });
            } else {
              // new next element must exist; otherwise, list order could not update
              newNextModel = $newNextElement.data('model');

              // if there is no new previous element, this must be the head
              newNextModel.set({ head: false });
              model.set({
                head: true,
                nextId: newNextModel.id
              });
            }

            // save each model if it exists
            if (oldPreviousModel) {
              oldPreviousModel.save({}, { wait: true });
            }
            if (oldNextModel) {
              oldNextModel.save({}, { wait: true });
            }

            if (newPreviousModel) {
              newPreviousModel.save({}, { wait: true });
            }
            if (newNextModel) {
              newNextModel.save({}, { wait: true });
            }

            // current model must exist
            model.save({}, { wait: true });
          }
        });

        // disable text selections, since this is draggable
        $component.disableSelection();
      }
    },

    generateId: function(element) {
      var id = element.get('name');
      
      // restrict to alphanumeric characters and underscores
      id = id.replace(/ /g, '_');
      id = id.replace(/[^a-zA-Z0-9_\-]/g, '');
      
      // an ID must start with a letter, dash, or underscore; if it starts with
      // a dash, there are further rules involved, so just prepend an
      // underscore if the generated ID begins with either a dash or number
      if (/[0-9\-]/.test(id[0])) {
        id = '_' + id;
      }

      // remove all numeric characters from the end of this id
      id = id.replace(/[0-9]+$/g, '');

      // note that usedIds[id] contains a count of how many ids there are with
      // the indexed id as a base; i.e. 'id', 'id1', 'id2', 'id3', etc. all
      // have the same base of 'id'
      if (!this.usedIds[id]) {
        this.usedIds[id] = 1;
      } else {
        this.usedIds[id]++;

        // this will append the count to id to create a unique id
        id = id + (this.usedIds[id] - 1);
        this.usedIds[id] = 1;
      }

      return id;
    },

    applyComponentConfig: function($form) {
      var that = this;
      var $component = this.$activeComponent;

      var model = $component.data('model');
      var config = $form.serializeObject();

      var $formSubmit = $('[type="submit"]');
      var $confirmIcon = $('.icon-ok');

      $formSubmit.attr('disabled', 'true');
      $confirmIcon.hide();
      model.set(config);

      model.save({}, {
        error: tooltipErrorHandler($form, 'right'),
        success: function(component) {
          $formSubmit.removeAttr('disabled');
          $confirmIcon.show();

          setTimeout(function() {
            $confirmIcon.hide();
          }, 1500);
        },
        wait: true
      });
    },

    applyElementEdits: function() {
      var that = this;
      var $element = this.$activeElement;
      var $component = $element.parent();
      var model = $element.data('model');

      var $popover = $element.data('popover').tip();
      var updatedProperties = $('form', $popover).serializeObject();

      model.set(updatedProperties);
      model.save({}, {
        error: tooltipErrorHandler($element, 'right'),
        success: function(model) {
          $element.tooltip('hide');
          that.resetActiveElement();
          $component.empty();
          $component.data('elementGroup').trigger('reset');
        },
        wait: true
      });
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
            previous.save({}, { wait: true });
          } else {
            // removing the first element, so reset the head
            var next = elementGroup.get(nextId);
            if (next) {
              next.set('head', true);
              next.save({}, { wait: true });
            } else if (!data.sharing) {
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
      'submit .popover-content form': 'applyElementEdits',
      'submit .component-config': 'applyComponentConfig',
      'click .popover-content .btn-danger': 'removeElement',
      'keydown': 'processKeyShortcuts'
    },

    initialize: function() {
      if (data.sharing) {
        // events are unnecessary if sharing
        this.events = {};
      } else {
        this.componentListView = new ComponentListView();
        $('#sidebar').append(this.componentListView.render().$el);
      }

      this.layoutView = new LayoutView();
      this.layoutView.render(); // already attached to #content
      componentGroup.fetch(); // fetch all components for the layout

      this.layoutView.bind('setActiveComponent', this.setActiveComponent, this);
      this.layoutView.bind('blurComponent', this.blurComponent, this);
    },

    setActiveComponent: function($component) {
      var type = $component.data('type');
      this.componentListView.$el.hide();

      this.elementListView = new ElementListView({
        type: type,
        component: $component.data('model')
      });
      this.elementListView.bind('createElement', this.layoutView.createElement,
        this.layoutView);

      $('#sidebar').append(this.elementListView.render().$el);
      this.elementListView.centerButtons();
      this.elementListView.populateSelectText();
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

    // apply edits to element when edit form is submitted
    applyElementEdits: function(event) {
      event.preventDefault();
      this.layoutView.trigger('applyElementEdits');
    },

    // apply component configuration when config form is submitted
    applyComponentConfig: function(event) {
      event.preventDefault();
      this.layoutView.trigger('applyComponentConfig', $(event.currentTarget));
    },

    // remove element when delete button is clicked
    removeElement: function(event) {
      event.preventDefault();
      this.layoutView.trigger('removeElement');
    },

    // process key presses for shortcuts; e.g. backspace deletes an element
    processKeyShortcuts: function(event) {
      // ignore key presses in input fields
      if ($('input[type="text"]:focus, textarea:focus').length === 0) {
        // if the user hit backspace and has an element/component focused, remove it
        if (event.which === 8) {
          if (this.layoutView.$activeElement) {
            this.layoutView.trigger('removeElement');
          } else if (this.layoutView.$activeComponent) {
            this.layoutView.unbindComponentModel(this.layoutView.$activeComponent);
          }
          event.preventDefault();
        }

        // if the user hit escape, reset the active element
        if (event.which === 27) {
          this.layoutView.resetActiveElement();
        }

        // if the user hit tab, make sure he/she focuses something in the main
        // content area and not the sidebar
        if (event.which === 9) {
          // since content dynamically changes, just add the tabIndex attribute
          // whenever tab is pressed
          $('#sidebar').find('a, input, select, button').attr('tabIndex', -1);
        }
      }
    }
  });

  new AppView();

  if (data.sharing) {
    // Browser ID login
    $('[class^="span"]').on('click', '.login-form a', function(event) {
      event.preventDefault(); 
      var $form = $(this).parent();

      navigator.id.getVerifiedEmail(function(assertion) {
        if (assertion) {
          $form.find('input[name="bid_assertion"]').val(assertion);
          $form.submit();
        }
      });
    });
  }
}
