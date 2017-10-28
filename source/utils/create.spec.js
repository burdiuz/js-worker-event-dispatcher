/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import WorkerType from '../WorkerType';
import DedicatedWorkerDispatcher from '../DedicatedWorkerDispatcher';
import SharedWorkerDispatcher from '../SharedWorkerDispatcher';
import ClientDispatcher from '../sharedWorker/ClientDispatcher';
import ServerDispatcher from '../sharedWorker/ServerDispatcher';
import { create, createForSelf } from './create';
import {
  Worker,
  SharedWorker,
  EventTarget,
  MessagePort,
  MessagePortBase,
} from '../../tests/stubs';

describe('utils/create', () => {
  describe('create()', () => {
    it('should create Dedicated worker', () => {
      expect(create(new Worker(), WorkerType.DEDICATED_WORKER))
        .to.be.an.instanceof(DedicatedWorkerDispatcher);
    });

    it('should create Shared worker', () => {
      expect(create(new SharedWorker(), WorkerType.SHARED_WORKER))
        .to.be.an.instanceof(SharedWorkerDispatcher);
    });

    it('should create Server/GlobalScope of Shared worker', () => {
      expect(create(new EventTarget(), WorkerType.SHARED_WORKER_SERVER))
        .to.be.an.instanceof(ServerDispatcher);
    });

    it('should create Client of Shared worker', () => {
      expect(create(new MessagePort(), WorkerType.SHARED_WORKER_CLIENT))
        .to.be.an.instanceof(ClientDispatcher);
    });

    it('should create Dedicated worker by default', () => {
      expect(create(new Worker()))
        .to.be.an.instanceof(DedicatedWorkerDispatcher);
    });
  });

  describe('createForSelf()', () => {
    let dispatcher;
    describe('When self doesn\'t have postMessage()', () => {
      beforeEach(() => {
        window.self = new EventTarget();
        dispatcher = createForSelf();
      });

      it('should create SharedWorker Server', () => {
        expect(dispatcher).to.be.an.instanceof(ServerDispatcher);
      });
    });

    describe('When self has postMessage()', () => {
      beforeEach(() => {
        window.self = new MessagePortBase();
        dispatcher = createForSelf();
      });

      it('should create Dedicated Worker', () => {
        expect(dispatcher).to.be.an.instanceof(DedicatedWorkerDispatcher);
      });
    });
  });
});
