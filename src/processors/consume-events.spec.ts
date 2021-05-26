import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { Mock } from 'jest-mock';
import { EventNotifier } from '../base';
import { EventEmitter } from '../senders';
import { consumeEvents } from './consume-events';

describe('consumeEvents', () => {

  let sender: EventEmitter<[EventNotifier<[string]>?]>;
  let nested1: EventNotifier<[string]>;
  let nested2: EventNotifier<[string]>;
  let consume: Mock<Supply | undefined, [EventNotifier<[string]>?]>;
  let receiver: Mock<void, [string]>;
  let supply: Supply;

  beforeEach(() => {
    sender = new EventEmitter();
    nested1 = new EventNotifier();
    nested2 = new EventNotifier();
    receiver = jest.fn();
    consume = jest.fn((nested?: EventNotifier<[string]>) => nested && nested.on(receiver));
    supply = sender.on.do(consumeEvents(consume));
  });

  it('receives nested event', () => {
    sender.send(nested1);
    nested1.send('value');
    expect(receiver).toHaveBeenCalledWith('value');
  });
  it('cuts off previous supply on new event', () => {

    const source = new EventEmitter<[]>();
    const supply1 = new Supply();
    const supply2 = new Supply();
    let calls = 0;

    source.on.do(consumeEvents(() => {

      const result = !calls ? supply1 : calls === 1 ? supply2 : undefined;

      ++calls;

      return result;
    }));

    source.send();
    expect(supply1.isOff).toBe(false);
    expect(supply2.isOff).toBe(false);

    source.send();
    expect(supply1.isOff).toBe(true);
    expect(supply2.isOff).toBe(false);

    source.send();
    expect(supply1.isOff).toBe(true);
    expect(supply2.isOff).toBe(true);
  });
  it('does not cut off previous supply on new event returning the same supply', () => {

    const source = new EventEmitter<[]>();
    const supply1 = new Supply();
    let calls = 0;

    source.on.do(consumeEvents(() => {

      const result = !calls || calls === 1 ? supply1 : undefined;

      ++calls;

      return result;
    }));

    source.send();
    expect(supply1.isOff).toBe(false);

    source.send();
    expect(supply1.isOff).toBe(false);

    source.send();
    expect(supply1.isOff).toBe(true);
  });
  it('receives latest event', () => {
    sender.send(nested1);

    nested1.send('value1');
    expect(receiver).toHaveBeenCalledWith('value1');

    nested1.send('value2');
    expect(receiver).toHaveBeenCalledWith('value2');
  });
  it('receives event from latest nested sender', () => {
    sender.send(nested1);
    sender.send(nested2);

    nested1.send('value1');
    nested2.send('value2');
    expect(receiver).not.toHaveBeenCalledWith('value1');
    expect(receiver).toHaveBeenCalledWith('value2');
  });
  it('does not receive event when not registered in nested', () => {
    sender.send(nested1);
    sender.send();

    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
  });
  it('does not receive events once their supply is cut off', () => {
    supply.off();

    sender.send(nested1);
    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
    expect(consume).not.toHaveBeenCalled();
    expect(sender.size).toBe(0);
  });
  it('stops consumption when original events supply is cut off', () => {

    const mockOff = jest.fn();

    supply.whenOff(mockOff);

    const reason = 'some reason';

    sender.supply.off(reason);

    expect(mockOff).toHaveBeenCalledWith(reason);

    sender.send(nested1);
    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
    expect(consume).not.toHaveBeenCalled();
  });
  it('does not stop consumption when nested events supply is cut off', () => {

    const mockOff = jest.fn();

    supply.whenOff(mockOff);

    const reason = 'some reason';

    sender.send(nested1);
    nested1.send('value1');
    nested1.supply.off(reason);
    nested1.send('value2');

    expect(mockOff).not.toHaveBeenCalledWith(reason);

    sender.send(nested2);
    nested2.send('value3');

    expect(receiver).toHaveBeenCalledWith('value1');
    expect(receiver).not.toHaveBeenCalledWith('value2');
    expect(receiver).toHaveBeenCalledWith('value3');
  });
});
