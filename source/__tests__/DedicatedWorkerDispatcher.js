/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import { apply, Worker, MessagePort } from '../../tests/stubs';
import { NativeEventTypes } from '../WorkerEvent';
import DedicatedWorkerDispatcher from '../DedicatedWorkerDispatcher';

describe('DedicatedWorkerDispatcher', () => {
  let worker;
  let dispatcher;

  beforeEach(apply);

  beforeEach(() => {
    worker = new Worker();
    dispatcher = new DedicatedWorkerDispatcher(worker);
  });

  it('should have Dispatcher interface', () => {
    expect(dispatcher.addEventListener).toBeInstanceOf(Function);
    expect(dispatcher.hasEventListener).toBeInstanceOf(Function);
    expect(dispatcher.removeEventListener).toBeInstanceOf(Function);
    expect(dispatcher.removeAllEventListeners).toBeInstanceOf(Function);
    expect(dispatcher.dispatchEvent).toBeInstanceOf(Function);
  });

  it('should add listeners to events', () => {
    expect(worker.addEventListener).toHaveBeenCalledWith(
      NativeEventTypes.ERROR,
      expect.any(Function),
    );
    expect(worker.addEventListener).toHaveBeenCalledWith(
      NativeEventTypes.LANGUAGECHANGE,
      expect.any(Function),
    );
    expect(worker.addEventListener).toHaveBeenCalledWith(
      NativeEventTypes.ONLINE,
      expect.any(Function),
    );
    expect(worker.addEventListener).toHaveBeenCalledWith(
      NativeEventTypes.OFFLINE,
      expect.any(Function),
    );
  });

  it('should call port.addEventListener()', () => {
    expect(worker.addEventListener).toHaveBeenCalledWith(
      NativeEventTypes.MESSAGE,
      expect.any(Function),
    );
  });

  it('should call port.postMessage()', () => {
    dispatcher.dispatchEvent({ type: 'meMyself', data: 'Irene' });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
  });

  describe('terminate()', () => {
    beforeEach(() => {
      dispatcher.terminate();
    });

    it('should call worker.terminate()', () => {
      expect(worker.terminate).toHaveBeenCalledTimes(1);
    });
  });

  describe('When creating from URL', () => {
    beforeEach(() => {
      Worker.mockClear();
      dispatcher = new DedicatedWorkerDispatcher('/some/url.js');
    });

    it('should create Worker instance', () => {
      expect(Worker).toHaveBeenCalledTimes(1);
      expect(Worker).toHaveBeenCalledWith('/some/url.js');
    });

    it('should keep Worker instance as target', () => {
      expect(dispatcher.target).toBeInstanceOf(Worker);
    });
  });

  describe('When creating without args', () => {
    beforeEach(() => {
      global.self = new MessagePort();
      dispatcher = new DedicatedWorkerDispatcher();
    });

    it('should use `self` thinking its WorkerGlobalScope', () => {
      expect(dispatcher.target).toBe(global.self);
    });
  });
});
