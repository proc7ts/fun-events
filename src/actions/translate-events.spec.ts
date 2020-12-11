import { EventEmitter } from '../senders';
import { translateEvents } from './translate-events';

describe('translateEvents', () => {
  it('translates event', () => {

    const emitter = new EventEmitter<[number, number]>();
    const onEvent = emitter.on.do(translateEvents((send, a: number, b: number) => send(b, a)));
    const receiver = jest.fn<void, [number, number]>();

    onEvent(receiver);

    emitter.send(2, 11);
    expect(receiver).toHaveBeenCalledWith(11, 2);
  });
  it('translates some events', () => {

    const emitter = new EventEmitter<[string?]>();
    const onEvent = emitter.on.do(translateEvents(
        (send, str) => str && !str.startsWith('-') && send(str.startsWith('+') ? str : `+${str}`),
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
