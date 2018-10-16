/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import { Worker, SharedWorker, EventTarget, MessagePort } from '../../../tests/stubs';
import WorkerType from '../../WorkerType';
import DedicatedWorkerDispatcher from '../../DedicatedWorkerDispatcher';
import SharedWorkerDispatcher from '../../SharedWorkerDispatcher';
import ClientDispatcher from '../../sharedWorker/ClientDispatcher';
import ServerDispatcher from '../../sharedWorker/ServerDispatcher';
import { create, createForSelf } from '../create';

describe('utils/create', () => {
  describe('create()', () => {
    it('should create Dedicated worker', () => {
      expect(create(new Worker(), WorkerType.DEDICATED_WORKER)).toBeInstanceOf(
        DedicatedWorkerDispatcher,
      );
    });

    it('should create Shared worker', () => {
      expect(create(new SharedWorker(), WorkerType.SHARED_WORKER)).toBeInstanceOf(
        SharedWorkerDispatcher,
      );
    });

    it('should create Server/GlobalScope of Shared worker', () => {
      expect(create(new EventTarget(), WorkerType.SHARED_WORKER_SERVER)).toBeInstanceOf(
        ServerDispatcher,
      );
    });

    it('should create Client of Shared worker', () => {
      expect(create(new MessagePort(), WorkerType.SHARED_WORKER_CLIENT)).toBeInstanceOf(
        ClientDispatcher,
      );
    });

    it('should create Dedicated worker by default', () => {
      expect(create(new Worker())).toBeInstanceOf(DedicatedWorkerDispatcher);
    });
  });

  describe('createForSelf()', () => {
    let dispatcher;

    describe("When self doesn't have postMessage()", () => {
      let postMessage;

      beforeEach(() => {
        ({ postMessage } = global.self);
        delete global.self.postMessage;
        dispatcher = createForSelf();
      });

      afterEach(() => {
        global.self.postMessage = postMessage;
      });

      it('should create SharedWorker Server', () => {
        expect(dispatcher).toBeInstanceOf(ServerDispatcher);
      });
    });

    describe('When self has postMessage()', () => {
      let postMessage;

      beforeEach(() => {
        ({ postMessage } = global.self.postMessage);
        global.self.postMessage = jest.fn();
        dispatcher = createForSelf();
      });

      afterEach(() => {
        global.self.postMessage = postMessage;
      });

      it('should create Dedicated Worker', () => {
        expect(dispatcher).toBeInstanceOf(DedicatedWorkerDispatcher);
      });
    });
  });
});
