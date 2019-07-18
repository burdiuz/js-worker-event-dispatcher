/* eslint-disable no-restricted-globals */
import { createEventDispatcher } from '@actualwave/event-dispatcher';
import WorkerType from '../WorkerType';
import WorkerEvent, {
  NativeEventType,
  dispatchWorkerEvents,
} from '../WorkerEvent';
import SharedClientDispatcher from './ClientDispatcher';

/**
 * Read-only interface, mainly will listen to "connect" event.
 * You should listen to WorkerEvent.CONNECT to intercept client
 * instance to be able to communicate.
 * @param worker
 * @param receiverEventPreprocessor {?Function}
 * @constructor
 */
class SharedServerDispatcher {
  constructor(
    target = self,
    receiverEventPreprocessor,
    clientReceiverEventPreprocessor,
    clientSenderEventPreprocessor,
  ) {
    this.type = WorkerType.SHARED_WORKER_SERVER;
    this.target = target;
    this.clientFactory = (client) => new SharedClientDispatcher(
      client,
      clientReceiverEventPreprocessor,
      clientSenderEventPreprocessor,
    );
    this.receiver = createEventDispatcher(receiverEventPreprocessor);
    this.target.addEventListener(NativeEventType.CONNECT, this.handleConnect);
    dispatchWorkerEvents(this.target, this.receiver);
  }

  addEventListener = (...args) => this.receiver.addEventListener(...args);

  hasEventListener = (...args) => this.receiver.hasEventListener(...args);

  removeEventListener = (...args) => this.receiver.removeEventListener(...args);

  removeAllEventListeners = (...args) => this.receiver.removeAllEventListeners(...args);

  handleConnect = (event) => {
    const [target] = event.ports;
    const client = this.clientFactory(target);

    this.receiver.dispatchEvent(
      new WorkerEvent(WorkerEvent.CONNECT, client, event, client),
    );
  };
}

export default SharedServerDispatcher;
