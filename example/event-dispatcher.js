(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.EventDispatcher = {}));
})(this, (function (exports) { 'use strict';

    const isObject = (value) => typeof value === 'object' && value !== null;

    class Event {
        constructor(type, data = null) {
            this.defaultPrevented = false;
            this.type = type;
            this.data = data;
        }
        toJSON() {
            return { type: this.type, data: this.data };
        }
        isDefaultPrevented() {
            return this.defaultPrevented;
        }
        preventDefault() {
            this.defaultPrevented = true;
        }
    }
    const getEvent = (eventOrType, optionalData) => {
        if (!isObject(eventOrType)) {
            return new Event(String(eventOrType), optionalData);
        }
        return eventOrType;
    };

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
        run(event) {
            const dispatched = event;
            dispatched.stopPropagation = this.onStopped;
            dispatched.stopImmediatePropagation = this.stopImmediatePropagation;
            for (this.index = 0; this.index < this.listeners.length; this.index++) {
                if (this.immediatelyStopped)
                    break;
                this.listeners[this.index](dispatched);
            }
            delete event.stopPropagation;
            delete event.stopImmediatePropagation;
            this.onComplete(this);
        }
        listenerRemoved(listeners, index) {
            if (listeners === this.listeners && index <= this.index) {
                this.index--;
            }
        }
    }

    class EventListeners {
        constructor() {
            this._listeners = {};
            this._runners = [];
            this.removeRunner = (runner) => {
                this._runners.splice(this._runners.indexOf(runner), 1);
            };
        }
        createList(eventType, priority) {
            const target = this.getPrioritiesByKey(eventType);
            const key = String(priority);
            if (Object.hasOwn(target, key)) {
                return target[key];
            }
            const value = [];
            target[key] = value;
            return value;
        }
        getPrioritiesByKey(key) {
            if (Object.hasOwn(this._listeners, key)) {
                return this._listeners[key];
            }
            const value = {};
            this._listeners[key] = value;
            return value;
        }
        add(eventType, handler, priority) {
            const handlers = this.createList(eventType, priority);
            if (handlers.indexOf(handler) < 0) {
                handlers.push(handler);
            }
        }
        has(eventType) {
            if (!Object.hasOwn(this._listeners, eventType)) {
                return false;
            }
            return Object.keys(this._listeners[eventType]).length > 0;
        }
        remove(eventType, handler) {
            if (!Object.hasOwn(this._listeners, eventType)) {
                return;
            }
            const priorities = this._listeners[eventType];
            const list = Object.getOwnPropertyNames(priorities);
            for (const priority of list) {
                const handlers = priorities[priority];
                const handlerIndex = handlers.indexOf(handler);
                if (handlerIndex >= 0) {
                    handlers.splice(handlerIndex, 1);
                    if (!handlers.length) {
                        delete priorities[priority];
                    }
                    this._runners.forEach((runner) => {
                        runner.listenerRemoved(handlers, handlerIndex);
                    });
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
        call(event) {
            if (!Object.hasOwn(this._listeners, event.type)) {
                return;
            }
            const priorities = this._listeners[event.type];
            let stopped = false;
            const stopPropagation = () => {
                stopped = true;
            };
            const list = Object.getOwnPropertyNames(priorities).sort((a, b) => Number(a) - Number(b));
            for (const key of list) {
                if (stopped)
                    break;
                const handlers = priorities[key];
                if (handlers) {
                    const runner = this.createRunner(handlers, stopPropagation);
                    runner.run(event);
                    if (runner.immediatelyStopped)
                        break;
                }
            }
        }
    }

    class EventDispatcher {
        constructor(eventPreprocessor = null) {
            this._eventPreprocessor = eventPreprocessor;
            this._listeners = new EventListeners();
        }
        addEventListener(eventType, listener, priority = 0) {
            // Negate priority so higher values sort first (ascending sort order in EventListeners)
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
    const createEventDispatcher = (eventPreprocessor) => new EventDispatcher(eventPreprocessor ?? null);

    exports.Event = Event;
    exports.EventDispatcher = EventDispatcher;
    exports.createEventDispatcher = createEventDispatcher;
    exports.default = EventDispatcher;
    exports.getEvent = getEvent;
    exports.isObject = isObject;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=event-dispatcher.js.map
