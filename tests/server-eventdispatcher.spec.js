/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('ServerEventDispatcher', function() {
  var worker = null;
  var dispatcher = null;
  beforeEach(function() {
    worker = {
      addEventListener: sinon.spy(),
      postMessage: sinon.spy()
    };
    dispatcher = new ServerEventDispatcher(worker);
  });
  it('should extend WorkerEventDispatcher', function() {
    expect(dispatcher).to.be.an.instanceof(WorkerEventDispatcher);
  });
  it('should add listeners to events', function() {
    expect(worker.addEventListener).to.be.calledWith(Event.ERROR);
    expect(worker.addEventListener).to.be.calledWith(Event.LANGUAGECHANGE);
    expect(worker.addEventListener).to.be.calledWith(Event.ONLINE);
    expect(worker.addEventListener).to.be.calledWith(Event.OFFLINE);
  });
});
