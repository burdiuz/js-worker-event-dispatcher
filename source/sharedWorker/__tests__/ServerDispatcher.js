/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import WorkerEvent, { NativeEventTypes } from '../../WorkerEvent';
import ServerDispatcher from '../ServerDispatcher';
import ClientDispatcher from '../ClientDispatcher';
import { EventTarget, MessagePortBase } from '../../../tests/stubs';

describe('ServerDispatcher', () => {
  let worker;
  let dispatcher;

  beforeEach(() => {
    worker = new MessagePortBase();
    dispatcher = new ServerDispatcher(worker);
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
      expect(event.client).toBeInstanceOf(ClientDispatcher);
    });
  });

  describe('When creating without args', () => {
    beforeEach(() => {
      global.self = new EventTarget();
      dispatcher = new ServerDispatcher();
    });

    it('should use `self` thinking its SharedWorkerGlobalScope', () => {
      expect(dispatcher.target).toBe(global.self);
    });
  });
});
