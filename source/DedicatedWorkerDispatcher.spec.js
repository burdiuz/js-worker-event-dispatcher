/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import { NativeEventTypes } from './WorkerEvent';
import DedicatedWorkerDispatcher from './DedicatedWorkerDispatcher';
import {
  apply,
  Worker,
  MessagePort,
} from '../tests/stubs';

describe('DedicatedWorkerDispatcher', () => {
  let worker;
  let dispatcher;

  beforeEach(apply);

  beforeEach(() => {
    worker = new Worker();
    dispatcher = new DedicatedWorkerDispatcher(worker);
  });

  it('should have Dispatcher interface', () => {
    expect(dispatcher.addEventListener).to.be.a('function');
    expect(dispatcher.hasEventListener).to.be.a('function');
    expect(dispatcher.removeEventListener).to.be.a('function');
    expect(dispatcher.removeAllEventListeners).to.be.a('function');
    expect(dispatcher.dispatchEvent).to.be.a('function');
  });

  it('should add listeners to events', () => {
    expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.ERROR);
    expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.LANGUAGECHANGE);
    expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.ONLINE);
    expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.OFFLINE);
  });

  it('should call port.addEventListener()', () => {
    expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.MESSAGE);
  });

  it('should call port.postMessage()', () => {
    dispatcher.dispatchEvent({ type: 'meMyself', data: 'Irene' });
    expect(worker.postMessage).to.be.calledOnce;
  });

  describe('terminate()', () => {
    beforeEach(() => {
      dispatcher.terminate();
    });

    it('should call worker.terminate()', () => {
      expect(worker.terminate).to.be.calledOnce;
    });
  });

  describe('When creating from URL', () => {
    beforeEach(() => {
      Worker.reset();
      dispatcher = new DedicatedWorkerDispatcher('/some/url.js');
    });

    it('should create Worker instance', () => {
      expect(Worker).to.be.calledOnce;
      expect(Worker).to.be.calledWithNew;
    });

    it('should pass URL to Worker', () => {
      expect(Worker.getCall(0).args[0]).to.be.equal('/some/url.js');
    });

    it('should keep Worker instance as target', () => {
      expect(dispatcher.target).to.be.an('object');
    });
  });

  describe('When creating without args', () => {
    beforeEach(() => {
      window.self = new MessagePort();
      dispatcher = new DedicatedWorkerDispatcher();
    });

    it('should use `self` thinking its WorkerGlobalScope', () => {
      expect(dispatcher.target).to.be.equal(window.self);
    });
  });
});
