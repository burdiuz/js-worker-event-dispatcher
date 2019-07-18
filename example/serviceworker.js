/**
 * Created by Oleg Galaburda on 10.02.16.
 */
importScripts('worker-dispatcher.js');

const { createForSelf, NativeEventType } = WorkerDispatcher;

const api = createForSelf();

api.addEventListener('time:request', (event) => {
  console.log('> time request');
  setTimeout(() => {
  console.log('< send time response');
    event.client.dispatchEvent('time:response', Date.now());
  }, 200);
});

self.addEventListener(NativeEventType.INSTALL, (event) => {
  console.log(event);

  /*
  event.waitUntil(
    Promise.all([Notification.requestPermission(), Promise.resolve()]),
  );
  */
});

self.addEventListener(NativeEventType.ACTIVATE, (event) => {
  console.log(event);
});
