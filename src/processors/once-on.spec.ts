import { neverSupply, Supply } from '@proc7ts/supply';
import { EventNotifier, EventReceiver } from '../base';
import { OnEvent, onEventBy } from '../on-event';
import { onceOn } from './once-on';

describe('onceOn', () => {

  let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string]>]>;
  let onEvent: OnEvent<[string]>;
  let supply: Supply;
  let whenOff: jest.SpyInstance;
  let emitter: EventNotifier<[string]>;
  let mockReceiver: jest.Mock<void, [string]>;

  beforeEach(() => {
    emitter = new EventNotifier();
    mockRegister = jest.fn(receiver => {
      emitter.on(receiver);
      supply = receiver.supply;
      supply.whenOff(whenOff = jest.fn());
    });
    onEvent = onEventBy(mockRegister);
    mockReceiver = jest.fn();
  });

  it('registers event receiver', () => {
    expect(onEvent.do(onceOn)(mockReceiver)).toBe(supply);
    expect(mockRegister).toHaveBeenCalled();
  });
  it('unregisters notified event receiver', () => {
    onEvent.do(onceOn)(mockReceiver);
    expect(whenOff).not.toHaveBeenCalled();

    emitter.send('event');
    expect(mockReceiver).toHaveBeenCalledWith('event');
    expect(whenOff).toHaveBeenCalled();
  });
  it('unregisters immediately notified event receiver', () => {
    mockRegister.mockImplementation(receiver => {
      emitter.on(receiver);
      supply = receiver.supply;
      whenOff = jest.spyOn(supply, 'off');
      emitter.send('event');
    });

    onEvent.do(onceOn)(mockReceiver);

    expect(whenOff).toHaveBeenCalled();
    expect(mockReceiver).toHaveBeenCalledWith('event');
  });
  it('never sends events if their supply is initially cut off', () => {
    supply = neverSupply();
    onEvent.do(onceOn)({
      supply,
      receive: (_context, ...event: [string]) => mockReceiver(...event),
    });
    emitter.send('event');
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('never sends events after their supply is cut off', () => {
    onEvent.do(onceOn)(mockReceiver).off();
    emitter.send('event');
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('sends only one event', () => {
    onEvent.do(onceOn)(mockReceiver);
    emitter.send('event1');
    emitter.send('event2');
    expect(mockReceiver).toHaveBeenCalledTimes(1);
    expect(mockReceiver).toHaveBeenLastCalledWith('event1');
  });
});
