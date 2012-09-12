/*globals exports:true*/
var exec = require('child_process').exec;
var rimraf = require('rimraf');

var ncp = require('ncp').ncp;
var handlebars = require('handlebars');

var screens = require('../lib/screens');
var components = require('../lib/components');
var elements = require('../lib/elements');

var fs = require('fs');
var ejs = require('ejs');
var templateDir = __dirname + '/templates';

// turns a string into lowercase
// usage: {{lowercase str}}
handlebars.registerHelper('lowercase', function(str, context) {
  return str.toLowerCase();
});

// map of template file path to corresponding context function
// context functions are of the form:
// ---
// Generates the context for a given template
// Requires: project, web request, db connection, callback
// Calls callback(data):
//  data - the data to be passed to the template
var templateContextMap = {
  'routes/index.js': function(project, req, db, callback) {
    // routes need list of screens
    callback({ screenList: req.screenList });
  },

  'views/layout.jade': function(project, req, db, callback) {
    // layout needs project
    callback({ project: project });
  }
};

/* Exports the given project to a zip file.
 * Requires: project, web request, db connection, callback
 * Calls: callback(error, fileName):
 *  error - null if the project was exported or an error otherwise
 *  fileName - the name of the zip file that was exported
 */
module.exports = exports = function(project, req, db, callback) {
  var projectName = req.session.email + '-' + project.id;
  var projectDir = __dirname + '/' + projectName;
  req.body.projectId = project.id;

  /* Zips up this project directory and calls the given callback */
  function zipProjectAndFinish() {
    // zip up project directory to deliver to the user
    exec('cd ' + __dirname + ';' + ' zip -r ' + projectName + '.zip ' +
         projectName, function(err, stdout, stderr) {
      if (err) {
        throw err;
      }

      // remove project directory
      rimraf(projectDir, function(err) {
        // ignore error; it's not a big deal if the project dir
        // doesn't get deleted fully
        callback(projectDir + '.zip');
      });
    });
  }

  // copy to a custom project directory
  ncp(__dirname + '/base-app', projectDir, function(err) {
    if (err) {
      throw err;
    }

    screens.list(req, db, function(err, screenList) {
      if (err) {
        throw err;
      }

      // translate screen list to a map of id => screen
      var screensById = {};
      screenList.forEach(function(screen) {
        screensById[screen.id] = screen;
      });

      // store in request for easy access
      req.screenList = screenList;
      req.screensById = screensById;

      screenList.forEach(function(screen) {
        // TODO: add screen title validation that ensures a valid file name
        // make title slug that works for URLs and file names
        var titleSlug = screen.title;
        titleSlug = titleSlug.replace(/ /g, '-');
        titleSlug = titleSlug.toLowerCase();
        screen.titleSlug = titleSlug;
      });

      // go through each template and build it
      Object.keys(templateContextMap).forEach(function(templatePath) {
        var filePath = projectDir + '/' + templatePath;

        fs.readFile(filePath, 'utf8', function(err, contents) {
          if (err) {
            throw err;
          }

          templateContextMap[templatePath](project, req, db, function(data) {
            var template = handlebars.compile(contents);
            var newContents = template(data);

            fs.writeFile(filePath, newContents, function(err) {
              if (err) {
                throw err;
              }
            });
          });
        });
      });

      var screensDone = 0;
      // make templates for each screen
      screenList.forEach(function(screen) {
        renderScreen(screen, req, db, function(output) {
          // add extends/block header
          output = 'block content\n' + indent(output, '  ');
          output = 'extends layout\n\n' + output;

          fs.writeFile(projectDir + '/views/' + screen.titleSlug + '.jade',
            output, function(err) {
              if (err) {
                throw err;
              }

              screensDone++;
              if (screensDone === screenList.length) {
                zipProjectAndFinish();
              }
            });
        });
      });

      if (screenList.length === 0) {
        zipProjectAndFinish();
      }
    });
  });
};

/* Renders the given screen.
 * Requires: screen, web request, db, callback
 * Calls: callback(output):
 *  output - the output Jade for the screen
 */
function renderScreen(screen, req, db, callback) {
  var output = '';
  var layout = screen.layout;

  var reqData = {
    screenList: req.screenList,
    screensById: req.screensById,
    session: {
      email: req.session.email
    },
    params: {
      projectId: req.body.projectId,
      screenId: screen.id
    }
  };

  components.list(reqData, db, function(err, componentList) {
    if (err) {
      throw err;
    }

    componentList.sort(function(componentA, componentB) {
      var rowDiff = componentA.row - componentB.row;

      // sort by rows and then columns
      if (rowDiff !== 0) {
        return rowDiff;
      } else {
        return componentA.col - componentB.col;
      }
    });

    if (componentList.length > 0) {
      var componentsDone = 0;
      var componentsByLocation = {};

      componentList.forEach(function(component) {
        // keep track of components by location for easy screen construction
        // later on
        if (!componentsByLocation[component.row]) {
          componentsByLocation[component.row] = {};
        }
        componentsByLocation[component.row][component.col] = component;

        renderComponent(component, reqData, db, function(componentOutput) {
            component.jade = componentOutput;
            componentsDone++;

            if (componentsDone === componentList.length) {
              // all components are finished; construct screen
              layout.forEach(function(cols, row) {
                output += '.row\n';

                cols.forEach(function(length, col) {
                  var component;
                  var column = '';

                  if (componentsByLocation[row]) {
                    component = componentsByLocation[row][col];
                  }

                  // construct column
                  column = '.span' + length + '\n';
                  if (component) {
                    column += indent(component.jade.trim(), '  ');
                    output += '\n';
                  }

                  // add to output with one level of indentation under the row
                  output += indent(column, '  ');
                  output += '\n\n';
                });
              });

              callback(output);
            }
          });
      });
    } else {
      callback('');
    }
  });
}

/* Renders the given component.
 * Requires: component, web request, db, callback
 * Calls: callback(output):
 *  output - the output Jade for the component
 */
function renderComponent(component, req, db, callback) {
  var result = '';
  var reqData = {
    session: {
      email: req.session.email
    },
    params: {
      projectId: req.params.projectId,
      screenId: req.params.screenId,
      componentId: component.id
    }
  };

  elements.list(reqData, db, function(err, elementList) {
    var headElement;
    var elementsById = {};

    elementList.forEach(function(element) {
      elementsById[element.id] = element;

      if (element.head) {
        headElement = element;
      }
    });

    if (headElement) {
      var elementsProcessed = 0;
      var elementsDone = 0;

      var curElement = headElement;
      while (curElement) {
        elementsProcessed++;

        (function(element) {
          // process each element's template
          fs.readFile(__dirname + '/../views/templates/elements/' + element.type + '.jade',
            'utf8', function(err, template) {
              if (err) {
                throw err;
              }

              element.jade = renderElementTemplate(template, element, component,
                req.screensById);

              // when done, amalgamate the results together
              elementsDone++;
              if (elementsDone === elementsProcessed) {
                while (headElement) {
                  result += headElement.jade.trim() + '\n';
                  headElement = elementsById[headElement.nextId];
                }

                // add the component wrapper if it exists
                wrapComponent(result, component, req.screensById, function(component) {
                  callback(component);
                });
              }
            });
        })(curElement);

        // proceed through the linked list
        var nextElement = elementsById[curElement.nextId];
        curElement = nextElement;
      }
    } else {
      callback('');
    }
  });
}

/* Given a template and an associated element, render the element's contents
 * Requires: template string, element, component, screens by id
 * Returns: the rendered element's Jade
 */
function renderElementTemplate(template, element, component, screensById) {
  var newlineIndex = template.indexOf('\n');
  var scriptTag = template.substring(0, newlineIndex);

  // get rid of first line, as this contains a script tag
  template = template.substring(newlineIndex + 1);
  var startMatch = /(\s*)if sharing\n/.exec(template);

  if (startMatch !== null) {
    var startIndex = startMatch.index + startMatch[0].length;
    var whitespace = startMatch[1];

    // same amount of whitespace precedes 'else'
    var endMatch = new RegExp('^' + whitespace + 'else', 'm').exec(template);

    // only get text in the `if sharing` clause
    template = template.substring(startIndex, endMatch.index);
  }

  // strip out trailing whitespace for dedent to work properly
  template = template.replace(/\s+$/, '');

  // if the template requires a wrapping tag, add it in
  var tagNameMatch = /data-tag='([^']+)'/.exec(scriptTag);
  if (tagNameMatch !== null) {
    var tag = tagNameMatch[1];
    template = indent(dedent(template), '  ');
    template = tag + '\n' + template;
  }

  if (component.type === 'form') {
    // generate an id for this element
    var elementId = element.name;
    elementId = elementId.replace(/ /g, '_');

    if (/[0-9\-]/.test(elementId[0])) {
      elementId = '_' + elementId;
    }
    element.elementId = elementId;
  }

  // element attributes should be passed to the ejs template
  return renderEjsTemplate(template, element, screensById);
}

/* Renders an EJS template, fixing links, classes, and partials in the process.
 * Requires: template, template attributes, screens by id
 * Returns: rendered template
 */
function renderEjsTemplate(template, attributes, screensById) {
  template = dedent(template);

  // no need for share element classes
  template = template.replace(/\.share-element/g, '');

  // fix logged in check
  template = template.replace(/if session\.auth && session\.auth\[projectId\]/g, 'if session.email');

  // replace partials
  template = template.replace(/^(\s*)!=\s*partial\('([^']*)'\)/gm,
    function(match, whitespace, path) {
      // must do sync read file because replace requires direct return value
      var partial = fs.readFileSync(__dirname + '/../views/' + path + '.jade', 'utf8');
      return indent(partial, whitespace);
    });

  // mimic CanJS's attr method
  attributes.attr = function(attr) {
    return this[attr];
  };

  // template needs to be rendered via ejs with the given attributes
  template = ejs.render(template, attributes);

  // adjust links
  template = template.replace(
    /\/share\/#\{userId\}\/project\/#\{projectId\}\/screen\/#\{screenId\}/g, '');
  template = template.replace(
    /\/share\/#\{session.sharedId\}\/project\/#\{projectId\}\/screen\/#\{screenId\}/g, '');

  /* Replaces a screen id with its corresponding title slug. Returns a function
   * that should be used as a regular expression replace callback.
   * Requires: format for the replacement string, where %s will be replaced
   *  with the slug
   * Returns: regular expression replace callback assuming that the first
   *  capture group is the screen id
   */
  function replaceLink(format) {
    return function(match, screenId) {
      screenId = parseInt(screenId, 10);
      return format.replace(/%s/g, screensById[screenId].titleSlug);
    };
  }

  // screen link targets need to be translated to screen routes
  template = template.replace(/\/share\/#\{userId\}\/project\/#\{projectId\}\/screen\/(\d+)/g,
    replaceLink('/%s'));
  template = template.replace(/\/share\/#\{session.sharedId\}\/project\/#\{projectId\}\/screen\/(\d+)/g,
    replaceLink('/%s'));
  template = template.replace(/\?redirect=(\d+)/, replaceLink('?redirect=%s'));

  // no need for unescaped attributes
  template = template.replace(/!=/g, '=');

  return template;
}

/* Wraps a given component's jade in its wrapper, if one exists.
 * Requires: component jade, component, screens by id, callback
 * Calls: callback(jade):
 *  jade - the wrapped component's jade if a wrapper exists or the original
 *      component's jade otherwise
 */
function wrapComponent(jade, component, screensById, callback) {
  var wrapperFile = __dirname + '/../views/templates/wrappers/' + component.type + '.jade';
  var wrapper;

  try {
    wrapper = fs.readFileSync(wrapperFile, 'utf8');
  } catch (err) {
    // no wrapper; callback with original jade
    callback(jade);
  }

  if (wrapper) {
    wrapper = renderEjsTemplate(wrapper, component, screensById);
    wrapper = wrapper.replace(/^(\s*).*?\.elements-container.*$/m,
      function(match, whitespace) {
        // add the jade as a child of the container
        return match + '\n' + indent(jade, '  ') + '\n';
      });

    callback(wrapper);
  }
}

/* Dedent a string
 * Requires: a string
 * Returns: the given string dedented by the most consistent amount on each line
 */
function dedent(str) {
  var leastWhitespace = null;

  str = str.replace(/^\s*/gm, function(match) {
    // keep track of the least amount of whitespace at the beginning of a line
    if (leastWhitespace === null || match.length < leastWhitespace.length) {
      leastWhitespace = match;
    }

    // don't actually do replacement
    return match;
  });

  if (leastWhitespace === null) {
    return str;
  } else {
    // strip whitespace from every line
    return str.replace(new RegExp('^' + leastWhitespace, 'gm'), '');
  }
}

/* Indent a string
 * Requires: a string, whitespace to indent it with
 * Returns: the given string indented on each line by the given whitespace
 */
function indent(str, whitespace) {
  return str.replace(new RegExp('^', 'gm'), whitespace);
}
