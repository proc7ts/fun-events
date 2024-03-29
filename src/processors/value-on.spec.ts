import { describe, expect, it, jest } from '@jest/globals';
import { EventEmitter } from '../senders';
import { valueOn } from './value-on';

describe('valueOn', () => {
  it('values event', () => {
    const emitter = new EventEmitter<[number, number]>();
    const onEvent = emitter.on.do(valueOn((a: number, b: number) => a + b));
    const receiver = jest.fn<(arg: number) => void>();

    onEvent(receiver);

    emitter.send(2, 11);
    expect(receiver).toHaveBeenCalledWith(13);
  });
  it('filters out non-valued matching events', () => {
    const emitter = new EventEmitter<[string?]>();
    const onEvent = emitter.on.do(
      valueOn(str => str && !str.startsWith('-') && (str.startsWith('+') ? str : `+${str}`)),
    );
    const receiver = jest.fn<(arg: string) => void>();

    onEvent(receiver);
    emitter.send();
    emitter.send('event1');
    emitter.send('-event2');
    emitter.send('+event3');

    expect(receiver).toHaveBeenCalledWith('+event1');
    expect(receiver).not.toHaveBeenCalledWith('-event2');
    expect(receiver).toHaveBeenLastCalledWith('+event3');
    expect(receiver).toHaveBeenCalledTimes(2);
  });
});
