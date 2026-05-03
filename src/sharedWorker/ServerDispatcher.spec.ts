import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import WorkerEvent, { NativeEventType } from '../WorkerEvent';
import SharedServerDispatcher from './ServerDispatcher';
import SharedClientDispatcher from './ClientDispatcher';
import { EventTarget, MessagePortBase } from '../stubs';

describe('SharedServerDispatcher', () => {
  let worker: InstanceType<typeof MessagePortBase>;
  let dispatcher: SharedServerDispatcher;

  beforeEach(() => {
    worker = new MessagePortBase();
    dispatcher = new SharedServerDispatcher(worker as unknown as globalThis.EventTarget);
  });

  it('should add listeners to events', () => {
    expect(worker.addEventListener).toHaveBeenCalledWith(NativeEventType.ERROR, expect.any(Function));
    expect(worker.addEventListener).toHaveBeenCalledWith(NativeEventType.LANGUAGECHANGE, expect.any(Function));
    expect(worker.addEventListener).toHaveBeenCalledWith(NativeEventType.ONLINE, expect.any(Function));
    expect(worker.addEventListener).toHaveBeenCalledWith(NativeEventType.OFFLINE, expect.any(Function));
  });

  describe('When "addEventListener" called', () => {
    let stub: ReturnType<typeof jest.spyOn>;
    let handler: () => null;

    beforeEach(() => {
      stub = jest.spyOn(dispatcher.receiver, 'addEventListener');
      handler = () => null;
      dispatcher.addEventListener('my-event', handler);
    });

    it('should pass call to receiver event dispatcher', () => {
      expect(stub).toHaveBeenCalledTimes(1);
      expect(stub).toHaveBeenCalledWith('my-event', handler);
    });
  });

  describe('When "hasEventListener" called', () => {
    let stub: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      stub = jest.spyOn(dispatcher.receiver, 'hasEventListener');
      dispatcher.hasEventListener('my-event');
    });

    it('should pass call to receiver event dispatcher', () => {
      expect(stub).toHaveBeenCalledTimes(1);
      expect(stub).toHaveBeenCalledWith('my-event');
    });
  });

  describe('When "removeEventListener" called', () => {
    let stub: ReturnType<typeof jest.spyOn>;
    let handler: () => null;

    beforeEach(() => {
      stub = jest.spyOn(dispatcher.receiver, 'removeEventListener');
      handler = () => null;
      dispatcher.removeEventListener('my-event', handler);
    });

    it('should pass call to receiver event dispatcher', () => {
      expect(stub).toHaveBeenCalledTimes(1);
      expect(stub).toHaveBeenCalledWith('my-event', handler);
    });
  });

  describe('When "removeAllEventListeners" called', () => {
    let stub: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      stub = jest.spyOn(dispatcher.receiver, 'removeAllEventListeners');
      dispatcher.removeAllEventListeners('my-event');
    });

    it('should pass call to receiver event dispatcher', () => {
      expect(stub).toHaveBeenCalledTimes(1);
    });
  });

  describe('on connect', () => {
    let port: InstanceType<typeof MessagePortBase>;
    let connectHandler: ReturnType<typeof jest.fn>;

    beforeEach(() => {
      port = new MessagePortBase();
      connectHandler = jest.fn();

      dispatcher.addEventListener(WorkerEvent.CONNECT, connectHandler);

      const handler = worker.addEventListener.mock.calls[0][1] as (e: object) => void;
      handler({ type: 'connect', ports: [port] });
    });

    it('should dispatch CONNECT event', () => {
      expect(connectHandler).toHaveBeenCalledTimes(1);
    });

    it('event should have client dispatcher', () => {
      const event = connectHandler.mock.calls[0][0];
      expect((event as WorkerEvent).client).toBeInstanceOf(SharedClientDispatcher);
    });
  });

  describe('destroy()', () => {
    it('should remove connect listener from target', () => {
      dispatcher.destroy();
      expect(worker.removeEventListener).toHaveBeenCalledWith(
        NativeEventType.CONNECT,
        expect.any(Function),
      );
    });

    it('should remove worker event listeners from target', () => {
      dispatcher.destroy();
      expect(worker.removeEventListener).toHaveBeenCalledWith(NativeEventType.ERROR, expect.any(Function));
      expect(worker.removeEventListener).toHaveBeenCalledWith(
        NativeEventType.LANGUAGECHANGE,
        expect.any(Function),
      );
      expect(worker.removeEventListener).toHaveBeenCalledWith(NativeEventType.ONLINE, expect.any(Function));
      expect(worker.removeEventListener).toHaveBeenCalledWith(NativeEventType.OFFLINE, expect.any(Function));
    });
  });

  describe('When creating without args', () => {
    beforeEach(() => {
      (global as any).self = new EventTarget();
      dispatcher = new SharedServerDispatcher();
    });

    it('should use `self` thinking its SharedWorkerGlobalScope', () => {
      expect(dispatcher.target).toBe((global as any).self);
    });
  });
});
