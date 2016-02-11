/**
 * Created by Oleg Galaburda on 09.12.15.
 */
// Uses Node, AMD or browser globals to create a module.
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['EventDispatcher', 'MessagePortDispatcher'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(
      require('EventDispatcher'),
      require('MessagePortDispatcher')
    );
  } else {
    // Browser globals (root is window)
    root.WorkerEventDispatcher = factory(root.EventDispatcher, root.MessagePortDispatcher);
  }
}(this, function (EventDispatcher, MessagePortDispatcher) {
  // here should be injected worker-event-dispatcher.js content
  //=require worker-event-dispatcher.js
  return WorkerEventDispatcher;
}));
