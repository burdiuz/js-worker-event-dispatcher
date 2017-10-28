/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import { NativeEventTypes } from '../WorkerEvent';
import ClientDispatcher from './ClientDispatcher';
import { MessagePort } from '../../tests/stubs';

describe('ClientDispatcher', () => {
  let port;
  let dispatcher;

  beforeEach(() => {
    port = new MessagePort();
    dispatcher = new ClientDispatcher(port);
  });

  it('should have Dispatcher interface', () => {
    expect(dispatcher.addEventListener).to.be.a('function');
    expect(dispatcher.hasEventListener).to.be.a('function');
    expect(dispatcher.removeEventListener).to.be.a('function');
    expect(dispatcher.removeAllEventListeners).to.be.a('function');
    expect(dispatcher.dispatchEvent).to.be.a('function');
  });

  it('should call port.addEventListener()', () => {
    expect(port.addEventListener).to.be.calledWith(NativeEventTypes.MESSAGE);
  });

  it('should call port.postMessage()', () => {
    dispatcher.dispatchEvent({ type: 'meMyself', data: 'Irene' });
    expect(port.postMessage).to.be.calledOnce;
  });

  describe('start()', () => {
    beforeEach(() => {
      dispatcher.start();
    });

    it('should call port.start()', () => {
      expect(port.start).to.be.calledOnce;
    });
  });

  describe('close()', () => {
    beforeEach(() => {
      dispatcher.close();
    });

    it('should call port.close()', () => {
      expect(port.close).to.be.calledOnce;
    });
  });
});
