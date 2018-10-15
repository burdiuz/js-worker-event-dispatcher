/**
 * Created by Oleg Galaburda on 10.02.16.
 */
importScripts(
  'worker-dispatcher.js',
);

const api = WorkerDispatcher.createForSelf();

api.addEventListener('time:request', () => {
  setTimeout(() => {
    api.dispatchEvent('time:response', Date.now());
  }, 200);
});
