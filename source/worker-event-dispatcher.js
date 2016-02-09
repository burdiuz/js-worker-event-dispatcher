/**
 * Created by Oleg Galaburda on 09.02.16.
 */

function WorkerEventDispatcher(worker) {
  /**
   * @type {EventDispatcher}
   */
  var _dispatcher = new EventDispatcher();

  function messageHandler(message) {
	  if(message && message.hasOwnProperty('type')){
		  _dispatcher.call(message.type, message);
	  }
  }

  function dispatchEvent(event) {
	  worker.postMessage(event);
  }

  function terminate(){
	  return worker.terminate();
  }

  this.addEventListener = _dispatcher.addEventListener;
  this.hasEventListener = _dispatcher.hasEventListener;
  this.removeEventListener = _dispatcher.removeEventListener;
  this.removeAllEventListeners = _dispatcher.removeAllEventListeners;
  this.dispatchEvent = dispatchEvent;
  this.terminate = terminate;

  if(!(worker instanceof Worker)){
	  worker = new Worker(String(worker));
  }

  worker.addEventListener('message', messageHandler);
}
