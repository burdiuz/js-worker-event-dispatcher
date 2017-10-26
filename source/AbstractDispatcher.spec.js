/**
 * Created by Oleg Galaburda on 15.02.16.
 */
import AbstractDispatcher from './AbstractDispatcher';
import { MessagePortBase } from '../tests/stubs';

describe('AbstractDispatcher', () => {
  const type = 'my-type';
  let port;
  let dispatcher;

  beforeEach(() => {
    port = new MessagePortBase();
    dispatcher = new AbstractDispatcher(type);
    dispatcher.initialize(port);
  });

  it('should have a type', () => {
    expect(type).to.be.equal(type);
  });

  it('should apply custom postMessage()', () => {
    dispatcher.dispatchEvent('anyEvent', null, []);
    expect(port.postMessage).to.be.calledOnce;
    expect(port.postMessage).to.be.calledWith(sinon.match.object, sinon.match.array);
  });

  it('should have Dispatcher interface', () => {
    expect(dispatcher.addEventListener).to.be.a('function');
    expect(dispatcher.hasEventListener).to.be.a('function');
    expect(dispatcher.removeEventListener).to.be.a('function');
    expect(dispatcher.removeAllEventListeners).to.be.a('function');
    expect(dispatcher.dispatchEvent).to.be.a('function');
  });

  it('should have target', () => {
    expect(dispatcher.target).to.be.equal(port);
  });

  it('should have dispatcherId', () => {
    expect(dispatcher.dispatcherId).to.be.ok;
  });
});
