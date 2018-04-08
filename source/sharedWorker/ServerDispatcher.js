import EventDispatcher from '@actualwave/event-dispatcher';
import WorkerType from '../WorkerType';
import WorkerEvent, { dispatchWorkerEvents } from '../WorkerEvent';
import ClientDispatcher from './ClientDispatcher';

/**
 * Read-only interface, mainly will listen to "connect" event.
 * You should listen to WorkerEvent.CONNECT to intercept client
 * instance to be able to communicate.
 * @param worker
 * @param receiverEventPreprocessor {?Function}
 * @constructor
 */
class ServerDispatcher {
  constructor(
    target,
    receiverEventPreprocessor,
    clientReceiverEventPreprocessor,
    clientSenderEventPreprocessor,
  ) {
    // eslint-disable-next-line no-restricted-globals
    this.target = target || self;
    this.clientReceiverEventPreprocessor = clientReceiverEventPreprocessor;
    this.clientSenderEventPreprocessor = clientSenderEventPreprocessor;
    this.type = WorkerType.SHARED_WORKER_SERVER;
    this.receiver = new EventDispatcher(receiverEventPreprocessor);

    this.target.addEventListener('connect', this.handleConnect);
    dispatchWorkerEvents(this.target, this.receiver);
  }

  addEventListener = (...args) => this.receiver.addEventListener(...args);
  hasEventListener = (...args) => this.receiver.hasEventListener(...args);
  removeEventListener = (...args) => this.receiver.removeEventListener(...args);
  removeAllEventListeners = (...args) => this.receiver.removeAllEventListeners(...args);

  handleConnect = (event) => {
    const [target] = event.ports;
    const client = new ClientDispatcher(
      target,
      this.clientReceiverEventPreprocessor,
      this.clientSenderEventPreprocessor,
    );

    this.receiver.dispatchEvent(new WorkerEvent(WorkerEvent.CONNECT, client, event, client));
  }
}

export default ServerDispatcher;
