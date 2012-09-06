define(['jquery', 'backbone', 'underscore', './extended', 'collections/element',
        './element', 'helpers/screen-utils', 'helpers/errors', 'jquery.ui'],
  function($, Backbone, _, ExtendedView, ElementCollection, ElementView,
           screenUtils, errors) {
    return ExtendedView.extend({
      template: _.template($('#component-action-template').html()),

      initialize: function(options) {
        this.constructParent(arguments);

        this.$el.addClass('has-component');
        this.$el.addClass(this.model.get('type') + '-container');

        var urlData = screenUtils.getUrlData();
        this.Elements = new ElementCollection([],
          _.extend({ componentId: this.model.get('id') }, urlData));

        this.Elements.on('reset', this.addAllElements, this);
        this.Elements.on('remove', this.addAllElements, this);

        this.Elements.fetch();

        // sortable only on prototype page
        if (!screenUtils.isSharePage()) {
          this.$el.sortable(this.sortableOptions);
        }
      },

      sortableOptions: {
        items: '.live-element'
      },
      
      addAllElements: function() {
        var self = this;
        var curElement;

        // id => element map
        var idElementMap = {};
        var $elementsContainer = self.$el;
        var originalContainerHTML;

        self.Elements.each(function(element, index) {
          idElementMap[element.get('id')] = element;

          // begin with the head
          if (element.get('head')) {
            curElement = element;
          }
        });

        // if there are elements to add
        if (curElement) {
          // component is no longer empty
          self.setComponentEmpty(false);

          var wrapperId = self.model.get('type') + '-wrapper-template';
          var $wrapper = $('#' + wrapperId);

          // if the wrapper template exists, add it to this component
          if ($wrapper.length === 1) {
            var wrapperTemplate = _.template($wrapper.html());
            self.$el.append(wrapperTemplate(self.model.toJSON()));

            // where the elements should be added to
            $elementsContainer = self.$('.elements-container');

            // clear out the container, but save its contents to be added after
            // all of the elements
            originalContainerHTML = $elementsContainer.html();
            $elementsContainer.html('');
          }
        } else {
          self.setComponentEmpty(true);
        }

        var index = 0;
        while (curElement) {
          // go through the linked list via the nextId attribute, adding each
          // element one-by-one
          self.addElement(curElement, $elementsContainer);
          curElement = idElementMap[curElement.get('nextId')];

          if (++index === 100) {
            console.log('This seems like an infinite loop due to a circular linked list.');
            break;
          }
        }

        if (originalContainerHTML) {
          $elementsContainer.append(originalContainerHTML);
        }
      },

      addElement: function(element, $container) {
        var type = element.get('type');
        var view = new ElementView({
          model: element,
          component: this.model
        });

        $container.append(view.render().el);
      },

      setComponentEmpty: function(empty) {
        // clear out leftover elements and add component actions
        this.$el.html(this.template(this.model.toJSON()));

        if (empty) {
          this.$el.addClass('empty');
          // no elements; add a type label as a placeholder
          this.$el.append(this.model.get('type'));
        } else {
          this.$el.removeClass('empty');
        }
      },

      remove: function() {
        this.$el.removeClass('has-component');
        this.$el.removeClass(this.model.get('type') + '-container');

        this.deselect(true);
        this.$el.empty();

        this.undelegateEvents();
        this.trigger('remove');
        this.off();

        this.$el.sortable('destroy');
        this.model.destroy();
      },

      select: function() {
        if (!this.$el.hasClass('active')) {
          this.$el.addClass('active');
          this.publish('component:selected', this.model);
        }
      },

      deselect: function(triggerDeselectedAll) {
        if (this.$el.hasClass('active')) {
          this.$el.removeClass('active');
          this.publish('component:deselected', this.model);

          if (triggerDeselectedAll) {
            this.publish('component:deselectedAll', this.model);
          }
        }
      },

      getLastElement: function() {
        var $lastElement = this.$('.live-element').last();
        return $lastElement.data('model');
      },

      createElement: function($element) {
        if (this.$el.hasClass('active')) {
          var self = this;
          // gather all element data; clone to prevent data modifications below
          // from affecting the original element
          var data = _.extend({}, $element.data());

          // get rid of jquery-ui data
          delete data.draggable;
          delete data.sortable;

          // integer level for headings
          if (data.level) {
            data.level = parseInt(data.level, 10);
          }

          // text for headings/paragraphs
          var text = $element.text();
          if (text) {
            data.text = text;
          }

          var lastElement = self.getLastElement();
          if (!lastElement) {
            data.head = true;
          }

          self.Elements.create(data, {
            success: function(element) {
              element.justCreated = true;

              function onLinkedListReady() {
                // when the linked list ready, refresh the elements
                self.publish('component:deactivateElements');
                self.addAllElements();
              }

              if (lastElement) {
                // lastElement is no longer the last; it now has a next
                lastElement.save({ nextId: element.get('id') }, {
                  success: onLinkedListReady,
                  wait: true
                });
              } else {
                onLinkedListReady();
              }
            },

            error: errors.tooltipHandler($element),
            wait: true
          });
        }
      },

      events: {
        'click .icon-trash': function(event) {
          event.preventDefault();
          this.publish('component:deactivateElements');
          this.remove();
        },

        'drop': function(event, ui) {
          var $element = $(ui.draggable);

          if (!$element.is('.element')) {
            // an element was not dragged; perhaps this is a component?
            return;
          }

          // reset component position, since it was just dragged
          $element.css({ top: 0, left: 0 });

          if (this.$el.hasClass('active')) {
            this.createElement($element);
          }
        }
      },

      contextualEvents: {
        'sortstart #content | .component-location': function(event, ui) {
          var $componentLocation = $(event.currentTarget);
          if ($componentLocation.is(this.$el)) {
            this.select();

            var $element = $(ui.item);
            this.$originalPrev = $element.prev();

            this.publish('component:removeElement', $element);
            this.publish('component:deactivateElements');
          }
        },

        'sortstop #content | .component-location': function(event, ui) {
          var $componentLocation = $(event.currentTarget);
          if ($componentLocation.is(this.$el)) {
            var $element = $(ui.item);
            this.publish('component:insertElement', $element);

            if (this.$originalPrev.is($element.prev())) {
              // element wasn't moved; treat this as a click and activate the popover
              this.publish('component:activateElement', $element);
            }
          }
        },

        'click window | #content': function(event) {
          this.deselect(true);
        },

        'click #content | .component-location': function(event) {
          var $componentLocation = $(event.currentTarget);
          if ($componentLocation.is(this.$el)) {
            // stop propagation to prevent content click handler above that blurs
            // all components
            event.stopPropagation();
            this.select();
          } else {
            // some other component was clicked; deselect this one
            // also deselect all if the location that was clicked does not have
            // a component associated with it
            this.deselect(!$componentLocation.hasClass('has-component'));
          }
        },

        'click #sidebar | #back': function(event) {
          this.deselect(true);
        }
      },

      subscriptions: {
        'screenLayout:selectComponent': function(component) {
          if (this.model === component) {
            this.select();
          }
        },

        'elementList:addElement': 'createElement',

        'layoutModification:deleteComponent': function(location) {
          // remove this component if it corresponds to the given location
          if (location.row === this.model.get('row') && location.col ===
              this.model.get('col')) {
            this.remove();
          }
        },

        'layoutModification:deleteRow': function(row) {
          var componentRow = this.model.get('row');

          // remove this component if it is in the given row
          if (componentRow === row) {
            this.remove();
          }

          // move this component up one row if it is below the given row
          if (componentRow > row) {
            this.model.save({ row: componentRow - 1}, { wait: true });
          }
        },

        'keyManager:keyDown': function(keyEvent) {
          // only activate keyboard shortcuts if component is at the front of
          // focus; i.e. no element is active
          if (this.$el.hasClass('active') &&
            !this.$('.live-element').hasClass('active')) {
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
      }
    });
  });
