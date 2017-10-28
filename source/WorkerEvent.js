import { Event } from 'event-dispatcher';

export const NativeEventTypes = {
  CONNECT: 'connect',
  MESSAGE: 'message',
  ERROR: 'error',
  LANGUAGECHANGE: 'languagechange',
  ONLINE: 'online',
  OFFLINE: 'offline',
};

class WorkerEvent extends Event {
  static CONNECT = 'worker:connect';
  static MESSAGE = 'worker:message';
  static ERROR = 'worker:error';
  static LANGUAGECHANGE = 'worker:languagechange';
  static ONLINE = 'worker:online';
  static OFFLINE = 'worker:offline';

  constructor(type, data, sourceEvent, client) {
    super(type, data);
    this.sourceEvent = sourceEvent;
    this.client = client;
  }
}

export const getWorkerEventType = (type) => {
  switch (type) {
    case NativeEventTypes.CONNECT:
      return WorkerEvent.CONNECT;
    case NativeEventTypes.MESSAGE:
      return WorkerEvent.MESSAGE;
    case NativeEventTypes.ERROR:
      return WorkerEvent.ERROR;
    case NativeEventTypes.LANGUAGECHANGE:
      return WorkerEvent.LANGUAGECHANGE;
    case NativeEventTypes.ONLINE:
      return WorkerEvent.ONLINE;
    case NativeEventTypes.OFFLINE:
      return WorkerEvent.OFFLINE;
    default:
      return null;
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
  dispatchWorkerEvent(NativeEventTypes.ERROR, source, target);
  dispatchWorkerEvent(NativeEventTypes.LANGUAGECHANGE, source, target);
  dispatchWorkerEvent(NativeEventTypes.ONLINE, source, target);
  dispatchWorkerEvent(NativeEventTypes.OFFLINE, source, target);
};

export const dispatchWorkerErrorEvent = (source, target) => {
  dispatchWorkerEvent(NativeEventTypes.ERROR, source, target);
};

export default WorkerEvent;
