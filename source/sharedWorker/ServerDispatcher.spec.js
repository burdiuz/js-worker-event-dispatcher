/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import WorkerEvent, { NativeEventTypes } from '../WorkerEvent';
import ServerDispatcher from './ServerDispatcher';
import ClientDispatcher from './ClientDispatcher';
import {
  EventTarget,
  MessagePortBase,
} from '../../tests/stubs';

describe('ServerDispatcher', () => {
  let worker;
  let dispatcher;

  beforeEach(() => {
    worker = new MessagePortBase();
    dispatcher = new ServerDispatcher(worker);
  });

  it('should add listeners to events', () => {
    expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.ERROR);
    expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.LANGUAGECHANGE);
    expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.ONLINE);
    expect(worker.addEventListener).to.be.calledWith(NativeEventTypes.OFFLINE);
  });

  describe('on connect', () => {
    let port;
    let connectHandler;

    beforeEach(() => {
      port = new MessagePortBase();
      connectHandler = sinon.spy();

      dispatcher.addEventListener(WorkerEvent.CONNECT, connectHandler);

      const handler = worker.addEventListener.getCall(0).args[1];
      handler({
        type: 'connect',
        ports: [port],
      });
    });

    it('should dispatch CONNECT event', () => {
      expect(connectHandler).to.be.calledOnce;
    });

    it('event should have client dispatcher', () => {
      const event = connectHandler.getCall(0).args[0];
      expect(event.client).to.be.an.instanceof(ClientDispatcher);
    });
  });

  describe('When creating without args', () => {
    beforeEach(() => {
      window.self = new EventTarget();
      dispatcher = new ServerDispatcher();
    });

    it('should use `self` thinking its SharedWorkerGlobalScope', () => {
      expect(dispatcher.target).to.be.equal(window.self);
    });
  });
});
