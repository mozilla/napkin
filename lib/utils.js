const ALPHANUM_MATCH = /[^a-z0-9]+/gi;

// Various utility functions

/* Generate a unique id
 * Requires: web request, redis incremented id
 * Returns: A unique id
 */
exports.generateUniqueId = function(name, id) {
  // As a last resort, if name is unavailable let's set it to a timestamp
  if (typeof name === 'undefined') {
    name = new Date().getTime().toString();
  }

  return name.toString().toLowerCase().replace(ALPHANUM_MATCH, '_') + id;
};

/* Generically map object to req.body
 * Requires: web request, current object, allowed fields
 * Returns: The updated object if it exists, else false
 */
exports.updateObject = function(req, currObject, allowedFields) {
  if (typeof currObject !== 'object') {
    currObject = JSON.parse(currObject);
  }

  if (currObject) {
    var setFields = function(currObject, from, allowedFields) {
      var props = Object.getOwnPropertyNames(from);
      var dest = currObject;

      props.forEach(function(name) {
        if (name in dest && name in allowedFields) {
          var destination = Object.getOwnPropertyDescriptor(from, name);

          if (destination) {
            Object.defineProperty(dest, name, destination);
          }
        }
      });

      return currObject;
    };

    return setFields(currObject, req.body, allowedFields);
  }

  return false;
};

/* No operation placeholder for empty callbacks */
exports.noop = function() {};
