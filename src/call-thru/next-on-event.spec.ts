import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { nextSkip } from '@proc7ts/call-thru';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { Mock } from 'jest-mock';
import { EventSender } from '../base';
import { OnEvent } from '../on-event';
import { EventEmitter } from '../senders';
import { nextOnEvent } from './next-on-event';
import { thruOn } from './thru-on';

describe('nextOnEvent', () => {
  let sender: EventEmitter<[EventEmitter<[string]>?]>;
  let nested1: EventEmitter<[string]>;
  let nested2: EventEmitter<[string]>;
  let extract: Mock<(emitter?: EventEmitter<[string]>) => EventSender<[string]> | undefined>;
  let result: OnEvent<[string]>;
  let receiver: Mock<(arg: string) => void>;
  let supply: Supply;

  beforeEach(() => {
    sender = new EventEmitter();
    nested1 = new EventEmitter();
    nested1.supply.whenOff(noop);
    nested2 = new EventEmitter();
    nested2.supply.whenOff(noop);
    receiver = jest.fn();
    extract = jest.fn((nested?: EventEmitter<[string]>) => nested);
    result = sender.on.do(
      thruOn(notifier => {
        const extracted = extract(notifier);

        return extracted ? nextOnEvent(extracted) : nextSkip;
      }),
    );
    supply = result(receiver);
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
  it('does not receive events once their supply is cut offlost', () => {
    supply.off();

    sender.send(nested1);
    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });
  it('cuts off events supply once original events supply does', () => {
    const mockOff = jest.fn();

    supply.whenOff(mockOff);

    const reason = 'some reason';

    sender.supply.off(reason);

    expect(mockOff).toHaveBeenCalledWith(reason);

    sender.send(nested1);
    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
    expect(sender.size).toBe(0);
  });
  it('does not cut off events supply when nested events supply cut off', () => {
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
  it('cuts off previous supply when next event skipped', () => {
    supply.off();

    result = sender.on.do(
      thruOn(
        notifier => (notifier === nested1 ? nested1 : nextSkip),
        notifier => {
          const extracted = extract(notifier);

          return extracted ? nextOnEvent(extracted) : nextSkip;
        },
      ),
    );
    supply = result(receiver);

    sender.send(nested1);
    sender.send(nested2);

    nested1.send('value1');
    nested2.send('value2');

    expect(receiver).not.toHaveBeenCalledWith('value1');
    expect(receiver).not.toHaveBeenCalledWith('value2');
  });
  it('allows to post-process events', () => {
    supply.off();

    result = sender.on.do(
      thruOn(
        notifier => {
          const extracted = extract(notifier);

          return extracted ? nextOnEvent(extracted) : nextSkip;
        },
        value => value + '!',
      ),
    );
    supply = result(receiver);

    sender.send(nested1);
    nested1.send('value1');
    nested1.send('value2');
    nested1.send('value3');

    expect(receiver).toHaveBeenCalledWith('value1!');
    expect(receiver).toHaveBeenCalledWith('value2!');
    expect(receiver).toHaveBeenCalledWith('value3!');
  });
});
