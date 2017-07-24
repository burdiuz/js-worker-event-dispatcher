
/**
 *
 * @param worker
 * @param receiverEventPreprocessor {?Function}
 * @extends WorkerMessenger
 * @constructor
 */
class ServerEventDispatcher extends WorkerEventDispatcher{
  constructor(target, receiverEventPreprocessor) {
  var _target = target || self;
  /**
   * @type {EventDispatcher}
   */
  var _receiver = new EventDispatcher(receiverEventPreprocessor);

  function connectHandler(event) {
    var client = WorkerEventDispatcher.create(
      event.ports[0],
      WorkerType.SHARED_WORKER_CLIENT
    );
    _receiver.dispatchEvent(new WorkerEvent(WorkerEvent.CONNECT, client, event, client));
  }

  _target.addEventListener('connect', connectHandler);

  this.addEventListener = _receiver.addEventListener.bind(_receiver);
  this.hasEventListener = _receiver.hasEventListener.bind(_receiver);
  this.removeEventListener = _receiver.removeEventListener.bind(_receiver);
  this.removeAllEventListeners = _receiver.removeAllEventListeners.bind(_receiver);

  WorkerMessenger.setScopeHandlers(_target, _receiver);

  Object.defineProperties(this, {
    receiver: {
      value: _receiver
    },
    target: {
      value: _target
    },
    type: {
      value: WorkerType.SHARED_WORKER_SERVER
    }
  });
}

ServerEventDispatcher.prototype = EventDispatcher.createNoInitPrototype();
.prototype.constructor = ServerEventDispatcher;


  export default ServerEventDispatcher;
