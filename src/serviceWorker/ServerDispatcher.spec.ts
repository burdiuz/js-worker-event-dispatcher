import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import WorkerEvent, { NativeEventType } from '../WorkerEvent';
import ServiceServerDispatcher from './ServerDispatcher';
import ServiceClientDispatcher from './ClientDispatcher';
import { EventTarget, MessagePort } from '../stubs';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Raw wire-format message as produced by MessagePortDispatcher.dispatchEvent()
const makeRawMessage = (type: string, data: unknown, dispatcherId = 'external-id') => ({
  event: JSON.stringify({ type, data }),
  dispatcherId,
});

describe('ServiceServerDispatcher', () => {
  let target: InstanceType<typeof EventTarget>;
  let dispatcher: ServiceServerDispatcher;

  beforeEach(() => {
    target = new EventTarget();
    dispatcher = new ServiceServerDispatcher(target as unknown as globalThis.EventTarget);
  });

  it('should register error event listeners on target', () => {
    expect(target.addEventListener).toHaveBeenCalledWith(NativeEventType.ERROR, expect.any(Function));
    expect(target.addEventListener).toHaveBeenCalledWith(NativeEventType.MESSAGEERROR, expect.any(Function));
  });

  it('should register message listener on target', () => {
    expect(target.addEventListener).toHaveBeenCalledWith(NativeEventType.MESSAGE, expect.any(Function));
  });

  it('should register service worker lifecycle event listeners on target', () => {
    expect(target.addEventListener).toHaveBeenCalledWith(NativeEventType.INSTALL, expect.any(Function));
    expect(target.addEventListener).toHaveBeenCalledWith(NativeEventType.ACTIVATE, expect.any(Function));
    expect(target.addEventListener).toHaveBeenCalledWith(NativeEventType.FETCH, expect.any(Function));
    expect(target.addEventListener).toHaveBeenCalledWith(NativeEventType.SYNC, expect.any(Function));
    expect(target.addEventListener).toHaveBeenCalledWith(NativeEventType.PUSH, expect.any(Function));
  });

  describe('addEventListener()', () => {
    it('should delegate to receiver', () => {
      const stub = jest.spyOn(dispatcher.receiver, 'addEventListener');
      const handler = () => null;
      dispatcher.addEventListener('my-event', handler);
      expect(stub).toHaveBeenCalledWith('my-event', handler);
    });
  });

  describe('hasEventListener()', () => {
    it('should delegate to receiver', () => {
      const stub = jest.spyOn(dispatcher.receiver, 'hasEventListener');
      dispatcher.hasEventListener('my-event');
      expect(stub).toHaveBeenCalledWith('my-event');
    });
  });

  describe('removeEventListener()', () => {
    it('should delegate to receiver', () => {
      const stub = jest.spyOn(dispatcher.receiver, 'removeEventListener');
      const handler = () => null;
      dispatcher.removeEventListener('my-event', handler);
      expect(stub).toHaveBeenCalledWith('my-event', handler);
    });
  });

  describe('removeAllEventListeners()', () => {
    it('should delegate to receiver', () => {
      const stub = jest.spyOn(dispatcher.receiver, 'removeAllEventListeners');
      dispatcher.removeAllEventListeners('my-event');
      expect(stub).toHaveBeenCalledWith('my-event');
    });
  });

  describe('on message', () => {
    let messageHandler: (event: object) => void;

    beforeEach(() => {
      const calls = (target.addEventListener as ReturnType<typeof jest.fn>).mock.calls;
      const [, handler] = calls.find(([type]) => type === NativeEventType.MESSAGE) as [string, (e: object) => void];
      messageHandler = handler;
    });

    it('should dispatch a WorkerEvent for a valid message', () => {
      const eventHandler = jest.fn();
      dispatcher.addEventListener('custom-event', eventHandler);

      messageHandler({ data: makeRawMessage('custom-event', { x: 1 }), ports: [] });

      expect(eventHandler).toHaveBeenCalledTimes(1);
      const received = eventHandler.mock.calls[0][0] as WorkerEvent;
      expect(received).toBeInstanceOf(WorkerEvent);
      expect(received.type).toBe('custom-event');
    });

    it('should attach a ServiceClientDispatcher as client when port is provided', () => {
      const port = new MessagePort();
      const eventHandler = jest.fn();
      dispatcher.addEventListener('custom-event', eventHandler);

      messageHandler({ data: makeRawMessage('custom-event', null), ports: [port] });

      const received = eventHandler.mock.calls[0][0] as WorkerEvent;
      expect(received.client).toBeInstanceOf(ServiceClientDispatcher);
    });

    it('should set client to null when no port is provided', () => {
      const eventHandler = jest.fn();
      dispatcher.addEventListener('custom-event', eventHandler);

      messageHandler({ data: makeRawMessage('custom-event', null), ports: [] });

      const received = eventHandler.mock.calls[0][0] as WorkerEvent;
      expect(received.client).toBeNull();
    });

    it('should attach the native event to the WorkerEvent', () => {
      const eventHandler = jest.fn();
      dispatcher.addEventListener('custom-event', eventHandler);

      const nativeEvent = { data: makeRawMessage('custom-event', null), ports: [] };
      messageHandler(nativeEvent);

      const received = eventHandler.mock.calls[0][0] as WorkerEvent;
      expect(received.nativeEvent).toBe(nativeEvent);
    });

    it('should ignore messages with no data', () => {
      const eventHandler = jest.fn();
      dispatcher.addEventListener('custom-event', eventHandler);

      messageHandler({ data: null, ports: [] });
      messageHandler({ data: undefined, ports: [] });

      expect(eventHandler).not.toHaveBeenCalled();
    });

    it('should ignore messages that are not valid MessagePortEvent envelopes', () => {
      const eventHandler = jest.fn();
      dispatcher.addEventListener('custom-event', eventHandler);

      messageHandler({ data: { notAnEvent: true }, ports: [] });
      messageHandler({ data: 'invalid-string', ports: [] });

      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('destroy()', () => {
    it('should remove message listener from target', () => {
      dispatcher.destroy();
      expect(target.removeEventListener).toHaveBeenCalledWith(
        NativeEventType.MESSAGE,
        expect.any(Function),
      );
    });

    it('should remove error event listeners from target', () => {
      dispatcher.destroy();
      expect(target.removeEventListener).toHaveBeenCalledWith(NativeEventType.ERROR, expect.any(Function));
      expect(target.removeEventListener).toHaveBeenCalledWith(
        NativeEventType.MESSAGEERROR,
        expect.any(Function),
      );
    });

    it('should remove lifecycle event listeners from target', () => {
      dispatcher.destroy();
      expect(target.removeEventListener).toHaveBeenCalledWith(NativeEventType.INSTALL, expect.any(Function));
      expect(target.removeEventListener).toHaveBeenCalledWith(
        NativeEventType.ACTIVATE,
        expect.any(Function),
      );
    });

  });

  describe('When creating without args', () => {
    it('should use `self` as default target', () => {
      (global as any).self = new EventTarget();
      const defaultDispatcher = new ServiceServerDispatcher();
      expect(defaultDispatcher.target).toBe((global as any).self);
    });
  });
});
