import { neverSupply, Supply } from '@proc7ts/primitives';
import { AfterEvent, afterEventBy } from '../after-event';
import { EventNotifier, EventReceiver } from '../base';
import { onceAfter } from './once-after';

describe('onceAfter', () => {

  let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string]>]>;
  let afterEvent: AfterEvent<[string]>;
  let supply: Supply;
  let whenOff: jest.Mock;
  let emitter: EventNotifier<[string]>;
  let mockReceiver: jest.Mock<void, [string]>;

  beforeEach(() => {
    emitter = new EventNotifier();
    mockRegister = jest.fn(receiver => {
      supply = receiver.supply;
      supply.whenOff(whenOff = jest.fn());
      emitter.on(receiver);
      emitter.send('init');
    });
    afterEvent = afterEventBy(mockRegister);
    mockReceiver = jest.fn();
  });

  it('registers event receiver', () => {
    afterEvent.do(onceAfter)(mockReceiver);
    expect(mockRegister).toHaveBeenCalled();
  });
  it('sends initial event', () => {
    afterEvent.do(onceAfter)(mockReceiver);
    expect(mockReceiver).toHaveBeenCalledWith('init');
  });
  it('cuts off supply after event received', () => {

    const returnedSupply = afterEvent.do(onceAfter)(mockReceiver);

    expect(mockRegister).toHaveBeenCalled();
    expect(returnedSupply.isOff).toBe(true);
    expect(supply.isOff).toBe(true);
  });
  it('unregisters notified event receiver', () => {
    afterEvent.do(onceAfter)(mockReceiver);
    expect(whenOff).toHaveBeenCalled();
  });
  it('never sends events if their supply is initially cut off', () => {
    supply = neverSupply();
    afterEvent.do(onceAfter)({
      supply,
      receive: (_context, ...event: [string]) => mockReceiver(...event),
    });
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('sends only one event', () => {
    afterEvent.do(onceAfter)(mockReceiver);
    emitter.send('event1');
    emitter.send('event2');
    expect(mockReceiver).toHaveBeenCalledTimes(1);
    expect(mockReceiver).toHaveBeenLastCalledWith('init');
  });
});
