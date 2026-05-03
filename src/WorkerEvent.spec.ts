import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import WorkerEvent, {
  NativeEventType,
  getWorkerEventType,
  dispatchWorkerEvent,
  type NativeEventHandler,
} from './WorkerEvent';
import type { IEventDispatcher } from '@actualwave/event-dispatcher';

describe('WorkerEvent', () => {
  let event: WorkerEvent;
  let data: object;
  let client: object;
  let nativeEvent: object;

  beforeEach(() => {
    data = { data: true };
    client = { client: true };
    nativeEvent = { source: true };
    event = new WorkerEvent('workerEvent', data, nativeEvent, client);
  });

  it('should store type', () => {
    expect(event.type).toBe('workerEvent');
  });

  it('should store data', () => {
    expect(event.data).toEqual(data);
  });

  it('should store nativeEvent', () => {
    expect(event.nativeEvent).toEqual(nativeEvent);
  });

  it('should store client', () => {
    expect(event.client).toEqual(client);
  });

  it('should set client to null when not provided', () => {
    const e = new WorkerEvent('test', null, null);
    expect(e.client).toBeNull();
  });
});

describe('getWorkerEventType()', () => {
  it('should properly convert connect event', () => {
    expect(getWorkerEventType(NativeEventType.CONNECT)).toBe(WorkerEvent.CONNECT);
  });
  it('should properly convert `message` event', () => {
    expect(getWorkerEventType(NativeEventType.MESSAGE)).toBe(WorkerEvent.MESSAGE);
  });
  it('should properly convert `error` event', () => {
    expect(getWorkerEventType(NativeEventType.ERROR)).toBe(WorkerEvent.ERROR);
  });
  it('should properly convert `messageerror` event', () => {
    expect(getWorkerEventType(NativeEventType.MESSAGEERROR)).toBe(WorkerEvent.MESSAGEERROR);
    expect(WorkerEvent.MESSAGEERROR).toBe('worker:messageerror');
  });
  it('should properly convert `languagechange` event', () => {
    expect(getWorkerEventType(NativeEventType.LANGUAGECHANGE)).toBe(WorkerEvent.LANGUAGECHANGE);
  });
  it('should properly convert `online` event', () => {
    expect(getWorkerEventType(NativeEventType.ONLINE)).toBe(WorkerEvent.ONLINE);
  });
  it('should properly convert `offline` event', () => {
    expect(getWorkerEventType(NativeEventType.OFFLINE)).toBe(WorkerEvent.OFFLINE);
  });
  it('should result with same value for unknown event type', () => {
    expect(getWorkerEventType('unknown-event')).toBe('unknown-event');
  });
});

describe('dispatchWorkerEvent()', () => {
  let target: EventTarget;
  let dispatcher: IEventDispatcher;
  let event: Event;

  beforeEach(() => {
    target = { addEventListener: jest.fn(), removeEventListener: jest.fn() } as unknown as EventTarget;
    dispatcher = {
      dispatchEvent: jest.fn(),
      hasEventListener: jest.fn(() => true),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      removeAllEventListeners: jest.fn(),
    } as unknown as IEventDispatcher;
    dispatchWorkerEvent(NativeEventType.ERROR, target, dispatcher);
    event = { type: 'error' } as globalThis.Event;
    const addEventMock = target.addEventListener as ReturnType<typeof jest.fn>;
    const handler = addEventMock.mock.calls[0][1] as NativeEventHandler;
    handler(event);
  });

  it('should add listener to target', () => {
    expect((target.addEventListener as ReturnType<typeof jest.fn>)).toHaveBeenCalledTimes(1);
    expect((target.addEventListener as ReturnType<typeof jest.fn>)).toHaveBeenCalledWith(
      NativeEventType.ERROR,
      expect.any(Function),
    );
  });

  it('handler should dispatch worker event', () => {
    expect((dispatcher.dispatchEvent as ReturnType<typeof jest.fn>)).toHaveBeenCalledTimes(1);
    const workerEvent = (dispatcher.dispatchEvent as ReturnType<typeof jest.fn>).mock.calls[0][0];
    expect(workerEvent).toBeInstanceOf(WorkerEvent);
    expect((workerEvent as WorkerEvent).type).toEqual(WorkerEvent.ERROR);
    expect((workerEvent as WorkerEvent).nativeEvent).toEqual(event);
  });

  it('should return a cleanup function that removes the listener', () => {
    const cleanupTarget = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as EventTarget;
    const cleanup = dispatchWorkerEvent(NativeEventType.ERROR, cleanupTarget, dispatcher);
    cleanup();
    expect((cleanupTarget.removeEventListener as ReturnType<typeof jest.fn>)).toHaveBeenCalledWith(
      NativeEventType.ERROR,
      expect.any(Function),
    );
  });
});
