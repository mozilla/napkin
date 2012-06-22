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
  },
  params: {
    id: undefined
  }
};

describe('project', function() {
  after(function(done) {
    db.flushdb(done);
    console.log('cleared test projects database');
  });

  describe('GET /list', function() {
    it('returns a list of available projects for the user', function(done) {
      var req = projectReq;

      projects.add(req, db, function(err, project) {
        projects.list(req, db, function(errList, projectList) {
          projectList[0].title.should.equal(req.body.title);
          projectList[0].author.should.equal(req.session.email);
          done();
        });
      });
    });
  });

  describe('GET /project/:id', function() {
    it('returns a specific project', function(done) {
      var req = projectReq;

      projects.get(req, db, 1, function(err, foundProject) {
        foundProject.title.should.equal(req.body.title);
        foundProject.author.should.equal(req.session.email);
        done();
      });
    });
  });

  describe('PUT /project/:id', function() {
    it('updates a specific project', function(done) {
      var req = projectReq;
      req.body.title = 'My Project2';

      projects.update(req, db, 1, function(err, project) {
        project.title.should.equal('My Project2');
        done();
      });
    });
  });

  describe('DELETE /project/:id', function() {
    it('deletes a project', function(done) {
      var req = projectReq;

      projects.remove(req, db, 1, function(err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
