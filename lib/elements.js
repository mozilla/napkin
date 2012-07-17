/*globals exports:true*/
const ALLOWED_FIELDS = {
  // positioning fields
  // > whether this is the head element in the linked list
  head: undefined,

  // > id of next element to form a linked list
  nextId: undefined,

  // input fields
  name: undefined,
  required: undefined,

  // heading/paragraph fields
  text: undefined,

  // heading level (1-6)
  level: undefined
};

var scaffold = require('./scaffold');

/* Get default element
 * Requires: web request
 * Returns: default element data
 */
function getDefaultElement(req) {
  return {
    type: req.body.type,
    head: req.body.head,
    nextId: req.body.nextId,
    name: req.body.name,
    required: req.body.required || false,
    text: req.body.text,
    level: req.body.level
  };
}

/* Validate element
 * Requires:
 *  req - web request,
 *  beingCreated - true if this element is being created for the first time
 *    and false otherwise
 * Returns: true if the request is valid to create/update a element or an
 *  error message otherwise
 */
function validateElement(req, beingCreated) {
  var body = req.body;
  var type = body.type;
  var nextId = body.nextId;
  var name = body.name;
  var required = body.required;
  var text = body.text;
  var level = body.level;

  // TODO: refactor these out to validation helpers
  // TODO: Should these be on both the client and server side? If so, how
  // should they be kept in sync?
  if (typeof type !== 'string') {
    return 'Element must have a type.';
  } else if (type.length < 1 || type.length > 20) {
    return "Element must have a type between 1 and 20 characters long.";
  } else if (nextId && typeof nextId !== 'number') {
    return "Element's nextId must be an integer.";
  } else if (required && typeof required !== 'boolean') {
    return "Element's required attribute must be a boolean.";
  }
  
  if (name !== undefined) {
    if (typeof name !== 'string') {
      return "Element's name must be a string.";
    } else if (name.length < 1 || name.length > 50) {
      return "Element's name must be between 1 and 50 characters long.";
    }
  }
  
  if (text !== undefined) {
    if (typeof text !== 'string') {
      return "Element's text must be a string.";
    } else if (text.length < 1 || text.length > 500) {
      return "Element's text must be between 1 and 500 characters long.";
    }
  }
  
  if (level !== undefined) {
    if (typeof level === 'string') {
      req.body.level = level = parseInt(level, 10);
    }

    if (typeof level !== 'number') {
      return "Element's level must be a number.";
    } else if (level < 1 || level > 6) {
      return "Element's level must be between 1 and 6.";
    }
  }

  return true;
}

exports = module.exports = scaffold.generate(['projects', 'screens',
  'components'], [], 'elements', getDefaultElement, ALLOWED_FIELDS,
  validateElement);
