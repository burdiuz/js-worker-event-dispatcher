(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.EventDispatcher = {})));
}(this, (function (exports) { 'use strict';

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

  var hasOwn = unwrapExports(hasOwn_1);
  var hasOwn_2 = hasOwn_1.hasOwn;

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

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=event-dispatcher.js.map
