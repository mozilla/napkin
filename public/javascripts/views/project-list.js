define(['jquery', 'backbone', './extended', 'collections/project',
        './project', 'helpers/errors'],
  function($, Backbone, ExtendedView, ProjectCollection, ProjectView, errors) {
    var Projects = new ProjectCollection();

    return ExtendedView.extend({
      initialize: function(options) {
        this.constructParent(arguments);

        // for caching purposes
        this.$projects = $('#projects');
        this.$projectTitle = $('#project-title');
        this.hasHistoryStarted = false;

        Projects.on('add', this.addProject, this);
        Projects.on('reset', this.addAllProjects, this);
        Projects.on('remove', this.addAllProjects, this);

        Projects.fetch();
      },

      addProject: function(project) {
        var view = new ProjectView({ model: project });
        this.$projects.append(view.render().el);
      },

      addAllProjects: function() {
        this.$projects.empty();
        Projects.each(_.bind(this.addProject, this));

        if (!this.hasHistoryStarted) {
          this.hasHistoryStarted = true;
          Backbone.history.start();
        }
      },

      events: {
        // to add a project
        'submit #add-project-form': function(event) {
          var self = this;
          event.preventDefault();

          Projects.create({ title: self.$projectTitle.val() }, {
            success: function(project) {
              self.$projectTitle.val('');
            },

            error: errors.tooltipHandler(self.$projectTitle),
            wait: true
          });
        }
      }
    });
  });
