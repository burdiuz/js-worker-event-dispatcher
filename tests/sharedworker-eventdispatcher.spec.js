/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('SharedWorkerEventDispatcher', function() {
  describe('Instance', function() {
    var worker = null;
    var dispatcher = null;
    beforeEach(function() {
      worker = {
        addEventListener: sinon.spy(),
        port: {
          start: sinon.spy(),
          close: sinon.spy(),
          addEventListener: sinon.spy(),
          postMessage: sinon.spy()
        }
      };
      dispatcher = new SharedWorkerEventDispatcher(worker);
    });
    it('should extend WorkerEventDispatcher', function() {
      expect(dispatcher).to.be.an.instanceof(WorkerEventDispatcher);
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
});
