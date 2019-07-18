/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import WorkerEvent, { NativeEventType } from '../../WorkerEvent';
import SharedServerDispatcher from '../ServerDispatcher';
import SharedClientDispatcher from '../ClientDispatcher';
import { EventTarget, MessagePortBase } from '../../../tests/stubs';

describe('SharedServerDispatcher', () => {
  let worker;
  let dispatcher;

  beforeEach(() => {
    worker = new MessagePortBase();
    dispatcher = new SharedServerDispatcher(worker);
  });

  it('should add listeners to events', () => {
    expect(worker.addEventListener).toHaveBeenCalledWith(
      NativeEventType.ERROR,
      expect.any(Function),
    );
    expect(worker.addEventListener).toHaveBeenCalledWith(
      NativeEventType.LANGUAGECHANGE,
      expect.any(Function),
    );
    expect(worker.addEventListener).toHaveBeenCalledWith(
      NativeEventType.ONLINE,
      expect.any(Function),
    );
    expect(worker.addEventListener).toHaveBeenCalledWith(
      NativeEventType.OFFLINE,
      expect.any(Function),
    );
  });

  describe('When "addEventListener" called', () => {
    let stub;
    let handler;

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
    let stub;

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
    let stub;
    let handler;

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
    let stub;

    beforeEach(() => {
      stub = jest.spyOn(dispatcher.receiver, 'removeAllEventListeners');
      dispatcher.removeAllEventListeners();
    });

    it('should pass call to receiver event dispatcher', () => {
      expect(stub).toHaveBeenCalledTimes(1);
    });
  });

  describe('on connect', () => {
    let port;
    let connectHandler;

    beforeEach(() => {
      port = new MessagePortBase();
      connectHandler = jest.fn();

      dispatcher.addEventListener(WorkerEvent.CONNECT, connectHandler);

      const handler = worker.addEventListener.mock.calls[0][1];
      handler({
        type: 'connect',
        ports: [port],
      });
    });

    it('should dispatch CONNECT event', () => {
      expect(connectHandler).toHaveBeenCalledTimes(1);
    });

    it('event should have client dispatcher', () => {
      const event = connectHandler.mock.calls[0][0];
      expect(event.client).toBeInstanceOf(SharedClientDispatcher);
    });
  });

  describe('When creating without args', () => {
    beforeEach(() => {
      global.self = new EventTarget();
      dispatcher = new SharedServerDispatcher();
    });

    it('should use `self` thinking its SharedWorkerGlobalScope', () => {
      expect(dispatcher.target).toBe(global.self);
    });
  });
});
