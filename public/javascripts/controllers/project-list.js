define(['jquery', 'can', './extended', 'models/project', './project',
        'helpers/errors', 'can.super'],
  function($, can, ExtendedControl, ProjectModel, ProjectControl, errors) {
    can.route.ready(false);

    return ExtendedControl({
      init: function($element, options) {
        this._super($element, options);
        var $projects = $('#projects');

        // create a ProjectControl for each project
        ProjectModel.findAll()
          .then(function(projects) {
            can.each(projects, function(project, index) {
              new ProjectControl($projects, { project: project });
            });

            can.route.ready(true);
          });
      },

      // to add a project
      '#add-project-form submit': function($element, event) {
        event.preventDefault();
        var $input = $('#project-title');

        var project = new ProjectModel({ title: $input.val() });
        project.save()
          .then(function(project) {
            new ProjectControl('#projects', { project: project });
            $input.val('');
          }, errors.tooltipHandler($input));
      }
    });
  });
