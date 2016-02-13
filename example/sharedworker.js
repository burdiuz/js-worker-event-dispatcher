/**
 * Created by Oleg Galaburda on 11.02.16.
 */
importScripts(
  '../bower_components/event-dispatcher/dist/event-dispatcher.js',
  '../bower_components/messageport-event-dispatcher/dist/messageport-event-dispatcher.js',
  '../dist/worker-event-dispatcher.js'
);

console.log('ROOT', self);

self.onconnect = function(event) {
  event.ports[0].start();
  event.ports[0].postMessage('SHARED WORKER WORKS');
  console.log('CONNECT', self);
};
