import { jest } from '@jest/globals';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface EventTargetInstance {
  type: string;
  addEventListener: ReturnType<typeof jest.fn>;
  hasEventListener: ReturnType<typeof jest.fn>;
  removeEventListener: ReturnType<typeof jest.fn>;
}

export interface MessagePortBaseInstance extends EventTargetInstance {
  postMessage: ReturnType<typeof jest.fn>;
}

export interface MessagePortInstance extends MessagePortBaseInstance {
  start: ReturnType<typeof jest.fn>;
  close: ReturnType<typeof jest.fn>;
}

export interface WorkerInstance extends MessagePortBaseInstance {
  terminate: ReturnType<typeof jest.fn>;
}

export interface SharedWorkerInstance extends EventTargetInstance {
  port: MessagePortInstance;
}

type MockedConstructor<T> = ReturnType<typeof jest.fn> & (new (...args: any[]) => T);

export const EventTarget = jest.fn(function (this: any) {
  this.type = 'EventTarget';
  this.addEventListener = jest.fn();
  this.hasEventListener = jest.fn();
  this.removeEventListener = jest.fn();
}) as unknown as MockedConstructor<EventTargetInstance>;

export const MessagePortBase = jest.fn(function (this: any) {
  (EventTarget as any).call(this);
  this.type = 'MessagePortBase';
  this.postMessage = jest.fn();
}) as unknown as MockedConstructor<MessagePortBaseInstance>;

export const MessagePort = jest.fn(function (this: any) {
  (MessagePortBase as any).call(this);
  this.type = 'MessagePort';
  this.start = jest.fn();
  this.close = jest.fn();
}) as unknown as MockedConstructor<MessagePortInstance>;

export const Worker = jest.fn(function (this: any) {
  (MessagePortBase as any).call(this);
  this.type = 'Worker';
  this.terminate = jest.fn();
}) as unknown as MockedConstructor<WorkerInstance>;

export const SharedWorker = jest.fn(function (this: any) {
  this.port = new (MessagePort as any)();
  this.type = 'SharedWorker';
  (EventTarget as any).call(this);
}) as unknown as MockedConstructor<SharedWorkerInstance>;

export const apply = (): void => {
  (global as any).MessagePort = MessagePort;
  (global as any).Worker = Worker;
  (global as any).SharedWorker = SharedWorker;
};
