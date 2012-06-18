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
  before(function() {
    var req = projectReq;

    projects.add(req, db, function(err, project) {
      var req = screenReq;

      screens.add(req, db, function(errScreen, screen) {
        console.log('Added screen / project');
      });
    });
  });

  after(function() {
    db.flushdb();
    console.log('cleared test components database');
  });

  describe('GET /list', function() {
    it('returns a list of available components for the screen', function() {
      var req = componentReq;

      components.add(req, db, function(errComponent, component) {
        components.list(req, db, function(errList, componentList) {
          should.exist(componentList);
          componentList[0].type.should.equal(req.body.type);
          componentList[0].layout.should.equal(req.body.layout);
          componentList[0].action.should.equal(req.body.action);
        });
      });
    });
  });

  describe('PUT /component/:id', function() {
    it('updates a specific component', function() {
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
            id: 2
          }
        };

        components.update(req, db, 1, function(err, component) {
          should.exist(component);
          component.layout.should.equal(req.body.layout);
        });
      });
    });

    it('does not update specific component because email is not matching', function() {
      var req = {
        session: {
          email: 'test2@test.org'
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

  describe('DELETE /component/:id', function() {
    it('does not delete a component because email is not matching', function() {
      var req = componentReq;

      components.add(req, db, function(errComponent, component) {
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
          component.should.equal(false);
        });
      });
    });

    it('deletes a component', function() {
      var req = componentReq;

      components.remove(req, db, 1, function(err, component) {
        component.should.equal(true);
      });
    });
  });
});
