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
    is_start: true,
    layout: 'col1'
  },
  params: {
    project_id: 1
  }
};

var componentReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    type: 'form',
    layout: 'row1',
    action: '/'
  },
  params: {
    project_id: 1,
    screen_id: 1
  }
};

var elementReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    type: 'input_text',
    layout: 'row1',
    required: true,
    src: ''
  },
  params: {
    project_id: 1,
    screen_id: 1,
    component_id: 1
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

  describe('POST /component', function() {
    var req = componentReq;

    it('adds a new component', function(done) {
      components.add(req, db, function(err, component) {
        component.type.should.equal(req.body.type);
        component.layout.should.equal(req.body.layout);
        component.action.should.equal(req.body.action);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      components.add(req, db);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        components.get(req, db, 2, function(err, component) {
          component.type.should.equal(req.body.type);
          component.layout.should.equal(req.body.layout);
          component.action.should.equal(req.body.action);
          done();
        });
      }, 10);
    });
  });

  describe('GET /list', function() {
    it('returns a list of available components for the screen', function(done) {
      var req = componentReq;

      components.list(req, db, function(errList, componentList) {
        componentList[0].type.should.equal(req.body.type);
        componentList[0].layout.should.equal(req.body.layout);
        componentList[0].action.should.equal(req.body.action);
        componentList[1].type.should.equal(req.body.type);
        componentList[1].layout.should.equal(req.body.layout);
        componentList[1].action.should.equal(req.body.action);
        done();
      });
    });
  });

  describe('GET /component/:id', function() {
    var req = componentReq;

    it('returns a specific component', function(done) {
      components.get(req, db, 1, function(err, component) {
        component.type.should.equal(req.body.type);
        component.layout.should.equal(req.body.layout);
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

  describe('PUT /component/:id', function() {
    var req = componentReq;

    it('updates a component', function(done) {
      req.body.layout = 'row2';
      components.update(req, db, 1, function(err, component) {
        component.layout.should.equal(req.body.layout);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      req.body.layout = 'row3';
      components.update(req, db, 1);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        components.get(req, db, 1, function(err, component) {
          component.layout.should.equal(req.body.layout);
          done();
        });
      }, 10);
    });
  });

  describe('DELETE /component/:id', function() {
    var req = componentReq;

    it('attempts to delete a component', function(done) {
      components.remove(req, db, 1, function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      components.remove(req, db, 2);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        components.list(req, db, function(error, componentList) {
          componentList.should.eql([]);
          done();
        });
      }, 10);
    });

    it('deletes an element associated with a component', function(done) {
      var req = componentReq;

      components.add(req, db, function(err, component) {
        req = elementReq;

        elements.add(req, db, function(err, element) {
          req = componentReq;

          components.remove(req, db, 1, function(err) {
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
