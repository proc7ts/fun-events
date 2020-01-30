import { asis } from 'call-thru';
import { EventEmitter } from '../event-emitter';
import { EventSupply } from '../event-supply';
import { onAnyAsync } from './on-any-async';
import Mock = jest.Mock;

describe('onAnyAsync', () => {

  let origin: EventEmitter<[(string | Promise<string>)]>;
  let receiver: Mock<void, [string, number]>;
  let received: Promise<[string, number]>[];
  let supply: EventSupply;

  beforeEach(() => {
    origin = new EventEmitter<[string | Promise<string>]>();
    received = [];
    receiver = jest.fn((event, index) => {
      received.push(Promise.resolve([event, index]));
    });
    supply = onAnyAsync(origin)(receiver).whenOff(reason => {
      received.push(Promise.reject(reason));
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

    origin.send(new Promise<string>(resolve => sendFirst = resolve));
    origin.send('2');

    expect(await next()).toEqual(['2', 2]);
    sendFirst('1');
    expect(await next()).toEqual(['1', 1]);
  });
  it('cuts off supply once incoming supply cut off', async () => {

    let sendFirst!: (event: string) => void;

    origin.send(new Promise<string>(resolve => sendFirst = resolve));
    origin.send('2');

    expect(await next()).toEqual(['2', 2]);
    sendFirst('1');

    const reason = 'test';

    origin.done(reason);
    expect(await next().catch(asis)).toBe(reason);

    const whenOff = jest.fn();

    supply.whenOff(whenOff);
    expect(whenOff).toHaveBeenCalledWith(reason);
  });
  it('cuts off supply once incoming supply once incoming event promise rejected', async () => {

    let rejectFirst!: (reason?: any) => void;

    origin.send(new Promise<string>((_resolve, reject) => rejectFirst = reject));
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
        receiver.mockImplementationOnce((event, index) => resolve([event, index]));
      }
    });
  }

});
