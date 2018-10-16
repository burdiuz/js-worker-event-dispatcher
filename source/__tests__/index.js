/**
 * Created by Oleg Galaburda on 15.02.16.
 */
import * as api from '../index';

describe('index', () => {
  it('should export all important parts', () => {
    expect(api).toEqual({
      create: expect.any(Function),
      createForSelf: expect.any(Function),
      CONNECT_EVENT: expect.any(String),
      DEDICATED_WORKER: expect.any(String),
      SHARED_WORKER: expect.any(String),
      WorkerType: expect.any(Object),
      WorkerEvent: expect.any(Function),
      ClientDispatcher: expect.any(Function),
      ServerDispatcher: expect.any(Function),
      SharedWorkerDispatcher: expect.any(Function),
      DedicatedWorkerDispatcher: expect.any(Function),
      default: api.DedicatedWorkerDispatcher,
    });
  });
});
