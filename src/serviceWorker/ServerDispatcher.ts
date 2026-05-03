/* eslint-disable no-restricted-globals */
import { createEventDispatcher } from '@actualwave/event-dispatcher';
import type { EventProcessor, IEventDispatcher, EventObject } from '@actualwave/event-dispatcher';
import { parseMessagePortEvent } from '@actualwave/messageport-dispatcher';
import WorkerType from '../WorkerType';
import WorkerEvent, {
  NativeEventType,
  dispatchWorkerErrorEvent,
  dispatchServiceWorkerEvents,
} from '../WorkerEvent';
import ServiceClientDispatcher from './ClientDispatcher';

class ServiceServerDispatcher {
  type: string;
  target: EventTarget;
  receiver: IEventDispatcher;
  clientFactory: (port?: MessagePort) => ServiceClientDispatcher | null;
  private _cleanup: () => void = () => {};

  constructor(
    target: EventTarget = self as unknown as EventTarget,
    receiverEventPreprocessor?: EventProcessor,
    clientReceiverEventPreprocessor?: EventProcessor,
    clientSenderEventPreprocessor?: EventProcessor,
  ) {
    this.type = WorkerType.SERVICE_WORKER_SERVER;
    this.target = target;

    this.clientFactory = (port?: MessagePort) => {
      if (!port) return null;
      return new ServiceClientDispatcher(port, clientReceiverEventPreprocessor, clientSenderEventPreprocessor);
    };

    this.receiver = createEventDispatcher(receiverEventPreprocessor);

    const cleanupErrors = dispatchWorkerErrorEvent(target, this.receiver);
    const cleanupLifecycle = dispatchServiceWorkerEvents(target, this.receiver);
    target.addEventListener(NativeEventType.MESSAGE, this._messageListener);
    this._cleanup = () => {
      cleanupErrors();
      cleanupLifecycle();
      target.removeEventListener(NativeEventType.MESSAGE, this._messageListener);
    };
  }

  addEventListener = (...args: Parameters<IEventDispatcher['addEventListener']>): void =>
    this.receiver.addEventListener(...args);

  hasEventListener = (...args: Parameters<IEventDispatcher['hasEventListener']>): boolean =>
    this.receiver.hasEventListener(...args);

  removeEventListener = (...args: Parameters<IEventDispatcher['removeEventListener']>): void =>
    this.receiver.removeEventListener(...args);

  removeAllEventListeners = (...args: Parameters<IEventDispatcher['removeAllEventListeners']>): void =>
    this.receiver.removeAllEventListeners(...args);

  destroy(): void {
    this._cleanup();
  }

  private _messageListener = (event: Event): void => {
    const nativeEvent = event as MessageEvent;
    const {
      data: rawMessage,
      ports: [client],
    } = nativeEvent;

    if (!rawMessage) return;

    const message = parseMessagePortEvent(rawMessage);
    if (!message) return;

    const { type: eventType, data: eventData } = message.event as EventObject;

    this.receiver.dispatchEvent(
      new WorkerEvent(eventType, eventData, nativeEvent, this.clientFactory(client)),
    );
  };
}

export default ServiceServerDispatcher;
