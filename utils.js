var https = require('https');
var url = require('url');
var my_config = require('./config');

module.exports.callMethod = function(methodName, options, callback_error, callback) {
  options = options || {};
  callback = callback || function() {};
  callback_error = callback_error || function() {};

  var token = my_config.token;

  var url_description = url.parse('https://api.telegram.org/bot' + token + '/' + methodName);
  url_description.query = options;

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
        callback_error('Got invalid JSON:\n' + e + "\nBody:\n" + body);
        return;
      }
      if (result.statusCode == 200 && body.ok) {
        callback(body.result);
      } else {
        callback_error(body.description);
      }
    });
  }).on('error', function(err) {
    callback_error('Unable to make HTTPS request:\n' + err);
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
}

module.exports.errorReporter = function(type) {
  return function(message) {
    module.exports.reportError(type + ': '+ message);
  }
}
