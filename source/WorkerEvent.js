export const NativeEvent = {
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

  static createHandler(type, target, dispatcher) {
    const eventType = WorkerEvent.getWorkerEventType(type);
    const handler = (event) => {
      if (dispatcher.hasEventListener(eventType)) {
        dispatcher.dispatchEvent(new WorkerEvent(eventType, event, event));
      }
    };

    target.addEventListener(type, handler);
    return handler;
  }

  static getWorkerEventType(type) {
    switch (type) {
      case NativeEvent.CONNECT:
        return WorkerEvent.CONNECT;
      case NativeEvent.MESSAGE:
        return WorkerEvent.MESSAGE;
      case NativeEvent.ERROR:
        return WorkerEvent.ERROR;
      case NativeEvent.LANGUAGECHANGE:
        return WorkerEvent.LANGUAGECHANGE;
      case NativeEvent.ONLINE:
        return WorkerEvent.ONLINE;
      case NativeEvent.OFFLINE:
        return WorkerEvent.OFFLINE;
    }
  }
}

export default WorkerEvent;
