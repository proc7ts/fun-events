import { describe, expect, it, jest } from '@jest/globals';
import { valueProvider } from '@proc7ts/primitives';
import { EventEmitter } from '../senders';
import { trackValue } from '../value';
import { valueAfter } from './value-after';

describe('valueAfter', () => {
  it('values events', () => {

    const tracker = trackValue(1);
    const afterEvent = tracker.read.do(valueAfter(a => a + 100));
    const receiver = jest.fn<void, [number]>();

    afterEvent(receiver);

    tracker.it = 2;
    expect(receiver).toHaveBeenCalledWith(101);
    expect(receiver).toHaveBeenLastCalledWith(102);
    expect(receiver).toHaveBeenCalledTimes(2);
  });
  it('values events with fallback', () => {

    const emitter = new EventEmitter<[number, number]>();
    const afterEvent = emitter.on.do(valueAfter((a: number, b: number) => a + b, valueProvider(0)));
    const receiver = jest.fn<void, [number]>();

    afterEvent(receiver);

    emitter.send(2, 11);
    expect(receiver).toHaveBeenCalledWith(0);
    expect(receiver).toHaveBeenLastCalledWith(13);
    expect(receiver).toHaveBeenCalledTimes(2);
  });
  it('filters out non-valued matching events', () => {

    const emitter = new EventEmitter<[string?]>();
    const afterEvent = emitter.on.do(valueAfter(
        str => str && !str.startsWith('-') && (str.startsWith('+') ? str : `+${str}`),
        valueProvider('-'),
    ));
    const receiver = jest.fn<void, [string]>();

    afterEvent(receiver);
    emitter.send();
    emitter.send('event1');
    emitter.send('-event2');
    emitter.send('+event3');

    expect(receiver).toHaveBeenCalledWith('-');
    expect(receiver).toHaveBeenCalledWith('+event1');
    expect(receiver).not.toHaveBeenCalledWith('-event2');
    expect(receiver).toHaveBeenLastCalledWith('+event3');
    expect(receiver).toHaveBeenCalledTimes(3);
  });
});
