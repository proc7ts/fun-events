import { nextArgs, nextSkip } from '@proc7ts/call-thru';
import { noop } from '@proc7ts/primitives';
import { EventNotifier, EventReceiver } from '../base';
import { OnEvent, onEventBy } from '../on-event';
import { thruOn } from './thru-on';

describe('thruOn', () => {

  let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string, string]>]>;
  let offSpy: jest.SpyInstance;
  let emitter: EventNotifier<[string, string]>;
  let onEvent: OnEvent<[string, string]>;
  let mockReceiver: jest.Mock<void, [string]>;

  beforeEach(() => {
    emitter = new EventNotifier();
    mockRegister = jest.fn(receiver => {
      emitter.on(receiver);
      offSpy = jest.spyOn(receiver.supply, 'off');
    });
    onEvent = onEventBy(mockRegister);
    mockReceiver = jest.fn();
  });

  it('registers event receiver', () => {

    const transforming = onEvent.do(thruOn).forAll(
        (event1: string, event2: string): string => `${event1}, ${event2}`,
    );

    transforming.to(mockReceiver);
    expect(mockRegister).toHaveBeenCalled();
  });
  it('unregisters event receiver once events supply cut off', () => {

    const transforming = onEvent.do(thruOn).forAll(
        (event1: string, event2: string) => `${event1}, ${event2}`,
    );

    const supply1 = transforming.to(mockReceiver);
    const supply2 = transforming.to(noop);

    supply1.off();
    expect(offSpy).not.toHaveBeenCalled();
    supply2.off();
    expect(offSpy).toHaveBeenCalled();
  });
  it('transforms original event', () => {

    const transforming = onEvent.do(thruOn).forAll(
        (event1: string, event2: string) => `${event1}, ${event2}`,
    );

    transforming.to(mockReceiver);

    emitter.send('a', 'bb');

    expect(mockReceiver).toHaveBeenCalledWith('a, bb');
  });
  it('skips original event', () => {

    const transforming = onEvent.do(thruOn).forAll(
        (event1: string, event2: string) => event1 < event2 ? nextArgs(event1, event2) : nextSkip,
        (event1: string, event2: string) => `${event1}, ${event2}`,
    );

    transforming.to(mockReceiver);

    emitter.send('a', 'bb');
    expect(mockReceiver).toHaveBeenCalledWith('a, bb');

    mockReceiver.mockClear();
    emitter.send('b', 'a');
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('cuts off transformed events supply once original events supply cut off', () => {

    const mockOff = jest.fn();
    const transforming = onEvent.do(thruOn).forAll(
        (event1: string, event2: string) => `${event1}, ${event2}`,
    );

    transforming.to(mockReceiver).whenOff(mockOff);

    const reason = 'some reason';

    emitter.supply.off(reason);
    expect(mockOff).toHaveBeenCalledWith(reason);
  });
});
