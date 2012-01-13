
/**
 * Module dependencies
 */

var http = require('http').createServer()
  , srv = require('../../distribute')(http)

/**
 * Set up middleware.
 */

srv.use(function (req, res, next) {
  if (/^blog\.localhost/.test(req.headers.host)) {
    next(3001);
  } else {
    next();
  }
});

/**
 * Default handler.
 */

srv.use(function (req, res, next) {
  next(3002);
});

/**
 * Listen.
 */

http.listen(3000, function () {
  console.log('\033[96m  - distributor listening on *:3000\033[39m');
  console.log('    - go to "blog.localhost:3000" for *:3001');
  console.log('    - go to "localhost:3000" for *:3002');
});
