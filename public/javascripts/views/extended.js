define(['jquery', 'backbone', 'underscore', 'router', 'helpers/screen-utils'],
  function($, Backbone, _, router, screenUtils) {
    var mediator = _.extend({}, Backbone.Events);
    var ExtendedView = Backbone.View.extend({
      initialize: function(options) {
        // nothing to do
      },

      constructParent: function(args) {
        args = Array.prototype.slice.call(args, 0);
        ExtendedView.prototype.initialize.apply(this, args);
      },

      setSubscriptions: function(action) {
        var self = this;

        // determine whether to subscribe or unsubscribe
        if (action === 'on') {
          action = 'subscribe';
        } else if (action === 'off') {
          action = 'unsubscribe';
        }

        if (_.isObject(self.subscriptions)) {
          // subscribe for each event-callback pair in the subscriptions object
          _.each(self.subscriptions, function(callback, eventType) {
            callback = self.resolveCallback(callback);
            self[action](eventType, callback, self);
          });
        }
      },

      setRouteEvents: function(action) {
        var self = this;
        if (_.isObject(self.routeEvents)) {
          // add route events for each event-callback pair
          _.each(self.routeEvents, function(callback, eventType) {
            callback = self.resolveCallback(callback);
            router[action]('route:' + eventType, _.bind(callback, self));
          });
        }
      },

      setContextualEvents: function(action) {
        var self = this;
        if (_.isObject(self.contextualEvents)) {
          // add contextual events for each event-callback pair
          _.each(self.contextualEvents, function(callback, eventDescriptor) {
            // eventDescriptor is of the form 'eventType contextSelector | 
            // selector', where eventType is the type of the event, contextSelector
            // is a jQuery selector corresponding to which element the event will
            // bubble up to, and selector is a jQuery selector corresponding to
            // which element the event is targeted for
            
            // parse the descriptor according to the form above
            var parts = eventDescriptor.split(' ');
            var eventType = parts[0];

            var contextSelector;
            var contextElement;
            var selector;

            for (var i = 1; i < parts.length; i++) {
              if (parts[i] === '|') {
                // we've hit the |, so find the contextSelector and selector
                contextSelector = parts.slice(1, i).join(' ');

                // special case for window
                if (contextSelector === 'window') {
                  contextElement = $(window);
                } else {
                  contextElement = $(contextSelector);
                }

                selector = parts.slice(i + 1, parts.length).join(' ');
                break;
              }
            }

            callback = self.resolveCallback(callback);
            // add the event with delegation
            contextElement[action](eventType, selector, _.bind(callback, self));
          });
        }
      },

      resolveCallback: function(callback) {
        // callback may be a string reference to a function as opposed to
        // a function itself, so resolve it if necessary
        if (_.isString(callback)) {
          callback = this[callback];
        }
        return callback;
      },

      publish: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        mediator.trigger.apply(mediator, args);
      },

      subscribe: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        mediator.on.apply(mediator, args);
      },

      unsubscribe: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        mediator.off.apply(mediator, args);
      },

      navigate: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        router.navigate.apply(router, args);
      },

      delegateEvents: function() {
        // don't delegate events on share page
        if (!this.eventsDelegated && !screenUtils.isSharePage()) {
          // also add subscriptions, route events, and contextual events
          this.setSubscriptions('on');
          this.setRouteEvents('on');
          this.setContextualEvents('on');

          Backbone.View.prototype.delegateEvents.call(this);
          this.eventsDelegated = true;
        }
      },

      undelegateEvents: function() {
        if (this.eventsDelegated) {
          // also remove subscriptions, route events, and contextual events
          this.setSubscriptions('off');
          this.setRouteEvents('off');
          this.setContextualEvents('off');

          Backbone.View.prototype.undelegateEvents.call(this);
          this.eventsDelegated = false;
        }
      }
    });

    return ExtendedView;
  });
