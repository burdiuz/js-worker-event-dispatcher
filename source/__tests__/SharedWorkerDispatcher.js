/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import { apply, SharedWorker, MessagePort } from '../../tests/stubs';
import { NativeEventType } from '../WorkerEvent';
import SharedWorkerDispatcher from '../SharedWorkerDispatcher';

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
      expect(dispatcher.addEventListener).toBeInstanceOf(Function);
      expect(dispatcher.hasEventListener).toBeInstanceOf(Function);
      expect(dispatcher.removeEventListener).toBeInstanceOf(Function);
      expect(dispatcher.removeAllEventListeners).toBeInstanceOf(Function);
      expect(dispatcher.dispatchEvent).toBeInstanceOf(Function);
    });

    it('should call start()', () => {
      expect(worker.port.start).toHaveBeenCalledTimes(1);
    });

    it('should add listener to ERROR event', () => {
      expect(worker.addEventListener).toHaveBeenCalledWith(
        NativeEventType.ERROR,
        expect.any(Function),
      );
    });

    it('should call port.addEventListener()', () => {
      expect(worker.port.addEventListener).toHaveBeenCalledWith(
        NativeEventType.MESSAGE,
        expect.any(Function),
      );
    });

    it('should call port.postMessage()', () => {
      dispatcher.dispatchEvent({ type: 'meMyself', data: 'Irene' });
      expect(worker.port.postMessage).toHaveBeenCalledTimes(1);
    });

    describe('start()', () => {
      beforeEach(() => {
        worker.port.start.mockClear();
        dispatcher.start();
      });

      it('should call port.start()', () => {
        expect(worker.port.start).toHaveBeenCalledTimes(1);
      });
    });

    describe('close()', () => {
      beforeEach(() => {
        dispatcher.close();
      });

      it('should call port.close()', () => {
        expect(worker.port.close).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('When creating from URL', () => {
    let dispatcher;

    beforeEach(() => {
      SharedWorker.mockClear();
      dispatcher = new SharedWorkerDispatcher('/some/url.js', 'SWName');
    });

    it('should create SharedWorker instance', () => {
      expect(SharedWorker).toHaveBeenCalledTimes(1);
      expect(SharedWorker).toHaveBeenCalledWith('/some/url.js', 'SWName');
    });

    it('should have .target property to be ShareWorker.port', () => {
      expect(dispatcher.target).toBeInstanceOf(MessagePort);
    });

    it('should have .worker property a ShareWorker instance', () => {
      expect(dispatcher.worker).toBeInstanceOf(SharedWorker);
    });
  });
});
