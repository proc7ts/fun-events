import { asis } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { EventEmitter } from '../senders';
import { resolveOnOrdered } from './resolve-on-ordered';
import Mock = jest.Mock;

describe('resolveOnOrdered', () => {

  let origin: EventEmitter<[(string | Promise<string>)]>;
  let receiver: Mock<void, string[]>;
  let received: Promise<string[]>[];
  let resolvers: ((resolved: string[] | PromiseLike<string[]>) => void)[];
  let supply: Supply;

  beforeEach(() => {
    origin = new EventEmitter<[string | Promise<string>]>();
    received = [];
    resolvers = [];
    receiver = jest.fn((...event) => {

      const resolver = resolvers.shift();

      if (resolver) {
        resolver(event);
      } else {
        received.push(Promise.resolve(event));
      }
    });
    supply = origin.on.do(resolveOnOrdered)(receiver).whenOff(reason => {

      const resolver = resolvers.shift();

      if (resolver) {
        resolver(Promise.reject(reason));
      } else {
        received.push(Promise.reject(reason));
      }
    });
  });

  it('resolves original events asynchronously', async () => {
    origin.send('1');
    origin.send(Promise.resolve('2'));
    origin.send('3');
    expect(await next()).toEqual(['1']);
    expect(await next()).toEqual(['2', '3']);
    expect(supply.isOff).toBe(false);
  });
  it('sends events in original order in batches', async () => {

    let sendFirst!: (event: string) => void;
    let sendSecond!: (event: string) => void;

    origin.send(new Promise<string>(resolve => sendFirst = resolve));
    origin.send(new Promise<string>(resolve => sendSecond = resolve));
    origin.send('3');

    sendSecond('2');
    sendFirst('1');
    expect(await next()).toEqual(['1']);
    expect(await next()).toEqual(['2', '3']);
    expect(supply.isOff).toBe(false);
  });
  it('cuts off supply when incoming event resolution failed', async () => {

    const whenOff = jest.fn();

    supply.whenOff(whenOff);

    let rejectFirst!: (reason?: any) => void;

    origin.send(new Promise<string>((_resolve, reject) => rejectFirst = reject));
    origin.send('2');

    const reason = 'test';

    rejectFirst(reason);
    expect(await next().catch(asis)).toBe(reason);
    expect(whenOff).toHaveBeenCalledWith(reason);
  });
  it('cuts off supply when incoming supply cut off and all events resolved', async () => {

    const whenOff = jest.fn();

    supply.whenOff(whenOff);

    let sendSecond!: (event: string) => void;

    origin.send('1');
    origin.send(new Promise<string>(resolve => sendSecond = resolve));
    origin.send('3');

    expect(await next()).toEqual(['1']);

    const reason = 'test';

    origin.supply.off(reason);
    expect(whenOff).not.toHaveBeenCalled();

    sendSecond('2');
    expect(await next()).toEqual(['2', '3']);
    expect(await next().catch(asis)).toBe(reason);
    expect(whenOff).toHaveBeenCalledWith(reason);
  });
  it('cuts off supply when incoming supply cut off and no incoming events', async () => {

    const whenOff = jest.fn();

    supply.whenOff(whenOff);

    const reason = 'test';

    origin.supply.off(reason);
    expect(await next().catch(asis)).toBe(reason);
    expect(whenOff).toHaveBeenCalledWith(reason);

    origin.send('1');
    await Promise.resolve();
    expect(received).toHaveLength(0);
  });
  it('sends resolved events if incoming supply already cut off', async () => {

    const whenOff = jest.fn();

    supply.whenOff(whenOff);

    const reason = 'test';

    origin.send(Promise.resolve('1'));
    origin.send(Promise.resolve('2'));
    origin.send(Promise.resolve('3'));
    origin.supply.off(reason);

    expect(whenOff).not.toHaveBeenCalled();
    expect(await next()).toEqual(['1']);
    expect(await next()).toEqual(['2']);
    expect(await next()).toEqual(['3']);
    expect(await next().catch(asis)).toBe(reason);
    expect(whenOff).toHaveBeenCalledWith(reason);
  });

  async function next(): Promise<string[]> {
    return new Promise(resolve => {

      const r = received.shift();

      if (r) {
        resolve(r);
      } else {
        resolvers.push(resolve);
      }
    });
  }
});
