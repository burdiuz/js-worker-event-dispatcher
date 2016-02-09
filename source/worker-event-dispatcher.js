/**
 * Created by Oleg Galaburda on 09.02.16.
 */

function WorkerEventDispatcher(worker) {
  /**
   * @type {EventDispatcher}
   */
  var _sender = new EventDispatcher();
  var _receiver = new EventDispatcher();

  function messageHandler(message) {
    var event;
    if (EventDispatcher.isObject(message.data)) {
      event = message.data;
    } else {
      try {
        event = JSON.parse(message.data);
      } catch (error) {
        // this isn't an event we are waiting for.
        return;
      }
    }
    if (EventDispatcher.isObject(event) && event.hasOwnProperty('type')) {
      _receiver.dispatchEvent(event);
    }
  }

  function dispatchEvent(event, data, transferList) {
    event = EventDispatcher.getEvent(event, data);
    var eventJson;
    if (event.hasOwnProperty('toJSON') && typeof(event.toJSON) === 'function') {
      eventJson = event.toJSON();
    } else {
      eventJson = JSON.stringify(event);
    }
    worker.postMessage(eventJson, transferList);
    _sender.dispatchEvent(event);
  }

  function terminate() {
    return worker.terminate();
  }

  this.addEventListener = _receiver.addEventListener;
  this.hasEventListener = _receiver.hasEventListener;
  this.removeEventListener = _receiver.removeEventListener;
  this.removeAllEventListeners = _receiver.removeAllEventListeners;
  this.dispatchEvent = dispatchEvent;
  this.terminate = terminate;

  Object.defineProperties(this, {
    sender: {
      value: _sender,
      enumerable: false
    },
    receiver: {
      value: _receiver,
      enumerable: false
    }
  });

  if (!EventDispatcher.isObject(worker)) {
    worker = new Worker(String(worker));
  }

  worker.addEventListener('message', messageHandler);
}

WorkerEventDispatcher.self = function() {
  return new WorkerEventDispatcher(self);
};
