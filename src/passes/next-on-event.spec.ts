import { nextSkip } from 'call-thru';
import { EventNotifier, EventSender, EventSupply } from '../base';
import { EventEmitter } from '../event-emitter';
import { OnEvent } from '../on-event';
import { nextOnEvent } from './next-on-event';
import Mock = jest.Mock;

describe('nextOnEvent', () => {

  let sender: EventEmitter<[EventNotifier<[string]>?]>;
  let nested1: EventNotifier<[string]>;
  let nested2: EventNotifier<[string]>;
  let extract: Mock<EventSender<[string]> | undefined, [EventNotifier<[string]>?]>;
  let result: OnEvent<[string]>;
  let receiver: Mock<void, [string]>;
  let supply: EventSupply;

  beforeEach(() => {
    sender = new EventEmitter();
    nested1 = new EventNotifier();
    nested2 = new EventNotifier();
    receiver = jest.fn();
    extract = jest.fn((nested?: EventNotifier<[string]>) => nested);
    result = sender.on.thru(notifier => {

      const extracted = extract(notifier);

      return extracted ? nextOnEvent(extracted) : nextSkip;
    });
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

    sender.done(reason);

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
    nested1.done(reason);
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

    result = sender.on.thru(
        notifier => notifier === nested1 ? nested1 : nextSkip,
        notifier => {

          const extracted = extract(notifier);

          return extracted ? nextOnEvent(extracted) : nextSkip;
        },
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

    result = sender.on.thru(
        notifier => {

          const extracted = extract(notifier);

          return extracted ? nextOnEvent(extracted) : nextSkip;
        },
        value => value + '!',
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
