define(['can'], function(can) {
  return can.Model({
    findAll: 'GET /projects/{projectId}/screens',
    findOne: 'GET /projects/{projectId}/screens/{id}',
    create: 'POST /projects/{projectId}/screens',
    update: 'PUT /projects/{projectId}/screens/{id}',
    destroy: 'DELETE /projects/{projectId}/screens/{id}'
  }, {});
});
