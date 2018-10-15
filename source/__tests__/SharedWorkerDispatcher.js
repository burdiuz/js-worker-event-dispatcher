/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import { NativeEventTypes } from '../WorkerEvent';
import SharedWorkerDispatcher from '../SharedWorkerDispatcher';
import {
  apply,
  SharedWorker,
} from '../../tests/stubs';

describe('SharedWorkerDispatcher', () => {
  beforeEach(apply);

  describe('Instance', () => {
    let worker;
    let dispatcher;

    beforeEach(() => {
      worker = new SharedWorker();
      dispatcher = new SharedWorkerDispatcher(worker);
    });

    it('should have Dispatcher interface', () => {
      expect(dispatcher.addEventListener).to.be.a('function');
      expect(dispatcher.hasEventListener).to.be.a('function');
      expect(dispatcher.removeEventListener).to.be.a('function');
      expect(dispatcher.removeAllEventListeners).to.be.a('function');
      expect(dispatcher.dispatchEvent).to.be.a('function');
    });

    it('should add listener to ERROR event', () => {
      expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.ERROR);
    });

    it('should call port.addEventListener()', () => {
      expect(worker.port.addEventListener).to.be.calledWith(NativeEventTypes.MESSAGE);
    });

    it('should call port.postMessage()', () => {
      dispatcher.dispatchEvent({ type: 'meMyself', data: 'Irene' });
      expect(worker.port.postMessage).to.be.calledOnce;
    });

    describe('start()', () => {
      beforeEach(() => {
        dispatcher.start();
      });

      it('should call port.start()', () => {
        expect(worker.port.start).to.be.calledOnce;
      });
    });

    describe('close()', () => {
      beforeEach(() => {
        dispatcher.close();
      });

      it('should call port.close()', () => {
        expect(worker.port.close).to.be.calledOnce;
      });
    });
  });

  describe('When creating from URL', () => {
    let dispatcher;

    beforeEach(() => {
      SharedWorker.reset();
      dispatcher = new SharedWorkerDispatcher('/some/url.js', 'SWName');
    });

    it('should create SharedWorker instance', () => {
      expect(SharedWorker).to.be.calledOnce;
      expect(SharedWorker).to.be.calledWithNew;
    });

    it('should pass URL to SharedWorker', () => {
      expect(SharedWorker.getCall(0).args[0]).to.be.equal('/some/url.js');
    });

    it('should pass name to SharedWorker', () => {
      expect(SharedWorker.getCall(0).args[1]).to.be.equal('SWName');
    });

    it('should keep SharedWorker instance as target', () => {
      expect(dispatcher.target).to.be.an('object');
    });
  });
});
