/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('ServerEventDispatcher', function() {

  var worker = null;
  var dispatcher = null;
  beforeEach(function() {
    worker = new MessagePortBase();
    dispatcher = new ServerEventDispatcher(worker);
  });
  it('should extend EventDispatcher', function() {
    expect(dispatcher).to.be.an.instanceof(EventDispatcher);
  });
  it('should add listeners to events', function() {
    expect(worker.addEventListener).to.be.calledWith(Event.ERROR);
    expect(worker.addEventListener).to.be.calledWith(Event.LANGUAGECHANGE);
    expect(worker.addEventListener).to.be.calledWith(Event.ONLINE);
    expect(worker.addEventListener).to.be.calledWith(Event.OFFLINE);
  });
  describe('on connect', function() {
    var port = null;
    var connectHandler = null;
    beforeEach(function() {
      port = new MessagePortBase();
      connectHandler = sinon.spy();
      dispatcher.addEventListener(WorkerEvent.CONNECT, connectHandler);
      var handler = worker.addEventListener.getCall(0).args[1];
      handler({
        type: 'connect',
        ports: [port]
      });
    });
    it('should dispatch CONNECT event', function() {
      expect(connectHandler).to.be.calledOnce;
    });
    it('event should have client dispatcher', function() {
      var event = connectHandler.getCall(0).args[0];
      expect(event.client).to.be.an.instanceof(ClientEventDispatcher);
    });
  });
  describe('When creating without args', function() {
    var dispatcher = null;
    beforeEach(function() {
      window.self = new EventTarget();
      dispatcher = new ServerEventDispatcher();
    });
    it('should use `self` thinking its SharedWorkerGlobalScope', function() {
      expect(dispatcher.target).to.be.equal(window.self);
    });
  });
});
