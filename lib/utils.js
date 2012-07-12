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

/* Generically map curObject to req.body. If a property exists in curObject,
 *  req.body, and allowedFields, curObject's value is updated to equal
 *  req.body's value. If a property exists in req.body and allowedFields, but
 *  not in curObject, it is added to curObject with req.body's value.
 *
 * Requires: web request, current object, allowed fields
 * Returns: The updated object if it exists, else false
 */
exports.updateObject = function(req, curObject, allowedFields) {
  if (typeof curObject !== 'object') {
    curObject = JSON.parse(curObject);
  }

  if (curObject) {
    var setFields = function(curObject, from, allowedFields) {
      var props = Object.getOwnPropertyNames(from);
      var dest = curObject;

      props.forEach(function(name) {
        if (name in allowedFields) {
          var destination = Object.getOwnPropertyDescriptor(from, name);

          if (destination) {
            Object.defineProperty(dest, name, destination);
          }
        }
      });

      return curObject;
    };

    return setFields(curObject, req.body, allowedFields);
  }

  return false;
};

/* No operation placeholder for empty callbacks */
exports.noop = function() {};
