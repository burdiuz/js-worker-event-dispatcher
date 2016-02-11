/**
 * Created by Oleg Galaburda on 09.02.16.
 */

/* TODOs
 * 1. implement transferList getter on passed event
 * 2. add SharedWebWorker suppor, add connect event handler
 * 3. WorkerEventDispatcher should become base class for workers and have static factory method to create different types ofdispatchers depending on worker type.
 *      web worker UI -- R/W
 *      web worker self -- R/W
 *      shared UI -- R/W
 *      shared self -- W only
 *      shared event -- R only
 */
var NOINIT = {};
/*
function WorkerEvent(type, data) {
  EventDispatcher.Event.call(this, type, data);
}
WorkerEvent.createHandler = function(type, messenger) {
  return function(event) {
    if (dispatcher.hasEventListener(type)) {
      dispatcher.dispatchEvent(new WorkerEvent(type, event));
    }
  }
};

Object.defineProperties(WorkerEvent, {
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
*/
var WorkerType = {};
Object.defineProperties(WorkerType, {
  WEB_WORKER: {
    value: 'web'
  },
  SHARED_WORKER: {
    value: 'shared'
  },
  SHARED_WORKER_SERVER: {
    value: 'sharedServer'
  },
  SHARED_WORKER_CLIENT: {
    value: 'sharedClient'
  }
});

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
/*
  port.addEventListener('error', WorkerEvent.createHandler(WorkerEvent.ERROR, this.receiver));
  port.addEventListener('languagechange', WorkerEvent.createHandler(WorkerEvent.LANGUAGECHANGE, this.receiver));
  port.addEventListener('online', WorkerEvent.createHandler(WorkerEvent.ONLINE, this.receiver));
  port.addEventListener('offline', WorkerEvent.createHandler(WorkerEvent.OFFLINE, this.receiver));
  */
}

/**
 *
 * @param worker {SharedWorker}
 * @extends WorkerMessenger
 * @constructor
 */
function SharedWorkerEventDispatcher(worker) {
  function start() {
    worker.port.start();
  }

  function close() {
    worker.port.close();
  }

  WorkerMessenger.call(this, worker.port);

  this.start = start;
  this.close = close;
}
SharedWorkerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT);
SharedWorkerEventDispatcher.prototype.constructor = SharedWorkerEventDispatcher;

/**
 *
 * @param worker
 * @extends WorkerMessenger
 * @constructor
 */
function ServerEventDispatcher(worker) {

  var _facade = worker.port;

  function connectHandler(event) {
    var target;
    if (this.receiver.hasEventListener('worker:connect')) {
      target = event.source || event.ports[0];
    }
  }

  WorkerMessenger.call(this, worker);

  worker.addEventListener('connect', connectHandler);
  worker.addEventListener('message', WorkerEvent.createHandler(WorkerEvent.MESSAGE, _receiver));
}
ServerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT);
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
ClientEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT);
ClientEventDispatcher.prototype.constructor = ClientEventDispatcher;

/**
 *
 * @param worker {Worker|String}
 * @extends WorkerMessenger
 * @constructor
 */
function WebWorkerEventDispatcher(worker) {
  var _worker = worker || self;

  if (!EventDispatcher.isObject(worker)) {
    _worker = new Worker(String(worker));
  }

  WorkerMessenger.call(this, _worker);

  function terminate() {
    return _worker.terminate();
  }

  this.terminate = terminate;
}
WebWorkerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT);
WebWorkerEventDispatcher.prototype.constructor = WebWorkerEventDispatcher;

/**
 *
 * @param worker
 * @extends WorkerMessenger
 * @constructor
 */
function WorkerEventDispatcher(worker) {
  if (worker !== NOINIT) {
    WebWorkerEventDispatcher.call(this, worker);
  }
}

//WorkerEventDispatcher.WorkerEvent = WorkerEvent;
WorkerEventDispatcher.WorkerType = WorkerType;

WorkerEventDispatcher.create = function(target, type) {
  var dispatcher = null;
  switch (type) {
    default:
    case WorkerType.WEB_WORKER:
      dispatcher = new WebWorkerEventDispatcher(target);
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
  return new WorkerEventDispatcher(self);
};
