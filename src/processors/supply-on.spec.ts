import { neverSupply, Supply } from '@proc7ts/primitives';
import { EventNotifier, EventReceiver } from '../base';
import { OnEvent, onEventBy } from '../on-event';
import { supplyOn } from './supply-on';

describe('letInEvents', () => {

  let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string]>]>;
  let onEvent: OnEvent<[string]>;
  let supply: Supply;
  let offSpy: jest.Mock;
  let emitter: EventNotifier<[string]>;
  let mockReceiver: jest.Mock<void, [string]>;
  let requiredSupply: Supply;

  beforeEach(() => {
    emitter = new EventNotifier();
    mockRegister = jest.fn(receiver => {
      emitter.on(receiver);
      supply = receiver.supply;
      supply.whenOff(offSpy = jest.fn());
    });
    onEvent = onEventBy(mockRegister);
    mockReceiver = jest.fn();
    requiredSupply = new Supply();
  });

  it('sends original events', () => {
    onEvent.do(supplyOn(requiredSupply))(mockReceiver);
    emitter.send('event1');
    emitter.send('event2');

    expect(mockReceiver).toHaveBeenCalledWith('event1');
    expect(mockReceiver).toHaveBeenLastCalledWith('event2');
  });
  it('does not send any events if required supply is initially cut off', () => {

    const whenOff = jest.fn();

    onEvent.do(supplyOn(neverSupply()))(mockReceiver).whenOff(whenOff);
    emitter.send('event1');
    expect(mockReceiver).not.toHaveBeenCalled();
    expect(whenOff).toHaveBeenCalled();
  });
  it('no longer sends events after original supply is cut off', () => {

    const whenOff = jest.fn();

    onEvent.do(supplyOn(requiredSupply))(mockReceiver).whenOff(whenOff);
    emitter.send('event1');
    supply.off('reason');
    emitter.send('event2');

    expect(mockReceiver).toHaveBeenLastCalledWith('event1');
    expect(mockReceiver).not.toHaveBeenCalledWith('event2');
    expect(whenOff).toHaveBeenCalledWith('reason');
    expect(offSpy).toHaveBeenCalledWith('reason');
  });
  it('no longer sends events after required supply is cut off', () => {

    const whenOff = jest.fn();

    onEvent.do(supplyOn(requiredSupply))(mockReceiver).whenOff(whenOff);
    emitter.send('event1');
    requiredSupply.off('reason');
    emitter.send('event2');

    expect(mockReceiver).toHaveBeenLastCalledWith('event1');
    expect(mockReceiver).not.toHaveBeenCalledWith('event2');
    expect(whenOff).toHaveBeenCalledWith('reason');
    expect(offSpy).toHaveBeenCalledWith('reason');
  });

  describe('with dependent supply', () => {

    let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string]>]>;
    let onEvent: OnEvent<[string]>;
    let supply: Supply;
    let offSpy: jest.Mock;
    let emitter: EventNotifier<[string]>;
    let mockReceiver: jest.Mock<void, [string]>;
    let requiredSupply: Supply;
    let dependentSupply: Supply;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
        supply = receiver.supply;
        supply.whenOff(offSpy = jest.fn());
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
      requiredSupply = new Supply();
      dependentSupply = new Supply();
    });

    it('sends original events', () => {
      onEvent.do(supplyOn(requiredSupply, dependentSupply))(mockReceiver);
      emitter.send('event1');
      emitter.send('event2');

      expect(mockReceiver).toHaveBeenCalledWith('event1');
      expect(mockReceiver).toHaveBeenLastCalledWith('event2');
    });
    it('does not send any events if required supply is initially cut off', () => {

      const whenOff = jest.fn();

      onEvent.do(supplyOn(neverSupply(), dependentSupply))(mockReceiver).whenOff(whenOff);
      emitter.send('event1');
      expect(mockReceiver).not.toHaveBeenCalled();
      expect(whenOff).not.toHaveBeenCalled();

      dependentSupply.whenOff(whenOff);
      expect(whenOff).toHaveBeenCalled();
    });
    it('no longer sends events after original supply is cut off', () => {

      const whenOff = jest.fn();

      onEvent.do(supplyOn(requiredSupply, dependentSupply))(mockReceiver).whenOff(whenOff);
      emitter.send('event1');
      supply.off('reason');
      emitter.send('event2');

      expect(mockReceiver).toHaveBeenLastCalledWith('event1');
      expect(mockReceiver).not.toHaveBeenCalledWith('event2');
      expect(offSpy).toHaveBeenCalledWith('reason');
      expect(whenOff).not.toHaveBeenCalledWith('reason');

      dependentSupply.whenOff(whenOff);
      expect(whenOff).toHaveBeenCalledWith('reason');
    });
    it('no longer sends events after required supply is cut off', () => {

      const whenOff = jest.fn();

      onEvent.do(supplyOn(requiredSupply, dependentSupply))(mockReceiver).whenOff(whenOff);
      emitter.send('event1');
      requiredSupply.off('reason');
      emitter.send('event2');

      expect(mockReceiver).toHaveBeenLastCalledWith('event1');
      expect(mockReceiver).not.toHaveBeenCalledWith('event2');
      expect(offSpy).toHaveBeenCalledWith('reason');
      expect(whenOff).not.toHaveBeenCalledWith('reason');

      dependentSupply.whenOff(whenOff);
      expect(whenOff).toHaveBeenCalledWith('reason');
    });
  });
});