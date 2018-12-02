/*
 * Primary file for RESTfulAPI
 */

// Dependencies
var http = require('http'),
  https = require('https'),
  url = require('url'),
  StringDecoder = require('string_decoder').StringDecoder,
  config = require('./config'),
  fs = require('fs');

// HTTP server instantiation and initiation
var httpServer = http.createServer(function(req,res){
  unifiedServer(req,res);
});

httpServer.listen(config.httpPort,function(){
  console.log('The server is listening on HTTP port '+config.httpPort);
});

// HTTPS server instantiation and initiation
var httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions,function(req,res){
  unifiedServer(req,res);
});

httpsServer.listen(config.httpsPort,function(){
  console.log('The server is listening on HTTPS port '+config.httpsPort);
});

// All the server logic for both the HTTP and HTTPS servers
var unifiedServer = function(req,res){

  // Parse the url
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname,
    trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  //Get the headers as an object
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8'),
    buffer = '';

  req.on('data',function(data) {
      buffer += decoder.write(data);
  });

  req.on('end',function() {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found use the notFound handler.
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handlers
    var data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    };

    // Route the request to the handler specified in the router
    chosenHandler(data,function(statusCode,payload){
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type','application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request/response
      console.log('Returning this response: ',statusCode,payloadString);
    });
  });
};

// Define the handlers
var handlers = {}

// Ping handler
handlers.ping = function(data,callback){
  callback(200);
};

// Hello handler
handlers.hello = function(data,callback){
  callback(406,{'WelcomeMessage':'Hello world!'});
}

// Not found handler
handlers.notFound = function(data,callback){
  callback(404);
};

// Define a request router
var router = {
  'ping' : handlers.ping,
  'hello' : handlers.hello
}
