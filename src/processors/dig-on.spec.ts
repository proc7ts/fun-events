import { asis, Supply } from '@proc7ts/primitives';
import { EventSender } from '../base';
import { EventEmitter } from '../senders';
import { digOn } from './dig-on';

describe('digOn', () => {

  let sender: EventEmitter<[EventEmitter<[string]>?]>;
  let nested1: EventEmitter<[string]>;
  let nested2: EventEmitter<[string]>;
  let extract: jest.Mock<EventSender<[string]> | undefined, [EventEmitter<[string]>?]>;
  let receiver: jest.Mock<void, [string]>;
  let supply: Supply;

  beforeEach(() => {
    sender = new EventEmitter();
    nested1 = new EventEmitter();
    nested2 = new EventEmitter();
    receiver = jest.fn();
    extract = jest.fn(asis);
    supply = sender.on.do(digOn(extract))(receiver);
  });
  afterEach(() => {
    supply.off();
  });

  it('receives nested event', () => {
    sender.send(nested1);
    nested1.send('value');
    expect(receiver).toHaveBeenCalledWith('value');
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
  it('does not receive events when the supply is cut off', () => {
    supply.off();

    sender.send(nested1);
    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });
  it('cuts off supply once incoming events supply cut off', () => {

    const whenOff = jest.fn();

    supply.whenOff(whenOff);

    const reason = 'some reason';

    sender.supply.off(reason);

    expect(whenOff).toHaveBeenCalledWith(reason);

    sender.send(nested1);
    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
    expect(sender.size).toBe(0);
  });
  it('does not cut off supply when nested events supply cut off', () => {

    const whenOff = jest.fn();

    supply.whenOff(whenOff);

    const reason = 'some reason';

    sender.send(nested1);
    nested1.send('value1');
    nested1.supply.off(reason);
    nested1.send('value2');

    expect(whenOff).not.toHaveBeenCalledWith(reason);

    sender.send(nested2);
    nested2.send('value3');

    expect(receiver).toHaveBeenCalledWith('value1');
    expect(receiver).not.toHaveBeenCalledWith('value2');
    expect(receiver).toHaveBeenCalledWith('value3');
  });
});
