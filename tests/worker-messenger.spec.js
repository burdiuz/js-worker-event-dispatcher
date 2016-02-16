/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('WorkerMessenger', function() {
  var port = new MessagePortBase();
  var messenger = null;
  beforeEach(function() {
    messenger = new WorkerMessenger(port);
  });
  it('should apply custom postMessage()', function() {
    messenger.dispatchEvent('anyEvent', null, []);
    expect(port.postMessage).to.be.calledOnce;
    expect(port.postMessage).to.be.calledWith(sinon.match.object, sinon.match.array);
  });
  it('should have MessagePortDispatcher interface', function() {
    expect(messenger.addEventListener).to.be.a('function');
    expect(messenger.hasEventListener).to.be.a('function');
    expect(messenger.removeEventListener).to.be.a('function');
    expect(messenger.removeAllEventListeners).to.be.a('function');
    expect(messenger.dispatchEvent).to.be.a('function');
  });
  it('should have target', function() {
    expect(messenger.target).to.be.equal(port);
  });
  it('should have dispatcherId', function() {
    expect(messenger.dispatcherId).to.be.ok;
  });
});
