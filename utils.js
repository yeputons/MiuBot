var https = require('https');
var dns = require('dns');
var url = require('url');
var my_config = require('./config');

module.exports.callMethod = function(methodName, options, callback_error, callback) {
  options = options || {};
  callback = callback || function() {};
  callback_error = callback_error || function() {};

  var token = my_config.token;

  var url_description = url.parse('https://api.telegram.org/bot' + token + '/' + methodName);
  url_description.query = options;

  var completed = function(err, result) {
    // Only fire once.  May fire twice when a partial HTTP response is received (hence `end`) but connection is lost (hence `error`).
    // See https://stackoverflow.com/questions/75655671/how-to-guarantee-that-exactly-one-callback-is-fired-in-a-simple-node-js-http-cli/75655750?noredirect=1#comment133472194_75655750
    completed = null;
    if (err) {
      callback_error(err);
    } else {
      callback(result);
    }
  };

  https.get(url.format(url_description), function(result) {
    var body = [];
    result.on('data', function(data) {
      body.push(data);
    });
    result.on('end', function() {
      body = Buffer.concat(body).toString();
      try {
        body = JSON.parse(body);
      } catch (e) {
        completed('Got invalid JSON:\n' + e + "\nBody:\n" + body);
        return;
      }
      if (result.statusCode == 200 && body.ok) {
        completed(null, body.result);
      } else {
        completed(body.description);
      }
    });
  }).on('error', function(err) {
    completed('Unable to make HTTPS request:\n' + err);
  });
}

module.exports.reportError = function(message) {
  var author_id = my_config.author_id;
  var time = new Date();
  message = "===== ERROR =====\n" + time + "\nTimestamp: " + time.getTime() + "\n" + message;
  console.log(message);
  module.exports.callMethod('sendMessage', {
    chat_id: author_id,
    text: message,
  });
  dns.lookup('api.telegram.org', function(err, address, family) {
    console.log("Debug DNS lookup after reportError:\n" + "  Err: " + err + "\n  Address: " + address + "\n  Family: " + family);
  });
}

module.exports.errorReporter = function(type) {
  return function(message) {
    module.exports.reportError(type + ': '+ message);
  }
}
