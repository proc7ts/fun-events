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
  it('exhausts after resolution', async () => {

    const on = onPromise(Promise.resolve('test'));
    const whenDone = jest.fn();

    on(noop).whenDone(whenDone);
    await Promise.resolve();

    expect(whenDone).toHaveBeenCalledWith(undefined);
  });
  it('exhausts with promise rejection reason', async () => {

    const error = new Error('test');
    const on = onPromise(Promise.reject(error));
    const whenDone = jest.fn();

    on(noop).whenDone(whenDone);
    await Promise.resolve();

    expect(whenDone).toHaveBeenCalledWith(error);
  });
});
