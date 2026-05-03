import { describe, it, expect, beforeEach } from '@jest/globals';
import { NativeEventType } from '../WorkerEvent';
import SharedClientDispatcher from './ClientDispatcher';
import { MessagePort } from '../stubs';

describe('SharedClientDispatcher', () => {
  let port: InstanceType<typeof MessagePort>;
  let dispatcher: SharedClientDispatcher;

  beforeEach(() => {
    port = new MessagePort();
    dispatcher = new SharedClientDispatcher(port as unknown as globalThis.MessagePort);
  });

  it('should have Dispatcher interface', () => {
    expect(dispatcher.addEventListener).toBeInstanceOf(Function);
    expect(dispatcher.hasEventListener).toBeInstanceOf(Function);
    expect(dispatcher.removeEventListener).toBeInstanceOf(Function);
    expect(dispatcher.removeAllEventListeners).toBeInstanceOf(Function);
    expect(dispatcher.dispatchEvent).toBeInstanceOf(Function);
  });

  it('should call port.addEventListener()', () => {
    expect(port.addEventListener).toHaveBeenCalledWith(NativeEventType.MESSAGE, expect.any(Function));
  });

  it('should call port.postMessage()', () => {
    dispatcher.dispatchEvent({ type: 'meMyself', data: 'Irene' });
    expect(port.postMessage).toHaveBeenCalledTimes(1);
  });

  describe('start()', () => {
    beforeEach(() => {
      dispatcher.start();
    });

    it('should call port.start()', () => {
      expect(port.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('close()', () => {
    beforeEach(() => {
      dispatcher.close();
    });

    it('should call port.close()', () => {
      expect(port.close).toHaveBeenCalledTimes(1);
    });
  });
});
