/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventProcessor } from '@actualwave/event-dispatcher';
import WorkerType from './WorkerType';
import { dispatchWorkerErrorEvent } from './WorkerEvent';
import AbstractDispatcher, { type WorkerLike } from './AbstractDispatcher';

const getServiceWorker = async (): Promise<ServiceWorker> => {
  const registration = await navigator.serviceWorker.ready;
  return registration.active as ServiceWorker;
};

const createTarget = (): WorkerLike => {
  let channel = new MessageChannel();
  let activeWorker: ServiceWorker | null = null;
  let started = false;
  const listeners: Array<[string, (event: any) => void]> = [];

  const resetChannel = (): void => {
    channel.port1.close();
    channel = new MessageChannel();
    if (started) {
      channel.port1.start();
    }
    for (const [type, handler] of listeners) {
      channel.port1.addEventListener(type, handler);
    }
  };

  return {
    postMessage: async (message: unknown): Promise<void> => {
      const worker = await getServiceWorker();

      if (worker !== activeWorker) {
        if (activeWorker !== null) {
          resetChannel();
        }
        activeWorker = worker;
        (worker as any).postMessage(message, [channel.port2]);
      } else {
        (worker as any).postMessage(message);
      }
    },
    addEventListener: (type: string, handler: (event: any) => void): void => {
      listeners.push([type, handler]);
      channel.port1.addEventListener(type, handler);
    },
    removeEventListener: (type: string, handler: (event: any) => void): void => {
      const idx = listeners.findIndex(([t, h]) => t === type && h === handler);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
      channel.port1.removeEventListener(type, handler);
    },
    start: (): void => {
      started = true;
      channel.port1.start();
    },
    close: (): void => {
      channel.port1.close();
    },
  } as unknown as WorkerLike;
};

class ServiceWorkerDispatcher extends AbstractDispatcher {
  private _cleanupErrors: () => void = () => {};

  constructor(
    receiverEventPreprocessor?: EventProcessor | null,
    senderEventPreprocessor?: EventProcessor | null,
  ) {
    const target = createTarget();
    super(
      WorkerType.SERVICE_WORKER,
      target,
      receiverEventPreprocessor ?? null,
      senderEventPreprocessor ?? null,
    );

    this.start();

    this._cleanupErrors = dispatchWorkerErrorEvent(this.target as unknown as EventTarget, this.receiver);
  }

  start(): void {
    (this.target as any).start();
  }

  close(): void {
    this._cleanupErrors();
    (this.target as any).close();
  }

  onReady(handler: (registration: ServiceWorkerRegistration) => void): Promise<void> {
    return navigator.serviceWorker.ready.then(handler);
  }

  get ready(): Promise<ServiceWorkerRegistration> {
    return navigator.serviceWorker.ready;
  }
}

export default ServiceWorkerDispatcher;
