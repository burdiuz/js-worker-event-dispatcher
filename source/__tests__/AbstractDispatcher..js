/**
 * Created by Oleg Galaburda on 15.02.16.
 */
import AbstractDispatcher from '../AbstractDispatcher';
import { MessagePortBase } from '../../tests/stubs';

describe('AbstractDispatcher', () => {
  const type = 'my-type';
  let port;
  let dispatcher;

  beforeEach(() => {
    port = new MessagePortBase();
    dispatcher = new AbstractDispatcher(type, port);
  });

  it('should have a type', () => {
    expect(type).toBe(type);
  });

  it('should apply custom postMessage()', () => {
    dispatcher.dispatchEvent('anyEvent', null, []);
    expect(port.postMessage).toHaveBeenCalledTimes(1);
    expect(port.postMessage).toHaveBeenCalledWith(expect.any(Object), expect.any(Array));
  });

  it('should have Dispatcher interface', () => {
    expect(dispatcher.addEventListener).toBeInstanceOf(Function);
    expect(dispatcher.hasEventListener).toBeInstanceOf(Function);
    expect(dispatcher.removeEventListener).toBeInstanceOf(Function);
    expect(dispatcher.removeAllEventListeners).toBeInstanceOf(Function);
    expect(dispatcher.dispatchEvent).toBeInstanceOf(Function);
  });

  it('should have target', () => {
    expect(dispatcher.target).toBe(port);
  });

  it('should have dispatcherId', () => {
    expect(dispatcher.dispatcherId).toBeTruthy();
  });
});
