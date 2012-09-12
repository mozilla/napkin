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

var projectReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    title: 'My Project'
  }
};

var otherProjectReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    title: 'My Other Project'
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

describe('project', function() {
  after(function(done) {
    db.flushdb(done);
    console.log('cleared test projects database');
  });

  describe('POST /projects', function() {
    it('adds a new project', function(done) {
      var req = projectReq;
      projects.add(req, db, function(err, project) {
        project.title.should.equal(req.body.title);
        project.author.should.equal(req.session.email);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      var req = otherProjectReq;
      projects.add(req, db, function(err) {
        projects.get(req, db, 2, function(err, project) {
          project.title.should.equal(req.body.title);
          project.author.should.equal(req.session.email);
          done();
        });
      });
    });
  });

  describe('GET /projects', function() {
    it('returns a list of projects', function(done) {
      var req = projectReq;

      projects.list(req, db, function(errList, projectList) {
        projectList[0].title.should.equal(req.body.title);
        projectList[0].author.should.equal(req.session.email);

        req = otherProjectReq;
        projectList[1].title.should.equal(req.body.title);
        projectList[1].author.should.equal(req.session.email);
        done();
      });
    });
  });

  describe('GET /projects/:id', function() {
    var req = projectReq;

    it('returns a specific project', function(done) {
      projects.get(req, db, 1, function(err, foundProject) {
        foundProject.title.should.equal(req.body.title);
        foundProject.author.should.equal(req.session.email);
        done();
      });
    });

    it('returns no project', function(done) {
      projects.get(req, db, 12345, function(err, project) {
        should.not.exist(project);
        done();
      });
    });
  });

  describe('PUT /projects/:id', function() {
    var req = projectReq;

    it('updates a specific project', function(done) {
      req.body.title = 'My Project2';
      projects.update(req, db, 1, function(err, project) {
        project.title.should.equal(req.body.title);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      req.body.title = 'My Project3';
      projects.update(req, db, 1);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        projects.get(req, db, 1, function(err, project) {
          project.title.should.equal(req.body.title);
          done();
        });
      }, 10);
    });
  });

  describe('DELETE /projects/:id', function() {
    var req = projectReq;

    it('deletes a project', function(done) {
      projects.remove(req, db, 1, function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      projects.remove(req, db, 2, function(err) {
        projects.list(req, db, function(err, projectList) {
          projectList.should.eql([]);
          done();
        });
      });
    });

    it('deletes a screen associated with a project', function(done) {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        req = screenReq;

        screens.add(req, db, function(err, screen) {
          req = projectReq;

          projects.remove(req, db, 3, function(err) {
            should.not.exist(err);
            screens.list(req, db, function(err, screenList) {
              screenList.should.eql([]);
              done();
            });
          });
        });
      });
    });
  });
});
