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

describe('project', function() {
  after(function() {
    db.flushdb();
    console.log('cleared test database');
  });

  describe('GET /list', function() {
    it('returns a list of available projects for the user', function() {
      var req = {
        session: {
          email: 'test@test.org'
        },
        body: {
          title: 'My Project'
        }
      };

      projects.add(req, db, function(err, project) {
        projects.list(req, db, function(err, projectList) {
          projectList.length.should.equal(1);
          projectList[0].title.should.equal(req.body.title);
          projectList[0].author.should.equal(req.session.email);
        });
      });
    });
  });

  describe('GET /project/:id', function() {
    it('returns a specific project', function() {
      var req = {
        session: {
          email: 'test@test.org'
        },
        body: {
          title: 'My Project'
        }
      };

      projects.get(req, db, 1, function(err, foundProject) {
        should.exist(foundProject);
        foundProject.title.should.equal(req.body.title);
        foundProject.author.should.equal(req.session.email);
      });
    });

    it('returns no project', function() {
      var req = {
        session: {
          email: 'test@test.org'
        }
      };

      projects.get(req, db, 12345, function(err, foundProject) {
        should.not.exist(foundProject);
      });
    });
  });

  describe('PUT /project/:id', function() {
    it('updates a specific project', function() {
      var req = {
        session: {
          email: 'test@test.org'
        },
        body: {
          title: 'My Project2'
        }
      };

      projects.update(req, db, 1, function(err, project) {
        project.title.should.equal(req.body.title);
      });
    });

    it('does not update specific project because email is not matching', function() {
      var req = {
        session: {
          email: 'test2@test.org'
        },
        body: {
          title: 'My Project3'
        }
      };

      projects.update(req, db, 1, function(err, project) {
        project.should.equal(false);
      });
    });
  });

  describe('DELETE /project/:id', function() {
    it('does not delete a project because email is not matching', function() {
      var req = {
        session: {
          email: 'test2@test.org'
        }
      };

      projects.remove(req, db, 1, function(err, project) {
        should.exist(project);
      });
    });

    it('deletes a project', function() {
      var req = {
        session: {
          email: 'test@test.org'
        }
      };

      projects.remove(req, db, 1, function(err, status) {
        projects.get(req, db, 1, function(err, delProject) {
          should.not.exist(delProject);
        });
      });
    });

    // TODO: when screen implementation is added
    it('verifies all child screens are also deleted', function() {

    });
  });
});
