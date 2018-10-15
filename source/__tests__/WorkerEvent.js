/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import WorkerEvent, {
  NativeEventTypes,
  getWorkerEventType,
  dispatchWorkerEvent,
} from '../WorkerEvent';

describe('WorkerEvent', () => {
  let event;
  let data;
  let client;
  let sourceEvent;

  beforeEach(() => {
    data = { data: true };
    client = { client: true };
    sourceEvent = { source: true };
    event = new WorkerEvent('workerEvent', data, sourceEvent, client);
  });

  it('should store type', () => {
    expect(event.type).to.be.equal('workerEvent');
  });

  it('should store data', () => {
    expect(event.data).to.be.equal(data);
  });

  it('should store sourceEvent', () => {
    expect(event.sourceEvent).to.be.equal(sourceEvent);
  });

  it('should store client', () => {
    expect(event.client).to.be.equal(client);
  });
});

describe('getWorkerEventType()', () => {
  it('should properly convert connect event', () => {
    expect(getWorkerEventType(NativeEventTypes.CONNECT))
      .to.be.equal(WorkerEvent.CONNECT);
  });
  it('should properly convert `message` event', () => {
    expect(getWorkerEventType(NativeEventTypes.MESSAGE))
      .to.be.equal(WorkerEvent.MESSAGE);
  });
  it('should properly convert `error` event', () => {
    expect(getWorkerEventType(NativeEventTypes.ERROR))
      .to.be.equal(WorkerEvent.ERROR);
  });
  it('should properly convert `languagechange` event', () => {
    expect(getWorkerEventType(NativeEventTypes.LANGUAGECHANGE))
      .to.be.equal(WorkerEvent.LANGUAGECHANGE);
  });
  it('should properly convert `online` event', () => {
    expect(getWorkerEventType(NativeEventTypes.ONLINE))
      .to.be.equal(WorkerEvent.ONLINE);
  });
  it('should properly convert `offline` event', () => {
    expect(getWorkerEventType(NativeEventTypes.OFFLINE))
      .to.be.equal(WorkerEvent.OFFLINE);
  });
  it('should result with NULL for unknown event type', () => {
    expect(getWorkerEventType('unknown-event'))
      .to.be.null;
  });
});

describe('dispatchWorkerEvent()', () => {
  let handler;
  let target;
  let dispatcher;
  let event;

  beforeEach(() => {
    target = { addEventListener: sinon.spy() };
    dispatcher = {
      dispatchEvent: sinon.spy(),
      hasEventListener: sinon.spy(() => true),
    };
    handler = dispatchWorkerEvent(NativeEventTypes.ERROR, target, dispatcher);
    event = { type: 'error' };
    handler(event);
  });

  it('should add listener to target', () => {
    expect(target.addEventListener).to.be.calledOnce;
    expect(target.addEventListener).to.be.calledWith(NativeEventTypes.ERROR, handler);
  });

  it('handler should dispatch worker event', () => {
    expect(dispatcher.dispatchEvent).to.be.calledOnce;
    const workerEvent = dispatcher.dispatchEvent.getCall(0).args[0];
    expect(workerEvent).to.be.an.instanceof(WorkerEvent);
    expect(workerEvent.type).to.be.equal(WorkerEvent.ERROR);
    expect(workerEvent.sourceEvent).to.be.equal(event);
  });
});
