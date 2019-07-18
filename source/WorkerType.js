const WorkerType = {
  DEDICATED_WORKER: 'dedicated',

  SHARED_WORKER: 'shared',
  /**
   * @private
   */
  SHARED_WORKER_SERVER: 'sharedServer',
  /**
   * @private
   */
  SHARED_WORKER_CLIENT: 'sharedClient',

  SERVICE_WORKER: 'service',
  /**
   * @private
   */
  SERVICE_WORKER_SERVER: 'serviceServer',
  /**
   * @private
   */
  SERVICE_WORKER_CLIENT: 'serviceClient',
};

export default WorkerType;
