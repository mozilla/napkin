define(['can', 'can.sort'], function(can) {
  var ProjectModel = can.Model({
    findAll: 'GET /projects',
    findOne: 'GET /projects/{id}',
    create: 'POST /projects',
    update: 'PUT /projects/{id}',
    destroy: 'DELETE /projects/{id}'
  }, {});

  ProjectModel.List = can.Model.List({
    // sort by project id for correct order
    comparator: 'id'
  });

  return ProjectModel;
});
