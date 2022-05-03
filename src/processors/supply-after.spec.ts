import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { alwaysSupply, neverSupply, Supply } from '@proc7ts/supply';
import { Mock } from 'jest-mock';
import { AfterEvent, afterEventBy } from '../after-event';
import { EventNotifier, EventReceiver } from '../base';
import { supplyAfter } from './supply-after';

describe('supplyAfter', () => {

  let mockRegister: Mock<(receiver: EventReceiver.Generic<[string]>) => void>;
  let afterEvent: AfterEvent<[string]>;
  let supply: Supply;
  let offSpy: Mock<(reason?: unknown) => Supply>;
  let emitter: EventNotifier<[string]>;
  let mockReceiver: Mock<(arg: string) => void>;
  let requiredSupply: Supply;

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
    requiredSupply = new Supply();
  });

  it('sends original events', () => {
    afterEvent.do(supplyAfter(requiredSupply))(mockReceiver);
    emitter.send('event1');
    emitter.send('event2');

    expect(mockReceiver).toHaveBeenCalledWith('init');
    expect(mockReceiver).toHaveBeenCalledWith('event1');
    expect(mockReceiver).toHaveBeenLastCalledWith('event2');
  });
  it('does not send any events if required supply is initially cut off', () => {

    const whenOff = jest.fn();

    afterEvent.do(supplyAfter(neverSupply()))(mockReceiver).whenOff(whenOff);
    emitter.send('event1');
    expect(mockReceiver).not.toHaveBeenCalled();
    expect(whenOff).toHaveBeenCalled();
  });
  it('does not modify the input supply when `alwaysSupply()` specified', () => {
    expect(afterEvent.do(supplyAfter(alwaysSupply()))).toBe(afterEvent);
  });
  it('no longer sends events after original supply is cut off', () => {

    const whenOff = jest.fn();

    afterEvent.do(supplyAfter(requiredSupply))(mockReceiver).whenOff(whenOff);
    emitter.send('event1');
    supply.off('reason');
    emitter.send('event2');

    expect(mockReceiver).toHaveBeenCalledWith('init');
    expect(mockReceiver).toHaveBeenLastCalledWith('event1');
    expect(mockReceiver).not.toHaveBeenCalledWith('event2');
    expect(whenOff).toHaveBeenCalledWith('reason');
    expect(offSpy).toHaveBeenCalledWith('reason');
  });
  it('no longer sends events after required supply is cut off', () => {

    const whenOff = jest.fn();

    afterEvent.do(supplyAfter(requiredSupply))(mockReceiver).whenOff(whenOff);
    emitter.send('event1');
    requiredSupply.off('reason');
    emitter.send('event2');

    expect(mockReceiver).toHaveBeenCalledWith('init');
    expect(mockReceiver).toHaveBeenLastCalledWith('event1');
    expect(mockReceiver).not.toHaveBeenCalledWith('event2');
    expect(whenOff).toHaveBeenCalledWith('reason');
    expect(offSpy).toHaveBeenCalledWith('reason');
  });
});
