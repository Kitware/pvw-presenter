var express = require('express');
var bodyParser = require('body-parser');
var httpProxy = require('http-proxy');
var gzipStatic = require('connect-gzip-static');
var ipList = require('arctic-viewer/bin/network');

var tenSeconds = 10000;

function startWebServer(contentPath, port, assetDir, serverOnly) {
  // Build request handling
  var app = express();

  // - static HTML + JS
  app.use(express.static(contentPath));

  // Need to proxy for paraview launcher
  var proxy = httpProxy.createProxyServer({});
  app.use('/paraview', function (req, res) {
    proxy.web(req, res, {
      target: `http://localhost:${port + 1}/paraview`,
      changeOrigin: true,
    });
  });

  // Serve assets in-place
  app.use('/assets', gzipStatic(assetDir, { maxAge: tenSeconds }));

  // Print server information
  if(ipList.length === 1) {
      console.log("\npvw-presenter\n  => http://" + ipList[0].ip + ":" + port + "/\n");
  } else {
      console.log("\npvw-presenter\n");
      ipList.forEach(function(l){
          console.log("    ", l.name, "=> http://" + l.ip + ":" + port + "/");
      });
      console.log();
  }

  // Add image export handler
  app.use(bodyParser.json({ limit: 10000000 }));

   // Start server and listening
  app.listen(port);

  // Open browser if asked
  if (!serverOnly) {
      require('open')('http://localhost:' + port);
  }
}

module.exports = startWebServer;
