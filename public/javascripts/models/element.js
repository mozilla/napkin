define(['can', './extended'], function(can, ExtendedModel) {
  return ExtendedModel({
    findAll: 'GET /projects/{projectId}/screens/{screenId}/components/{componentId}/elements',
    findOne: 'GET /projects/{projectId}/screens/{screenId}/components/{componentId}/elements/{id}',
    create: 'POST /projects/{projectId}/screens/{screenId}/components/{componentId}/elements',
    update: 'PUT /projects/{projectId}/screens/{screenId}/components/{componentId}/elements/{id}',
    destroy: 'DELETE /projects/{projectId}/screens/{screenId}/components/{componentId}/elements/{id}'
  }, {});
});
