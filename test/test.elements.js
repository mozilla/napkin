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

var elements = require('../lib/elements');
var projects = require('../lib/projects');
var screens = require('../lib/screens');
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
    id: 1,
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
    id: 1,
    project_id: 1,
    type: 'form',
    layout: 'row1',
    action: '/'
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
    id: 1,
    project_id: 1,
    type: 'input_text',
    layout: 'row1',
    required: true,
    src: ''
  },
  params: {
    id: 1
  }
};

describe('element', function() {
  before(function() {
    var req = projectReq;

    projects.add(req, db, function(err, project) {
      var req = screenReq;

      screens.add(req, db, function(errScreen, screen) {
        var req = componentReq;

        components.add(req, db, function(errComponent, component) {
          console.log('Added test component / screen / project');
        });
      });
    });
  });

  after(function() {
    db.flushdb();
    console.log('cleared test elements database');
  });

  describe('GET /list', function() {
    it('returns a list of available elements for the component', function() {
      var req = elementReq;

      elements.add(req, db, function(errElement, element) {
        elements.list(req, db, function(errList, elementList) {
          should.exist(elementList);
          elementList[0].type.should.equal(req.body.type);
          elementList[0].layout.should.equal(req.body.layout);
          elementList[0].required.should.equal(req.body.required);
        });
      });
    });
  });

  describe('PUT /element/:id', function() {
    it('updates a specific element', function() {
      var req = componentReq;

      components.add(req, db, function(errComponent, component) {
        var req = elementReq;

        elements.add(req, db, function(errElement, element) {
          var req = {
            session: {
              email: 'test@test.org'
            },
            body: {
              id: 1,
              layout: 'row2',
              project_id: 1
            },
            params: {
              id: 1
            }
          };

          elements.update(req, db, 1, function(err, element) {
            should.exist(element);
            element.layout.should.equal(req.body.layout);
          });
        });
      });
    });

    it('does not update specific component because email is not matching', function() {
      var req = {
        session: {
          email: 'test2@test.org'
        },
        body: {
          id: 1,
          layout: 'row2',
          project_id: 1
        },
        params: {
          id: 1
        }
      };

      elements.update(req, db, 1, function(err, element) {
        element.should.equal(false);
      });
    });
  });

  describe('DELETE /element/:id', function() {
    it('attempts to delete an element because email is not matching', function() {
      var req = elementReq;

      elements.add(req, db, function(errElement, element) {
        var req = {
          session: {
            email: 'test2@test.org'
          },
          body: {
            id: 1,
            project_id: 1
          },
          params: {
            id: 1
          }
        };

        elements.remove(req, db, 1, function(err, element) {
          element.should.equal(false);
        });
      });
    });

    it('deletes an element', function() {
      var req = {
        session: {
          email: 'test@test.org'
        },
        body: {
          id: 1,
          project_id: 1
        },
        params: {
          id: 1
        }
      };

      elements.remove(req, db, 1, function(err, element) {
        element.should.equal(true);
      });
    });
  });
});
