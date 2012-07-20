function NapkinClient(window, document, $, data, undefined) {
  var $window = $(window);
  var $addScreen = $('#add-screen').hide();

  var Project = Backbone.Model.extend({
    name: 'Project',

    // default values for a project
    defaults: function() {
      return {
        title: 'Project name'
      };
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
      var that = this;
      var title = this.$input.val().trim();

      this.model.save({
        title: title
      }, {
        error: tooltipErrorHandler(this.$input),
        success: function(model) {
          that.$el.removeClass('editing');
        },
        wait: true
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
        this.forceActive();
      }
    },

    forceActive: function() {
      this.$el.siblings().removeClass('active');
      this.$el.addClass('active');
      this.options.screens.setActiveProject(this.model.id);
      $addScreen.show();
    }
  });

  var Screen = Backbone.Model.extend({
    name: 'Screen',

    defaults: function() {
      // TODO: implement isStart, layout
      return {
        title: 'Screen name'
      };
    }
  });

  var ScreenList = Backbone.Collection.extend({
    model: Screen,
    url: '/screens',
    urlTemplate: _.template('/projects/<%= projectId %>/screens'),

    // set which project the user is focused on
    setActiveProject: function(projectId) {
      this.activeProjectId = projectId;
      this.url = this.urlTemplate({ projectId: projectId });
      this.fetch();
    },

    // sort screens by title
    comparator: function(screen) {
      return screen.get('title');
    }
  });

  var projects = new ProjectList();
  var screens = new ScreenList();

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
      var templateData = this.model.toJSON();
      templateData.projectId = screens.activeProjectId;

      this.$el.html(this.template(templateData));
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
        },
        wait: true
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

      // if the part of the URL after # is an existing project id, make the
      // corresponding project active initially
      var poundIndex = location.href.lastIndexOf('#');
      if (poundIndex !== -1) {
        this.initialProjectId = location.href.substring(poundIndex + 1);
        this.initialProjectId = parseInt(this.initialProjectId, 10);
      }

      // get all projects from server
      projects.fetch();

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

      if (this.initialProjectId === project.id) {
        view.forceActive();
        this.initialProjectId = null;
      }
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
        title: this.$projectInput.val().trim()
      }, {
        error: tooltipErrorHandler(this.$projectInput),
        success: function(model) {
          that.$projectInput.val('');
        },
        wait: true
      });
    },

    // create a screen on form submission
    createScreenOnSubmit: function(event) {
      event.preventDefault();
      var that = this;

      screens.create({
        title: this.$screenInput.val().trim()
      }, {
        error: tooltipErrorHandler(this.$screenInput),
        success: function(model) {
          that.$screenInput.val('');
        },
        wait: true
      });
    }
  });

  // instantiate the app view to begin!
  new AppView();
}
