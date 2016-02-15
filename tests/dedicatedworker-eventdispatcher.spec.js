/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('DedicatedWorkerEventDispatcher', function() {
  var worker = null;
  var dispatcher = null;
  beforeEach(function() {
    worker = {
      addEventListener: sinon.spy(),
      postMessage: sinon.spy(),
      terminate: sinon.spy()
    };
    dispatcher = new DedicatedWorkerEventDispatcher(worker);
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
  it('should add listeners to events', function() {
    expect(worker.addEventListener).to.be.calledWith(Event.ERROR);
    expect(worker.addEventListener).to.be.calledWith(Event.LANGUAGECHANGE);
    expect(worker.addEventListener).to.be.calledWith(Event.ONLINE);
    expect(worker.addEventListener).to.be.calledWith(Event.OFFLINE);
  });
  it('should call port.addEventListener()', function() {
    expect(worker.addEventListener).to.be.calledWith(Event.MESSAGE);
  });
  it('should call port.postMessage()', function() {
    dispatcher.dispatchEvent({type: 'meMyself', data: 'Irene'});
    expect(worker.postMessage).to.be.calledOnce;
  });
  describe('terminate()', function() {
    beforeEach(function() {
      dispatcher.terminate();
    });
    it('should call worker.terminate()', function() {
      expect(worker.terminate).to.be.calledOnce;
    });
  });
});
