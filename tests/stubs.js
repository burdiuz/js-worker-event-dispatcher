/**
 * Created by Oleg Galaburda on 16.02.16.
 */

export const EventTarget = jest.fn(function () {
  this.type = 'EventTarget';
  this.addEventListener = jest.fn();
  this.hasEventListener = jest.fn();
  this.removeEventListener = jest.fn();
});

export const MessagePortBase = jest.fn(function () {
  EventTarget.call(this);

  this.type = 'MessagePortBase';
  this.postMessage = jest.fn();
});

export const MessagePort = jest.fn(function () {
  MessagePortBase.call(this);

  this.type = 'MessagePort';
  this.start = jest.fn();
  this.close = jest.fn();
});

export const Worker = jest.fn(function () {
  MessagePortBase.call(this);

  this.type = 'Worker';
  this.terminate = jest.fn();
});

export const SharedWorker = jest.fn(function () {
  this.port = new MessagePort();

  this.type = 'SharedWorker';
  EventTarget.call(this);
});

export const apply = () => {
  global.MessagePort = MessagePort;
  global.Worker = Worker;
  global.SharedWorker = SharedWorker;
};
