var express = require('express');
var configurations = module.exports;
var app = express.createServer();
var nconf = require('nconf');
var settings = require('./settings')(app, configurations, express);

nconf.argv().env().file({ file: 'local.json' });

// routes
require("./routes")(app);
require('./routes/auth')(app, nconf);

app.listen(process.env.PORT || nconf.get('port'));
