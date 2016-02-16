/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('DedicatedWorkerEventDispatcher', function() {
  var worker = null;
  var dispatcher = null;
  beforeEach(function() {
    worker = new Worker();
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
  describe('When creating from URL', function() {
    var dispatcher = null;
    beforeEach(function() {
      Worker.reset();
      dispatcher = new DedicatedWorkerEventDispatcher('/some/url.js');
    });
    it('should create Worker instance', function() {
      expect(Worker).to.be.calledOnce;
      expect(Worker).to.be.calledWithNew;
    });
    it('should pass URL to Worker', function() {
      expect(Worker.getCall(0).args[0]).to.be.equal('/some/url.js');
    });
    it('should keep Worker instance as target', function() {
      expect(dispatcher.target).to.be.an('object');
    });
  });
  describe('When creating without args', function() {
    var dispatcher = null;
    beforeEach(function() {
      window.self = new MessagePort();
      dispatcher = new DedicatedWorkerEventDispatcher();
    });
    it('should use `self` thinking its WorkerGlobalScope', function() {
      expect(dispatcher.target).to.be.equal(window.self);
    });
  });
});
