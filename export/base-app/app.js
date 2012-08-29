"use strict";
var express = require('express');
var app = express();

var nconf = require('nconf');
nconf.argv().env().file({ file: 'local.json' });

require('./settings')(app, express, nconf);
require('./routes')(app, nconf);

app.listen(process.env.PORT || nconf.get('port'));
