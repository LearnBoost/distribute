
require('http').createServer(function (req, res) {
  res.writeHead(200);
  res.end('Welcome to our app!');
}).listen(3002, function () {
  console.log('\033[90m  - app listening on *:3002\033[39m');
});
