import { describe, expect, it, jest } from '@jest/globals';
import { EventEmitter } from '../senders';
import { trackValue } from '../value';
import { nextAfterEvent } from './next-after-event';
import { thruOn } from './thru-on';

describe('nextAfterEvent', () => {
  it('prefers `EventKeeper` over `EventSender`', () => {

    const sender = new EventEmitter<[string]>();
    const receiver = jest.fn<void, [string]>();

    sender.on.do(thruOn(
        str => trackValue(str + '!'),
        tracker => nextAfterEvent(tracker),
    ))(receiver);

    sender.send('test');

    expect(receiver).toHaveBeenCalledWith('test!');
  });
});
