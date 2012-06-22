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

var elementReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    type: 'input_text',
    layout: 'row1',
    required: true,
    src: '',
    project_id: 1
  },
  params: {
    id: 1
  }
};

describe('element', function() {
  after(function(done) {
    db.flushdb(done);
    console.log('cleared test elements database');
  });

  describe('GET /list', function() {
    it('returns a list of available elements for the component', function(done) {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          req = componentReq;

          components.add(req, db, function(errComponent, component) {
            req = elementReq;

            elements.add(req, db, function(errElement, element) {
              elements.list(req, db, function(errList, elementList) {
                elementList[0].type.should.equal(req.body.type);
                elementList[0].layout.should.equal(req.body.layout);
                elementList[0].required.should.equal(req.body.required);
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('PUT /element/:id', function() {
    it('updates a specific element', function(done) {
      var req = elementReq;

      elements.add(req, db, function(errElement, element) {
        req.body.layout = 'row2';

        elements.update(req, db, 1, function(err, element) {
          element.layout.should.equal(req.body.layout);
          done();
        });
      });
    });
  });

  describe('DELETE /element/:id', function() {
    it('deletes an element', function(done) {
      var req = elementReq;

      elements.add(req, db, function(errElement, element) {
        elements.remove(req, db, 1, function(err, element) {
          element.should.equal(true);
          done();
        });
      });
    });
  });
});
