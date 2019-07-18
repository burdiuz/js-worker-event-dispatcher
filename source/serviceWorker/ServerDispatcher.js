/* eslint-disable no-restricted-globals */
import { createEventDispatcher } from '@actualwave/event-dispatcher';
import { parseMessagePortEvent } from '@actualwave/messageport-dispatcher';
import WorkerType from '../WorkerType';
import WorkerEvent, {
  NativeEventType,
  dispatchWorkerErrorEvent,
} from '../WorkerEvent';
import ServiceClientDispatcher from './ClientDispatcher';

/**
 * Read-only interface, mainly will listen to "connect" event.
 * You should listen to WorkerEvent.CONNECT to intercept client
 * instance to be able to communicate.
 * @param worker
 * @param receiverEventPreprocessor {?Function}
 * @constructor
 */
class ServiceServerDispatcher {
  constructor(
    target = self,
    receiverEventPreprocessor,
    clientReceiverEventPreprocessor,
    clientSenderEventPreprocessor,
  ) {
    this.type = WorkerType.SERVICE_WORKER_SERVER;
    this.target = target;

    this.clientFactory = (port) => {
      if (!port) {
        return null;
      }

      return new ServiceClientDispatcher(
        port,
        clientReceiverEventPreprocessor,
        clientSenderEventPreprocessor,
      );
    };

    this.receiver = createEventDispatcher(receiverEventPreprocessor);

    dispatchWorkerErrorEvent(target, this.receiver);
    target.addEventListener(NativeEventType.MESSAGE, (event) => this._postMessageListener(event),
    );
  }

  addEventListener = (...args) => this.receiver.addEventListener(...args);

  hasEventListener = (...args) => this.receiver.hasEventListener(...args);

  removeEventListener = (...args) => this.receiver.removeEventListener(...args);

  removeAllEventListeners = (...args) => this.receiver.removeAllEventListeners(...args);

  /**
   * @private
   */
  _postMessageListener(nativeEvent) {
    const {
      data: rawMessage,
      ports: [client],
    } = nativeEvent;

    if (!rawMessage) {
      return;
    }

    const {
      event: { type: eventType, data: eventData },
    } = parseMessagePortEvent(rawMessage);

    const event = new WorkerEvent(
      eventType,
      eventData,
      nativeEvent,
      this.clientFactory(client),
    );

    this.receiver.dispatchEvent(event);
  }
}

export default ServiceServerDispatcher;
