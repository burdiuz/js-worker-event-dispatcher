import { Event as BaseEvent } from '@actualwave/event-dispatcher';
import type { IEventDispatcher } from '@actualwave/event-dispatcher';

export const NativeEventType = {
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
} as const;

export type NativeEventTypeValue = (typeof NativeEventType)[keyof typeof NativeEventType];

class WorkerEvent extends BaseEvent {
  static readonly CONNECT = 'worker:connect' as const;
  static readonly MESSAGE = 'worker:message' as const;
  static readonly ERROR = 'worker:error' as const;
  static readonly MESSAGEERROR = 'worker:messageerror' as const;
  static readonly LANGUAGECHANGE = 'worker:languagechange' as const;
  static readonly ONLINE = 'worker:online' as const;
  static readonly OFFLINE = 'worker:offline' as const;
  static readonly INSTALL = 'worker:install' as const;
  static readonly ACTIVATE = 'worker:activate' as const;
  static readonly FETCH = 'worker:fetch' as const;
  static readonly SYNC = 'worker:sync' as const;
  static readonly PUSH = 'worker:push' as const;

  nativeEvent: unknown;
  client: unknown;

  constructor(type: string, data: unknown, nativeEvent: unknown, client?: unknown) {
    super(type, data);
    this.nativeEvent = nativeEvent;
    this.client = client ?? null;
  }
}

export type NativeEventHandler = (event: globalThis.Event) => void;

export const getWorkerEventType = (type: string): string => {
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

export const dispatchWorkerEvent = (
  type: string,
  source: EventTarget,
  target: IEventDispatcher,
): () => void => {
  const eventType = getWorkerEventType(type);

  const handler: NativeEventHandler = (event) => {
    if (target.hasEventListener(eventType)) {
      target.dispatchEvent(new WorkerEvent(eventType, event, event));
    }
  };

  source.addEventListener(type, handler);
  return () => source.removeEventListener(type, handler);
};

export const dispatchWorkerEvents = (source: EventTarget, target: IEventDispatcher): () => void => {
  const cleanups = [
    dispatchWorkerEvent(NativeEventType.ERROR, source, target),
    dispatchWorkerEvent(NativeEventType.LANGUAGECHANGE, source, target),
    dispatchWorkerEvent(NativeEventType.ONLINE, source, target),
    dispatchWorkerEvent(NativeEventType.OFFLINE, source, target),
  ];
  return () => cleanups.forEach((fn) => fn());
};

export const dispatchServiceWorkerEvents = (source: EventTarget, target: IEventDispatcher): () => void => {
  const cleanups = [
    dispatchWorkerEvent(NativeEventType.INSTALL, source, target),
    dispatchWorkerEvent(NativeEventType.ACTIVATE, source, target),
    dispatchWorkerEvent(NativeEventType.FETCH, source, target),
    dispatchWorkerEvent(NativeEventType.SYNC, source, target),
    dispatchWorkerEvent(NativeEventType.PUSH, source, target),
  ];
  return () => cleanups.forEach((fn) => fn());
};

export const dispatchWorkerErrorEvent = (source: EventTarget, target: IEventDispatcher): () => void => {
  const cleanups = [
    dispatchWorkerEvent(NativeEventType.ERROR, source, target),
    dispatchWorkerEvent(NativeEventType.MESSAGEERROR, source, target),
  ];
  return () => cleanups.forEach((fn) => fn());
};

export default WorkerEvent;
