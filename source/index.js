import WorkerType from './WorkerType';
import WorkerEvent, { NativeEventType } from './WorkerEvent';
import DedicatedWorkerDispatcher from './DedicatedWorkerDispatcher';
import SharedWorkerDispatcher from './SharedWorkerDispatcher';
import SharedClientDispatcher from './sharedWorker/ClientDispatcher';
import SharedServerDispatcher from './sharedWorker/ServerDispatcher';
import ServiceWorkerDispatcher from './ServiceWorkerDispatcher';
import ServiceClientDispatcher from './serviceWorker/ClientDispatcher';
import ServiceServerDispatcher from './serviceWorker/ServerDispatcher';
import {
  create,
  createForSelf,
  createForDedicatedWorker,
  createForSharedWorker,
  createForServiceWorker,
} from './utils/create';

const CONNECT_EVENT = WorkerEvent.CONNECT;
const { DEDICATED_WORKER, SHARED_WORKER, SERVICE_WORKER } = WorkerType;

export default DedicatedWorkerDispatcher;

export {
  create,
  createForSelf,
  createForDedicatedWorker,
  createForSharedWorker,
  createForServiceWorker,
  CONNECT_EVENT,
  DEDICATED_WORKER,
  SHARED_WORKER,
  SERVICE_WORKER,
  WorkerEvent,
  WorkerType,
  NativeEventType,
  SharedClientDispatcher,
  SharedServerDispatcher,
  SharedWorkerDispatcher,
  ServiceWorkerDispatcher,
  ServiceClientDispatcher,
  ServiceServerDispatcher,
  DedicatedWorkerDispatcher,
};
