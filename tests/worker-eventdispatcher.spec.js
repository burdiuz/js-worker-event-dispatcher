/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('WorkerEventDispatcher', function() {
  describe('create()', function() {
    it('should create Dedicated worker', function() {
      expect(WorkerEventDispatcher.create(new Worker(), WorkerEventDispatcher.WorkerType.DEDICATED_WORKER)).to.be.an.instanceof(DedicatedWorkerEventDispatcher);
    });
    it('should create Shared worker', function() {
      expect(WorkerEventDispatcher.create(new SharedWorker(), WorkerEventDispatcher.WorkerType.SHARED_WORKER)).to.be.an.instanceof(SharedWorkerEventDispatcher);
    });
    it('should create Server/GlobalScope of Shared worker', function() {
      expect(WorkerEventDispatcher.create(new EventTarget(), WorkerEventDispatcher.WorkerType.SHARED_WORKER_SERVER)).to.be.an.instanceof(ServerEventDispatcher);
    });
    it('should create Client of Shared worker', function() {
      expect(WorkerEventDispatcher.create(new MessagePort(), WorkerEventDispatcher.WorkerType.SHARED_WORKER_CLIENT)).to.be.an.instanceof(ClientEventDispatcher);
    });
    it('should create Dedicated worker by default', function() {
      expect(WorkerEventDispatcher.create(new Worker())).to.be.an.instanceof(DedicatedWorkerEventDispatcher);
    });
  });
  describe('self()', function() {
    describe('When self doesn\'t have postMessage()', function() {
      var dispatcher = null;
      beforeEach(function() {
        window.self = new EventTarget();
        dispatcher = WorkerEventDispatcher.self();
      });
      it('should create SharedWorker Server', function() {
        expect(dispatcher).to.be.an.instanceof(ServerEventDispatcher);
      });
    });
    describe('When self has postMessage()', function() {
      var dispatcher = null;
      beforeEach(function() {
        window.self = new MessagePortBase();
        dispatcher = WorkerEventDispatcher.self();
      });
      it('should create Dedicated Worker', function() {
        expect(dispatcher).to.be.an.instanceof(DedicatedWorkerEventDispatcher);
      });
    });
  });
  describe('When instantiating WorkerEventDispatcher', function() {
    var instance;
    beforeEach(function() {
      instance = new WorkerEventDispatcher(new Worker());
    });
    it('shound create instance with DedicatedWED functionality', function(){
      expect(instance.type).to.be.equal(WorkerType.DEDICATED_WORKER);
      expect(instance.terminate).to.be.a('function');
    });
  });
});
