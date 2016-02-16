/**
 * Created by Oleg Galaburda on 09.02.16.
 */

/* TODOs
 * 1. implement transferList getter on passed event
 */
var NOINIT = {};

var Event = {};

Object.defineProperties(Event, {
  CONNECT: {
    value: 'connect'
  },
  MESSAGE: {
    value: 'message'
  },
  ERROR: {
    value: 'error'
  },
  LANGUAGECHANGE: {
    value: 'languagechange'
  },
  ONLINE: {
    value: 'online'
  },
  OFFLINE: {
    value: 'offline'
  }
});

function WorkerEvent(type, data, sourceEvent, client) {
  EventDispatcher.Event.call(this, type, data);
  this.sourceEvent = sourceEvent;
  this.client = client;
}
WorkerEvent.createHandler = function(type, target, dispatcher) {
  var eventType = WorkerEvent.getWorkerEventType(type);

  function handler(event) {
    if (dispatcher.hasEventListener(eventType)) {
      dispatcher.dispatchEvent(new WorkerEvent(eventType, event, event));
    }
  }

  target.addEventListener(type, handler);
  return handler;
};
WorkerEvent.getWorkerEventType = function(type) {
  var eventType = '';
  switch (type) {
    case Event.CONNECT:
      eventType = WorkerEvent.CONNECT;
      break;
    case Event.MESSAGE:
      eventType = WorkerEvent.MESSAGE;
      break;
    case Event.ERROR:
      eventType = WorkerEvent.ERROR;
      break;
    case Event.LANGUAGECHANGE:
      eventType = WorkerEvent.LANGUAGECHANGE;
      break;
    case Event.ONLINE:
      eventType = WorkerEvent.ONLINE;
      break;
    case Event.OFFLINE:
      eventType = WorkerEvent.OFFLINE;
      break;
  }
  return eventType;
};

Object.defineProperties(WorkerEvent, {
  CONNECT: {
    value: 'worker:connect'
  },
  MESSAGE: {
    value: 'worker:message'
  },
  ERROR: {
    value: 'worker:error'
  },
  LANGUAGECHANGE: {
    value: 'worker:languagechange'
  },
  ONLINE: {
    value: 'worker:online'
  },
  OFFLINE: {
    value: 'worker:offline'
  }
});

var WorkerType = {};
Object.defineProperties(WorkerType, {
  DEDICATED_WORKER: {
    value: 'dedicated'
  },
  SHARED_WORKER: {
    value: 'shared'
  },
  /**
   * @private
   */
  SHARED_WORKER_SERVER: {
    value: 'sharedServer'
  },
  /**
   * @private
   */
  SHARED_WORKER_CLIENT: {
    value: 'sharedClient'
  }
});

var WorkerMessenger = (function() {
  /**
   *
   * @param port {Worker|MessagePort}
   * @extends MessagePortDispatcher
   * @constructor
   */
  function WorkerMessenger(port) {

    function postMessageHandler(data, transferList) {
      port.postMessage(data, transferList);
    }

    MessagePortDispatcher.call(this, port, postMessageHandler);
  }

  function setScopeHandlers(source, target) {
    WorkerEvent.createHandler(Event.ERROR, source, target);
    WorkerEvent.createHandler(Event.LANGUAGECHANGE, source, target);
    WorkerEvent.createHandler(Event.ONLINE, source, target);
    WorkerEvent.createHandler(Event.OFFLINE, source, target);
  }

  WorkerMessenger.setScopeHandlers = setScopeHandlers;

  function setAbstractWorkerHandlers(source, target) {
    WorkerEvent.createHandler(Event.ERROR, source, target);
  }

  WorkerMessenger.setAbstractWorkerHandlers = setAbstractWorkerHandlers;
  return WorkerMessenger;
})();

/**
 *
 * @param worker
 * @extends WorkerMessenger
 * @constructor
 */
function ServerEventDispatcher(target) {
  var _target = target || self;
  /**
   * @type {EventDispatcher}
   */
  var _receiver = new EventDispatcher();

  function connectHandler(event) {
    var client = WorkerEventDispatcher.create(
      event.ports[0],
      WorkerType.SHARED_WORKER_CLIENT
    );
    _receiver.dispatchEvent(new WorkerEvent(WorkerEvent.CONNECT, client, event, client));
  }

  _target.addEventListener('connect', connectHandler);

  this.addEventListener = _receiver.addEventListener;
  this.hasEventListener = _receiver.hasEventListener;
  this.removeEventListener = _receiver.removeEventListener;
  this.removeAllEventListeners = _receiver.removeAllEventListeners;

  WorkerMessenger.setScopeHandlers(_target, _receiver);

  Object.defineProperties(this, {
    receiver: {
      value: _receiver
    },
    target: {
      value: _target
    }
  });
}
ServerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, WorkerType.SHARED_WORKER_SERVER);
ServerEventDispatcher.prototype.constructor = ServerEventDispatcher;

/**
 * @param port {MessagePort}
 * @extends WorkerMessenger
 * @constructor
 */
function ClientEventDispatcher(port) {
  function start() {
    port.start();
  }

  function close() {
    port.close();
  }

  WorkerMessenger.call(this, port);

  this.start = start;
  this.close = close;
}
ClientEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, WorkerType.SHARED_WORKER_CLIENT);
ClientEventDispatcher.prototype.constructor = ClientEventDispatcher;

/**
 *
 * @param worker {SharedWorker}
 * @extends WorkerMessenger
 * @constructor
 */
function SharedWorkerEventDispatcher(worker, name) {
  var _target = worker;
  if (!EventDispatcher.isObject(worker)) {
    _target = new SharedWorker(String(worker), name);
  }

  ClientEventDispatcher.call(this, _target.port);
  WorkerMessenger.setAbstractWorkerHandlers(_target, this.receiver);
}
SharedWorkerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, WorkerType.SHARED_WORKER);
SharedWorkerEventDispatcher.prototype.constructor = SharedWorkerEventDispatcher;

/**
 *
 * @param worker {Worker|String}
 * @extends WorkerMessenger
 * @constructor
 */
function DedicatedWorkerEventDispatcher(worker) {
  var _target = worker || self;

  if (!EventDispatcher.isObject(_target)) {
    _target = new Worker(String(worker));
  }

  WorkerMessenger.call(this, _target);
  WorkerMessenger.setScopeHandlers(_target, this.receiver);

  function terminate() {
    return _target.terminate();
  }

  this.terminate = terminate;
}
DedicatedWorkerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, WorkerType.DEDICATED_WORKER);
DedicatedWorkerEventDispatcher.prototype.constructor = DedicatedWorkerEventDispatcher;

/**
 *
 * @param worker
 * @extends WorkerMessenger
 * @constructor
 */
function WorkerEventDispatcher(worker, type) {
  if (worker === NOINIT) {
    Object.defineProperties(this, {
      type: {
        value: type
      }
    });
  } else {
    DedicatedWorkerEventDispatcher.call(this, worker);
  }
}

WorkerEventDispatcher.WorkerEvent = WorkerEvent;
WorkerEventDispatcher.WorkerType = WorkerType;

WorkerEventDispatcher.Dedicated = DedicatedWorkerEventDispatcher;
WorkerEventDispatcher.Shared = SharedWorkerEventDispatcher;
WorkerEventDispatcher.Server = ServerEventDispatcher;
WorkerEventDispatcher.Client = ClientEventDispatcher;

WorkerEventDispatcher.create = function(target, type) {
  var dispatcher = null;
  switch (type) {
    default:
    case WorkerType.DEDICATED_WORKER:
      dispatcher = new DedicatedWorkerEventDispatcher(target);
      break;
    case WorkerType.SHARED_WORKER:
      dispatcher = new SharedWorkerEventDispatcher(target);
      break;
    case WorkerType.SHARED_WORKER_SERVER:
      dispatcher = new ServerEventDispatcher(target);
      break;
    case WorkerType.SHARED_WORKER_CLIENT:
      dispatcher = new ClientEventDispatcher(target);
      break;
  }
  return dispatcher;
}

WorkerEventDispatcher.self = function() {
  var dispatcher = null;
  if (typeof(self.postMessage) === 'function') {
    dispatcher = new DedicatedWorkerEventDispatcher(self);
  } else {
    dispatcher = new ServerEventDispatcher(self);
  }
  return dispatcher;
};
