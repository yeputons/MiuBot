var utils = require('./utils');
var callMethod = utils.callMethod;
var reportError = utils.reportError;
var errorReporter = utils.errorReporter;
var emoji = require('node-emoji').emoji;

function processCommands(chat_id, text) {
  var commandRegexp = /\/([a-zA-Z0-9_]{1,32})(@MiuBot)?(?:\s|$)/gi;
  var m;
  var wasCommand = {};
  var duplicates = false;
  var saidSomething = false;
  while ((m = commandRegexp.exec(text)) != null) {
    var command = m[1];
    if (wasCommand[command]) {
      duplicates = true;
      continue;
    }
    wasCommand[command] = true;
    if (saidSomething) {
      continue;
    }
    if (command == 'miu') {
      callMethod('sendMessage',
        { chat_id: chat_id,
          text: 'миу'
        }, errorReporter("In 'miu' command")
      );
      saidSomething = true;
    } else if (command == 'woof') {
      callMethod('sendSticker',
        { chat_id: chat_id,
          sticker: 'BQADAwADeAUAAmFKuQAB37zscLaXJQQC'
        }, errorReporter("In 'woof' command")
      );
      saidSomething = true;
    } else {
      if (chat_id > 0 || m[2]) { // if called in private or in a group by name
        callMethod('sendMessage',
          { chat_id: chat_id,
            text: 'не миу ' + emoji.unamused
          }, errorReporter("In unknown command")
        );
        saidSomething = true;
      }
    }
  }
  if (duplicates) {
    callMethod('sendMessage',
      { chat_id: chat_id,
        text: emoji.fearful
      }, errorReporter("In reaction to a lot of commands")
    );
    saidSomething = true;
  }
}

function messageReceived(message) {
  var chat_id = message.chat.id;

  if (message.text) {
    processCommands(chat_id, message.text);
    if (message.text.toLowerCase().indexOf("миу") != -1) {
      callMethod('sendMessage', { chat_id: chat_id, text: 'миу ' + emoji.relieved }, errorReporter("In 'miu' reaction"))
    }
    if (message.text.toLowerCase().indexOf("мяу") != -1) {
      callMethod('sendMessage', { chat_id: chat_id, text: 'не "мяу", а "миу"! ' + emoji.angry }, errorReporter("In 'meow' reaction"))
    }
    if (message.text.toLowerCase().indexOf("гав") != -1) {
      callMethod('sendMessage', { chat_id: chat_id, text: 'не "гав", а "/woof"! ' + emoji.smirk_cat }, errorReporter("In 'woof' reaction"))
    }
  }
}

var updatesOffset = 0;
function requestUpdates() {
  callMethod('getUpdates', {timeout: 25, offset: updatesOffset},
    function(error) {
      reportError('In requestUpdates: ' + error);
      setTimeout(requestUpdates, 2000);
    },
    function(data) {
      for (var i in data) {
        var upd = data[i];
        updatesOffset = Math.max(updatesOffset, upd.update_id + 1);
        messageReceived(upd.message);
      }
      requestUpdates();
    }
  );
}

requestUpdates();
