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
var elements = require('../lib/elements');

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
    isStart: true,
    layout: 'col1'
  },
  params: {
    projectId: 1
  }
};

var componentReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    type: 'form',
    row: 1,
    col: 0,
    action: '/'
  },
  params: {
    projectId: 1,
    screenId: 1
  }
};

var otherComponentReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    type: 'authentication',
    row: 1,
    col: 1,
    action: '/auth'
  },
  params: {
    projectId: 1,
    screenId: 1
  }
};

var elementReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    type: 'input_text',
    order: 1,
    required: true,
    src: ''
  },
  params: {
    projectId: 1,
    screenId: 1,
    componentId: 1
  }
};

describe('component', function() {
  before(function(done) {
    var req = projectReq;
    projects.add(req, db, function(err, project) {
        req = screenReq;
        screens.add(req, db, done);
    });
  });

  after(function(done) {
    db.flushdb(done);
    console.log('cleared test components database');
  });

  describe('POST /projects/:projectId/screens/:screenId/components',
    function() {
      it('adds a new component', function(done) {
        var req = componentReq;

        components.add(req, db, function(err, component) {
          component.type.should.equal(req.body.type);
          component.row.should.eql(req.body.row);
          component.col.should.eql(req.body.col);
          component.action.should.equal(req.body.action);
          done();
        });
      });

      it('accepts an empty callback', function(done) {
        var req = otherComponentReq;
        components.add(req, db, function(err) {
          components.get(req, db, 2, function(err, component) {
            component.type.should.equal(req.body.type);
            component.row.should.eql(req.body.row);
            component.col.should.eql(req.body.col);
            component.action.should.equal(req.body.action);
            done();
          });
        });
      });
    });

  describe('GET /projects/:projectId/screens/:screenId/components',
    function() {
      it('returns a list of available components for the screen', function(done) {
        var req = componentReq;

        components.list(req, db, function(errList, componentList) {
          componentList[0].type.should.equal(req.body.type);
          componentList[0].row.should.eql(req.body.row);
          componentList[0].col.should.eql(req.body.col);
          componentList[0].action.should.equal(req.body.action);

          req = otherComponentReq;
          componentList[1].type.should.equal(req.body.type);
          componentList[1].row.should.eql(req.body.row);
          componentList[1].col.should.eql(req.body.col);
          componentList[1].action.should.equal(req.body.action);
          done();
        });
      });
    });

  describe('GET /projects/:projectId/screens/:screenId/components/:id',
    function() {
      var req = componentReq;

      it('returns a specific component', function(done) {
        components.get(req, db, 1, function(err, component) {
          component.type.should.equal(req.body.type);
          component.row.should.eql(req.body.row);
          component.col.should.eql(req.body.col);
          component.action.should.equal(req.body.action);
          done();
        });
      });

      it('returns no component', function(done) {
        components.get(req, db, 12345, function(err, component) {
          should.not.exist(component);
          done();
        });
      });
    });

  describe('PUT /projects/:projectId/screens/:screenId/components/:id',
    function() {
      var req = componentReq;

      it('updates a component', function(done) {
        req.body.row = 2;
        components.update(req, db, 1, function(err, component) {
          component.row.should.eql(req.body.row);
          done();
        });
      });

      it('accepts an empty callback', function(done) {
        req.body.col = 4;
        components.update(req, db, 1, function(err) {
          components.get(req, db, 1, function(err, component) {
            component.col.should.eql(req.body.col);
            done();
          });
        });
      });
    });

  describe('DELETE /projects/:projectId/screens/:screenId/components/:id',
    function() {
      var req = componentReq;

      it('attempts to delete a component', function(done) {
        components.remove(req, db, 1, function(err) {
          should.not.exist(err);
          done();
        });
      });

      it('accepts an empty callback', function(done) {
        components.remove(req, db, 2, function(err) {
          components.list(req, db, function(error, componentList) {
            componentList.should.eql([]);
            done();
          });
        });
      });

      it('deletes an element associated with a component', function(done) {
        var req = componentReq;

        components.add(req, db, function(err, component) {
          req = elementReq;

          elements.add(req, db, function(err, element) {
            req = componentReq;

            components.remove(req, db, 3, function(err) {
              should.not.exist(err);
              elements.list(req, db, function(err, elementList) {
                elementList.should.eql([]);
                done();
              });
            });
          });
        });
      });
    });
});
