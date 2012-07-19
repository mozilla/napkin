"use strict";
var express = require('express');
var configurations = module.exports;
var app = express.createServer();
var nconf = require('nconf');
var redis = require('redis');
var db = redis.createClient();
var settings = require('./settings')(app, configurations, express);

db.select(settings.set('napkin'), function(errDb, res) {
  console.log('PROD/DEV database connection status: ', res);
});

nconf.argv().env().file({ file: 'local.json' });

// routes
require('./routes')(app, nconf, db);
require('./routes/auth')(app, nconf, db);

app.listen(process.env.PORT || nconf.get('port'));
