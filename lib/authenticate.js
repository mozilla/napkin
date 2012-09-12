var request = require('request');

/* Persona authentication
 * Requires: web request, nconf
 * Returns: A Persona email if successful
 */
exports.verify = function(req, nconf, callback) {
  var authUrl = nconf.get('authUrl') + '/verify';
  var siteUrl = nconf.get('domain') + ':' + nconf.get('authPort');

  if (!req.body.assertion) {
    callback(new Error('Persona assertion not found.'));
    return;
  }

  var qs = {
    assertion: req.body.assertion,
    audience: siteUrl
  };

  var params = {
    url: authUrl,
    form: qs
  };

  request.post(params, function(err, resp, body) {
    var email = false;

    if (err) {
      callback(err);
      return;
    }

    try {
      var jsonResp = JSON.parse(body);
      if (jsonResp.status === 'okay') {
        email = jsonResp.email;
      } else {
        // Response status is 'not okay'
        callback(jsonResp);
        return;
      }
    } catch (err) {
      callback(err);
      return;
    }

    callback(null, email);
  });
};
