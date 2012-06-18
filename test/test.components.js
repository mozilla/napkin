var express = require('express');
var app = express.createServer();
var auth = require('../lib/authenticate');
var should = require('should');
var nconf = require('nconf');
var configurations = module.exports;
var settings = require('../settings')(app, configurations, express);

nconf.argv().env().file({ file: 'test/local-test.json' });

var redis = require('./db-test');
var db = redis.redisConnect(settings);

var screens = require('../lib/screens');
var projects = require('../lib/projects');
var components = require('../lib/components');

var projectReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    title: 'My Project'
  }
};

var screenReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    id: 1,
    title: 'My Screen',
    is_start: true,
    layout: 'col1'
  },
  params: {
    id: 1
  }
};

var componentReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    id: 1,
    project_id: 1,
    type: 'form',
    layout: 'row1',
    action: '/'
  },
  params: {
    id: 1
  }
};

describe('component', function() {
  after(function() {
    db.flushdb();
    console.log('cleared test database');
  });

  describe('GET /list', function() {
    it('returns a list of available components for the screen', function() {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        var req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          var req = componentReq;

          components.add(req, db, function(errComponent, component) {
            should.exist(component);
            component.type.should.equal(req.body.type);
            component.layout.should.equal(req.body.layout);
            component.action.should.equal(req.body.action);
          });
        });
      });
    });
  });

  describe('GET /component/:id', function() {
    it('returns a specific component', function() {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        var req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          var req = screenReq;

          components.add(req, db, function(errComponent, component) {
            var req = componentReq;

            components.get(req, db, 1, function(err, component) {
              should.exist(component);
              component.type.should.equal(req.body.type);
            });
          });
        });
      });
    });

    it('returns no component', function() {
      var req = componentReq;

      components.get(req, db, 12345, function(err, component) {
        should.not.exist(component);
      });
    });
  });

  describe('PUT /component/:id', function() {
    it('updates a specific component', function() {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        var req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          var req = componentReq;

          components.add(req, db, function(errComponent, component) {

            var req = {
              session: {
                email: 'test@test.org'
              },
              body: {
                id: 1,
                layout: 'row2',
                project_id: 1
              },
              params: {
                id: 1
              }
            };

            components.update(req, db, 1, function(err, component) {
              component.layout.should.equal(req.body.layout);
            });
          });
        });
      });
    });

    it('does not update specific component because email is not matching', function() {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        var req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          var req = componentReq;

          components.add(req, db, function(errComponent, component) {
            var req = {
              session: {
                email: 'test@test.org'
              },
              body: {
                id: 1,
                layout: 'row3',
                project_id: 1
              },
              params: {
                id: 1
              }
            };

            components.update(req, db, 1, function(err, component) {
              component.should.equal(false);
            });
          });
        });
      });
    });
  });

  describe('DELETE /component/:id', function() {
    it('does not delete a component because email is not matching', function() {
      var req = {
        session: {
          email: 'test2@test.org'
        },
        body: {
          id: 1,
          project_id: 1
        },
        params: {
          id: 1
        }
      };

      components.remove(req, db, 1, function(err, component) {
        should.exist(component);
      });
    });

    it('deletes a screen', function() {
      var req = {
        session: {
          email: 'test@test.org'
        },
        body: {
          id: 1,
          project_id: 1
        },
        params: {
          id: 1
        }
      };

      components.remove(req, db, 1, function(err, status) {
        components.get(req, db, 1, function(err, delComponent) {
          should.not.exist(delComponent);
        });
      });
    });
  });
});
