/**
 * Created by Oleg Galaburda on 11.02.16.
 */
importScripts(
  '../bower_components/event-dispatcher/dist/event-dispatcher.js',
  '../bower_components/messageport-event-dispatcher/dist/messageport-event-dispatcher.js',
  '../dist/worker-event-dispatcher.js'
);

var _clients = [];

var getName = (function() {
  var baseName = 'Client #';
  var index = 0;
  return function() {
    return baseName + String(++index);
  };
})();

var _history = [];
var HISTORY_MAX_LENGTH = 10;

function addToHistory(message) {
  _history.unshift(message);
  if (_history.length > HISTORY_MAX_LENGTH) {
    _history = _history.slice(0, HISTORY_MAX_LENGTH);
  }
}

function getHistory() {
  return _history.slice().reverse();
}

var dispatcher = WorkerEventDispatcher.self();
dispatcher.addEventListener(WorkerEventDispatcher.WorkerEvent.CONNECT, function(event) {
  var client = event.client;
  _clients.push(client);

  client.addEventListener('sendData', function(event) {
    addToHistory(event.data);

    _clients.forEach(function(client, index, list) {
      client.dispatchEvent('dataReceived', event.data);
    });
  });

  client.start();
  client.dispatchEvent('handshake', {
    name: getName(),
    history: getHistory()
  });
});
