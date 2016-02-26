/**
 * Created by Oleg Galaburda on 09.12.15.
 */
// Uses Node, AMD or browser globals to create a module.
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['EventDispatcher', 'MessagePortDispatcher'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(
      require('EventDispatcher'),
      require('MessagePortDispatcher')
    );
  } else {
    // Browser globals (root is window)
    root.WorkerEventDispatcher = factory(root.EventDispatcher, root.MessagePortDispatcher);
  }
}(this, function (EventDispatcher, MessagePortDispatcher) {
  // here should be injected worker-event-dispatcher.js content
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
     * @param receiverEventPreprocessor {?Function}
     * @param senderEventPreprocessor {?Function}
     * @extends MessagePortDispatcher
     * @constructor
     */
    function WorkerMessenger(port, receiverEventPreprocessor, senderEventPreprocessor) {
  
      function postMessageHandler(data, transferList) {
        port.postMessage(data, transferList);
      }
  
      MessagePortDispatcher.call(this, port, postMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);
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
   * @param receiverEventPreprocessor {?Function}
   * @extends WorkerMessenger
   * @constructor
   */
  function ServerEventDispatcher(target, receiverEventPreprocessor) {
    var _target = target || self;
    /**
     * @type {EventDispatcher}
     */
    var _receiver = new EventDispatcher(receiverEventPreprocessor);
  
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
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @extends WorkerMessenger
   * @constructor
   */
  function ClientEventDispatcher(port, receiverEventPreprocessor, senderEventPreprocessor) {
    function start() {
      port.start();
    }
  
    function close() {
      port.close();
    }
  
    WorkerMessenger.call(this, port, receiverEventPreprocessor, senderEventPreprocessor);
  
    this.start = start;
    this.close = close;
  }
  ClientEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, WorkerType.SHARED_WORKER_CLIENT);
  ClientEventDispatcher.prototype.constructor = ClientEventDispatcher;
  
  /**
   *
   * @param worker {SharedWorker}
   * @param name {String}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @extends WorkerMessenger
   * @constructor
   */
  function SharedWorkerEventDispatcher(worker, name, receiverEventPreprocessor, senderEventPreprocessor) {
    var _target = worker;
    if (!EventDispatcher.isObject(worker)) {
      _target = new SharedWorker(String(worker), name);
    }
  
    ClientEventDispatcher.call(this, _target.port, receiverEventPreprocessor, senderEventPreprocessor);
    WorkerMessenger.setAbstractWorkerHandlers(_target, this.receiver);
  }
  SharedWorkerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, WorkerType.SHARED_WORKER);
  SharedWorkerEventDispatcher.prototype.constructor = SharedWorkerEventDispatcher;
  
  /**
   *
   * @param worker {Worker|String}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @extends WorkerMessenger
   * @constructor
   */
  function DedicatedWorkerEventDispatcher(worker, receiverEventPreprocessor, senderEventPreprocessor) {
    var _target = worker || self;
  
    if (!EventDispatcher.isObject(_target)) {
      _target = new Worker(String(worker));
    }
  
    WorkerMessenger.call(this, _target, receiverEventPreprocessor, senderEventPreprocessor);
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
   * @param worker {String|Worker}
   * @param type {String}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @extends WorkerMessenger
   * @constructor
   */
  function WorkerEventDispatcher(worker, type, receiverEventPreprocessor, senderEventPreprocessor) {
    if (worker === NOINIT) {
      Object.defineProperties(this, {
        type: {
          value: type
        }
      });
    } else {
      DedicatedWorkerEventDispatcher.call(this, worker, receiverEventPreprocessor, senderEventPreprocessor);
    }
  }
  
  WorkerEventDispatcher.WorkerEvent = WorkerEvent;
  WorkerEventDispatcher.WorkerType = WorkerType;
  
  WorkerEventDispatcher.Dedicated = DedicatedWorkerEventDispatcher;
  WorkerEventDispatcher.Shared = SharedWorkerEventDispatcher;
  WorkerEventDispatcher.Server = ServerEventDispatcher;
  WorkerEventDispatcher.Client = ClientEventDispatcher;
  
  /**
   *
   * @param worker {String|Worker|SharedWorker|MessagePort}
   * @param type {String}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @returns {WorkerEventDispatcher}
   */
  WorkerEventDispatcher.create = function(target, type, receiverEventPreprocessor, senderEventPreprocessor) {
    var dispatcher = null;
    switch (type) {
      default:
      case WorkerType.DEDICATED_WORKER:
        dispatcher = new DedicatedWorkerEventDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
        break;
      case WorkerType.SHARED_WORKER:
        dispatcher = new SharedWorkerEventDispatcher(target, null, receiverEventPreprocessor, senderEventPreprocessor);
        break;
      case WorkerType.SHARED_WORKER_SERVER:
        dispatcher = new ServerEventDispatcher(target, receiverEventPreprocessor);
        break;
      case WorkerType.SHARED_WORKER_CLIENT:
        dispatcher = new ClientEventDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
        break;
    }
    return dispatcher;
  }
  
  /**
   *
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @returns {WorkerEventDispatcher}
   */
  WorkerEventDispatcher.self = function(receiverEventPreprocessor, senderEventPreprocessor) {
    var dispatcher = null;
    if (typeof(self.postMessage) === 'function') {
      dispatcher = new DedicatedWorkerEventDispatcher(self, receiverEventPreprocessor, senderEventPreprocessor);
    } else {
      dispatcher = new ServerEventDispatcher(self, receiverEventPreprocessor);
    }
    return dispatcher;
  };
  
  return WorkerEventDispatcher;
}));
