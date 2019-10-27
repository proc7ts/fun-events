import { noop } from 'call-thru';
import { onPromise } from './on-promise';

describe('onPromise', () => {
  it('reports the resolved value', async () => {

    const value = 'test';
    const on = onPromise(Promise.resolve(value));
    const receiver = jest.fn();

    on(receiver);
    await Promise.resolve();

    expect(receiver).toHaveBeenCalledWith(value);
  });
  it('cuts off events supply after resolution', async () => {

    const on = onPromise(Promise.resolve('test'));
    const whenOff = jest.fn();

    on(noop).whenOff(whenOff);
    await Promise.resolve();

    expect(whenOff).toHaveBeenCalledWith(undefined);
  });
  it('cuts off events supply with promise rejection reason', async () => {

    const error = new Error('test');
    const on = onPromise(Promise.reject(error));
    const whenOff = jest.fn();

    on(noop).whenOff(whenOff);
    await Promise.resolve();

    expect(whenOff).toHaveBeenCalledWith(error);
  });
});
