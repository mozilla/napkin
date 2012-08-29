define(['can', './extended'], function(can, ExtendedModel) {
  return ExtendedModel({
    findAll: 'GET /projects/{projectId}/screens/{screenId}/components',
    findOne: 'GET /projects/{projectId}/screens/{screenId}/components/{id}',
    create: 'POST /projects/{projectId}/screens/{screenId}/components',
    update: 'PUT /projects/{projectId}/screens/{screenId}/components/{id}',
    destroy: 'DELETE /projects/{projectId}/screens/{screenId}/components/{id}'
  }, {});
});
