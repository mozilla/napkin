var redis = require('redis');
var db = redis.createClient();

exports.redisConnect = function(settings) {
  db.select(settings.set('napkin'), function(errDb, res) {
    console.log('TEST database connection status: ', res);
  });
  
  return db;
};
