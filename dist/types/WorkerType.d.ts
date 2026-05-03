declare const WorkerType: {
    readonly DEDICATED_WORKER: "dedicated";
    readonly SHARED_WORKER: "shared";
    /** @private */
    readonly SHARED_WORKER_SERVER: "sharedServer";
    /** @private */
    readonly SHARED_WORKER_CLIENT: "sharedClient";
    readonly SERVICE_WORKER: "service";
    /** @private */
    readonly SERVICE_WORKER_SERVER: "serviceServer";
    /** @private */
    readonly SERVICE_WORKER_CLIENT: "serviceClient";
};
export type WorkerTypeValue = (typeof WorkerType)[keyof typeof WorkerType];
export default WorkerType;
