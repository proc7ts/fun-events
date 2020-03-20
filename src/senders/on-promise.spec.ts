import { noop } from '@proc7ts/call-thru';
import { onPromise } from './on-promise';

describe('onPromise', () => {
  it('reports resolved value', async () => {

    const value = 'test';
    const on = onPromise(Promise.resolve(value));

    expect(await on).toBe(value);
  });
  it('cuts off events supply after resolution', async () => {

    const on = onPromise(Promise.resolve('test'));
    const promise = new Promise(resolve => on.to(noop).whenOff(resolve));

    expect(await promise).toBeUndefined();
  });
  it('cuts off events supply with error as reason after failed resolution processing', async () => {

    const error = new Error('test');
    const on = onPromise(Promise.resolve('test'));
    const promise = new Promise(resolve => on.to(() => { throw error; }).whenOff(resolve));

    expect(await promise).toBe(error);
  });
  it('cuts off events supply with promise rejection reason', async () => {

    const error = new Error('test');
    const on = onPromise(Promise.reject(error));
    const promise = new Promise(resolve => on.to(noop).whenOff(resolve));

    expect(await promise).toBe(error);
  });
  it('reports resolved value immediately if reported already', async () => {

    const value = 'test';
    const promise = Promise.resolve(value);
    const on = onPromise(promise);

    await promise;

    let reported: string | undefined;

    on.to(value => reported = value);
    expect(reported).toBe(value);
  });
  it('cuts off events supply immediately if promise rejected already', async () => {

    const error = new Error('test');
    const promise = Promise.reject(error);
    const on = onPromise(promise);

    await promise.catch(noop);

    let reported: any;
    on.to(noop).whenOff(reason => reported = reason);
    expect(reported).toBe(error);
  });
});
