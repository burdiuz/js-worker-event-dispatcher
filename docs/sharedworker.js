/**
 * Created by Oleg Galaburda on 11.02.16.
 */

importScripts('worker-dispatcher.js');

const clients = [];
const HISTORY_MAX_LENGTH = 10;
const dispatcher = WorkerDispatcher.createForSelf();
let history = [];

const getName = (() => {
  const baseName = 'Client #';
  let index = 0;
  return () => `${baseName}${++index}`;
})();

function addToHistory(message) {
  history.unshift(message);
  if (history.length > HISTORY_MAX_LENGTH) {
    history = history.slice(0, HISTORY_MAX_LENGTH);
  }
}

function getHistory() {
  return history.reverse();
}

dispatcher.addEventListener(WorkerDispatcher.CONNECT_EVENT, ({ client: newClient }) => {
  clients.push(newClient);

  newClient.addEventListener('sendData', ({ data }) => {
    addToHistory(data);

    clients.forEach((client) => {
      client.dispatchEvent('dataReceived', data);
    });
  });

  newClient.start();
  newClient.dispatchEvent('handshake', {
    name: getName(),
    history: getHistory(),
  });
});
