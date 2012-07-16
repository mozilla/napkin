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

  // image/video fields
  src: undefined,

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
    src: req.body.src,
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
  var level = body.level;

  // TODO: validation for every field
  if (typeof type !== 'string' || type.length === 0) {
    return 'Component must have a type.';
  }

  if (level && typeof level === 'string') {
    req.body.level = level = parseInt(level, 10);
  }

  if (level && (typeof level !== 'number' || level < 1 || level > 6)) {
    return 'Level must be an integer';
  }

  return true;
}

exports = module.exports = scaffold.generate(['projects', 'screens',
  'components'], [], 'elements', getDefaultElement, ALLOWED_FIELDS,
  validateElement);
