(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WorkerDispatcher = {}));
})(this, (function (exports) { 'use strict';

    const WorkerType = {
        DEDICATED_WORKER: 'dedicated',
        SHARED_WORKER: 'shared',
        /** @private */
        SHARED_WORKER_SERVER: 'sharedServer',
        /** @private */
        SHARED_WORKER_CLIENT: 'sharedClient',
        SERVICE_WORKER: 'service',
        /** @private */
        SERVICE_WORKER_SERVER: 'serviceServer',
        /** @private */
        SERVICE_WORKER_CLIENT: 'serviceClient',
    };

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    var eventDispatcher = {};

    var hasRequiredEventDispatcher;

    function requireEventDispatcher () {
    	if (hasRequiredEventDispatcher) return eventDispatcher;
    	hasRequiredEventDispatcher = 1;

    	Object.defineProperty(eventDispatcher, '__esModule', { value: true });

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

    	eventDispatcher.Event = Event;
    	eventDispatcher.EventDispatcher = EventDispatcher;
    	eventDispatcher.createEventDispatcher = createEventDispatcher;
    	eventDispatcher.default = EventDispatcher;
    	eventDispatcher.getEvent = getEvent;
    	eventDispatcher.isObject = isObject;
    	
    	return eventDispatcher;
    }

    var eventDispatcherExports = requireEventDispatcher();

    const NativeEventType = {
        CONNECT: 'connect',
        MESSAGE: 'message',
        ERROR: 'error',
        MESSAGEERROR: 'messageerror',
        LANGUAGECHANGE: 'languagechange',
        ONLINE: 'online',
        OFFLINE: 'offline',
        INSTALL: 'install',
        ACTIVATE: 'activate',
        FETCH: 'fetch',
        SYNC: 'sync',
        PUSH: 'push',
    };
    class WorkerEvent extends eventDispatcherExports.Event {
        constructor(type, data, nativeEvent, client) {
            super(type, data);
            this.nativeEvent = nativeEvent;
            this.client = client ?? null;
        }
    }
    WorkerEvent.CONNECT = 'worker:connect';
    WorkerEvent.MESSAGE = 'worker:message';
    WorkerEvent.ERROR = 'worker:error';
    WorkerEvent.MESSAGEERROR = 'worker:messageerror';
    WorkerEvent.LANGUAGECHANGE = 'worker:languagechange';
    WorkerEvent.ONLINE = 'worker:online';
    WorkerEvent.OFFLINE = 'worker:offline';
    WorkerEvent.INSTALL = 'worker:install';
    WorkerEvent.ACTIVATE = 'worker:activate';
    WorkerEvent.FETCH = 'worker:fetch';
    WorkerEvent.SYNC = 'worker:sync';
    WorkerEvent.PUSH = 'worker:push';
    const getWorkerEventType = (type) => {
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
    const dispatchWorkerEvent = (type, source, target) => {
        const eventType = getWorkerEventType(type);
        const handler = (event) => {
            if (target.hasEventListener(eventType)) {
                target.dispatchEvent(new WorkerEvent(eventType, event, event));
            }
        };
        source.addEventListener(type, handler);
        return () => source.removeEventListener(type, handler);
    };
    const dispatchWorkerEvents = (source, target) => {
        const cleanups = [
            dispatchWorkerEvent(NativeEventType.ERROR, source, target),
            dispatchWorkerEvent(NativeEventType.LANGUAGECHANGE, source, target),
            dispatchWorkerEvent(NativeEventType.ONLINE, source, target),
            dispatchWorkerEvent(NativeEventType.OFFLINE, source, target),
        ];
        return () => cleanups.forEach((fn) => fn());
    };
    const dispatchServiceWorkerEvents = (source, target) => {
        const cleanups = [
            dispatchWorkerEvent(NativeEventType.INSTALL, source, target),
            dispatchWorkerEvent(NativeEventType.ACTIVATE, source, target),
            dispatchWorkerEvent(NativeEventType.FETCH, source, target),
            dispatchWorkerEvent(NativeEventType.SYNC, source, target),
            dispatchWorkerEvent(NativeEventType.PUSH, source, target),
        ];
        return () => cleanups.forEach((fn) => fn());
    };
    const dispatchWorkerErrorEvent = (source, target) => {
        const cleanups = [
            dispatchWorkerEvent(NativeEventType.ERROR, source, target),
            dispatchWorkerEvent(NativeEventType.MESSAGEERROR, source, target),
        ];
        return () => cleanups.forEach((fn) => fn());
    };

    var messageportDispatcher = {};

    var hasRequiredMessageportDispatcher;

    function requireMessageportDispatcher () {
    	if (hasRequiredMessageportDispatcher) return messageportDispatcher;
    	hasRequiredMessageportDispatcher = 1;

    	Object.defineProperty(messageportDispatcher, '__esModule', { value: true });

    	var eventDispatcher = requireEventDispatcher();

    	/* eslint-disable @typescript-eslint/no-explicit-any */
    	class MessagePortTarget {
    	    constructor(sender, receiver) {
    	        this.sender = sender ? (Array.isArray(sender) ? sender : [sender]) : [];
    	        this.receiver = receiver ? (Array.isArray(receiver) ? receiver : [receiver]) : [];
    	    }
    	    postMessage(...args) {
    	        this.sender.forEach((item) => item.postMessage(...args));
    	    }
    	    addEventListener(type, handler) {
    	        this.receiver.forEach((item) => item.addEventListener(type, handler));
    	    }
    	    removeEventListener(type, handler) {
    	        this.receiver.forEach((item) => item.removeEventListener(type, handler));
    	    }
    	}

    	const isObject = (value) => typeof value === 'object' && value !== null;
    	const createId = () => `MP/${Math.ceil(Math.random() * 10000)}/${Date.now()}`;
    	/**
    	 * If toJSON method is implemented on the object, it will be called instead of converting to a
    	 * JSON string. This utilises the structured cloning algorithm for raw objects.
    	 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
    	 * In this case the developer is responsible for converting nested objects.
    	 */
    	const toRawData = (object) => {
    	    if (typeof object.toJSON === 'function') {
    	        return object.toJSON();
    	    }
    	    return JSON.stringify(object);
    	};
    	const parseRawData = (data) => {
    	    if (isObject(data)) {
    	        return data;
    	    }
    	    try {
    	        return JSON.parse(data);
    	    }
    	    catch {
    	        // not a valid JSON event
    	    }
    	    return undefined;
    	};

    	class MessagePortEvent {
    	    constructor(event, dispatcherId) {
    	        this.event = event;
    	        this.dispatcherId = dispatcherId;
    	    }
    	    toJSON() {
    	        return {
    	            event: toRawData(this.event),
    	            dispatcherId: this.dispatcherId,
    	        };
    	    }
    	}
    	const isMessagePortEvent = (object) => typeof object === 'object' &&
    	    object !== null &&
    	    Object.hasOwn(object, 'dispatcherId') &&
    	    Object.hasOwn(object, 'event');
    	const parseMessagePortEvent = (object) => {
    	    const result = parseRawData(object);
    	    if (result && isMessagePortEvent(result)) {
    	        const { event, dispatcherId } = result;
    	        return new MessagePortEvent(parseRawData(event), dispatcherId);
    	    }
    	    return null;
    	};

    	/* eslint-disable no-restricted-globals, @typescript-eslint/no-explicit-any */
    	class MessagePortDispatcher {
    	    constructor(target = null, customPostMessageHandler = null, receiverEventPreprocessor = null, senderEventPreprocessor = null) {
    	        this.dispatcherId = createId();
    	        this.targetOrigin = '*';
    	        this.target = target ?? self;
    	        this.customPostMessageHandler = customPostMessageHandler;
    	        this.senderEventPreprocessor = senderEventPreprocessor;
    	        this.sender = eventDispatcher.createEventDispatcher();
    	        this.receiver = eventDispatcher.createEventDispatcher(receiverEventPreprocessor ?? undefined);
    	        this.target.addEventListener('message', (event) => this._postMessageListener(event));
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
    	        let event = typeof eventType === 'string' ? { type: eventType, data } : eventType;
    	        if (this.senderEventPreprocessor) {
    	            event = this.senderEventPreprocessor(event);
    	        }
    	        const eventJson = toRawData(new MessagePortEvent(event, this.dispatcherId));
    	        this._postMessageHandler(eventJson, transferList);
    	    }
    	    _postMessageHandler(data, transferList) {
    	        const handler = this.customPostMessageHandler;
    	        if (handler) {
    	            handler.call(this, data, this.targetOrigin, transferList);
    	            return;
    	        }
    	        this.target.postMessage(data, this.targetOrigin, transferList);
    	    }
    	    _postMessageListener(event) {
    	        // .nativeEvent is a React Native property containing the event from WebView
    	        const nativeEvent = event.nativeEvent ?? event;
    	        const message = parseMessagePortEvent(nativeEvent.data);
    	        if (message) {
    	            if (message.dispatcherId === this.dispatcherId) {
    	                this.sender.dispatchEvent(message.event);
    	            }
    	            else {
    	                this.receiver.dispatchEvent(message.event);
    	            }
    	        }
    	    }
    	}
    	const createMessagePortDispatcher = (target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) => new MessagePortDispatcher(target ?? null, customPostMessageHandler ?? null, receiverEventPreprocessor ?? null, senderEventPreprocessor ?? null);
    	const factory = (getTarget) => {
    	    let dispatcher = null;
    	    return () => {
    	        if (!dispatcher) {
    	            dispatcher = createMessagePortDispatcher(getTarget());
    	        }
    	        return dispatcher;
    	    };
    	};
    	const getForSelf = factory(() => self);
    	const getForParent = factory(() => parent);
    	const getForTop = factory(() => top);

    	messageportDispatcher.MessagePortDispatcher = MessagePortDispatcher;
    	messageportDispatcher.MessagePortEvent = MessagePortEvent;
    	messageportDispatcher.MessagePortTarget = MessagePortTarget;
    	messageportDispatcher.createMessagePortDispatcher = createMessagePortDispatcher;
    	messageportDispatcher.default = MessagePortDispatcher;
    	messageportDispatcher.getForParent = getForParent;
    	messageportDispatcher.getForSelf = getForSelf;
    	messageportDispatcher.getForTop = getForTop;
    	messageportDispatcher.isMessagePortEvent = isMessagePortEvent;
    	messageportDispatcher.parseMessagePortEvent = parseMessagePortEvent;
    	
    	return messageportDispatcher;
    }

    var messageportDispatcherExports = requireMessageportDispatcher();
    var MessagePortDispatcher = /*@__PURE__*/getDefaultExportFromCjs(messageportDispatcherExports);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    class AbstractDispatcher extends MessagePortDispatcher {
        constructor(type, target, receiverEventPreprocessor = null, senderEventPreprocessor = null) {
            super(target, (_data, _targetOrigin, _transferList) => {
                target.postMessage(_data, _transferList);
            }, receiverEventPreprocessor, senderEventPreprocessor);
            this.type = type;
        }
    }

    const getTarget$1 = (worker) => {
        // eslint-disable-next-line no-restricted-globals
        const target = worker ?? self;
        if (!eventDispatcherExports.isObject(target)) {
            return new Worker(String(worker));
        }
        return target;
    };
    class DedicatedWorkerDispatcher extends AbstractDispatcher {
        constructor(worker, receiverEventPreprocessor, senderEventPreprocessor) {
            const target = getTarget$1(worker);
            super(WorkerType.DEDICATED_WORKER, target, receiverEventPreprocessor ?? null, senderEventPreprocessor ?? null);
            this._cleanup = dispatchWorkerEvents(this.target, this.receiver);
        }
        terminate() {
            this._cleanup();
            this.target.terminate();
        }
    }

    const getTarget = (target, name) => {
        if (!eventDispatcherExports.isObject(target)) {
            return new SharedWorker(String(target), name);
        }
        return target;
    };
    class SharedWorkerDispatcher extends AbstractDispatcher {
        constructor(target, name, receiverEventPreprocessor, senderEventPreprocessor) {
            const worker = getTarget(target, name);
            super(WorkerType.SHARED_WORKER, worker.port, receiverEventPreprocessor ?? null, senderEventPreprocessor ?? null);
            this.worker = worker;
            this._cleanup = dispatchWorkerErrorEvent(this.worker, this.receiver);
            this.start();
        }
        start() {
            this.target.start();
        }
        close() {
            this._cleanup();
            this.target.close();
        }
    }

    class SharedClientDispatcher extends AbstractDispatcher {
        constructor(target, receiverEventPreprocessor, senderEventPreprocessor) {
            super(WorkerType.SHARED_WORKER_CLIENT, target, receiverEventPreprocessor ?? null, senderEventPreprocessor ?? null);
        }
        start() {
            this.target.start();
        }
        close() {
            this.target.close();
        }
    }

    /* eslint-disable no-restricted-globals */
    class SharedServerDispatcher {
        constructor(target = self, receiverEventPreprocessor, clientReceiverEventPreprocessor, clientSenderEventPreprocessor) {
            this._cleanup = () => { };
            this.addEventListener = (...args) => this.receiver.addEventListener(...args);
            this.hasEventListener = (...args) => this.receiver.hasEventListener(...args);
            this.removeEventListener = (...args) => this.receiver.removeEventListener(...args);
            this.removeAllEventListeners = (...args) => this.receiver.removeAllEventListeners(...args);
            this.handleConnect = (event) => {
                const [target] = event.ports;
                const client = this.clientFactory(target);
                this.receiver.dispatchEvent(new WorkerEvent(WorkerEvent.CONNECT, client, event, client));
            };
            this.type = WorkerType.SHARED_WORKER_SERVER;
            this.target = target;
            this.clientFactory = (client) => new SharedClientDispatcher(client, clientReceiverEventPreprocessor, clientSenderEventPreprocessor);
            this.receiver = eventDispatcherExports.createEventDispatcher(receiverEventPreprocessor);
            this.target.addEventListener(NativeEventType.CONNECT, this.handleConnect);
            const cleanupWorkerEvents = dispatchWorkerEvents(this.target, this.receiver);
            this._cleanup = () => {
                cleanupWorkerEvents();
                this.target.removeEventListener(NativeEventType.CONNECT, this.handleConnect);
            };
        }
        destroy() {
            this._cleanup();
        }
    }

    const getServiceWorker = async () => {
        const registration = await navigator.serviceWorker.ready;
        return registration.active;
    };
    const createTarget = () => {
        let channel = new MessageChannel();
        let activeWorker = null;
        let started = false;
        const listeners = [];
        const resetChannel = () => {
            channel.port1.close();
            channel = new MessageChannel();
            if (started) {
                channel.port1.start();
            }
            for (const [type, handler] of listeners) {
                channel.port1.addEventListener(type, handler);
            }
        };
        return {
            postMessage: async (message) => {
                const worker = await getServiceWorker();
                if (worker !== activeWorker) {
                    if (activeWorker !== null) {
                        resetChannel();
                    }
                    activeWorker = worker;
                    worker.postMessage(message, [channel.port2]);
                }
                else {
                    worker.postMessage(message);
                }
            },
            addEventListener: (type, handler) => {
                listeners.push([type, handler]);
                channel.port1.addEventListener(type, handler);
            },
            removeEventListener: (type, handler) => {
                const idx = listeners.findIndex(([t, h]) => t === type && h === handler);
                if (idx !== -1) {
                    listeners.splice(idx, 1);
                }
                channel.port1.removeEventListener(type, handler);
            },
            start: () => {
                started = true;
                channel.port1.start();
            },
            close: () => {
                channel.port1.close();
            },
        };
    };
    class ServiceWorkerDispatcher extends AbstractDispatcher {
        constructor(receiverEventPreprocessor, senderEventPreprocessor) {
            const target = createTarget();
            super(WorkerType.SERVICE_WORKER, target, receiverEventPreprocessor ?? null, senderEventPreprocessor ?? null);
            this._cleanupErrors = () => { };
            this.start();
            this._cleanupErrors = dispatchWorkerErrorEvent(this.target, this.receiver);
        }
        start() {
            this.target.start();
        }
        close() {
            this._cleanupErrors();
            this.target.close();
        }
        onReady(handler) {
            return navigator.serviceWorker.ready.then(handler);
        }
        get ready() {
            return navigator.serviceWorker.ready;
        }
    }

    class ServiceClientDispatcher extends AbstractDispatcher {
        constructor(target, receiverEventPreprocessor, senderEventPreprocessor) {
            super(WorkerType.SERVICE_WORKER_CLIENT, target, receiverEventPreprocessor ?? null, senderEventPreprocessor ?? null);
        }
        start() {
            this.target.start();
        }
        close() {
            this.target.close();
        }
    }

    /* eslint-disable no-restricted-globals */
    class ServiceServerDispatcher {
        constructor(target = self, receiverEventPreprocessor, clientReceiverEventPreprocessor, clientSenderEventPreprocessor) {
            this._cleanup = () => { };
            this.addEventListener = (...args) => this.receiver.addEventListener(...args);
            this.hasEventListener = (...args) => this.receiver.hasEventListener(...args);
            this.removeEventListener = (...args) => this.receiver.removeEventListener(...args);
            this.removeAllEventListeners = (...args) => this.receiver.removeAllEventListeners(...args);
            this._messageListener = (event) => {
                const nativeEvent = event;
                const { data: rawMessage, ports: [client], } = nativeEvent;
                if (!rawMessage)
                    return;
                const message = messageportDispatcherExports.parseMessagePortEvent(rawMessage);
                if (!message)
                    return;
                const { type: eventType, data: eventData } = message.event;
                this.receiver.dispatchEvent(new WorkerEvent(eventType, eventData, nativeEvent, this.clientFactory(client)));
            };
            this.type = WorkerType.SERVICE_WORKER_SERVER;
            this.target = target;
            this.clientFactory = (port) => {
                if (!port)
                    return null;
                return new ServiceClientDispatcher(port, clientReceiverEventPreprocessor, clientSenderEventPreprocessor);
            };
            this.receiver = eventDispatcherExports.createEventDispatcher(receiverEventPreprocessor);
            const cleanupErrors = dispatchWorkerErrorEvent(target, this.receiver);
            const cleanupLifecycle = dispatchServiceWorkerEvents(target, this.receiver);
            target.addEventListener(NativeEventType.MESSAGE, this._messageListener);
            this._cleanup = () => {
                cleanupErrors();
                cleanupLifecycle();
                target.removeEventListener(NativeEventType.MESSAGE, this._messageListener);
            };
        }
        destroy() {
            this._cleanup();
        }
    }

    const createForDedicatedWorker = (target, receiverEventPreprocessor, senderEventPreprocessor) => new DedicatedWorkerDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
    const createForSharedWorker = (target, receiverEventPreprocessor, senderEventPreprocessor) => new SharedWorkerDispatcher(target, undefined, receiverEventPreprocessor, senderEventPreprocessor);
    const createForServiceWorker = (receiverEventPreprocessor, senderEventPreprocessor) => new ServiceWorkerDispatcher(receiverEventPreprocessor, senderEventPreprocessor);
    const create = (target, type, receiverEventPreprocessor, senderEventPreprocessor) => {
        switch (type) {
            default:
            case WorkerType.DEDICATED_WORKER:
                return createForDedicatedWorker(target, receiverEventPreprocessor, senderEventPreprocessor);
            case WorkerType.SHARED_WORKER:
                return createForSharedWorker(target, receiverEventPreprocessor, senderEventPreprocessor);
            case WorkerType.SHARED_WORKER_SERVER:
                return new SharedServerDispatcher(target, receiverEventPreprocessor ?? undefined);
            case WorkerType.SHARED_WORKER_CLIENT:
                return new SharedClientDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
            case WorkerType.SERVICE_WORKER:
                return createForServiceWorker(receiverEventPreprocessor, senderEventPreprocessor);
            case WorkerType.SERVICE_WORKER_SERVER:
                return new ServiceServerDispatcher(target, receiverEventPreprocessor ?? undefined);
            case WorkerType.SERVICE_WORKER_CLIENT:
                return new ServiceClientDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
        }
    };
    const createForSelf = (receiverEventPreprocessor, senderEventPreprocessor) => {
        // Only dedicated WebWorker has postMessage since they have single client
        if (typeof self.postMessage === 'function') {
            return new DedicatedWorkerDispatcher(self, receiverEventPreprocessor, senderEventPreprocessor);
        }
        // Only ServiceWorker has registration object
        const selfRecord = self;
        if (selfRecord.registration && typeof selfRecord.registration.scope === 'string') {
            return new ServiceServerDispatcher(self, receiverEventPreprocessor ?? undefined);
        }
        return new SharedServerDispatcher(self, receiverEventPreprocessor ?? undefined);
    };

    const CONNECT_EVENT = WorkerEvent.CONNECT;
    const { DEDICATED_WORKER, SHARED_WORKER, SERVICE_WORKER } = WorkerType;

    exports.CONNECT_EVENT = CONNECT_EVENT;
    exports.DEDICATED_WORKER = DEDICATED_WORKER;
    exports.DedicatedWorkerDispatcher = DedicatedWorkerDispatcher;
    exports.NativeEventType = NativeEventType;
    exports.SERVICE_WORKER = SERVICE_WORKER;
    exports.SHARED_WORKER = SHARED_WORKER;
    exports.ServiceClientDispatcher = ServiceClientDispatcher;
    exports.ServiceServerDispatcher = ServiceServerDispatcher;
    exports.ServiceWorkerDispatcher = ServiceWorkerDispatcher;
    exports.SharedClientDispatcher = SharedClientDispatcher;
    exports.SharedServerDispatcher = SharedServerDispatcher;
    exports.SharedWorkerDispatcher = SharedWorkerDispatcher;
    exports.WorkerEvent = WorkerEvent;
    exports.WorkerType = WorkerType;
    exports.create = create;
    exports.createForDedicatedWorker = createForDedicatedWorker;
    exports.createForSelf = createForSelf;
    exports.createForServiceWorker = createForServiceWorker;
    exports.createForSharedWorker = createForSharedWorker;
    exports.default = DedicatedWorkerDispatcher;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=worker-dispatcher.js.map
