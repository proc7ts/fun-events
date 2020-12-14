import { neverSupply, Supply } from '@proc7ts/primitives';
import { AfterEvent, afterEventBy } from '../after-event';
import { EventNotifier, EventReceiver } from '../base';
import { OnEvent, onEventBy } from '../on-event';
import { firstEvent } from './first-event';

describe('firstEvent', () => {
  describe('OnEvent', () => {

    let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string]>]>;
    let onEvent: OnEvent<[string]>;
    let supply: Supply;
    let offSpy: jest.SpyInstance;
    let emitter: EventNotifier<[string]>;
    let mockReceiver: jest.Mock<void, [string]>;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
        supply = receiver.supply;
        offSpy = jest.spyOn(supply, 'off');
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {
      expect(onEvent.do(firstEvent)(mockReceiver)).toBe(supply);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('unregisters notified event receiver', () => {
      onEvent.do(firstEvent)(mockReceiver);
      expect(offSpy).not.toHaveBeenCalled();

      emitter.send('event');
      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(offSpy).toHaveBeenCalled();
    });
    it('unregisters immediately notified event receiver', () => {
      mockRegister.mockImplementation(receiver => {
        emitter.on(receiver);
        supply = receiver.supply;
        offSpy = jest.spyOn(supply, 'off');
        emitter.send('event');
      });

      onEvent.do(firstEvent)(mockReceiver);

      expect(offSpy).toHaveBeenCalled();
      expect(mockReceiver).toHaveBeenCalledWith('event');
    });
    it('never sends events if their supply is initially cut off', () => {
      supply = neverSupply();
      onEvent.do(firstEvent)({
        supply,
        receive: (_context, ...event: [string]) => mockReceiver(...event),
      });
      emitter.send('event');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('never sends events after their supply is cut off', () => {
      onEvent.do(firstEvent)(mockReceiver).off();
      emitter.send('event');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('sends only one event', () => {
      onEvent.do(firstEvent)(mockReceiver);
      emitter.send('event1');
      emitter.send('event2');
      expect(mockReceiver).toHaveBeenCalledTimes(1);
      expect(mockReceiver).toHaveBeenLastCalledWith('event1');
    });
  });

  describe('AfterEvent', () => {

    let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string]>]>;
    let afterEvent: AfterEvent<[string]>;
    let supply: Supply;
    let offSpy: jest.Mock;
    let emitter: EventNotifier<[string]>;
    let mockReceiver: jest.Mock<void, [string]>;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        supply = receiver.supply;
        supply.whenOff(offSpy = jest.fn());
        emitter.on(receiver);
        emitter.send('init');
      });
      afterEvent = afterEventBy(mockRegister);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {
      afterEvent.do(firstEvent)(mockReceiver);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('sends initial event', () => {
      afterEvent.do(firstEvent)(mockReceiver);
      expect(mockReceiver).toHaveBeenCalledWith('init');
    });
    it('cuts off supply after event received', () => {

      const returnedSupply = afterEvent.do(firstEvent)(mockReceiver);

      expect(mockRegister).toHaveBeenCalled();
      expect(returnedSupply.isOff).toBe(true);
      expect(supply.isOff).toBe(true);
    });
    it('unregisters notified event receiver', () => {
      afterEvent.do(firstEvent)(mockReceiver);
      expect(offSpy).toHaveBeenCalled();
    });
    it('never sends events if their supply is initially cut off', () => {
      supply = neverSupply();
      afterEvent.do(firstEvent)({
        supply,
        receive: (_context, ...event: [string]) => mockReceiver(...event),
      });
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('sends only one event', () => {
      afterEvent.do(firstEvent)(mockReceiver);
      emitter.send('event1');
      emitter.send('event2');
      expect(mockReceiver).toHaveBeenCalledTimes(1);
      expect(mockReceiver).toHaveBeenLastCalledWith('init');
    });
  });
});
