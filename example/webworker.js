/**
 * Created by Oleg Galaburda on 10.02.16.
 */
importScripts(
  '../bower_components/event-dispatcher/dist/event-dispatcher.js',
  '../bower_components/messageport-event-dispatcher/dist/messageport-event-dispatcher.js',
  '../dist/worker-event-dispatcher.js'
);
var api = WorkerEventDispatcher.self();
api.addEventListener('time:request', function() {
  setTimeout(function() {
    api.dispatchEvent('time:response', Date.now());
  }, 200);
});
