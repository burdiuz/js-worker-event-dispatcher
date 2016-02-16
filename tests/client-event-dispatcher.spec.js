/**
 * Created by Oleg Galaburda on 15.02.16.
 */

describe('ClientEventDispatcher', function() {
  var port = null;
  var dispatcher = null;
  beforeEach(function() {
    port = new MessagePort();
    dispatcher = new ClientEventDispatcher(port);
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
  it('should call port.addEventListener()', function() {
    expect(port.addEventListener).to.be.calledWith(Event.MESSAGE);
  });
  it('should call port.postMessage()', function() {
    dispatcher.dispatchEvent({type: 'meMyself', data: 'Irene'});
    expect(port.postMessage).to.be.calledOnce;
  });
  describe('start()', function() {
    beforeEach(function() {
      dispatcher.start();
    });
    it('should call port.start()', function() {
      expect(port.start).to.be.calledOnce;
    });
  });
  describe('close()', function() {
    beforeEach(function() {
      dispatcher.close();
    });
    it('should call port.close()', function() {
      expect(port.close).to.be.calledOnce;
    });
  });
});
