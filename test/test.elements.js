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

var projects = require('../lib/projects');
var screens = require('../lib/screens');
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
    layout: 'row1',
    action: '/'
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
    name: 'email',
    nextId: null,
    required: true
  },
  params: {
    projectId: 1,
    screenId: 1,
    componentId: 1
  }
};

var otherElementReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    type: 'heading',
    head: true,
    nextId: 1,
    text: 'Email',
    level: 3
  },
  params: {
    projectId: 1,
    screenId: 1,
    componentId: 1
  }
};

describe('element', function() {
  before(function(done) {
    var req = projectReq;

    projects.add(req, db, function(err, project) {
      req = screenReq;
      screens.add(req, db, function(errScreen, screen) {
        req = componentReq;
        components.add(req, db, done);
      });
    });
  });

  after(function(done) {
    db.flushdb(done);
    console.log('cleared test elements database');
  });

  describe('POST /projects/:projectId/screens/:screenId/components/:componentId/elements',
    function() {
      it('adds a new element', function(done) {
        var req = elementReq;
        elements.add(req, db, function(err, element) {
          element.type.should.equal(req.body.type);
          element.name.should.equal(req.body.name);
          should.not.exist(element.head);
          should.not.exist(element.nextId);
          element.required.should.equal(req.body.required);
          done();
        });
      });

      it('accepts an empty callback', function(done) {
        var req = otherElementReq;
        elements.add(req, db, function(err) {
          elements.get(req, db, 2, function(err, element) {
            element.type.should.equal(req.body.type);
            element.head.should.equal(req.body.head);
            element.nextId.should.equal(req.body.nextId);
            element.text.should.equal(req.body.text);
            element.level.should.equal(req.body.level);
            done();
          });
        });
      });
    });

  describe('GET /projects/:projectId/screens/:screenId/components/:componentId/elements',
    function() {
      it('returns a list of available elements for the component', function(done) {
        var req = elementReq;

        elements.list(req, db, function(errList, elementList) {
          elementList[0].type.should.equal(req.body.type);
          elementList[0].name.should.equal(req.body.name);
          should.not.exist(elementList[0].head);
          should.not.exist(elementList[0].nextId);
          elementList[0].required.should.equal(req.body.required);

          req = otherElementReq;
          elementList[1].type.should.equal(req.body.type);
          elementList[1].head.should.equal(req.body.head);
          elementList[1].nextId.should.equal(req.body.nextId);
          elementList[1].text.should.equal(req.body.text);
          elementList[1].level.should.equal(req.body.level);
          done();
        });
      });
    });

  describe('GET /projects/:projectId/screens/:screenId/components/:componentId/elements/:id',
    function() {
      var req = elementReq;

      it('returns a specific element', function(done) {
        elements.get(req, db, 1, function(err, element) {
          element.type.should.equal(req.body.type);
          element.name.should.equal(req.body.name);
          should.not.exist(element.head);
          should.not.exist(element.nextId);
          element.required.should.equal(req.body.required);
          done();
        });
      });

      it('returns no element', function(done) {
        elements.get(req, db, 12345, function(err, element) {
          should.not.exist(element);
          done();
        });
      });
    });

  describe('PUT /projects/:projectId/screens/:screenId/components/:componentId/elements/:id',
    function() {
      var req = elementReq;

      it('updates a specific element', function(done) {
        req.body.nextId = 2;
        elements.update(req, db, 1, function(err, element) {
          element.nextId.should.equal(req.body.nextId);
          done();
        });
      });

      it('accepts an empty callback', function(done) {
        req.body.nextId = 3;
        elements.update(req, db, 1, function(err) {
          elements.get(req, db, 1, function(err, element) {
            element.nextId.should.equal(req.body.nextId);
            done();
          });
        });
      });
    });

  describe('DELETE /projects/:projectId/screens/:screenId/components/:componentId/elements/:id',
    function() {
      var req = elementReq;

      it('deletes an element', function(done) {
        elements.remove(req, db, 1, function(err) {
          should.not.exist(err);
          done();
        });
      });

      it('accepts an empty callback', function(done) {
        elements.remove(req, db, 2, function(err) {
          elements.list(req, db, function(error, elementList) {
            elementList.should.eql([]);
            done();
          });
        });
      });
    });
});
