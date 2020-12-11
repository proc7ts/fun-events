import { EventEmitter } from '../senders';
import { translateOn } from './translate-on';

describe('translateOn', () => {
  it('translates event', () => {

    const emitter = new EventEmitter<[number, number]>();
    const onEvent = emitter.on.do(translateOn((send, a: number, b: number) => send(b, a)));
    const receiver = jest.fn<void, [number, number]>();

    onEvent(receiver);

    emitter.send(2, 11);
    expect(receiver).toHaveBeenLastCalledWith(11, 2);
    expect(receiver).toHaveBeenCalledTimes(1);
  });
  it('translates some events', () => {

    const emitter = new EventEmitter<[string?]>();
    const onEvent = emitter.on.do(translateOn(
        (send, str) => str && !str.startsWith('-') && send(str.startsWith('+') ? str : `+${str}`),
    ));
    const receiver = jest.fn<void, [string]>();

    onEvent(receiver);
    emitter.send();
    expect(receiver).not.toHaveBeenCalled();

    emitter.send('event1');
    expect(receiver).toHaveBeenLastCalledWith('+event1');

    emitter.send('-event2');
    expect(receiver).not.toHaveBeenCalledWith('-event2');

    emitter.send('+event3');
    expect(receiver).toHaveBeenLastCalledWith('+event3');
    expect(receiver).toHaveBeenCalledTimes(2);
  });
});
