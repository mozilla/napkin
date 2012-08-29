define(['can', './extended'], function(can, ExtendedModel) {
  var ScreenModel = ExtendedModel({
    findAll: 'GET /projects/{projectId}/screens',
    findOne: 'GET /projects/{projectId}/screens/{id}',
    create: 'POST /projects/{projectId}/screens',
    update: 'PUT /projects/{projectId}/screens/{id}',
    destroy: 'DELETE /projects/{projectId}/screens/{id}',
  }, {});

  ScreenModel.List = can.Model.List({
    // sort by screen id for correct order
    comparator: 'id'
  });

  return ScreenModel;
});
