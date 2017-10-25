/**
 * Created by Oleg Galaburda on 16.02.16.
 */

export const EventTarget = sinon.spy(function () {
  this.addEventListener = sinon.spy();
  this.hasEventListener = sinon.spy();
  this.removeEventListener = sinon.spy();
});

export const MessagePortBase = sinon.spy(function () {
  EventTarget.call(this);
  this.postMessage = sinon.spy();
});

export const MessagePort = sinon.spy(function () {
  MessagePortBase.call(this);
  this.start = sinon.spy();
  this.close = sinon.spy();
});

export const Worker = sinon.spy(function () {
  MessagePortBase.call(this);
  this.terminate = sinon.spy();
});

export const SharedWorker = sinon.spy(function () {
  this.port = new MessagePort();
  EventTarget.call(this);
});

export const apply = () => {
  window.MessagePort = MessagePort;
  window.Worker = Worker;
  window.SharedWorker = SharedWorker;
};

export dafault apply;
