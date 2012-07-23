/*globals exports:true*/

/* Gets user id. If one doesn't exist, adds an id for this user.
 * Requires: email
 * Calls: callback(error, id):
 *  error - null if the id was retrieved or an error otherwise
 *  id - if error is null, the id of the user
 */
exports.getId = function(db, email, callback) {
  db.get('user:id:' + email, function(err, id) {
    if (err) {
      callback(err);
    } else if (!id) {
      addUserId(db, email, callback);
    } else {
      callback(null, id);
    }
  });
};

/* Gets user email.
 * Requires: user id
 * Calls: callback(error, id):
 *  error - null if the id was retrieved or an error otherwise
 *  id - if error is null, the id of the user
 */
exports.getEmail = function(db, id, callback) {
  db.get('user:email:' + id, function(err, email) {
    if (err) {
      callback(err);
    } else {
      callback(null, email);
    }
  });
};

/* Adds user id.
 * Requires: email
 * Calls: callback(error, id):
 *  error - null if the id was added or an error otherwise
 *  id - if error is null, the id of the user
 */
function addUserId(db, email, callback) {
  db.incr('user:id:id', function(err, id) {
    if (err) {
      callback(err);
    } else {
      // redis values must be strings
      id = String(id);

      // user:id:[userEmail] => [userId]
      db.set('user:id:' + email, id, function(err, status) {
        if (err) {
          callback(err);
        } else {
          // user:email:[userId] => [userEmail]
          db.set('user:email:' + id, email, function(err, status) {
            if (err) {
              callback(err);
            } else {
              callback(null, id);
            }
          });
        }
      });
    }
  });
}
