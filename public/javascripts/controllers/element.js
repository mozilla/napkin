define(['can', './extended', 'models/element', 'helpers/screen-utils', 'can.super',
        'lib/bootstrap', 'jquery.ui'],
  function(can, ExtendedControl, ElementModel, screenUtils) {
    return ExtendedControl({
      usedIds: {}
    }, {
      init: function($element, options) {
        this._super($element, options);
        this.elementModel = options.elementModel;

        this.componentRow = options.component.attr('row');
        this.componentId = options.component.attr('id');

        if (options.component.attr('type') === 'form') {
          this.addIdToFormElement();
        }

        this.appendAndSetElement();
        this.addPopover();
        this.element.data('model', this.elementModel);

        // for event handlers
        this.content = $('#content');
      },

      appendAndSetElement: function() {
        var type = this.elementModel.attr('type');
        this.element.append(can.view(type + '-element-template', this.elementModel));
        this.setElement(this.$('.live-element').last());
      },

      addPopover: function() {
        if (screenUtils.isSharePage()) {
          // no popovers on the screen share page
          return;
        }

        var templateId = this.elementModel.attr('type') + '-popover-template';
        var placement = 'bottom';

        // TODO: change this when layout additions kick in
        if (this.componentRow === 3) {
          placement = 'top';
        }

        this.element.popover({
          title: 'Edit Element',
          trigger: 'manual',
          placement: placement,
          content: can.view.render(templateId, this.elementModel)
        });
      },

      render: function() {
        var type = this.elementModel.attr('type');
        var $oldElement = this.element;

        this.deactivate();
        this.setElement(this.element.parent());

        // replace the current element with a newly rendered one
        var $newElement = $(can.view.render(type + '-element-template', this.elementModel));
        $newElement = $newElement.filter('.live-element');
        $oldElement.replaceWith($newElement);

        this.setElement($newElement);
        this.addPopover();
        this.element.data('model', this.elementModel);
      },

      activate: function() {
        if (!this.element.hasClass('active')) {
          this.element.popover('show');
          this.element.addClass('active');

          // add text to selection div inside popover select box
          var $popover = this.element.data('popover').tip();
          var $select = $popover.find('.field select');
          $select.siblings('.selection')
            .text($select.find('option:selected').text());

          // if the element model was just created, the user likely wants to
          // edit this element; in turn, immediately focus the first input/textarea
          if (this.elementModel.justCreated) {
            $popover.find('input, textarea')
              .eq(0)
              .focus();

            // only do this once
            this.elementModel.justCreated = false;
          }
        }
      },

      deactivate: function() {
        if (this.element.hasClass('active')) {
          this.element.popover('hide');
          this.element.removeClass('active');
        }
      },

      getPreviousElement: function() {
        var $prev = this.element.prev();

        if ($prev.length > 0) {
          return $prev.data('model');
        }
        return null;
      },

      getNextElement: function() {
        var $next = this.element.next();

        // skip over placeholder added by jqueryui sortable
        if ($next.hasClass('ui-sortable-placeholder')) {
          $next = $next.next();
        }

        if ($next.length > 0) {
          return $next.data('model');
        }
        return null;
      },

      // given the current state of this element in the DOM, update the element
      // model linked list to match
      updateElementPosition: function() {
        var elementModel = this.elementModel;
        var previousElement = this.getPreviousElement();

        if (previousElement) {
          elementModel.attr('nextId', previousElement.attr('nextId'));

          previousElement.attr('nextId', elementModel.attr('id'));
          previousElement.withRouteData({ componentId: this.componentId })
            .save();
        } else {
          // no previous element means this is the head
          elementModel.attr('head', true);
          var nextElement = this.getNextElement();

          if (nextElement) {
            elementModel.attr('nextId', nextElement.attr('id'));
            nextElement.attr('head', null);
            nextElement.withRouteData({ componentId: this.componentId })
              .save();
          }
        }

        elementModel.withRouteData({ componentId: this.componentId })
          .save();
      },

      removeElementFromLinkedList: function() {
        event.preventDefault();

        var elementModel = this.elementModel;
        var previousElement = this.getPreviousElement(); 

        if (previousElement) {
          var nextId = elementModel.attr('nextId');

          if (nextId) {
            // set the previous' nextId to this element's nextId
            previousElement.attr('nextId', elementModel.attr('nextId')) ;
          } else {
            // there is no next; remove the previous' nextId
            previousElement.attr('nextId', null);
          }

          previousElement.withRouteData({ componentId: this.componentId })
            .save();
        } else {
          var nextElement = this.getNextElement();

          if (nextElement) {
            // no previous element means nextElement is the new head
            nextElement.attr('head', true);
            nextElement.withRouteData({ componentId: this.componentId })
              .save();
          }
        }

        // unset the element's nextId and head, but do not save; the element
        // will either be deleted promptly (see destroyElement below) or saved
        // later (see updateElementPosition)
        elementModel.attr('nextId', null);
        elementModel.attr('head', null);
      },

      destroyElement: function() {
        var self = this;
        self.removeElementFromLinkedList(true);
        self.elementModel.withRouteData({ componentId: self.componentId })
          .destroy()
          .then(function() {
            self.deactivate();
            // will also destroy this controller
            self.element.remove();
          });
      },

      addIdToFormElement: function() {
        var id = this.elementModel.attr('name');
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

        this.elementModel.attr('elementId', id);
      },

      '{content} click': function($element, event) {
        this.deactivate();
      },

      '{content} .live-element click': function($element, event) {
        if ($element.is(this.element)) {
          event.preventDefault();

          if (this.element.hasClass('active')) {
            // if already activated, deactivate
            this.deactivate();
          } else {
            this.activate();
          }
        } else {
          this.deactivate();
        }
      },

      '{content} deactivateElementRequested': function($element, event) {
        this.deactivate();
      },

      '{window} .close-popover click': function($element, event) {
        event.preventDefault();
        this.deactivate();
      },

      '{window} .popover-content form submit': function($form, event) {
        if (this.element.hasClass('active')) {
          event.preventDefault();
          var self = this;

          var formData = $form.serializeObject();
          for (var attr in formData) {
            var oldValue = self.elementModel.attr(attr);

            // make the new value's type match the old value's type
            if (typeof oldValue === 'number' && typeof formData[attr] === 'string') {
              formData[attr] = +formData[attr];
            }

            self.elementModel.attr(attr, formData[attr]);
          }

          self.elementModel.withRouteData({ componentId: self.componentId })
            .save()
            .then(function() {
              self.render();
            });
        }
      },

      '{window} .popover-content textarea keydown': function($textarea, event) {
        if (this.element.hasClass('active')) {
          if ((event.ctrlKey || event.metaKey) && event.which === 13) {
            event.preventDefault();

            // submit the element edit form
            $textarea.parent().submit();
          }
        }
      },

      '{window} .popover-content .btn-danger click': function($btn, event) {
        if (this.element.hasClass('active')) {
          this.destroyElement();
        }
      },

      '{window} isolatedKeyDown': function($window, event, keyEvent) {
        if (this.element && this.element.hasClass('active')) {
          // escape key
          if (keyEvent.which === 27) {
            this.deactivate();
          }

          // backspace key
          if (keyEvent.which === 8) {
            this.destroyElement();
          }
        }
      }
    });
  });
