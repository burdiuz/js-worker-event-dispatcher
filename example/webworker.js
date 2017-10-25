/**
 * Created by Oleg Galaburda on 10.02.16.
 */
importScripts(
  '../dist/worker-event-dispatcher.standalone.js'
);
var api = AbstractDispatcher.self();
api.addEventListener('time:request', function() {
  setTimeout(function() {
    api.dispatchEvent('time:response', Date.now());
  }, 200);
});
