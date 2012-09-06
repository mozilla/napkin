define(['jquery', 'backbone', 'underscore', './extended', 'helpers/screen-utils',
        'helpers/errors', 'helpers/shared-models', 'lib/bootstrap', 'jquery.ui',
        'jquery.serialize'],
  function($, Backbone, _, ExtendedView, screenUtils, errors, sharedModels) {
    return ExtendedView.extend({
      tagName: 'div',

      initialize: function(options) {
        this.component = options.component;
        this.componentRow = this.component.get('row');
        this.componentId = this.component.get('id');

        var type = this.model.get('type');
        var templateId = type + '-element-template';

        var $template = $('#' + templateId);
        this.template = _.template($template.html());

        // popovers only on prototype page
        if (!screenUtils.isSharePage()) {
          var popoverTemplateId = type + '-popover-template';
          this.popoverTemplate = _.template($('#' + popoverTemplateId).html());
        }

        // if a certain tag is specified by the template, use it; otherwise,
        // default to div
        var tag = $template.data('tag');
        if (tag) {
          this.setElement(this.make(tag));
        }

        // construct after tag is finalized
        this.constructParent(arguments);

        if (screenUtils.isSharePage()) {
          this.$el.addClass('share-element');
        } else {
          this.$el.addClass('live-element');
        }

        if (this.component.get('type') === 'form') {
          this.addIdToFormElement();
          this.$el.addClass('field');
        }
      },

      addPopover: function() {
        if (screenUtils.isSharePage()) {
          // no popovers on the screen share page
          return;
        }

        var self = this;
        sharedModels.getCurrentScreen()
          .then(function(screen) {
            var placement = 'bottom';
            if (self.componentRow === screen.get('layout').length) {
              placement = 'top';
            }

            self.$el.popover({
              title: 'Edit Element',
              trigger: 'manual',
              placement: placement,
              content: self.popoverTemplate(self.getTemplateData())
            });
          });
      },

      render: function() {
        this.deactivate();
        this.$el.html(this.template(this.getTemplateData()));

        // get rid of the current popover entirely if one exists
        this.$el.data('popover', null);
        this.addPopover();

        this.$el.data('model', this.model);
        return this;
      },

      getTemplateData: function() {
        var data = this.model.toJSON();
        data.elementId = this.elementId;
        return data;
      },

      activate: function() {
        if (!this.$el.hasClass('active')) {
          this.$el.popover('show');
          this.$el.addClass('active');

          // add text to selection div inside popover select box
          var $popover = this.$el.data('popover').tip();
          var $select = $popover.find('.field select');
          $select.siblings('.selection')
            .text($select.find('option:selected').text());

          // if the element model was just created, the user likely wants to
          // edit this element; in turn, immediately focus the first input/textarea
          if (this.model.justCreated) {
            $popover.find('input, textarea')
              .eq(0)
              .focus()
              .select();

            // only do this once
            this.model.justCreated = false;
          }
        }
      },

      deactivate: function() {
        if (this.$el.hasClass('active')) {
          var $popover = this.$el.data('popover').tip();
          $popover.find('.btn-primary').tooltip('hide');

          this.$el.popover('hide');
          this.$el.removeClass('active');
        }
      },

      getPreviousElement: function() {
        var $prev = this.$el.prev();

        if ($prev.length > 0) {
          return $prev.data('model');
        }
        return null;
      },

      getNextElement: function() {
        var $next = this.$el.next();

        // skip over placeholder added by jqueryui sortable
        if ($next.hasClass('ui-sortable-placeholder')) {
          $next = $next.next();
        }

        if ($next.length > 0) {
          return $next.data('model');
        }
        return null;
      },

      // insert this element into the linked list based off of its current
      // position in the DOM
      insertElement: function() {
        var model = this.model;
        var previousElement = this.getPreviousElement();

        model.set({
          head: null,
          nextId: null
        });

        if (previousElement) {
          var nextId = previousElement.get('nextId');

          if (nextId) {
            model.set('nextId', nextId);
          } else {
            model.set('nextId', null);
          }

          previousElement.save({ nextId: model.get('id') }, { wait: true });
        } else {
          // no previous element means this is the head
          model.set('head', true);
          var nextElement = this.getNextElement();

          if (nextElement) {
            model.set('nextId', nextElement.get('id'));
            nextElement.save({ head: null }, { wait: true });
          }
        }

        model.save({}, { wait: true });
      },

      removeElementFromLinkedList: function() {
        var model = this.model;
        var previousElement = this.getPreviousElement(); 

        if (previousElement) {
          var nextId = model.get('nextId');

          if (nextId) {
            // set the previous' nextId to this element's nextId
            previousElement.set('nextId', nextId);
          } else {
            // there is no next; remove the previous' nextId
            previousElement.set('nextId', null);
          }

          previousElement.save({}, { wait: true });
        } else {
          var nextElement = this.getNextElement();

          if (nextElement) {
            // no previous element means nextElement is the new head
            nextElement.save({ head: true }, { wait: true });
          }
        }
      },

      destroyElement: function() {
        var self = this;
        self.removeElementFromLinkedList();

        self.model.destroy({
          success: function() {
            self.deactivate();
            self.undelegateEvents();

            self.off();
            self.remove();
          },
          wait: true
        });
      },

      addIdToFormElement: function() {
        var id = this.model.get('name');
        var usedIds = this.constructor.usedIds;

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
        if (!usedIds[id]) {
          usedIds[id] = 1;
        } else {
          usedIds[id]++;

          // this will append the count to id to create a unique id
          id = id + (usedIds[id] - 1);
          usedIds[id] = 1;
        }

        this.elementId = id;
      },

      contextualEvents: {
        'click window | #content': function(event) {
          this.deactivate();
        },

        'click #content | .live-element': function(event) {
          var $element = $(event.currentTarget);
          if ($element.is(this.$el)) {
            event.preventDefault();

            if (this.$el.hasClass('active')) {
              // if already activated, deactivate
              this.deactivate();
            } else {
              this.activate();
            }
          } else {
            this.deactivate();
          }
        },

        'click window | .close-popover': function(event) {
          event.preventDefault();
          this.deactivate();
        },

        'submit window | .popover-content form': function(event) {
          if (this.$el.hasClass('active')) {
            event.preventDefault();
            var self = this;

            var $form = $(event.currentTarget);
            var formData = $form.serializeObject();

            for (var attr in formData) {
              var oldValue = self.model.get(attr);

              // make the new value's type match the old value's type
              if (typeof oldValue === 'number' && typeof formData[attr] === 'string') {
                formData[attr] = +formData[attr];
              }

              self.model.set(attr, formData[attr]);
            }

            self.model.save({}, {
              success: function() {
                self.render();
              },

              error: errors.tooltipHandler($form.find('.btn-primary')),
              wait: true
            });
          }
        },

        'keydown window | .popover-content textarea': function(event) {
          if (this.$el.hasClass('active')) {
            if ((event.ctrlKey || event.metaKey) && event.which === 13) {
              event.preventDefault();

              // submit the element edit form
              $(event.currentTarget).parent().submit();
            }
          }
        },

        'click window | .popover-content .btn-danger': function(event) {
          if (this.$el.hasClass('active')) {
            event.preventDefault();
            this.deactivate();
            this.destroyElement();
          }
        }
      },

      subscriptions: {
        'component:activateElement': function($element) {
          if ($element.is(this.$el)) {
            this.activate();
          } else {
            this.deactivate();
          }
        },

        'component:deactivateElements': function() {
          this.deactivate();
        },

        'screenActions:deactivateElementsInComponent': function(component) {
          if (this.component === component) {
            this.deactivate();
          }
        },

        'component:removeElement': function($element) {
          if ($element.is(this.$el)) {
            this.removeElementFromLinkedList();
          }
        },

        'component:insertElement': function($element) {
          if ($element.is(this.$el)) {
            this.insertElement();
          }
        },

        'keyManager:keyDown': function(keyEvent) {
          if (this.$el && this.$el.hasClass('active')) {
            // escape key
            if (keyEvent.which === 27) {
              this.deactivate();
            }

            // backspace key
            if (keyEvent.which === 8) {
              keyEvent.preventDefault();
              this.deactivate();
              this.destroyElement();
            }
          }
        }
      }
    }, {
      // to keep track of form IDs that are used
      usedIds: {}
    });
  });
