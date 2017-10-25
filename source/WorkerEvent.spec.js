/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('WorkerEvent', function() {
  describe('Instance', function() {
    var event = null;
    var data = null;
    var client = null;
    var sourceEvent = null;
    beforeEach(function() {
      data = {data: true};
      client = {client: true};
      sourceEvent = {source: true};
      event = new WorkerEvent('workerEvent', data, sourceEvent, client);
    });
    it('should store type', function() {
      expect(event.type).to.be.equal('workerEvent');
    });
    it('should store data', function() {
      expect(event.data).to.be.equal(data);
    });
    it('should store sourceEvent', function() {
      expect(event.sourceEvent).to.be.equal(sourceEvent);
    });
    it('should store client', function() {
      expect(event.client).to.be.equal(client);
    });
  });
  describe('getWorkerEventType()', function() {
    it('should properly convert connect event', function() {
      expect(WorkerEvent.getWorkerEventType(Event.CONNECT)).to.be.equal(WorkerEvent.CONNECT);
    });
    it('should properly convert `message` event', function() {
      expect(WorkerEvent.getWorkerEventType(Event.MESSAGE)).to.be.equal(WorkerEvent.MESSAGE);
    });
    it('should properly convert `error` event', function() {
      expect(WorkerEvent.getWorkerEventType(Event.ERROR)).to.be.equal(WorkerEvent.ERROR);
    });
    it('should properly convert `languagechange` event', function() {
      expect(WorkerEvent.getWorkerEventType(Event.LANGUAGECHANGE)).to.be.equal(WorkerEvent.LANGUAGECHANGE);
    });
    it('should properly convert `online` event', function() {
      expect(WorkerEvent.getWorkerEventType(Event.ONLINE)).to.be.equal(WorkerEvent.ONLINE);
    });
    it('should properly convert `offline` event', function() {
      expect(WorkerEvent.getWorkerEventType(Event.OFFLINE)).to.be.equal(WorkerEvent.OFFLINE);
    });
  });

  describe('createHandler()', function() {
    var handler = null;
    var target = null;
    var dispatcher = null;
    var event = null;
    beforeEach(function() {
      target = {addEventListener: sinon.spy()};
      dispatcher = {
        dispatchEvent: sinon.spy(),
        hasEventListener: sinon.spy(function() {
          return true;
        })
      };
      handler = WorkerEvent.redispatchWorkerEvent(Event.ERROR, target, dispatcher);
      event = {type: 'error'};
      handler(event);
    });
    it('should add listener to target', function() {
      expect(target.addEventListener).to.be.calledOnce;
      expect(target.addEventListener).to.be.calledWith(Event.ERROR, handler);
    });
    it('handler should dispatch worker event', function() {
      expect(dispatcher.dispatchEvent).to.be.calledOnce;
      var workerEvent = dispatcher.dispatchEvent.getCall(0).args[0];
      expect(workerEvent).to.be.an.instanceof(WorkerEvent);
      expect(workerEvent.type).to.be.equal(WorkerEvent.ERROR);
      expect(workerEvent.sourceEvent).to.be.equal(event);
    });
  });
});
