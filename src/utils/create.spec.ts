import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Worker, SharedWorker, EventTarget, MessagePort } from '../stubs';
import WorkerType from '../WorkerType';
import DedicatedWorkerDispatcher from '../DedicatedWorkerDispatcher';
import SharedWorkerDispatcher from '../SharedWorkerDispatcher';
import ClientDispatcher from '../sharedWorker/ClientDispatcher';
import ServerDispatcher from '../sharedWorker/ServerDispatcher';
import { create, createForSelf } from './create';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('utils/create', () => {
  beforeEach(() => {
    (global as any).Worker = Worker;
    (global as any).SharedWorker = SharedWorker;
    (global as any).MessagePort = MessagePort;
  });

  describe('create()', () => {
    it('should create Dedicated worker', () => {
      expect(
        create(new Worker() as unknown as globalThis.Worker, WorkerType.DEDICATED_WORKER),
      ).toBeInstanceOf(DedicatedWorkerDispatcher);
    });

    it('should create Shared worker', () => {
      expect(
        create(new SharedWorker() as unknown as globalThis.SharedWorker, WorkerType.SHARED_WORKER),
      ).toBeInstanceOf(SharedWorkerDispatcher);
    });

    it('should create Server/GlobalScope of Shared worker', () => {
      expect(
        create(new EventTarget() as unknown as globalThis.EventTarget, WorkerType.SHARED_WORKER_SERVER),
      ).toBeInstanceOf(ServerDispatcher);
    });

    it('should create Client of Shared worker', () => {
      expect(
        create(new MessagePort() as unknown as globalThis.MessagePort, WorkerType.SHARED_WORKER_CLIENT),
      ).toBeInstanceOf(ClientDispatcher);
    });

    it('should create Dedicated worker by default', () => {
      expect(create(new Worker() as unknown as globalThis.Worker)).toBeInstanceOf(DedicatedWorkerDispatcher);
    });
  });

  describe('createForSelf()', () => {
    let dispatcher: ReturnType<typeof createForSelf>;
    let savedSelf: unknown;

    beforeEach(() => {
      savedSelf = (global as any).self;
      (global as any).self = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    });

    afterEach(() => {
      (global as any).self = savedSelf;
    });

    describe("When self doesn't have postMessage()", () => {
      beforeEach(() => {
        dispatcher = createForSelf();
      });

      it('should create SharedWorker Server', () => {
        expect(dispatcher).toBeInstanceOf(ServerDispatcher);
      });
    });

    describe('When self has postMessage()', () => {
      beforeEach(() => {
        (global as any).self.postMessage = jest.fn();
        dispatcher = createForSelf();
      });

      it('should create Dedicated Worker', () => {
        expect(dispatcher).toBeInstanceOf(DedicatedWorkerDispatcher);
      });
    });
  });
});
