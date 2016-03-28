/**
 * Created by Oleg Galaburda on 09.12.15.
 */
// Uses Node, AMD or browser globals to create a module.
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.WorkerEventDispatcher = factory();
  }
}(this, function () {
  var EventDispatcher = (function() {
    /**
     * Created by Oleg Galaburda on 09.02.16.
     */
    
    var Event = (function() {
    
      function toJSON() {
        return {type: this.type, data: this.data};
      }
    
      function Event(type, data) {
        var _defaultPrevented = false;
    
        function isDefaultPrevented() {
          return _defaultPrevented;
        }
    
        function preventDefault() {
          _defaultPrevented = true;
        }
    
        Object.defineProperties(this, {
          type: {
            value: type,
            enumerable: true
          },
          data: {
            value: data || null,
            enumerable: true
          }
        });
        this.preventDefault = preventDefault;
        this.isDefaultPrevented = isDefaultPrevented;
      }
    
      Event.prototype.toJSON = toJSON;
    
      return Event;
    })();
    
    var EventListeners = (function() {
      function add(eventType, handler, priority) {
        var handlers = createList(eventType, priority, this._listeners);
        if (handlers.indexOf(handler) < 0) {
          handlers.push(handler);
        }
      }
    
      function has(eventType) {
        var result = false;
        var priorities = getHashByKey(eventType, this._listeners);
        if (priorities) {
          for (var priority in priorities) {
            if (priorities.hasOwnProperty(priority)) {
              result = true;
              break;
            }
          }
        }
        return result;
      }
    
      function remove(eventType, handler) {
        var priorities = getHashByKey(eventType, this._listeners);
        if (priorities) {
          var list = Object.getOwnPropertyNames(priorities);
          var length = list.length;
          for (var index = 0; index < length; index++) {
            var priority = list[index];
            var handlers = priorities[priority];
            var handlerIndex = handlers.indexOf(handler);
            if (handlerIndex >= 0) {
              handlers.splice(handlerIndex, 1);
              if (!handlers.length) {
                delete priorities[priority];
              }
            }
          }
        }
      }
    
      function removeAll(eventType) {
        delete this._listeners[eventType];
      }
    
      function call(event, target) {
        var _stopped = false;
        var _immediatelyStopped = false;
    
        function stopPropagation() {
          _stopped = true;
        }
    
        function stopImmediatePropagation() {
          _immediatelyStopped = true;
        }
    
        /*
         * Three ways to implement this
         * 1. As its now -- just assign and delete after event cycle finished
         * 2. Use EventDispatcher.setupOptional()
         * 3. In this method create function StoppableEvent that will extend from this event and add these functions,
         *    then instantiate it for this one cycle.
         */
        event.stopPropagation = stopPropagation;
        event.stopImmediatePropagation = stopImmediatePropagation;
        /*
         var rmStopPropagation = EventDispatcher.setupOptional(event, 'stopPropagation', stopPropagation);
         var rmStopImmediatePropagation = EventDispatcher.setupOptional(event, 'stopImmediatePropagation', stopImmediatePropagation);
         */
        var priorities = getHashByKey(event.type, this._listeners);
        if (priorities) {
          var list = Object.getOwnPropertyNames(priorities).sort(function(a, b) {
            return a - b;
          });
          var length = list.length;
          for (var index = 0; index < length; index++) {
            if (_stopped) break;
            var handlers = priorities[list[index]];
            var handlersLength = handlers.length;
            for (var handlersIndex = 0; handlersIndex < handlersLength; handlersIndex++) {
              if (_immediatelyStopped) break;
              var handler = handlers[handlersIndex];
              handler.call(target, event);
            }
          }
        }
        delete event.stopPropagation;
        delete event.stopImmediatePropagation;
        /*
         rmStopPropagation();
         rmStopImmediatePropagation();
         */
      }
    
      function createList(eventType, priority, target) {
        var priorities = getHashByKey(eventType, target, Object);
        return getHashByKey(parseInt(priority), priorities, Array);
      }
    
      function getHashByKey(key, target, definition) {
        var value = null;
        if (target.hasOwnProperty(key)) {
          value = target[key];
        } else if (definition) {
          value = target[key] = new definition();
        }
        return value;
      }
    
      function EventListeners() {
        /**
         * key - event Type
         * value - hash of priorities
         *    key - priority
         *    value - list of handlers
         * @type {Object<string, Object.<string, Array<number, Function>>>}
         * @private
         */
        this._listeners = {};
      }
    
      EventListeners.prototype.add = add;
      EventListeners.prototype.has = has;
      EventListeners.prototype.remove = remove;
      EventListeners.prototype.removeAll = removeAll;
      EventListeners.prototype.call = call;
    
      return EventListeners;
    })();
    
    var EVENTDISPATCHER_NOINIT = {};
    
    /**
     *
     * @param eventPreprocessor {?Function}
     * @constructor
     */
    var EventDispatcher = (function() {
    
      var LISTENERS_FIELD = Symbol('event.dispatcher::listeners');
    
      var PREPROCESSOR_FIELD = Symbol('event.dispatcher::preprocessor');
    
      function EventDispatcher(eventPreprocessor) {
        if (eventPreprocessor === EVENTDISPATCHER_NOINIT) {
          // create noinit prototype
          return;
        }
        /**
         * @type {EventListeners}
         */
        Object.defineProperty(this, LISTENERS_FIELD, {
          value: new EventListeners()
        });
        Object.defineProperty(this, PREPROCESSOR_FIELD, {
          value: eventPreprocessor
        });
      }
    
    
      function _addEventListener(eventType, listener, priority) {
        this[LISTENERS_FIELD].add(eventType, listener, -priority || 0);
      }
    
      function _hasEventListener(eventType) {
        return this[LISTENERS_FIELD].has(eventType);
      }
    
      function _removeEventListener(eventType, listener) {
        this[LISTENERS_FIELD].remove(eventType, listener);
      }
    
      function _removeAllEventListeners(eventType) {
        this[LISTENERS_FIELD].removeAll(eventType);
      }
    
      function _dispatchEvent(event, data) {
        var eventObject = EventDispatcher.getEvent(event, data);
        if (this[PREPROCESSOR_FIELD]) {
          eventObject = this[PREPROCESSOR_FIELD].call(this, eventObject);
        }
        this[LISTENERS_FIELD].call(eventObject);
      }
    
      EventDispatcher.prototype.addEventListener = _addEventListener;
      EventDispatcher.prototype.hasEventListener = _hasEventListener;
      EventDispatcher.prototype.removeEventListener = _removeEventListener;
      EventDispatcher.prototype.removeAllEventListeners = _removeAllEventListeners;
      EventDispatcher.prototype.dispatchEvent = _dispatchEvent;
    
      function EventDispatcher_isObject(value) {
        return (typeof value === 'object') && (value !== null);
      }
    
      function EventDispatcher_getEvent(eventOrType, optionalData) {
        var event = eventOrType;
        if (!EventDispatcher.isObject(eventOrType)) {
          event = new EventDispatcher.Event(String(eventOrType), optionalData);
        }
        return event;
      }
    
      function EventDispatcher_create(eventPreprocessor) {
        return new EventDispatcher(eventPreprocessor);
      }
    
      function EventDispatcher_createNoInitPrototype() {
        return new EventDispatcher(EVENTDISPATCHER_NOINIT);
      }
    
      /*
       function setupOptional(target, name, value) {
       var cleaner = null;
       if (name in target) {
       cleaner = function() {
       };
       } else {
       target[name] = value;
       cleaner = function() {
       delete target[name];
       };
       }
       return cleaner;
       }
       EventDispatcher.setupOptional = setupOptional;
       */
    
      EventDispatcher.isObject = EventDispatcher_isObject;
    
      EventDispatcher.getEvent = EventDispatcher_getEvent;
      EventDispatcher.create = EventDispatcher_create;
      EventDispatcher.createNoInitPrototype = EventDispatcher_createNoInitPrototype;
      EventDispatcher.Event = Event;
      return EventDispatcher;
    })();
    
    return EventDispatcher;
  })();
  var MessagePortDispatcher = (function() {
    /**
     * Created by Oleg Galaburda on 09.02.16.
     */
    
    var MessagePortEvent = (function() {
    
    
      function MessagePortEvent(event, dispatcherId) {
        this.event = event;
        this.dispatcherId = dispatcherId;
      }
    
      function toJSON() {
        return {
          event: MessagePortDispatcher.toJSON(this.event),
          dispatcherId: this.dispatcherId
        };
      }
    
      MessagePortEvent.prototype.toJSON = toJSON;
    
      function parse(object) {
        var result = MessagePortDispatcher.parse(object);
        if (MessagePortEvent.isEvent(result)) {
          result.event = MessagePortDispatcher.parse(result.event);
        } else {
          result = null;
        }
        return result;
      }
    
      MessagePortEvent.parse = parse;
    
      function isEvent(object) {
        return EventDispatcher.isObject(object) && object.hasOwnProperty('dispatcherId') && object.hasOwnProperty('event');
      }
    
      MessagePortEvent.isEvent = isEvent;
    
      return MessagePortEvent;
    })();
    
    /**
     *
     * @param target {Window|Worker|MessagePort}
     * @param customPostMessageHandler {?Function} Function that receive message object and pass it to MessagePort.postMessage()
     * @param receiverEventPreprocessor {?Function} Function that pre-process all events received from MessagePort, before passing to listeners
     * @param senderEventPreprocessor Function that pre-process all events sent to MessagePort
     * @constructor
     */
    var MessagePortDispatcher = (function() {
      var NOINIT = {};
      var HANDLERS_FIELD = Symbol('message.port.dispatcher::handlers');
    
      function MessagePortDispatcher(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) {
        if (target === NOINIT) {
          return;
        }
        target = target || self;
        this[HANDLERS_FIELD] = {
          customPostMessageHandler: customPostMessageHandler,
          senderEventPreprocessor: senderEventPreprocessor
        };
    
        Object.defineProperties(this, {
          /**
           * @type {EventDispatcher}
           */
          sender: {
            value: EventDispatcher.create()
          },
          /**
           * @type {EventDispatcher}
           */
          receiver: {
            value: EventDispatcher.create(receiverEventPreprocessor)
          },
          target: {
            value: target
          },
          dispatcherId: {
            value: 'MP/' + String(Math.ceil(Math.random() * 10000)) + '/' + String(Date.now())
          }
        });
    
        this.targetOrigin = '*';
        this.addEventListener = this.receiver.addEventListener.bind(this.receiver);
        this.hasEventListener = this.receiver.hasEventListener.bind(this.receiver);
        this.removeEventListener = this.receiver.removeEventListener.bind(this.receiver);
        this.removeAllEventListeners = this.receiver.removeAllEventListeners.bind(this.receiver);
    
        target.addEventListener('message', this._messageEventListener.bind(this));
      }
    
      function _dispatchEvent(event, data, transferList) {
        event = EventDispatcher.getEvent(event, data);
        if (this[HANDLERS_FIELD].senderEventPreprocessor) {
          event = this[HANDLERS_FIELD].senderEventPreprocessor.call(this, event);
        }
        var eventJson = MessagePortDispatcher.toJSON(new MessagePortEvent(event, this.dispatcherId));
        this._postMessageHandler(eventJson, transferList);
      }
    
      function __postMessageHandler(data, transferList) {
        var handler = this[HANDLERS_FIELD].customPostMessageHandler;
        if (handler) {
          handler.call(this, data, transferList);
        } else {
          this.target.postMessage(data, this.targetOrigin, transferList);
        }
      }
    
      function __messageEventListener(event) {
        var message = MessagePortEvent.parse(event.data);
        if (message) {
          if (message.dispatcherId === this.dispatcherId) {
            this.sender.dispatchEvent(message.event);
          } else {
            this.receiver.dispatchEvent(message.event);
          }
        }
      }
    
      MessagePortDispatcher.prototype = EventDispatcher.createNoInitPrototype();
      MessagePortDispatcher.prototype.constructor = MessagePortDispatcher;
      MessagePortDispatcher.prototype.dispatchEvent = _dispatchEvent;
      /**
       * @private
       */
      MessagePortDispatcher.prototype._messageEventListener = __messageEventListener;
      /**
       * @private
       */
      MessagePortDispatcher.prototype._postMessageHandler = __postMessageHandler;
    
      //----------------- static
    
      var _self = null;
      var _parent = null;
      var _top = null;
    
      function MessagePortDispatcher_toJSON(object) {
        var objectJson;
        if (typeof(object.toJSON) === 'function') {
          objectJson = object.toJSON();
        } else {
          objectJson = JSON.stringify(object);
        }
        return objectJson;
      }
    
      function MessagePortDispatcher_parse(data) {
        var object; // keep it undefined in case of error
        if (EventDispatcher.isObject(data)) {
          object = data;
        } else {
          try {
            object = JSON.parse(data);
          } catch (error) {
            // this isn't an event we are waiting for.
          }
        }
        return object;
      }
    
      function MessagePortDispatcher_self() {
        if (!_self) {
          _self = new MessagePortDispatcher(self);
        }
        return _self;
      }
    
      function MessagePortDispatcher_parent() {
        if (!_parent) {
          _parent = new MessagePortDispatcher(parent);
        }
        return _parent;
      }
    
      function MessagePortDispatcher_top() {
        if (!_top) {
          _top = new MessagePortDispatcher(top);
        }
        return _top;
      }
    
      function MessagePortDispatcher_create(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) {
        return new MessagePortDispatcher(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);
      }
    
      function MessagePortDispatcher_createNoInitPrototype() {
        return new MessagePortDispatcher(NOINIT);
      }
    
      /**
       * If toJSON method implemented on object, it will be called instead of converting to JSON string.
       * This was made to utilize structured cloning algorithm for raw objects.
       * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
       * In this case developer is responsible for converting linked objects.
       * @param object
       * @returns {Object|String}
       */
      MessagePortDispatcher.toJSON = MessagePortDispatcher_toJSON;
      /**
       *
       * @param data {Object|String}
       * @returns {Object}
       */
      MessagePortDispatcher.parse = MessagePortDispatcher_parse;
      /**
       * @returns {MessagePortDispatcher}
       */
      MessagePortDispatcher.self = MessagePortDispatcher_self;
      /**
       * @returns {MessagePortDispatcher}
       */
      MessagePortDispatcher.parent = MessagePortDispatcher_parent;
      /**
       * @returns {MessagePortDispatcher}
       */
      MessagePortDispatcher.top = MessagePortDispatcher_top;
      MessagePortDispatcher.create = MessagePortDispatcher_create;
      MessagePortDispatcher.createNoInitPrototype = MessagePortDispatcher_createNoInitPrototype;
    
      return MessagePortDispatcher;
    })();
    
    return MessagePortDispatcher;
  })();
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
      if (port === NOINIT) return;
      function postMessageHandler(data, transferList) {
        port.postMessage(data, transferList);
      }
  
      MessagePortDispatcher.call(this, port, postMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);
    }
  
    WorkerMessenger.prototype = MessagePortDispatcher.createNoInitPrototype();
    WorkerMessenger.prototype.constructor = WorkerMessenger;
  
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
    function createNoInitPrototype() {
      return new WorkerMessenger(NOINIT);
    }
  
    WorkerMessenger.createNoInitPrototype = createNoInitPrototype;
  
    WorkerMessenger.setAbstractWorkerHandlers = setAbstractWorkerHandlers;
    return WorkerMessenger;
  })();
  
  /**
   *
   * @param worker {String|Worker}
   * @param type {String}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @extends WorkerMessenger
   * @constructor
   */
  function WorkerEventDispatcher(worker, receiverEventPreprocessor, senderEventPreprocessor, type) {
    if (worker === NOINIT) {
      Object.defineProperties(this, {
        type: {
          value: type
        }
      });
    } else {
      Object.defineProperties(this, {
        type: {
          value: WorkerType.DEDICATED_WORKER
        }
      });
      DedicatedWorkerEventDispatcher.call(this, worker, receiverEventPreprocessor, senderEventPreprocessor);
    }
  }
  
  WorkerEventDispatcher.prototype = WorkerMessenger.createNoInitPrototype();
  WorkerEventDispatcher.prototype.constructor = WorkerEventDispatcher;
  
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
  
    this.addEventListener = _receiver.addEventListener.bind(_receiver);
    this.hasEventListener = _receiver.hasEventListener.bind(_receiver);
    this.removeEventListener = _receiver.removeEventListener.bind(_receiver);
    this.removeAllEventListeners = _receiver.removeAllEventListeners.bind(_receiver);
  
    WorkerMessenger.setScopeHandlers(_target, _receiver);
  
    Object.defineProperties(this, {
      receiver: {
        value: _receiver
      },
      target: {
        value: _target
      },
      type: {
        value: WorkerType.SHARED_WORKER_SERVER
      }
    });
  }
  
  ServerEventDispatcher.prototype = EventDispatcher.createNoInitPrototype();
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
  ClientEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, null, null, WorkerType.SHARED_WORKER_CLIENT);
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
  SharedWorkerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, null, null, WorkerType.SHARED_WORKER);
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
  DedicatedWorkerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, null, null, WorkerType.DEDICATED_WORKER);
  DedicatedWorkerEventDispatcher.prototype.constructor = DedicatedWorkerEventDispatcher;
  
  WorkerEventDispatcher.WorkerEvent = WorkerEvent;
  WorkerEventDispatcher.WorkerType = WorkerType;
  WorkerEventDispatcher.CONNECT_EVENT = WorkerEvent.CONNECT;
  WorkerEventDispatcher.DEDICATED_WORKER = WorkerType.DEDICATED_WORKER;
  WorkerEventDispatcher.SHARED_WORKER = WorkerType.SHARED_WORKER;
  
  WorkerEventDispatcher.DedicatedWorker = DedicatedWorkerEventDispatcher;
  WorkerEventDispatcher.SharedWorker = SharedWorkerEventDispatcher;
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
  };
  
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
