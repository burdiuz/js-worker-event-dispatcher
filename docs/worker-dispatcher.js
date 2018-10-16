(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WorkerDispatcher = {})));
}(this, (function (exports) { 'use strict';

  const WorkerType = {
    DEDICATED_WORKER: 'dedicated',
    SHARED_WORKER: 'shared',

    /**
     * @private
     */
    SHARED_WORKER_SERVER: 'sharedServer',

    /**
     * @private
     */
    SHARED_WORKER_CLIENT: 'sharedClient'
  };

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var hasOwn_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, '__esModule', { value: true });

  const hasOwn = (
    (has) =>
    (target, property) =>
    Boolean(target && has.call(target, property))
  )(Object.prototype.hasOwnProperty);

  exports.hasOwn = hasOwn;
  exports.default = hasOwn;
  });

  unwrapExports(hasOwn_1);
  var hasOwn_2 = hasOwn_1.hasOwn;

  var eventDispatcher = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, '__esModule', { value: true });

  function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

  var hasOwn = _interopDefault(hasOwn_1);

  /**
   *      
   */

  /* eslint-disable import/prefer-default-export */
  const isObject = value => typeof value === 'object' && value !== null;

  /**
   * Created by Oleg Galaburda on 09.02.16.
   *      
   */
  class Event {
    constructor(type, data = null) {
      this.type = type;
      this.data = data;
      this.defaultPrevented = false;
    }

    toJSON() {
      return {
        type: this.type,
        data: this.data
      };
    }

    isDefaultPrevented() {
      return this.defaultPrevented;
    }

    preventDefault() {
      this.defaultPrevented = true;
    }

  }
  const getEvent = (eventOrType, optionalData) => {
    let event = eventOrType;

    if (!isObject(eventOrType)) {
      event = new Event(String(eventOrType), optionalData);
    }

    return event;
  };

  /**
   * Created by Oleg Galaburda on 09.02.16.
   *      
   */
  class ListenersRunner {
    constructor(listeners, onStopped, onComplete) {
      this.index = -1;
      this.immediatelyStopped = false;

      this.stopImmediatePropagation = () => {
        this.immediatelyStopped = true;
      };

      this.listeners = listeners;
      this.onStopped = onStopped;
      this.onComplete = onComplete;
    }

    run(event, target) {
      let listener;
      const {
        listeners
      } = this;
      this.augmentEvent(event); // TODO this has to be handled in separate object ListenersRunner that should be
      // created for each call() call and asked for index validation on each listener remove.

      for (this.index = 0; this.index < listeners.length; this.index++) {
        if (this.immediatelyStopped) break;
        listener = listeners[this.index];
        listener.call(target, event);
      }

      this.clearEvent(event);
      this.onComplete(this);
    }

    augmentEvent(eventObject) {
      const event = eventObject;
      event.stopPropagation = this.onStopped;
      event.stopImmediatePropagation = this.stopImmediatePropagation;
    }
    /* eslint class-methods-use-this: "off" */


    clearEvent(eventObject) {
      const event = eventObject;
      delete event.stopPropagation;
      delete event.stopImmediatePropagation;
    }

    listenerRemoved(listeners, index) {
      if (listeners === this.listeners && index <= this.index) {
        this.index--;
      }
    }

  }

  /**
   * Created by Oleg Galaburda on 09.02.16.
   *      
   */
  class EventListeners {
    constructor() {
      this._listeners = {};
      this._runners = [];

      this.removeRunner = runner => {
        this._runners.splice(this._runners.indexOf(runner), 1);
      };
    }

    createList(eventType, priorityOpt) {
      const priority = parseInt(priorityOpt, 10);
      const target = this.getPrioritiesByKey(eventType);
      const key = String(priority);
      let value;

      if (hasOwn(target, key)) {
        value = target[key];
      } else {
        value = [];
        target[key] = value;
      }

      return value;
    }

    getPrioritiesByKey(key) {
      let value;

      if (hasOwn(this._listeners, key)) {
        value = this._listeners[key];
      } else {
        value = {};
        this._listeners[key] = value;
      }

      return value;
    }

    add(eventType, handler, priority) {
      const handlers = this.createList(eventType, priority);

      if (handlers.indexOf(handler) < 0) {
        handlers.push(handler);
      }
    }

    has(eventType) {
      let priority;
      let result = false;
      const priorities = this.getPrioritiesByKey(eventType);

      if (priorities) {
        for (priority in priorities) {
          if (hasOwn(priorities, priority)) {
            result = true;
            break;
          }
        }
      }

      return result;
    }

    remove(eventType, handler) {
      const priorities = this.getPrioritiesByKey(eventType);

      if (priorities) {
        const list = Object.getOwnPropertyNames(priorities);
        const {
          length
        } = list;

        for (let index = 0; index < length; index++) {
          const priority = list[index];
          const handlers = priorities[priority];
          const handlerIndex = handlers.indexOf(handler);

          if (handlerIndex >= 0) {
            handlers.splice(handlerIndex, 1);

            if (!handlers.length) {
              delete priorities[priority];
            }

            this._runners.forEach(runner => {
              runner.listenerRemoved(handlers, handlerIndex);
            });
          }
        }
      }
    }

    removeAll(eventType) {
      delete this._listeners[eventType];
    }

    createRunner(handlers, onStopped) {
      const runner = new ListenersRunner(handlers, onStopped, this.removeRunner);

      this._runners.push(runner);

      return runner;
    }

    call(event, target) {
      const priorities = this.getPrioritiesByKey(event.type);
      let stopped = false;

      const stopPropagation = () => {
        stopped = true;
      };

      if (priorities) {
        // getOwnPropertyNames() or keys()?
        const list = Object.getOwnPropertyNames(priorities).sort((a, b) => a - b);
        const {
          length
        } = list;

        for (let index = 0; index < length; index++) {
          if (stopped) break;
          const handlers = priorities[list[index]]; // in case if all handlers of priority were removed while event
          // was dispatched and handlers become undefined.

          if (handlers) {
            const runner = this.createRunner(handlers, stopPropagation);
            runner.run(event, target);
            if (runner.immediatelyStopped) break;
          }
        }
      }
    }

  }

  /**
   * Created by Oleg Galaburda on 09.02.16.
   *      
   */

  class EventDispatcher {
    constructor(eventPreprocessor = null) {
      this._eventPreprocessor = eventPreprocessor;
      this._listeners = new EventListeners();
    }

    addEventListener(eventType, listener, priority = 0) {
      this._listeners.add(eventType, listener, -priority || 0);
    }

    hasEventListener(eventType) {
      return this._listeners.has(eventType);
    }

    removeEventListener(eventType, listener) {
      this._listeners.remove(eventType, listener);
    }

    removeAllEventListeners(eventType) {
      this._listeners.removeAll(eventType);
    }

    dispatchEvent(event, data) {
      let eventObject = getEvent(event, data);

      if (this._eventPreprocessor) {
        eventObject = this._eventPreprocessor.call(this, eventObject);
      }

      this._listeners.call(eventObject);
    }

  }

  const createEventDispatcher = eventPreprocessor => new EventDispatcher(eventPreprocessor);

  exports.default = EventDispatcher;
  exports.Event = Event;
  exports.EventDispatcher = EventDispatcher;
  exports.createEventDispatcher = createEventDispatcher;
  exports.getEvent = getEvent;
  exports.isObject = isObject;

  });

  unwrapExports(eventDispatcher);
  var eventDispatcher_1 = eventDispatcher.Event;
  var eventDispatcher_2 = eventDispatcher.EventDispatcher;
  var eventDispatcher_3 = eventDispatcher.createEventDispatcher;
  var eventDispatcher_4 = eventDispatcher.getEvent;
  var eventDispatcher_5 = eventDispatcher.isObject;

  const NativeEventTypes = {
    CONNECT: 'connect',
    MESSAGE: 'message',
    ERROR: 'error',
    LANGUAGECHANGE: 'languagechange',
    ONLINE: 'online',
    OFFLINE: 'offline'
  };

  class WorkerEvent extends eventDispatcher_1 {
    constructor(type, data, sourceEvent, client) {
      super(type, data);
      this.sourceEvent = sourceEvent;
      this.client = client;
    }

  }

  WorkerEvent.CONNECT = 'worker:connect';
  WorkerEvent.MESSAGE = 'worker:message';
  WorkerEvent.ERROR = 'worker:error';
  WorkerEvent.LANGUAGECHANGE = 'worker:languagechange';
  WorkerEvent.ONLINE = 'worker:online';
  WorkerEvent.OFFLINE = 'worker:offline';
  const getWorkerEventType = type => {
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
  const dispatchWorkerEvent = (type, source, target) => {
    const eventType = getWorkerEventType(type);

    const handler = event => {
      if (target.hasEventListener(eventType)) {
        target.dispatchEvent(new WorkerEvent(eventType, event, event));
      }
    };

    source.addEventListener(type, handler);
    return handler;
  };
  const dispatchWorkerEvents = (source, target) => {
    dispatchWorkerEvent(NativeEventTypes.ERROR, source, target);
    dispatchWorkerEvent(NativeEventTypes.LANGUAGECHANGE, source, target);
    dispatchWorkerEvent(NativeEventTypes.ONLINE, source, target);
    dispatchWorkerEvent(NativeEventTypes.OFFLINE, source, target);
  };
  const dispatchWorkerErrorEvent = (source, target) => {
    dispatchWorkerEvent(NativeEventTypes.ERROR, source, target);
  };

  var messageportDispatcher = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, '__esModule', { value: true });

  function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }


  var hasOwn = _interopDefault(hasOwn_1);

  /**
   * Created by Oleg Galaburda on 09.02.16.
   */
  const createId = () => `MP/${Math.ceil(Math.random() * 10000)}/${Date.now()}`;
  /**
   * If toJSON method implemented on object, it will be called instead of converting to JSON string.
   * This was made to utilize structured cloning algorithm for raw objects.
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
   * In this case developer is responsible for converting linked objects.
   * @param object
   * @returns {Object}
   */

  const toRawData = object => {
    if (typeof object.toJSON === 'function') {
      return object.toJSON();
    }

    return JSON.stringify(object);
  };
  /**
   *
   * @param data {Object|String}
   * @returns {Object}
   */

  const parseRawData = data => {
    let object; // keep it undefined in case of error

    if (eventDispatcher.isObject(data)) {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch (error) {// this isn't an event we are waiting for.
    }

    return object;
  };

  /**
   * Created by Oleg Galaburda on 09.02.16.
   */
  class MessagePortEvent {
    constructor(event, dispatcherId) {
      this.event = event;
      this.dispatcherId = dispatcherId;
    }

    toJSON() {
      return {
        event: toRawData(this.event),
        dispatcherId: this.dispatcherId
      };
    }

  }
  const isMessagePortEvent = object => eventDispatcher.isObject(object) && hasOwn(object, 'dispatcherId') && hasOwn(object, 'event');
  const parseMessagePortEvent = object => {
    const result = parseRawData(object);

    if (result && isMessagePortEvent(result)) {
      const {
        event,
        dispatcherId
      } = result;
      return new MessagePortEvent(parseRawData(event), dispatcherId);
    }

    return null;
  };

  /**
   * Created by Oleg Galaburda on 09.02.16.
   */
  class MessagePortDispatcher {
    constructor(target = null, customPostMessageHandler = null, receiverEventPreprocessor = null, senderEventPreprocessor = null) {
      this.dispatcherId = createId();
      this.targetOrigin = '*';
      this.target = target || self;
      this.customPostMessageHandler = customPostMessageHandler;
      this.senderEventPreprocessor = senderEventPreprocessor;
      this.sender = eventDispatcher.createEventDispatcher();
      this.receiver = eventDispatcher.createEventDispatcher(receiverEventPreprocessor);
      this.target.addEventListener('message', event => this._postMessageListener(event));
    }

    addEventListener(eventType, listener, priority) {
      this.receiver.addEventListener(eventType, listener, priority);
    }

    hasEventListener(eventType) {
      return this.receiver.hasEventListener(eventType);
    }

    removeEventListener(eventType, listener) {
      this.receiver.removeEventListener(eventType, listener);
    }

    removeAllEventListeners(eventType) {
      this.receiver.removeAllEventListeners(eventType);
    }

    dispatchEvent(eventType, data, transferList) {
      let event = eventDispatcher.getEvent(eventType, data);

      if (this.senderEventPreprocessor) {
        event = this.senderEventPreprocessor.call(this, event);
      }

      const eventJson = toRawData(new MessagePortEvent(event, this.dispatcherId));
      return this._postMessageHandler(eventJson, transferList);
    }
    /**
     * @private
     */


    _postMessageHandler(data, transferList) {
      const handler = this.customPostMessageHandler;

      if (handler) {
        return handler.call(this, data, this.targetOrigin, transferList);
      }

      return this.target.postMessage(data, this.targetOrigin, transferList);
    }
    /**
     * @private
     */


    _postMessageListener(event) {
      // INFO .nativeEvent react-native thing, it contains event object coming from WebView
      event = event.nativeEvent || event;
      const message = parseMessagePortEvent(event.data);

      if (message) {
        if (message.dispatcherId === this.dispatcherId) {
          this.sender.dispatchEvent(message.event);
        } else {
          this.receiver.dispatchEvent(message.event);
        }
      }
    }

  }
  const createMessagePortDispatcher = (target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) => new MessagePortDispatcher(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);
  const factory = (getTarget, dispatcher = null) => () => {
    if (!dispatcher) {
      dispatcher = createMessagePortDispatcher(getTarget());
    }

    return dispatcher;
  };
  const getForSelf = factory(() => self);
  const getForParent = factory(() => parent);
  const getForTop = factory(() => top);

  exports.default = MessagePortDispatcher;
  exports.MessagePortDispatcher = MessagePortDispatcher;
  exports.MessagePortEvent = MessagePortEvent;
  exports.factory = factory;
  exports.getForSelf = getForSelf;
  exports.getForParent = getForParent;
  exports.getForTop = getForTop;
  exports.createMessagePortDispatcher = createMessagePortDispatcher;

  });

  var MessagePortDispatcher = unwrapExports(messageportDispatcher);
  var messageportDispatcher_1 = messageportDispatcher.MessagePortDispatcher;
  var messageportDispatcher_2 = messageportDispatcher.MessagePortEvent;
  var messageportDispatcher_3 = messageportDispatcher.factory;
  var messageportDispatcher_4 = messageportDispatcher.getForSelf;
  var messageportDispatcher_5 = messageportDispatcher.getForParent;
  var messageportDispatcher_6 = messageportDispatcher.getForTop;
  var messageportDispatcher_7 = messageportDispatcher.createMessagePortDispatcher;

  /**
   *
   * @param target {String|Worker}
   * @param customPostMessageHandler {?Function}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @extends MessagePortDispatcher
   * @constructor
   */

  class AbstractDispatcher extends MessagePortDispatcher {
    constructor(type, target, receiverEventPreprocessor = null, senderEventPreprocessor = null) {
      super(target, (data, targetOrigin, transferList) => target.postMessage(data, transferList), receiverEventPreprocessor, senderEventPreprocessor);
      this.type = type;
    }

  }

  const getTarget = worker => {
    // eslint-disable-next-line no-restricted-globals
    let target = worker || self;

    if (!eventDispatcher_5(target)) {
      target = new Worker(String(worker));
    }

    return target;
  };
  /**
   *
   * @param target {Worker|String}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @extends MessagePortDispatcher
   * @constructor
   */


  class DedicatedWorkerDispatcher extends AbstractDispatcher {
    constructor(worker, receiverEventPreprocessor, senderEventPreprocessor) {
      super(WorkerType.DEDICATED_WORKER, getTarget(worker), receiverEventPreprocessor, senderEventPreprocessor);
      dispatchWorkerEvents(this.target, this.receiver);
    }

    terminate() {
      return this.target.terminate();
    }

  }

  const getTarget$1 = (target, name) => {
    if (!eventDispatcher_5(target)) {
      return new SharedWorker(String(target), name);
    }

    return target;
  };
  /**
   *
   * @param worker {SharedWorker}
   * @param name {String}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @extends WorkerMessenger
   * @constructor
   */


  class SharedWorkerDispatcher extends AbstractDispatcher {
    constructor(target, name, receiverEventPreprocessor, senderEventPreprocessor) {
      const worker = getTarget$1(target, name);
      super(WorkerType.SHARED_WORKER, worker.port, receiverEventPreprocessor, senderEventPreprocessor);
      this.worker = worker;
      dispatchWorkerErrorEvent(this.worker, this.receiver);
    }

    start() {
      this.target.start();
    }

    close() {
      this.target.close();
    }

  }

  /**
   * @param target {MessagePort}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @extends MessagePortDispatcher
   * @constructor
   */

  class ClientDispatcher extends AbstractDispatcher {
    constructor(target, receiverEventPreprocessor, senderEventPreprocessor) {
      super(WorkerType.SHARED_WORKER_CLIENT, target, receiverEventPreprocessor, senderEventPreprocessor);
    }

    start() {
      this.target.start();
    }

    close() {
      this.target.close();
    }

  }

  /**
   * Read-only interface, mainly will listen to "connect" event.
   * You should listen to WorkerEvent.CONNECT to intercept client
   * instance to be able to communicate.
   * @param worker
   * @param receiverEventPreprocessor {?Function}
   * @constructor
   */

  class ServerDispatcher {
    constructor(target = self, // eslint-disable-line no-restricted-globals
    receiverEventPreprocessor, clientReceiverEventPreprocessor, clientSenderEventPreprocessor) {
      _initialiseProps.call(this);

      this.type = WorkerType.SHARED_WORKER_SERVER;
      this.target = target;

      this.clientFactory = client => new ClientDispatcher(client, clientReceiverEventPreprocessor, clientSenderEventPreprocessor);

      this.receiver = eventDispatcher_3(receiverEventPreprocessor);
      this.target.addEventListener('connect', this.handleConnect);
      dispatchWorkerEvents(this.target, this.receiver);
    }

  }

  var _initialiseProps = function () {
    this.addEventListener = (...args) => this.receiver.addEventListener(...args);

    this.hasEventListener = (...args) => this.receiver.hasEventListener(...args);

    this.removeEventListener = (...args) => this.receiver.removeEventListener(...args);

    this.removeAllEventListeners = (...args) => this.receiver.removeAllEventListeners(...args);

    this.handleConnect = event => {
      const [target] = event.ports;
      const client = this.clientFactory(target);
      this.receiver.dispatchEvent(new WorkerEvent(WorkerEvent.CONNECT, client, event, client));
    };
  };

  /**
   *
   * @param worker {String|Worker|SharedWorker|MessagePort}
   * @param type {String}
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @returns {AbstractDispatcher}
   */

  const create = (target, type, receiverEventPreprocessor, senderEventPreprocessor) => {
    let dispatcher = null;

    switch (type) {
      default:
      case WorkerType.DEDICATED_WORKER:
        dispatcher = new DedicatedWorkerDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
        break;

      case WorkerType.SHARED_WORKER:
        dispatcher = new SharedWorkerDispatcher(target, null, receiverEventPreprocessor, senderEventPreprocessor);
        break;

      case WorkerType.SHARED_WORKER_SERVER:
        dispatcher = new ServerDispatcher(target, receiverEventPreprocessor);
        break;

      case WorkerType.SHARED_WORKER_CLIENT:
        dispatcher = new ClientDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
        break;
    }

    return dispatcher;
  };
  /**
   *
   * @param receiverEventPreprocessor {?Function}
   * @param senderEventPreprocessor {?Function}
   * @returns {AbstractDispatcher}
   */

  const createForSelf = (receiverEventPreprocessor, senderEventPreprocessor) => {
    /* eslint-disable no-restricted-globals */
    let dispatcher = null;

    if (typeof self.postMessage === 'function') {
      dispatcher = new DedicatedWorkerDispatcher(self, receiverEventPreprocessor, senderEventPreprocessor);
    } else {
      dispatcher = new ServerDispatcher(self, receiverEventPreprocessor);
    }

    return dispatcher;
    /* eslint-enable no-restricted-globals */
  };

  const CONNECT_EVENT = WorkerEvent.CONNECT;
  const {
    DEDICATED_WORKER
  } = WorkerType;
  const {
    SHARED_WORKER
  } = WorkerType;

  exports.default = DedicatedWorkerDispatcher;
  exports.create = create;
  exports.createForSelf = createForSelf;
  exports.CONNECT_EVENT = CONNECT_EVENT;
  exports.DEDICATED_WORKER = DEDICATED_WORKER;
  exports.SHARED_WORKER = SHARED_WORKER;
  exports.WorkerEvent = WorkerEvent;
  exports.WorkerType = WorkerType;
  exports.ClientDispatcher = ClientDispatcher;
  exports.ServerDispatcher = ServerDispatcher;
  exports.SharedWorkerDispatcher = SharedWorkerDispatcher;
  exports.DedicatedWorkerDispatcher = DedicatedWorkerDispatcher;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=worker-dispatcher.js.map
