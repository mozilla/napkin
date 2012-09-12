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
    isStart: true,
    layout: 'col1'
  },
  params: {
    projectId: 1
  }
};

var otherScreenReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    title: 'My Other Screen',
    isStart: false,
    layout: 'col3'
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

describe('screen', function() {
  before(function(done) {
    var req = projectReq;
    projects.add(req, db, done);
  });

  after(function(done) {
    db.flushdb(done);
    console.log('cleared test screens database');
  });

  describe('POST /projects/:projectId/screens', function() {
    it('adds a new screen', function(done) {
      var req = screenReq;
      screens.add(req, db, function(err, screen) {
        screen.title.should.equal(req.body.title);
        screen.isStart.should.equal(req.body.isStart);
        screen.layout.should.equal(req.body.layout);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      var req = otherScreenReq;
      screens.add(req, db, function(err) {
        screens.get(req, db, 2, function(err, screen) {
          screen.title.should.equal(req.body.title);
          screen.isStart.should.equal(req.body.isStart);
          screen.layout.should.equal(req.body.layout);
          done();
        });
      });
    });
  });

  describe('GET /projects/:projectId/screens', function() {
    it('returns a list of screens', function(done) {
      var req = screenReq;

      screens.list(req, db, function(errList, screenList) {
        screenList[0].title.should.equal(req.body.title);
        screenList[0].isStart.should.equal(req.body.isStart);
        screenList[0].layout.should.equal(req.body.layout);

        req = otherScreenReq;
        screenList[1].title.should.equal(req.body.title);
        screenList[1].isStart.should.equal(req.body.isStart);
        screenList[1].layout.should.equal(req.body.layout);
        done();
      });
    });
  });

  describe('GET /projects/:projectId/screens/:id', function() {
    var req = screenReq;

    it('returns a specific screen', function(done) {
      screens.get(req, db, 1, function(err, screen) {
        screen.title.should.equal(req.body.title);
        done();
      });
    });

    it('returns no screen', function(done) {
      screens.get(req, db, 12345, function(err, screen) {
        should.not.exist(screen);
        done();
      });
    });
  });

  describe('PUT /projects/:projectId/screens/:id', function() {
    var req = screenReq;

    it('updates a specific screen', function(done) {
      req.body.title = 'My Screen2';
      screens.update(req, db, 1, function(err, screen) {
        screen.title.should.equal(req.body.title);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      req.body.title = 'My Screen3';
      screens.update(req, db, 1, function(err) {
        screens.get(req, db, 1, function(err, screen) {
          screen.title.should.equal(req.body.title);
          done();
        });
      });
    });
  });

  describe('DELETE /projects/:projectId/screens/:id', function() {
    var req = screenReq;

    it('deletes a screen', function(done) {
      screens.remove(req, db, 1, function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      screens.remove(req, db, 2, function(err) {
        screens.list(req, db, function(err, screenList) {
          screenList.should.eql([]);
          done();
        });
      });
    });

    it('deletes a component associated with a screen', function(done) {
      var req = screenReq;

      screens.add(req, db, function(err, screen) {
        req = componentReq;

        components.add(req, db, function(err, component) {
          req = screenReq;

          screens.remove(req, db, 3, function(err) {
            should.not.exist(err);
            components.list(req, db, function(err, componentList) {
              componentList.should.eql([]);
              done();
            });
          });
        });
      });
    });
  });
});
