/**
 * Created by Oleg Galaburda on 11.02.16.
 */
importScripts(
  '../bower_components/event-dispatcher/dist/event-dispatcher.js',
  '../bower_components/messageport-event-dispatcher/dist/messageport-event-dispatcher.js',
  '../dist/worker-event-dispatcher.js'
);

var getName = (function() {
  var baseName = 'Client #';
  var index = 0;
  return function() {
    return baseName + String(++index);
  };
})();

var dispatcher = WorkerEventDispatcher.self();
dispatcher.addEventListener(WorkerEventDispatcher.WorkerEvent.CONNECT, function(event) {
  var client = event.client;
  client.start();
  client.dispatchEvent('handshake', {
    name: getName()
    });
});
