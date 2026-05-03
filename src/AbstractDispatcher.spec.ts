import { describe, it, expect, beforeEach } from '@jest/globals';
import AbstractDispatcher from './AbstractDispatcher';
import { MessagePortBase } from './stubs';

describe('AbstractDispatcher', () => {
  const type = 'my-type';
  let port: InstanceType<typeof MessagePortBase>;
  let dispatcher: AbstractDispatcher;

  beforeEach(() => {
    port = new MessagePortBase();
    dispatcher = new AbstractDispatcher(type, port as any);
  });

  it('should have a type', () => {
    expect(dispatcher.type).toBe(type);
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
