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

export default DedicatedWorkerDispatcher;

export {
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
};
