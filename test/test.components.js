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
    type: 'form',
    layout: 'row1',
    action: '/',
    project_id: 1
  },
  params: {
    id: 1
  }
};

describe('component', function() {
  after(function(done) {
    db.flushdb(done);
    console.log('cleared test components database');
  });

  describe('GET /list', function() {
    it('returns a list of available components for the screen', function(done) {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          req = componentReq;

          components.add(req, db, function(errComponent, component) {
            components.list(req, db, function(errList, componentList) {
              componentList[0].type.should.equal(req.body.type);
              componentList[0].layout.should.equal(req.body.layout);
              componentList[0].action.should.equal(req.body.action);
              done();
            });
          });
        });
      });
    });
  });

  describe('PUT /component/:id', function() {
    it('updates a component', function(done) {
      var req = componentReq;

      components.add(req, db, function(errComponent, component) {
        req.body.layout = 'row2';

        components.update(req, db, 1, function(err, component) {
          component.layout.should.equal(req.body.layout);
          done();
        });
      });
    });
  });

  describe('DELETE /component/:id', function() {
    it('attempts to delete a component', function(done) {
      var req = componentReq;
      
      components.add(req, db, function(errComponent, component) {
        components.remove(req, db, 1, function(err) {
          should.not.exist(err);
          done();
        });
      });
    });
  });
});
