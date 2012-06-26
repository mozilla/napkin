/*globals exports:true*/
const ALLOWED_FIELDS = {
        title: undefined,
        identifier: undefined,
        required: undefined,
        layout: undefined,
        src: undefined
      };

var scaffold = require('./scaffold');

/* Get Default Element
 * Requires: web request
 * Returns: default element data
 */
function getDefaultElement(req) {
  return {
    type: req.body.type,
    title: req.body.title,
    layout: req.body.layout,
    required: req.body.required || false,
    src: req.body.src
  };
}

exports = module.exports = scaffold.generate(['projects', 'screens',
    'components'], [], 'elements', getDefaultElement, ALLOWED_FIELDS);
