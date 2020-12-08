import { nextArgs, nextSkip } from '@proc7ts/call-thru';
import { AfterEvent, afterEventBy } from '../after-event';
import { EventNotifier, EventReceiver } from '../base';
import { thruAfter } from './thru-after';

describe('thruAfter', () => {

  let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string, string]>]>;
  let mockOff: jest.Mock<void, [any?]>;
  let emitter: EventNotifier<[string, string]>;
  let afterEvent: AfterEvent<[string, string]>;
  let mockReceiver: jest.Mock<void, [string]>;

  beforeEach(() => {
    emitter = new EventNotifier();
    mockOff = jest.fn();
    mockRegister = jest.fn(receiver => {
      emitter.on(receiver);
      receiver.supply.whenOff(mockOff);
    });
    afterEvent = afterEventBy(mockRegister, () => ['init1', 'init2']);
    mockReceiver = jest.fn();
  });

  it('registers event receiver', () => {

    const transforming: AfterEvent<[string]> = afterEvent.do(thruAfter).forAll(
        (event1: string, event2: string) => `${event1}, ${event2}`,
    );

    transforming.to(mockReceiver);
    expect(mockRegister).toHaveBeenCalled();
  });
  it('unregisters event receiver when supply is cut off', () => {

    const transforming = afterEvent.do(thruAfter).forAll(
        (event1: string, event2: string) => `${event1}, ${event2}`,
    );

    const supply1 = transforming.to(mockReceiver);
    const supply2 = transforming.to(jest.fn());

    supply1.off();
    expect(mockOff).not.toHaveBeenCalled();
    supply2.off();
    expect(mockOff).toHaveBeenCalled();
  });
  it('transforms original event', () => {

    const transforming = afterEvent.do(thruAfter).forAll(
        (event1: string, event2: string) => `${event1}, ${event2}`,
    );

    transforming.to(mockReceiver);

    emitter.send('a', 'bb');

    expect(mockReceiver).toHaveBeenCalledWith('init1, init2');
    expect(mockReceiver).toHaveBeenCalledWith('a, bb');
  });
  it('skips original event', () => {

    const transforming = afterEvent.do(thruAfter).forAll(
        (event1: string, event2: string) => event1 < event2 ? nextArgs(event1, event2) : nextSkip,
        (event1: string, event2: string) => `${event1}, ${event2}`,
    );

    transforming.to(mockReceiver);

    emitter.send('a', 'bb');
    expect(mockReceiver).toHaveBeenCalledWith('init1, init2');
    expect(mockReceiver).toHaveBeenCalledWith('a, bb');

    mockReceiver.mockClear();
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('cuts off events supply when original sender cuts it off', () => {

    const mockOff2 = jest.fn();
    const transforming = afterEvent.do(thruAfter).forAll(
        (event1: string, event2: string) => `${event1}, ${event2}`,
    );

    transforming.to(mockReceiver).whenOff(mockOff2);

    const reason = 'some reason';

    emitter.supply.off(reason);
    expect(mockOff2).toHaveBeenCalledWith(reason);
  });
});
