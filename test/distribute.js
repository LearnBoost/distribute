
/**
 * Test dependencies.
 */

var http = require('http')
  , expect = require('expect.js')
  , request = require('superagent')
  , distribute = require('../distribute')

/**
 * Test.
 */

describe('distribute', function () {

  it('should support multiple request middleware', function (done) {
    var servers = 3;

    var srv1 = http.createServer(function (req, res) {
      res.writeHead(200);
      res.end('a');
    }).listen(4001, onListen);

    var srv2 = http.createServer(function (req, res) {
      res.writeHead(200);
      res.end('b');
    }).listen(4002, onListen);

    var master = http.createServer().listen(4000, onListen);
    var srv = distribute(master)

    srv.use(function (req, res, next) {
      if (/a\./.test(req.headers.host)) return next(4001);
      next();
    });

    srv.use(function (req, res, next) {
      if (/b\./.test(req.headers.host)) return next(4002);
      next();
    });

    function onListen () {
      if (!--servers) {
        var total = 2;

        function finish () {
          var total = 3;

          function onClose () {
            --total || done();
          }

          srv1.once('close', onClose).close();
          srv2.once('close', onClose).close();
          master.once('close', onClose).close();
        }

        request.get('http://localhost:4000')
          .set('Host', 'a.localhost')
          .end(function (res) {
            expect(res.text).to.be('a');
            --total || finish();
          });

        request.get('http://localhost:4000')
          .set('Host', 'b.localhost')
          .end(function (res) {
            expect(res.text).to.be('b');
            --total || finish();
          });
      }
    }
  });

  it('should support middleware chaining', function (done) {
    var servers = 3;

    var srv1 = http.createServer(function (req, res) {
      res.writeHead(200);
      res.end('a');
    }).listen(4001, onListen);

    var srv2 = http.createServer(function (req, res) {
      res.writeHead(200);
      res.end('b');
    }).listen(4002, onListen);

    var master = http.createServer().listen(4000, onListen);
    var srv = distribute(master)
      .use(function (req, res, next) {
        if (/a\./.test(req.headers.host)) return next(4001);
        next();
      })
      .use(function (req, res, next) {
        if (/b\./.test(req.headers.host)) return next(4002);
        next();
      })

    function onListen () {
      if (!--servers) {
        var total = 2;

        function finish () {
          var total = 3;

          function onClose () {
            --total || done();
          }

          srv1.once('close', onClose).close();
          srv2.once('close', onClose).close();
          master.once('close', onClose).close();
        }

        request.get('http://localhost:4000')
          .set('Host', 'a.localhost')
          .end(function (res) {
            expect(res.text).to.be('a');
            --total || finish();
          });

        request.get('http://localhost:4000')
          .set('Host', 'b.localhost')
          .end(function (res) {
            expect(res.text).to.be('b');
            --total || finish();
          });
      }
    }
  });

  it('should return 501 if no middleware is left', function (done) {
    var servers = 2;
    var srv1 = http.createServer(function (req, res) {
      res.writeHead(200);
      res.end('a');
    }).listen(4001, onListen);
    var master = http.createServer().listen(4000, onListen);
    var srv = distribute(master)

    srv.use(function (req, res, next) {
      if (/a\./.test(req.headers.host)) return next(4001);
      next();
    });

    function onListen () {
      if (!--servers) {
        var total = 2;

        function finish () {
          var total = 2;

          function onClose () {
            --total || done();
          }

          srv1.once('close', onClose).close();
          master.once('close', onClose).close();
        }

        request.get('http://localhost:4000')
          .set('Host', 'a.localhost')
          .end(function (res) {
            expect(res.text).to.be('a');
            --total || finish();
          });

        request.get('http://localhost:4000')
          .set('Host', 'b.localhost')
          .end(function (res) {
            expect(res.status).to.be(501);
            --total || finish();
          });
      }
    }
  });

  it('should do error handling', function (done) {
    var servers = 2;
    var srv1 = http.createServer(function (req, res) {
      res.writeHead(200);
      res.end('a');
    }).listen(4001, onListen);
    var master = http.createServer().listen(4000, onListen);
    var srv = distribute(master)

    srv.use(function (req, res, next) {
      if (/a\./.test(req.headers.host)) return next(4001);
      next(new Error('Test'));
    });

    srv.use(function (req, res, next) {
      throw new Error('should not execute');
    });

    srv.use(function (err, req, res, next) {
      expect(err).to.be.an(Error);
      expect(err.message).to.be('Test');
      next();
    });

    function onListen () {
      if (!--servers) {
        var total = 2;

        function finish () {
          var total = 2;

          function onClose () {
            --total || done();
          }

          srv1.once('close', onClose).close();
          master.once('close', onClose).close();
        }

        request.get('http://localhost:4000')
          .set('Host', 'a.localhost')
          .end(function (res) {
            expect(res.text).to.be('a');
            --total || finish();
          });

        request.get('http://localhost:4000')
          .set('Host', 'b.localhost')
          .end(function (res) {
            expect(res.status).to.be(500);
            if ('development' == process.env.NODE_ENV) {
              expect(res.text).to.contain('Test');
            }
            --total || finish();
          });
      }
    }
  });

  it('should buffer', function (done) {
    var srv1 = http.createServer(function (req, res) {
      expect(req.method).to.be('POST');

      var data = '';

      req.on('data', function (chunk) {
        data += chunk;
      });

      req.on('end', function () {
        expect(data).to.be('ABC');
        res.end();
        srv1.close();
        master.on('close', done).close();
      });
    }).listen(4001, onListen);

    var master = http.createServer().listen(4000, onListen);
    var chunks = 0;
    var srv = distribute(master)
      .use(function (req, res, next) {
        expect(req.headers.host).to.be('a.localhost');
        expect(chunks).to.be(1);

        setTimeout(function () {
          next(4001);
        }, 100);
      });

    var total = 2;
    function onListen () {
      if (--total) return;
      var req = request
        .post('http://localhost:4000')
        .set('Host', 'a.localhost')
        .set('Content-Type', 'text/plain');

      req.write('A');

      chunks++;
      setTimeout(function () {
        chunks++;
        req.write('B');

        setTimeout(function () {
          chunks++;
          req.write('C');
          req.end();
        }, 20);
      }, 20);
    }
  });

  it('should not break on double next', function (done) {
    var httpServer = http.createServer()
      , srv = distribute(httpServer)

    srv.use(function (req, res, next) {
      next();
      setTimeout(function () {
        expect(next).to.throwException(/more than once.*tobi/);
      }, 10);
    });

    srv.use(function (req, res, next) {
      setTimeout(function () {
        res.writeHead(200);
        res.end('Hello World');
      }, 50);
    });

    httpServer.listen(4000, function () {
      request.get('http://localhost:4000/tobi').end(function (res) {
        expect(res.text).to.be('Hello World');
        httpServer.on('close', done).close();
      });
    });
  });

});
