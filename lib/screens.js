/*globals exports:true*/
const ALLOWED_FIELDS = {
  title: undefined,
  isStart: undefined,
  layout: undefined,
  secure: undefined,
  screenshotCreated: undefined,
  screenshotInProgress: undefined
};

var fs = require('fs');
var phantom = require('phantom');
var im = require('imagemagick');
var scaffold = require('./scaffold');
var utils = require('./utils');

/* Get default screen
 * Requires: web request
 * Returns: default screen data
 */
function getDefaultScreen(req) {
  // default to three rows with the following column lengths
  var defaultLayout = [
    [ 8, 4 ],
    [ 4, 4, 4 ],
    [ 4, 8 ]
  ];

  return {
    title: req.body.title,
    isStart: req.body.isStart || false,
    layout: req.body.layout || defaultLayout,
    secure: req.body.secure || false,
    created: new Date().getTime(),
    screenshotCreated: null,
    screenshotInProgress: false
  };
}

/* Validate screen
 * Requires:
 *  req - web request,
 *  beingCreated - true if this screen is being created for the first time and
 *    false otherwise,
 *  db - db connection,
 *  callback
 * Calls: callback([error]):
 *  error - if there was a validation issue, this is an error message that
 *    explains it; otherwise, this argument is not provided.
 */
function validateScreen(req, beingCreated, db, callback) {
  var body = req.body;
  var title = body.title;
  var isStart = body.isStart;
  var secure = body.secure;
  var id = parseInt(req.params.id, 10);

  // TODO: validate isStart and layout
  if (!title) {
    callback('Screen must have a title.');
    return;
  } else if (title.length < 1 || title.length > 20) {
    callback('Screen must have a title between 1 than 20 characters long.');
    return;
  }

  if (isStart !== undefined) {
    if (isStart === 'true') {
      body.isStart = isStart = true;
    } else if (isStart === 'false') {
      body.isStart = isStart = false;
    }

    if (typeof isStart !== 'boolean') {
      callback('Screen must have an isStart boolean.');
      return;
    }
  }

  if (secure !== undefined) {
    if (secure === 'true') {
      body.secure = secure = true;
    } else if (secure === 'false') {
      body.secure = secure = false;
    }

    if (typeof secure !== 'boolean') {
      callback('Screen must have a secure boolean.');
      return;
    }
  }

  // these can only be edited explicitly on the server side; client requests
  // should not be allowed to modify them
  delete req.body.screenshotCreated;
  delete req.body.screenshotInProgress;

  exports.list(req, db, function(err, screenList) {
    if (err) {
      throw err;
    } else {
      for (var i = 0; i < screenList.length; i++) {
        if (screenList[i].title.toLowerCase() === title.toLowerCase() &&
            // confirm that we aren't looking at the exact same screen
            (beingCreated || screenList[i].id !== id)) {
          callback('Screen must have a unique case-insensitive title.');
          return;
        }
      }

      // everything has been validated; there are no errors
      callback();
    }
  });
}

exports = module.exports = scaffold.generate(['projects'], ['components'],
  'screens', getDefaultScreen, ALLOWED_FIELDS, validateScreen);

/* Generates a PhantomJS screenshot of the given URL to act as this screen's
 * thumbnail.
 * Requires: web request, db connection, screen id, url
 */
exports.generateScreenshot = function(req, db, id, url) {
  exports.get(req, db, id, function(err, screen) {
    if (err) {
      console.error('Screen fetch error:', err);
      return;
    }

    // find the time of the last screenshot's creation, defaulting to the
    // time of this screen's creation
    var referenceTime = screen.screenshotCreated;
    if (!referenceTime) {
      referenceTime = screen.created;
    }

    // only create a new screenshot if it has been 10 minutes since the old one
    var now = new Date().getTime();
    if (now - referenceTime < 1000 * 60 * 10) {
      return;
    }

    if (screen.screenshotInProgress) {
      // screenshot is currently being generated; do not try to generate again
      return;
    }

    // automatically end generating screenshot after 10 seconds as a timeout
    var finishTimeout = setTimeout(finishGeneratingScreenshot, 10000);

    /* Marks this screenshot as no longer in progress. */
    function finishGeneratingScreenshot() {
      if (finishTimeout) {
        clearTimeout(finishTimeout);
      }

      req.body.screenshotInProgress = false;
      exports.update(req, db, id);
    }

    // screenshot is now in progress
    req.body.screenshotInProgress = true;
    exports.update(req, db, id, function(err, screen) {
      if (err) {
        console.error('Screen update error:', err);
        finishGeneratingScreenshot();
        return;
      }

      phantom.create(function(ph) {
        ph.createPage(function(page) {
          page.open(url, function(status) {

            if (status !== 'success') {
              console.error('Bad PhantomJS status:', status);
              finishGeneratingScreenshot();
              return;
            }

            // wait two seconds for the page's JS to kick in prior to rendering it
            setTimeout(function() {
              // path uniquely identifies this screenshot
              var imagePath = __dirname + '/../public/screenshots/';
              imagePath += req.session.id + '-' + req.project.id + '-' + id;
              imagePath += '.png';

              page.set('viewportSize', {
                width: 1300,
                height: 960
              });

              page.set('clipRect', {
                top: 0,
                left: 0,
                width: 1300,
                height: 960
              });

              page.render(imagePath, function() {
                // crop out the sidebar
                im.convert([imagePath, '-crop', '960x960+331+0', imagePath],
                  function(err, stdout, stderr) {
                    if (err) {
                      console.error('Imagemagick error:', err);
                      finishGeneratingScreenshot();
                      return;
                    }

                    // resize to 220x220
                    im.convert([imagePath, '-resize', '220x220', imagePath],
                      function(err, stdout, stderr) {
                        if (err) {
                          console.error('Imagemagick error:', err);
                          finishGeneratingScreenshot();
                          return;
                        }

                        // update the screenshot created time with the new time
                        req.body.screenshotCreated = new Date().getTime();
                        exports.update(req, db, id);
                      });
                  });

                ph.exit();
              });
            }, 2000);
          });
        });
      });
    });
  });
};

var removeScreen = exports.remove;

/* Removes a screen and its associated screenshot.
 * Requires: web request, db connection, id, callback
 * Calls: callback(error):
 *   error - null if the object was removed or an error otherwise
 */
exports.remove = function(req, db, id, callback) {
  callback = callback || utils.noop;

  removeScreen.call(exports, req, db, id, function(err) {
    if (err) {
      // don't remove the screenshot, as there was an error removing the screen
      callback(err);
      return;
    }

    // path uniquely identifies this screenshot
    var imagePath = __dirname + '/../public/screenshots/';
    imagePath += req.session.id + '-' + req.params.projectId + '-' + id;
    imagePath += '.png';

    fs.unlink(imagePath, function(err) {
      if (err) {
        console.error('Screenshot could not be unlinked.');
        // fall through to callback
      }

      // call the callback with no error regardless of whether the screenshot
      // was unlinked, as it's not a big deal if the screenshot remains
      callback();
    });
  });
};
