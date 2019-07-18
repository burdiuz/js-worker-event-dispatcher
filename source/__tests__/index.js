/**
 * Created by Oleg Galaburda on 15.02.16.
 */
import * as api from '../index';

describe('index', () => {
  it('should export all important parts', () => {
    expect(api).toEqual({
      create: expect.any(Function),
      createForSelf: expect.any(Function),
      createForDedicatedWorker: expect.any(Function),
      createForSharedWorker: expect.any(Function),
      createForServiceWorker: expect.any(Function),
      CONNECT_EVENT: expect.any(String),
      DEDICATED_WORKER: expect.any(String),
      SHARED_WORKER: expect.any(String),
      SERVICE_WORKER: expect.any(String),
      WorkerEvent: expect.any(Function),
      WorkerType: expect.any(Object),
      NativeEventType: expect.any(Object),
      SharedClientDispatcher: expect.any(Function),
      SharedServerDispatcher: expect.any(Function),
      SharedWorkerDispatcher: expect.any(Function),
      ServiceClientDispatcher: expect.any(Function),
      ServiceServerDispatcher: expect.any(Function),
      ServiceWorkerDispatcher: expect.any(Function),
      DedicatedWorkerDispatcher: expect.any(Function),
      default: api.DedicatedWorkerDispatcher,
    });
  });
});
