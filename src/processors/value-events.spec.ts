import { EventEmitter } from '../senders';
import { valueEvents } from './value-events';

describe('valueEvents', () => {
  it('values event', () => {

    const emitter = new EventEmitter<[number, number]>();
    const onEvent = emitter.on.do(valueEvents((a: number, b: number) => a + b));
    const receiver = jest.fn<void, [number]>();

    onEvent(receiver);

    emitter.send(2, 11);
    expect(receiver).toHaveBeenCalledWith(13);
  });
  it('filters out non-valued matching events', () => {

    const emitter = new EventEmitter<[string?]>();
    const onEvent = emitter.on.do(valueEvents(
        str => str && !str.startsWith('-') && (str.startsWith('+') ? str : `+${str}`),
    ));
    const receiver = jest.fn<void, [string]>();

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
