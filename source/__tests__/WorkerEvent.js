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
    expect(event.type).toBe('workerEvent');
  });

  it('should store data', () => {
    expect(event.data).toEqual(data);
  });

  it('should store sourceEvent', () => {
    expect(event.sourceEvent).toEqual(sourceEvent);
  });

  it('should store client', () => {
    expect(event.client).toEqual(client);
  });
});

describe('getWorkerEventType()', () => {
  it('should properly convert connect event', () => {
    expect(getWorkerEventType(NativeEventTypes.CONNECT)).toBe(WorkerEvent.CONNECT);
  });
  it('should properly convert `message` event', () => {
    expect(getWorkerEventType(NativeEventTypes.MESSAGE)).toBe(WorkerEvent.MESSAGE);
  });
  it('should properly convert `error` event', () => {
    expect(getWorkerEventType(NativeEventTypes.ERROR)).toBe(WorkerEvent.ERROR);
  });
  it('should properly convert `languagechange` event', () => {
    expect(getWorkerEventType(NativeEventTypes.LANGUAGECHANGE)).toBe(WorkerEvent.LANGUAGECHANGE);
  });
  it('should properly convert `online` event', () => {
    expect(getWorkerEventType(NativeEventTypes.ONLINE)).toBe(WorkerEvent.ONLINE);
  });
  it('should properly convert `offline` event', () => {
    expect(getWorkerEventType(NativeEventTypes.OFFLINE)).toBe(WorkerEvent.OFFLINE);
  });
  it('should result with NULL for unknown event type', () => {
    expect(getWorkerEventType('unknown-event')).toBeNull();
  });
});

describe('dispatchWorkerEvent()', () => {
  let handler;
  let target;
  let dispatcher;
  let event;

  beforeEach(() => {
    target = { addEventListener: jest.fn() };
    dispatcher = {
      dispatchEvent: jest.fn(),
      hasEventListener: jest.fn(() => true),
    };
    handler = dispatchWorkerEvent(NativeEventTypes.ERROR, target, dispatcher);
    event = { type: 'error' };
    handler(event);
  });

  it('should add listener to target', () => {
    expect(target.addEventListener).toHaveBeenCalledTimes(1);
    expect(target.addEventListener).toHaveBeenCalledWith(NativeEventTypes.ERROR, handler);
  });

  it('handler should dispatch worker event', () => {
    expect(dispatcher.dispatchEvent).toHaveBeenCalledTimes(1);
    const workerEvent = dispatcher.dispatchEvent.mock.calls[0][0];
    expect(workerEvent).toBeInstanceOf(WorkerEvent);
    expect(workerEvent.type).toEqual(WorkerEvent.ERROR);
    expect(workerEvent.sourceEvent).toEqual(event);
  });
});
