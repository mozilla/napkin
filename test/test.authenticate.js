var auth = require('../lib/authenticate');
var should = require('should');
var nock = require('nock');
var nconf = require('nconf');

nconf.argv().env().file({ file: 'test/local-test.json' });

var authUrl = nconf.get('domain') + '/verify';
var siteUrl = nconf.get('domain') + ':' + nconf.get('port');
var qs = { assertion: '1a2b3c', audience: siteUrl };

describe('login', function() {
  describe('POST /verify', function() {
    it('logs the user in when they have good credentials', function() {
      var scope = nock(authUrl).post('', qs).reply(200, { status: 'okay', email: 'test@test.org' });

      var params = {
        body: { bid_assertion: qs.assertion }
      };

      var authResp = auth.verify(params, nconf, function(error, email) { });
      authResp.should.equal(true);
    });

    it('does not log the user in if they have bad credentials', function() {
      var scope = nock(authUrl).post('', qs).reply(500, { status: 'invalid' });

      var params = {
        body: { }
      };

      var authResp = auth.verify(params, nconf, function(error, email) { });
      authResp.should.equal(false);
    });
  });
});
