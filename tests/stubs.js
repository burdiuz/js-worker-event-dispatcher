/**
 * Created by Oleg Galaburda on 16.02.16.
 */
var EventTarget = sinon.spy(function() {
  this.addEventListener = sinon.spy();
  this.hasEventListener = sinon.spy();
  this.removeEventListener = sinon.spy();
});
var MessagePortBase = sinon.spy(function() {
  EventTarget.call(this);
  this.postMessage = sinon.spy();
});
window.MessagePort = sinon.spy(function() {
  MessagePortBase.call(this);
  this.start = sinon.spy();
  this.close = sinon.spy();
});
window.Worker = sinon.spy(function() {
  MessagePortBase.call(this);
  this.terminate = sinon.spy();
});
window.SharedWorker = sinon.spy(function() {
  this.port = new MessagePort();
  EventTarget.call(this);
});
