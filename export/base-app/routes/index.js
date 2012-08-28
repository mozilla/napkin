// persona-powered authentication
var auth = require('../lib/auth');

/**
 * Creates the routes for the given express application.
 *
 * @param app - the express application
 * @param nconf - the configuration settings
 */
module.exports = function(app, nconf) {
  {{#screenList}}
  app.get('/{{titleSlug}}', function(request, response) {
    {{#if secure}}
    if (request.session.email) {
      response.render('{{titleSlug}}', {
        session: request.session
      });
    } else {
      response.render('auth-required', {
        session: request.session
      });
    }
    {{else}}
    response.render('{{titleSlug}}', {
      session: request.session
    });
    {{/if}}
  });
  {{/screenList}}

  app.get('/', function(request, response) {
    response.render('index', {
      domain: nconf.get('domain'),
      port: nconf.get('port')
    });
  });

  // Log in route
  app.post('/log-in', function(request, response) {
    auth.verify(request, nconf, function(error, email) {
      if (error) {
        throw error;
      }

      if (email) {
        // store the e-mail in the client session
        request.session.email = email;
        response.redirect(303, getRedirect(request));
      } else {
        throw new Error('Auth failed to return e-mail.');
      }
    });
  });

  // Log out route
  app.get('/log-out', function(request, response) {
    if (request.session) {
      request.session.reset();
    }

    response.redirect(303, getRedirect(request));
  });

  /**
   * Finds which URL to redirect to given a request.
   */
  function getRedirect(request) {
    var redirect = request.query.redirect;
    redirect = redirect || request.headers.referer;
    return redirect || '/'; // default to home page
  }
};
