import { noop } from 'call-thru';
import { onPromise } from './on-promise';

describe('onPromise', () => {
  it('reports the resolved value', async () => {

    const value = 'test';
    const on = onPromise(Promise.resolve(value));
    const promise = await new Promise(resolve => on(resolve));

    expect(await promise).toBe(value);
  });
  it('cuts off events supply after resolution', async () => {

    const on = onPromise(Promise.resolve('test'));
    const promise = new Promise(resolve => on(noop).whenOff(resolve));

    expect(await promise).toBeUndefined();
  });
  it('cuts off events supply with promise rejection reason', async () => {

    const error = new Error('test');
    const on = onPromise(Promise.reject(error));
    const promise = new Promise(resolve => on(noop).whenOff(resolve));

    expect(await promise).toBe(error);
  });
});
