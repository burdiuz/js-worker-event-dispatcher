import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import ServiceWorkerDispatcher from './ServiceWorkerDispatcher';
import { NativeEventType } from './WorkerEvent';

/* eslint-disable @typescript-eslint/no-explicit-any */

const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

interface MockPort {
  start: ReturnType<typeof jest.fn>;
  close: ReturnType<typeof jest.fn>;
  addEventListener: ReturnType<typeof jest.fn>;
  removeEventListener: ReturnType<typeof jest.fn>;
}

interface MockChannel {
  port1: MockPort;
  port2: object;
}

const createMockPort = (): MockPort => ({
  start: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

const createMockChannel = (): MockChannel => ({
  port1: createMockPort(),
  port2: {},
});

const createMockWorker = () => ({ postMessage: jest.fn() });

let mockWorker: ReturnType<typeof createMockWorker>;
let mockRegistration: { active: ReturnType<typeof createMockWorker> };
let mockChannel: MockChannel;
let savedNavigator: unknown;
let savedMessageChannel: unknown;

beforeEach(() => {
  savedNavigator = (global as any).navigator;
  savedMessageChannel = (global as any).MessageChannel;

  mockWorker = createMockWorker();
  mockRegistration = { active: mockWorker };
  mockChannel = createMockChannel();

  (global as any).MessageChannel = jest.fn(() => mockChannel);
  (global as any).navigator = {
    serviceWorker: {
      ready: Promise.resolve(mockRegistration),
    },
  };
});

afterEach(() => {
  (global as any).navigator = savedNavigator;
  (global as any).MessageChannel = savedMessageChannel;
});

describe('ServiceWorkerDispatcher', () => {
  describe('constructor', () => {
    it('should start port1', () => {
      new ServiceWorkerDispatcher();
      expect(mockChannel.port1.start).toHaveBeenCalledTimes(1);
    });

    it('should listen on port1 for messages', () => {
      new ServiceWorkerDispatcher();
      expect(mockChannel.port1.addEventListener).toHaveBeenCalledWith(
        NativeEventType.MESSAGE,
        expect.any(Function),
      );
    });

    it('should register error event listeners', () => {
      new ServiceWorkerDispatcher();
      expect(mockChannel.port1.addEventListener).toHaveBeenCalledWith(
        NativeEventType.ERROR,
        expect.any(Function),
      );
      expect(mockChannel.port1.addEventListener).toHaveBeenCalledWith(
        NativeEventType.MESSAGEERROR,
        expect.any(Function),
      );
    });

    it('should have Dispatcher interface', () => {
      const dispatcher = new ServiceWorkerDispatcher();
      expect(dispatcher.addEventListener).toBeInstanceOf(Function);
      expect(dispatcher.hasEventListener).toBeInstanceOf(Function);
      expect(dispatcher.removeEventListener).toBeInstanceOf(Function);
      expect(dispatcher.removeAllEventListeners).toBeInstanceOf(Function);
      expect(dispatcher.dispatchEvent).toBeInstanceOf(Function);
    });
  });

  describe('dispatchEvent()', () => {
    it('should transfer port2 on first send', async () => {
      const dispatcher = new ServiceWorkerDispatcher();
      dispatcher.dispatchEvent('test', { value: 1 });
      await flushPromises();

      expect(mockWorker.postMessage).toHaveBeenCalledTimes(1);
      expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.any(Object), [mockChannel.port2]);
    });

    it('should not transfer port2 on subsequent sends to same worker', async () => {
      const dispatcher = new ServiceWorkerDispatcher();

      dispatcher.dispatchEvent('first');
      await flushPromises();
      dispatcher.dispatchEvent('second');
      await flushPromises();

      expect(mockWorker.postMessage).toHaveBeenCalledTimes(2);
      const secondCallArgs = mockWorker.postMessage.mock.calls[1];
      expect(secondCallArgs).toHaveLength(1);
    });
  });

  describe('service worker recovery', () => {
    it('should create a new channel when the service worker changes', async () => {
      const secondChannel = createMockChannel();
      let channelCount = 0;
      (global as any).MessageChannel = jest.fn(() => (channelCount++ === 0 ? mockChannel : secondChannel));

      const dispatcher = new ServiceWorkerDispatcher();

      dispatcher.dispatchEvent('first');
      await flushPromises();
      expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.anything(), [mockChannel.port2]);

      const newWorker = createMockWorker();
      mockRegistration.active = newWorker;

      dispatcher.dispatchEvent('second');
      await flushPromises();

      expect(mockChannel.port1.close).toHaveBeenCalledTimes(1);
      expect(newWorker.postMessage).toHaveBeenCalledWith(expect.anything(), [secondChannel.port2]);
    });

    it('should re-attach existing listeners to new channel on recovery', async () => {
      const secondChannel = createMockChannel();
      let channelCount = 0;
      (global as any).MessageChannel = jest.fn(() => (channelCount++ === 0 ? mockChannel : secondChannel));

      const dispatcher = new ServiceWorkerDispatcher();
      const listenersOnFirstChannel = mockChannel.port1.addEventListener.mock.calls.length;

      dispatcher.dispatchEvent('first');
      await flushPromises();

      const newWorker = createMockWorker();
      mockRegistration.active = newWorker;

      dispatcher.dispatchEvent('second');
      await flushPromises();

      expect(secondChannel.port1.addEventListener).toHaveBeenCalledTimes(listenersOnFirstChannel);
    });

    it('should start new channel port1 if was already started', async () => {
      const secondChannel = createMockChannel();
      let channelCount = 0;
      (global as any).MessageChannel = jest.fn(() => (channelCount++ === 0 ? mockChannel : secondChannel));

      const dispatcher = new ServiceWorkerDispatcher();

      dispatcher.dispatchEvent('first');
      await flushPromises();

      const newWorker = createMockWorker();
      mockRegistration.active = newWorker;

      dispatcher.dispatchEvent('second');
      await flushPromises();

      expect(secondChannel.port1.start).toHaveBeenCalledTimes(1);
    });

    it('should not reset channel on first message even if no prior worker', async () => {
      const secondChannel = createMockChannel();
      let channelCount = 0;
      (global as any).MessageChannel = jest.fn(() => (channelCount++ === 0 ? mockChannel : secondChannel));

      const dispatcher = new ServiceWorkerDispatcher();

      dispatcher.dispatchEvent('first');
      await flushPromises();

      expect(mockChannel.port1.close).not.toHaveBeenCalled();
      expect(channelCount).toBe(1);
    });
  });

  describe('start()', () => {
    it('should call port1.start()', () => {
      const dispatcher = new ServiceWorkerDispatcher();
      mockChannel.port1.start.mockClear();
      dispatcher.start();
      expect(mockChannel.port1.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('close()', () => {
    it('should call port1.close()', () => {
      const dispatcher = new ServiceWorkerDispatcher();
      dispatcher.close();
      expect(mockChannel.port1.close).toHaveBeenCalledTimes(1);
    });

    it('should remove error event listeners', () => {
      const dispatcher = new ServiceWorkerDispatcher();
      dispatcher.close();
      expect(mockChannel.port1.removeEventListener).toHaveBeenCalledWith(
        NativeEventType.ERROR,
        expect.any(Function),
      );
      expect(mockChannel.port1.removeEventListener).toHaveBeenCalledWith(
        NativeEventType.MESSAGEERROR,
        expect.any(Function),
      );
    });
  });

  describe('ready', () => {
    it('should return navigator.serviceWorker.ready', () => {
      const dispatcher = new ServiceWorkerDispatcher();
      expect(dispatcher.ready).toBe((global as any).navigator.serviceWorker.ready);
    });
  });

  describe('onReady()', () => {
    it('should invoke handler when ready resolves', async () => {
      const dispatcher = new ServiceWorkerDispatcher();
      const handler = jest.fn();
      dispatcher.onReady(handler as any);
      await flushPromises();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
