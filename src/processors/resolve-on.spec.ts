import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { Mock } from 'jest-mock';
import { EventEmitter } from '../senders';
import { resolveOn } from './resolve-on';

describe('resolveOn', () => {
  let origin: EventEmitter<[string | Promise<string>]>;
  let receiver: Mock<(arg1: string, arg2: number) => void>;
  let received: Promise<[string, number]>[];
  let resolvers: ((resolved: [string, number] | PromiseLike<[string, number]>) => void)[];
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
    supply = origin.on
      .do(resolveOn)(receiver)
      .whenOff(reason => {
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
    expect(await next()).toEqual(['1', 1]);
    expect(await next()).toEqual(['3', 3]);
    expect(await next()).toEqual(['2', 2]);
  });
  it('sends events in order of their resolution', async () => {
    let sendFirst!: (event: string) => void;

    origin.send(new Promise<string>(resolve => (sendFirst = resolve)));
    origin.send('2');

    expect(await next()).toEqual(['2', 2]);
    sendFirst('1');
    expect(await next()).toEqual(['1', 1]);
  });
  it('cuts off supply once incoming supply cut off', async () => {
    let sendFirst!: (event: string) => void;

    origin.send(new Promise<string>(resolve => (sendFirst = resolve)));
    origin.send('2');

    expect(await next()).toEqual(['2', 2]);
    sendFirst('1');

    const reason = 'test';

    origin.supply.off(reason);
    expect(await next().catch(asis)).toBe(reason);

    const whenOff = jest.fn();

    supply.whenOff(whenOff);
    expect(whenOff).toHaveBeenCalledWith(reason);
  });
  it('cuts off supply when incoming event resolution failed', async () => {
    let rejectFirst!: (reason?: unknown) => void;

    origin.send(new Promise<string>((_resolve, reject) => (rejectFirst = reject)));
    origin.send('2');

    expect(await next()).toEqual(['2', 2]);

    const reason = 'test';

    rejectFirst(reason);
    await Promise.resolve();

    expect(await next().catch(asis)).toBe(reason);
  });

  async function next(): Promise<[string, number]> {
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
