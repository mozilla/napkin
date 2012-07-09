function NapkinClient(window, document, $, data, undefined) {
  var $window = $(window);
  var $body = $('body');
  var $sidebar = $('#sidebar');
  var $addScreen = $('#add-screen').hide();

  var Project = Backbone.Model.extend({
    name: 'Project',

    // default values for a project
    defaults: function() {
      return {
        title: 'Project name'
      };
    },

    // validate a project's attributes
    validate: function(attrs) {
      var name = this.name + ' ';
      if (!attrs.title || attrs.title.length === 0) {
        return name + 'must have a title.';
      } else if (attrs.title.length > 25) {
        return name + 'must have a title less than 25 characters long.';
      }
    }
  });

  var ProjectList = Backbone.Collection.extend({
    model: Project,
    url: '/projects',
    
    // sort projects by title
    comparator: function(project) {
      return project.get('title');
    }
  });

  var ProjectView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#project-template').html()),

    events: {
      'click .icon-pencil': 'edit',
      'click .icon-trash': 'destroy',
      'keypress .edit': 'finishOnEnter',
      'click a': 'makeActive'
    },

    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
      this.model.bind('sync', this.render, this);
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$input = this.$('.edit');
      return this;
    },

    // edit a project
    edit: function(event) {
      event.preventDefault();
      this.$el.addClass('editing');
      this.$input.focus();
    },
    
    // finish editing a project
    finish: function() {
      var title = this.$input.val().trim();
      var that = this;

      this.model.save({
        title: title
      }, {
        error: tooltipErrorHandler(this.$input),
        success: function(model) {
          that.$el.removeClass('editing');
        }
      });
    },

    // call finish when enter is pressed
    finishOnEnter: function(event) {
      if (event.which === 13) { // enter key
        this.finish();
      }
    },

    // remove a project
    destroy: function(event) {
      if (event) {
        event.preventDefault();
      }
      this.model.destroy();
    },

    // set the active project that is being viewed
    makeActive: function(event) {
      event.preventDefault();
      var $target = $(event.target);

      // make sure that this isn't propagation
      if ($target.is('a')) {
        this.$el.siblings().removeClass('active');
        this.$el.addClass('active');
        this.options.screens.setActiveProject(this.model.id);
        $addScreen.show();
      }
    }
  });

  var Screen = Backbone.Model.extend({
    name: 'Screen',

    defaults: function() {
      /* TODO: implement is_start, layout */
      return {
        title: 'Screen name'
      };
    },

    // validate a screen's attributes
    validate: function(attrs) {
      var name = this.name + ' ';
      if (!attrs.title || attrs.title.length === 0) {
        return name + 'must have a title.';
      } else if (attrs.title.length > 25) {
        return name + 'must have a title less than 25 characters long.';
      }
    }
  });

  var ScreenList = Backbone.Collection.extend({
    model: Screen,
    url: '/screens',
    urlTemplate: _.template('/projects/<%= id %>/screens'),

    // set which project the user is focused on
    setActiveProject: function(id) {
      this.url = this.urlTemplate({
        id: id
      });
      this.fetch();
    },

    // sort screens by title
    comparator: function(screen) {
      return screen.get('title');
    }
  });

  var ScreenView = Backbone.View.extend({
    tagName: 'div',
    className: 'span3 screen',
    template: _.template($('#screen-template').html()),

    events: {
      'click .icon-pencil': 'edit',
      'click .icon-trash': 'destroy',
      'keypress .edit': 'finishOnEnter'
    },

    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
      this.model.bind('sync', this.render, this);
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$input = this.$('.edit');
      return this;
    },

    // edit a screen
    edit: function(event) {
      event.preventDefault();
      this.$el.addClass('editing');
      this.$input.focus();
    },

    // finish editing a screen
    finish: function() {
      var that = this;
      var title = this.$input.val().trim();

      this.model.save({
        title: title
      }, {
        error: tooltipErrorHandler(this.$input),
        success: function(model) {
          that.$el.removeClass('editing');
        }
      });
    },

    // call finish when enter is pressed
    finishOnEnter: function(event) {
      if (event.which === 13) { // enter key
        this.finish();
      }
    },

    // remove a screen
    destroy: function(event) {
      if (event) {
        event.preventDefault();
      }
      this.model.destroy();
    }
  });

  var projects = new ProjectList();
  var screens = new ScreenList();

  var AppView = Backbone.View.extend({
    el: $('body'),

    $projectInput: $('#add-project-form input[type="text"]'),
    $screenInput: $('#add-screen input[type="text"]'),

    events: {
      'submit #add-project-form': 'createProjectOnSubmit',
      'submit #add-screen form': 'createScreenOnSubmit'
    },

    initialize: function() {
      this.$projectList = $('<div id="projects">').appendTo('#sidebar');
      this.$screenList = $('<div id="screens">').appendTo('#content');

      projects.bind('add', this.addProject, this);
      projects.bind('reset', this.addAllProjects, this);
      projects.fetch(); // get all projects from server

      screens.bind('add', this.addAllScreens, this);
      screens.bind('reset', this.addAllScreens, this);
      screens.bind('remove', this.addAllScreens, this);
    },

    render: function() {
      // nothing to do
    },

    // add a project to the list
    addProject: function(project) {
      var view = new ProjectView({
        model: project,
        screens: screens
      });
      this.$projectList.append(view.render().$el);
    },

    // add all projects to the list
    addAllProjects: function() {
      var that = this;
      projects.each(function(project) {
        that.addProject(project);
      });
    },

    // add a screen to the list
    addScreen: function(screen) {
      var view = new ScreenView({
        model: screen
      });

      if (this.$screenList.find('.screen').length % 4 === 0) {
        $('<div class="row"></div>').appendTo(this.$screenList);
      }
      this.$('.row:last').append(view.render().$el);
    },

    // add all screens to the list
    addAllScreens: function() {
      this.$screenList.empty();
      var that = this;

      screens.each(function(screen) {
        that.addScreen(screen);
      });
      $window.resize();
    },

    // create a project on form submission
    createProjectOnSubmit: function(event) {
      event.preventDefault();
      var that = this;

      projects.create({
        title: this.$projectInput.val().trim(),
      }, {
        error: tooltipErrorHandler(this.$projectInput),
        success: function(model) {
          that.$projectInput.val('');
        }
      });
    },

    // create a screen on form submission
    createScreenOnSubmit: function(event) {
      event.preventDefault();
      var that = this;

      screens.create({
        title: this.$screenInput.val().trim(),
      }, {
        error: tooltipErrorHandler(this.$screenInput),
        success: function(model) {
          that.$screenInput.val('');
        }
      });
    }
  });

  /* Returns a tooltip error handler for a create/save call.
   * Requires: input element to create a tooltip on
   * Returns: an error handler that displays a tooltip if a problem arises
   */
  function tooltipErrorHandler($input) {
    return function(model, message) {
      if (_.isString(message)) {
        // client-side validation
        displayTooltip($input, message);
      } else {
        // server-side validation
        displayTooltip($input, message.responseText);
      }
      $input.focus();
    };
  }

  /* Display a tooltip on the given element.
   * Requires: element, message of tooltip, placement, how long to display for
   */
  function displayTooltip($element, message, placement, howLong) {
    placement = placement || 'bottom';
    howLong = howLong || 3000;

    var tooltip = $element.data('tooltip');
    if (tooltip) {
      // if the element already has a tooltip, reset its properties
      clearTimeout($element.data('timeout'));
      tooltip.options.title = message;
      tooltip.options.placement = placement;
      $element.tooltip('show'); // call show to update content
    } else {
      // otherwise create its tooltip
      $element.tooltip({
        trigger: 'manual',
        title: message,
        placement: placement
      }).tooltip('show');
    }

    // make the tooltip hide after the given display time has elapsed
    var timeout = setTimeout(function() {
      $element.tooltip('hide');
    }, howLong);
    $element.data('timeout', timeout);
  }

  // instantiate the app view to begin!
  new AppView();

  // placeholder polyfill
  var input = document.createElement('input');
  if (!('placeholder' in input)) {
    $('input[placeholder]').each(function() {
      var $this = $(this);
      var placeholder = $this.attr('placeholder');

      if ($this.val() === '') {
        $this.val(placeholder);
      }

      $this.focus(function() {
        if ($this.val() === placeholder) {
          $this.val('');
        }
      });

      $this.blur(function() {
        if ($this.val() === '') {
          $this.val(placeholder);
        }
      });
    });
  }

  // extend sidebar to full window height
  $window.resize(function() {
    $sidebar.height(Math.max($window.height(), $body.height()));
  }).resize(); // initial call
}
