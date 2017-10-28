import EventDispatcher from 'event-dispatcher';
import MessagePortDispatcher from 'messageport-dispatcher';
import WorkerType from './WorkerType';
import WorkerEvent from './WorkerEvent';
import DedicatedWorkerDispatcher from './DedicatedWorkerDispatcher';
import SharedWorkerDispatcher from './SharedWorkerDispatcher';
import ClientDispatcher from './sharedWorker/ClientDispatcher';
import ServerDispatcher from './sharedWorker/ServerDispatcher';
import { create, createForSelf } from './utils/create';

const CONNECT_EVENT = WorkerEvent.CONNECT;
const { DEDICATED_WORKER } = WorkerType;
const { SHARED_WORKER } = WorkerType;

module.exports = Object.assign(DedicatedWorkerDispatcher, {
  create,
  createForSelf,
  CONNECT_EVENT,
  DEDICATED_WORKER,
  SHARED_WORKER,
  WorkerEvent,
  WorkerType,
  ClientDispatcher,
  ServerDispatcher,
  SharedWorkerDispatcher,
  DedicatedWorkerDispatcher,
  EventDispatcher,
  MessagePortDispatcher,
});
