/* eslint-disable no-restricted-globals */
import { createEventDispatcher } from '@actualwave/event-dispatcher';
import type { EventProcessor, IEventDispatcher, EventListener } from '@actualwave/event-dispatcher';
import WorkerType from '../WorkerType';
import WorkerEvent, { NativeEventType, dispatchWorkerEvents } from '../WorkerEvent';
import SharedClientDispatcher from './ClientDispatcher';

class SharedServerDispatcher {
  type: string;
  target: EventTarget;
  receiver: IEventDispatcher;
  clientFactory: (client: MessagePort) => SharedClientDispatcher;
  private _cleanup: () => void = () => {};

  constructor(
    target: EventTarget = self as unknown as EventTarget,
    receiverEventPreprocessor?: EventProcessor,
    clientReceiverEventPreprocessor?: EventProcessor,
    clientSenderEventPreprocessor?: EventProcessor,
  ) {
    this.type = WorkerType.SHARED_WORKER_SERVER;
    this.target = target;
    this.clientFactory = (client: MessagePort) =>
      new SharedClientDispatcher(client, clientReceiverEventPreprocessor, clientSenderEventPreprocessor);
    this.receiver = createEventDispatcher(receiverEventPreprocessor);
    this.target.addEventListener(NativeEventType.CONNECT, this.handleConnect as EventListener);
    const cleanupWorkerEvents = dispatchWorkerEvents(this.target, this.receiver);
    this._cleanup = () => {
      cleanupWorkerEvents();
      this.target.removeEventListener(NativeEventType.CONNECT, this.handleConnect as EventListener);
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

  handleConnect = (event: Event): void => {
    const [target] = (event as MessageEvent).ports;
    const client = this.clientFactory(target);

    this.receiver.dispatchEvent(new WorkerEvent(WorkerEvent.CONNECT, client, event, client));
  };
}

export default SharedServerDispatcher;
