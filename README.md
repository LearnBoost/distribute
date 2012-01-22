# Distribute

**Distribute** is a middleware-based API to expressively perform request
routing / load balancing in Node.JS.

## How to use

### Normal HTTP

```js
var http = require('http').createServer().listen(3000)
  , srv = require('distribute')(http);

srv.use(function (req, res, next) {
  if (req.headers.host == 'blog.mydomain.com') {
    next(8000);
  } else {
    next();
  }
});

srv.use(function (req, res, next) {
  somethingAsync(function (err, host, port) {
    if (err) return next(err); // sends a `500` and cleans up
    next(port, host);
  });
});
```

### WebSocket

Requests triggered by the `upgrade` event (as a result of the `Upgrade`
HTTP header) are handled by prepending the `ws` flag each time you call
`use`.

```js
server.ws.use(function (req, socket, next) {
  next(3000);
});
```

## Features

- Leverages the well-tested `node-http-proxy`.
- Simplicity of Express.
- Compatible with connect middleware (eg: qs parser, cookie decoder).
- Middleware makes sticky/session load balancing trivial to write.
- Middleware can perform async tasks.
  **Distribute** manages buffers transparently for you.

## API

### next

The `next` parameter can take three signatures:

  - no parameters (`next()`) will execute the next middleware. If no
    middleware is available, an error is displayed (refer to the "Default
    behaviors section")
  - port (`Number`)
  - port (`Number`), host (`String`)

### req

**Distribute** adds two properties to request objects:

#### req.buf

The `node-http-proxy` data buffer.

#### req.head

For WS requests, the first packet of the stream, only present for legacy
purposes.

## Behaviors

### Error handling

When an `Error` object is passed to next, or when no middleware will
handle a given request, the default behavior is to show a
`500 Internal Server Error` (for HTTP requests) or the socket is ended 
(WS requests). In development (ie: NODE_ENV is set to `development`), a
stack trace is sent along with the error code.

If you want to define custom "error handling middleware", you can do so
by adding a function with 4 parameters instead of 3 (in other words, with
an arity of 4).

```js
// regular requests
srv.use(function (err, req, res, next) {
  next();
});

// ws requests
srv.use(function (err, req, socket, next) {
  next();
});
```

It's not necessary to pass the error to `next` to trigger the next error 
middleware.

### Buffers

Request data buffers are cleaned up automatically when:

  - a response is produced prematurely instead of proxying. For example

  ```js
  srv.use(function (req, res, next) {
    res.writeHead(204);
    res.end();
  });
  ```

  - a socket for an upgrade is `.end` or `.destroy` prematurely:

  ```js
  srv.ws.use(function (req, socket, next) {
    socket.end();
  });
  ```

## License 

(The MIT License)

Copyright (c) 2011 Guillermo Rauch &lt;guillermo@learnboost.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
