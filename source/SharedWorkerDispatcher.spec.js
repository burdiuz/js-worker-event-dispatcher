/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('SharedWorkerEventDispatcher', function() {
  describe('Instance', function() {
    var worker = null;
    var dispatcher = null;
    beforeEach(function() {
      worker = new SharedWorker();
      dispatcher = new SharedWorkerEventDispatcher(worker);
    });
    it('should extend WorkerEventDispatcher', function() {
      expect(dispatcher).to.be.an.instanceof(AbstractDispatcher);
    });
    it('should have WorkerMessenger interface', function() {
      expect(dispatcher.addEventListener).to.be.a('function');
      expect(dispatcher.hasEventListener).to.be.a('function');
      expect(dispatcher.removeEventListener).to.be.a('function');
      expect(dispatcher.removeAllEventListeners).to.be.a('function');
      expect(dispatcher.dispatchEvent).to.be.a('function');
    });
    it('should add listener to ERROR event', function() {
      expect(worker.addEventListener).to.be.calledWith(Event.ERROR);
    });
    it('should call port.addEventListener()', function() {
      expect(worker.port.addEventListener).to.be.calledWith(Event.MESSAGE);
    });
    it('should call port.postMessage()', function() {
      dispatcher.dispatchEvent({type: 'meMyself', data: 'Irene'});
      expect(worker.port.postMessage).to.be.calledOnce;
    });
    describe('start()', function() {
      beforeEach(function() {
        dispatcher.start();
      });
      it('should call port.start()', function() {
        expect(worker.port.start).to.be.calledOnce;
      });
    });
    describe('close()', function() {
      beforeEach(function() {
        dispatcher.close();
      });
      it('should call port.close()', function() {
        expect(worker.port.close).to.be.calledOnce;
      });
    });
  });
  describe('When creating from URL', function() {
    var dispatcher = null;
    beforeEach(function() {
      SharedWorker.reset();
      dispatcher = new SharedWorkerEventDispatcher('/some/url.js', 'SWName');
    });
    it('should create SharedWorker instance', function() {
      expect(SharedWorker).to.be.calledOnce;
      expect(SharedWorker).to.be.calledWithNew;
    });
    it('should pass URL to SharedWorker', function() {
      expect(SharedWorker.getCall(0).args[0]).to.be.equal('/some/url.js');
    });
    it('should pass name to SharedWorker', function() {
      expect(SharedWorker.getCall(0).args[1]).to.be.equal('SWName');
    });
    it('should keep SharedWorker instance as target', function() {
      expect(dispatcher.target).to.be.an('object');
    });
  });
});
