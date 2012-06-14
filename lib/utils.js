const ALPHANUM_MATCH = /[^a-z0-9]+/gi;

// Various utility functions

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
