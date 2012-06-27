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

var otherElementReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    type: 'input_radio',
    layout: 'col1',
    required: true,
    src: ''
  },
  params: {
    project_id: 1,
    screen_id: 1,
    component_id: 1
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

  describe('POST /element', function() {
    it('adds a new element', function(done) {
      var req = elementReq;
      elements.add(req, db, function(err, element) {
        element.type.should.equal(req.body.type);
        element.layout.should.equal(req.body.layout);
        element.required.should.equal(req.body.required);
        element.src.should.equal(req.body.src);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      var req = otherElementReq;
      elements.add(req, db);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        elements.get(req, db, 2, function(err, element) {
          element.type.should.equal(req.body.type);
          element.layout.should.equal(req.body.layout);
          element.required.should.equal(req.body.required);
          element.src.should.equal(req.body.src);
          done();
        });
      }, 10);
    });
  });

  describe('GET /list', function() {
    it('returns a list of available elements for the component', function(done) {
      var req = elementReq;

      elements.list(req, db, function(errList, elementList) {
        elementList[0].type.should.equal(req.body.type);
        elementList[0].layout.should.equal(req.body.layout);
        elementList[0].required.should.equal(req.body.required);
        elementList[0].src.should.equal(req.body.src);

        req = otherElementReq;
        elementList[1].type.should.equal(req.body.type);
        elementList[1].layout.should.equal(req.body.layout);
        elementList[1].required.should.equal(req.body.required);
        elementList[1].src.should.equal(req.body.src);
        done();
      });
    });
  });

  describe('GET /element/:id', function() {
    var req = elementReq;

    it('returns a specific element', function(done) {
      elements.get(req, db, 1, function(err, element) {
        element.type.should.equal(req.body.type);
        element.layout.should.equal(req.body.layout);
        element.required.should.equal(req.body.required);
        element.src.should.equal(req.body.src);
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

  describe('PUT /element/:id', function() {
    var req = elementReq;

    it('updates a specific element', function(done) {
      req.body.layout = 'row2';
      elements.update(req, db, 1, function(err, element) {
        element.layout.should.equal(req.body.layout);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      req.body.layout = 'row3';
      elements.update(req, db, 1);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        elements.get(req, db, 1, function(err, element) {
          element.layout.should.equal(req.body.layout);
          done();
        });
      }, 10);
    });
  });

  describe('DELETE /element/:id', function() {
    var req = elementReq;

    it('deletes an element', function(done) {
      elements.remove(req, db, 1, function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      elements.remove(req, db, 2);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        elements.list(req, db, function(error, elementList) {
          elementList.should.eql([]);
          done();
        });
      }, 10);
    });
  });
});
