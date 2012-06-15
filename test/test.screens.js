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

describe('screen', function() {
  after(function() {
    db.flushdb();
    console.log('cleared test database');
  });

  describe('GET /list', function() {
    it('returns a list of available screens for the project', function() {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        var req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          should.exist(screen);
          screen.title.should.equal(req.body.title);
          screen.is_start.should.equal(req.body.is_start);
          screen.layout.should.equal(req.body.layout);
        });
      });
    });
  });

  describe('GET /screen/:id', function() {
    it('returns a specific screen', function() {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        var req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          var req = screenReq;

          screens.get(req, db, 1, function(err, screen) {
            should.exist(screen);
            screen.title.should.equal(req.body.title);
          });
        });
      });
    });

    it('returns no screen', function() {
      var req = screenReq;

      screens.get(req, db, 12345, function(err, screen) {
        should.not.exist(screen);
      });
    });
  });

  describe('PUT /screen/:id', function() {
    it('updates a specific screen', function() {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        var req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          var req = {
            session: {
              email: 'test@test.org'
            },
            body: {
              id: 1,
              title: 'My Screen2'
            },
            params: {
              id: 1
            }
          };

          screens.update(req, db, 1, function(err, screen) {
            screen.title.should.equal(req.body.title);
          });
        });
      });
    });

    it('does not update specific screen because email is not matching', function() {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        var req = screenReq;

        screens.add(req, db, function(errScreen, screen) {
          var req = {
            session: {
              email: 'test@test.org'
            },
            body: {
              id: 1,
              title: 'My Screen2'
            },
            params: {
              id: 1
            }
          };

          screens.update(req, db, 1, function(err, screen) {
            screen.should.equal(false);
          });
        });
      });
    });
  });

  describe('DELETE /screen/:id', function() {
    it('does not delete a screen because email is not matching', function() {
      var req = {
        session: {
          email: 'test2@test.org'
        },
        body: {
          id: 1
        }
      };

      screens.remove(req, db, 1, function(err, screen) {
        should.exist(screen);
      });
    });

    it('deletes a screen', function() {
      var req = {
        session: {
          email: 'test@test.org'
        },
        body: {
          id: 1
        }
      };

      screens.remove(req, db, 1, function(err, status) {
        screens.get(req, db, 1, function(err, delScreen) {
          should.not.exist(delScreen);
        });
      });
    });
  });
});
