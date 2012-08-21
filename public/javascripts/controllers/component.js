define(['can', './extended', './element', 'models/element', 'helpers/screen-utils',
        'helpers/errors', 'can.super', 'jquery.ui'],
  function(can, ExtendedControl, ElementControl, ElementModel, screenUtils, errors) {
    return ExtendedControl({
      init: function($element, options) {
        this._super($element, options);
        this.component = options.component;

        // used for event handlers
        this.off();
        this.options.content = $('#content');
        this.options.$sidebar = $('#sidebar');
        this.on();

        var type = this.getType();
        this.element.addClass('has-component');
        this.element.addClass(type + '-container');

        this.addAllElements();
        if (!screenUtils.isSharePage()) {
          this.element.sortable(this.sortableOptions);
        }
      },

      sortableOptions: {
        items: '.live-element'
      },
      
      getType: function() {
        return this.component.attr('type');
      },

      addAllElements: function() {
        var self = this;
        var componentId = self.component.attr('id');

        if (self.cachedElements) {
          self.prepareForAddition();
          self.traverseElementLinkedList();
        } else {
          // TODO: optimize this when layout row is removed (new request for
          // every moved component)
          ElementModel.withRouteData()
            .findAll({ componentId: componentId })
            .then(function(elements) {
              self.cachedElements = elements;
              self.prepareForAddition();
              self.traverseElementLinkedList();
            }, function(xhr) {
              // TODO: handle error
            });
        }
      },

      setComponentEmpty: function(empty) {
        // clear out leftover elements and add component actions
        this.element.html(can.view('component-action-template', {}));

        if (empty) {
          this.element.addClass('empty');
          // no elements; add a type label as a placeholder
          this.element.append(this.getType());
        } else {
          this.element.removeClass('empty');
        }
      },

      prepareForAddition: function() {
        var elements = this.cachedElements;
        if (elements.length > 0) {
          this.setComponentEmpty(false);
        } else {
          this.setComponentEmpty(true);
        }
      },

      traverseElementLinkedList: function() {
        var self = this;
        var curElement;

        // id => element map
        var idElementMap = {};
        var elements = self.cachedElements;

        elements.each(function(element, index) {
          idElementMap[element.attr('id')] = element;

          // begin with the head
          if (element.attr('head')) {
            curElement = element;
          }
        });

        while (curElement) {
          // go through the linked list via the nextId attribute, adding each
          // element one-by-one
          self.addElement(curElement);
          curElement = idElementMap[curElement.attr('nextId')];
        }

        if (screenUtils.isSharePage()) {
          var wrapperId = self.component.attr('type') + '-wrapper-template';

          // if the wrapper template exists, add it to this component
          if ($('#' + wrapperId).length === 1) {
            // this is a wrapper; add the inner HTML as an attribute so that it
            // can be inserted
            this.component.attr('html', this.element.html());
            this.element.html(can.view(wrapperId, this.component));
          }
        }
      },

      addElement: function(element) {
        if (this.element.hasClass('empty')) {
          this.setComponentEmpty(false);
        }

        var type = element.attr('type');
        new ElementControl(this.element, {
          elementModel: element,
          component: this.component
        });
      },

      remove: function() {
        var self = this;
        self.element.removeClass('has-component');
        self.element.removeClass(this.getType() + '-container');

        self.deselect(true);
        self.element.empty();
        self.element.sortable('destroy');

        self.component.withRouteData()
          .destroy()
          .then(function(component) {
            self.destroy();
          }, function(xhr) {
            // TODO: handle error
          });
      },

      select: function() {
        if (!this.element.hasClass('active')) {
          this.element.addClass('active');
          this.element.trigger('selected', this.component);
        }
      },

      deselect: function(triggerDeselectedAll) {
        if (this.element.hasClass('active')) {
          this.element.removeClass('active');
          this.element.trigger('deselected', this.component);

          if (triggerDeselectedAll) {
            this.options.content.trigger('deselectedAll', this.component);
          }
        }
      },

      getLastElement: function() {
        return this.$('.live-element').last()
          .data('model');
      },

      '{content} .component-location sortstart': function($componentLocation, event, ui) {
        if ($componentLocation.is(this.element)) {
          this.select();
          var $element = $(ui.item);
          var elementControl = $element.data('controls')[0];
          elementControl.removeElementFromLinkedList();

          this.originalPrev = $element.prev();
          this.options.content.trigger('deactivateElementRequested');
        }
      },

      '{content} .component-location sortstop': function($componentLocation, event, ui) {
        if ($componentLocation.is(this.element)) {
          var $element = $(ui.item);
          var elementControl = $element.data('controls')[0];
          elementControl.updateElementPosition();

          if (this.originalPrev.is($element.prev())) {
            // element wasn't moved; treat this as a click and activate the popover
            elementControl.activate();
          }
        }
      },

      '{content} click': function($element, event) {
        this.deselect(true);
      },

      '{content} .component-location click': function($element, event) {
        if ($element.is(this.element)) {
          // stop propagation to prevent {content} click handler above that blurs
          // all components
          event.stopPropagation();
          this.select();
        } else {
          // some other component was clicked; deselect this one
          // also deselect all if the element that was clicked does not have
          // a component associated with it
          this.deselect(!$element.hasClass('has-component'));
        }
      },

      '{$sidebar} .element addRequested': function($element, event) {
        if (this.element.hasClass('active')) {
          var self = this;
          // gather all element data
          var data = $element.data();

          // integer level for headings
          if (data.level) {
            data.level = parseInt(data.level, 10);
          }

          // text for headings/paragraphs
          var text = $element.text();
          if (text) {
            data.text = text;
          }

          var element = new ElementModel(data);
          var lastElement = self.getLastElement();

          if (!lastElement) {
            element.attr('head', true);
          }

          // TODO: how to factor out componentId from this as well?
          element.withRouteData({ componentId: self.component.attr('id') })
            .save()
            .then(function(element) {
              element.justCreated = true;

              // add element to this component
              function addElement() {
                self.cachedElements.push(element);
                self.addElement(element);
              }

              if (lastElement) {
                // lastElement is no longer the last; it now has a next
                lastElement.attr('nextId', element.attr('id'));
                lastElement.withRouteData({ componentId: self.component.attr('id') })
                  .save()
                  .then(addElement);
              } else {
                addElement();
              }
            }, errors.tooltipHandler($element));
        }
      },

      '{$sidebar} #back click': function($element, event) {
        this.deselect(true);
      },

      '.icon-trash click': function($element, event) {
        event.preventDefault();
        this.options.content.trigger('deactivateElementRequested');
        this.remove();
      },

      '{content} deleteComponentRequested': function($element, event, location) {
        // remove this component if it corresponds to the given location
        if (location.row === this.component.attr('row') && location.col ===
            this.component.attr('col')) {
          this.remove();
        }
      },

      '{content} deleteRowRequested': function($element, event, row) {
        var componentRow = this.component.attr('row');

        // remove this component if it is in the given row
        if (componentRow === row) {
          this.remove();
        }

        // move this component up one row if it is below the given row
        if (componentRow > row) {
          this.component.attr('row', componentRow - 1);
          this.component.withRouteData()
            .save()
            .then(function(component) {
            }, function(xhr) {
              // TODO: handle error
            });
        }
      },

      '{window} isolatedKeyDown': function($window, event, keyEvent) {
        // only activate keyboard shortcuts if component is at the front of
        // focus; i.e. no element is active
        if (this.element.hasClass('active') && !this.$('.live-element').hasClass('active')) {
          // escape key
          if (keyEvent.which === 27) {
            this.deselect(true);
          }

          // backspace key
          if (keyEvent.which === 8) {
            keyEvent.preventDefault();
            this.remove();
          }
        }
      }
    });
  });
