import { valuesProvider } from '@proc7ts/primitives';
import { AfterEvent } from '../after-event';
import { EventEmitter } from '../senders';
import { trackValue } from '../value';
import { translateAfter } from './translate-after';

describe('translateAfter', () => {
  it('translates event', () => {

    const tracker = trackValue<[number, number]>([1, 11]);
    const afterEvent: AfterEvent<[number, number]> = tracker.read.do(
        translateAfter((send, [a, b]: [number, number]) => send(b, a)),
    );
    const receiver = jest.fn<void, [number, number]>();

    afterEvent(receiver);
    expect(receiver).toHaveBeenLastCalledWith(11, 1);

    tracker.it = [2, 22];
    expect(receiver).toHaveBeenLastCalledWith(22, 2);

    expect(receiver).toHaveBeenCalledTimes(2);
  });
  it('translates events with fallback', () => {

    const emitter = new EventEmitter<[number, number]>();
    const onEvent = emitter.on.do(translateAfter((send, a: number, b: number) => send(b, a), valuesProvider(0, -1)));
    const receiver = jest.fn<void, [number, number]>();

    onEvent(receiver);

    emitter.send(2, 11);
    expect(receiver).toHaveBeenCalledWith(0, -1);
    expect(receiver).toHaveBeenLastCalledWith(11, 2);
    expect(receiver).toHaveBeenCalledTimes(2);
  });
  it('translates some events', () => {

    const tracker = trackValue('');
    const afterEvent: AfterEvent<[string]> = tracker.read.do(translateAfter(
        (send, str) => str && !str.startsWith('-') && send(str.startsWith('+') ? str : `+${str}`),
        valuesProvider('NONE!'),
    ));
    const receiver = jest.fn<void, [string]>();

    afterEvent(receiver);
    expect(receiver).toHaveBeenCalledWith('NONE!');

    tracker.it = 'event1';
    expect(receiver).toHaveBeenLastCalledWith('+event1');

    tracker.it = '-event2';
    expect(receiver).not.toHaveBeenCalledWith('-event2');

    tracker.it = '+event3';
    expect(receiver).toHaveBeenLastCalledWith('+event3');
    expect(receiver).toHaveBeenCalledTimes(3);
  });
});
