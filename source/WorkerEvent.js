import { Event } from '@actualwave/event-dispatcher';

export const NativeEventType = {
  CONNECT: 'connect',
  MESSAGE: 'message',
  ERROR: 'error',
  MESSAGEERROR: 'messageerror',
  LANGUAGECHANGE: 'languagechange',
  ONLINE: 'online',
  OFFLINE: 'offline',

  /* Service Worker specific events */
  INSTALL: 'install',
  ACTIVATE: 'activate',
  FETCH: 'fetch',
  SYNC: 'sync',
  PUSH: 'push',
};

class WorkerEvent extends Event {
  static CONNECT = 'worker:connect';

  static MESSAGE = 'worker:message';

  static ERROR = 'worker:error';

  static MESSAGEERROR = 'messageerror';

  static LANGUAGECHANGE = 'worker:languagechange';

  static ONLINE = 'worker:online';

  static OFFLINE = 'worker:offline';

  /* Service Worker specific events */

  static INSTALL: 'worker:install';

  static ACTIVATE: 'worker:activate';

  static FETCH: 'worker:fetch';

  static SYNC: 'worker:sync';

  static PUSH: 'worker:push';

  constructor(type, data, nativeEvent, client) {
    super(type, data);
    this.nativeEvent = nativeEvent;
    this.client = client;
  }
}

export const getWorkerEventType = (type) => {
  switch (type) {
    case NativeEventType.CONNECT:
      return WorkerEvent.CONNECT;
    case NativeEventType.MESSAGE:
      return WorkerEvent.MESSAGE;
    case NativeEventType.ERROR:
      return WorkerEvent.ERROR;
    case NativeEventType.MESSAGEERROR:
      return WorkerEvent.MESSAGEERROR;
    case NativeEventType.LANGUAGECHANGE:
      return WorkerEvent.LANGUAGECHANGE;
    case NativeEventType.ONLINE:
      return WorkerEvent.ONLINE;
    case NativeEventType.OFFLINE:
      return WorkerEvent.OFFLINE;

    /* Service Worker specific events */
    case NativeEventType.INSTALL:
      return WorkerEvent.INSTALL;
    case NativeEventType.ACTIVATE:
      return WorkerEvent.ACTIVATE;
    case NativeEventType.FETCH:
      return WorkerEvent.FETCH;
    case NativeEventType.SYNC:
      return WorkerEvent.SYNC;
    case NativeEventType.PUSH:
      return WorkerEvent.PUSH;
    default:
      return type;
  }
};

export const dispatchWorkerEvent = (type, source, target) => {
  const eventType = getWorkerEventType(type);

  const handler = (event) => {
    if (target.hasEventListener(eventType)) {
      target.dispatchEvent(new WorkerEvent(eventType, event, event));
    }
  };

  source.addEventListener(type, handler);
  return handler;
};

export const dispatchWorkerEvents = (source, target) => {
  dispatchWorkerEvent(NativeEventType.ERROR, source, target);
  dispatchWorkerEvent(NativeEventType.LANGUAGECHANGE, source, target);
  dispatchWorkerEvent(NativeEventType.ONLINE, source, target);
  dispatchWorkerEvent(NativeEventType.OFFLINE, source, target);
};

export const dispatchServiceWorkerEvents = (source, target) => {
  dispatchWorkerEvent(NativeEventType.INSTALL, source, target);
  dispatchWorkerEvent(NativeEventType.ACTIVATE, source, target);
  dispatchWorkerEvent(NativeEventType.FETCH, source, target);
  dispatchWorkerEvent(NativeEventType.SYNC, source, target);
  dispatchWorkerEvent(NativeEventType.PUSH, source, target);
};

export const dispatchWorkerErrorEvent = (source, target) => {
  dispatchWorkerEvent(NativeEventType.ERROR, source, target);
  dispatchWorkerEvent(NativeEventType.MESSAGEERROR, source, target);
};

export default WorkerEvent;
