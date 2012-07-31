define(['can'], function(can) {
  return can.Model({
    findAll: 'GET /projects',
    findOne: 'GET /projects/{id}',
    create: 'POST /projects',
    update: 'PUT /projects/{id}',
    destroy: 'DELETE /projects/{id}'
  }, {});
});
