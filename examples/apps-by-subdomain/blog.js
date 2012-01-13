
require('http').createServer(function (req, res) {
  res.writeHead(200);
  res.end('Welcome to our blog!');
}).listen(3001, function () {
  console.log('\033[90m  - blog listening on *:3001\033[39m');
});
