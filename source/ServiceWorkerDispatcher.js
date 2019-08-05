/* eslint-disable class-methods-use-this */
import WorkerType from './WorkerType';
import { dispatchWorkerErrorEvent } from './WorkerEvent';
import AbstractDispatcher from './AbstractDispatcher';

const getServiceWorker = async () => {
  await navigator.serviceWorker.ready;
  const registration = await navigator.serviceWorker.getRegistration();

  return registration.active;
};

const createTarget = () => {
  const channel = new MessageChannel();
  let neutered = false;

  return {
    postMessage: async (message) => {
      const worker = await getServiceWorker();

      if (neutered) {
        return worker.postMessage(message);
      }

      neutered = true;

      return worker.postMessage(message, [channel.port2]);
    },
    get onmessage() {
      return channel.port1.onmessage;
    },
    set onmessage(handler) {
      channel.port1.onmessage = handler;
    },
    start: () => {
      channel.port1.start();
    },
    close: () => {
      channel.port1.close();
    },
    addEventListener: (...args) => channel.port1.addEventListener(...args),
  };
};

/**
 *
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends WorkerMessenger
 * @constructor
 */
class ServiceWorkerDispatcher extends AbstractDispatcher {
  constructor(receiverEventPreprocessor, senderEventPreprocessor) {
    super(
      WorkerType.SERVICE_WORKER,
      createTarget(),
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );

    this.start();

    dispatchWorkerErrorEvent(this.target, this.receiver);
  }

  start() {
    return this.target.start();
  }

  close() {
    return this.target.close();
  }

  onReady(handler) {
    return navigator.serviceWorker.ready.then(handler);
  }

  get ready() {
    return navigator.serviceWorker.ready;
  }
}

export default ServiceWorkerDispatcher;
