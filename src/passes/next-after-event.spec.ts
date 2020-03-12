import { EventEmitter } from '../senders';
import { trackValue } from '../value';
import { nextAfterEvent } from './next-after-event';

describe('nextAfterEvent', () => {
  it('prefers `EventKeeper` over `EventSender`', () => {

    const sender = new EventEmitter<[string]>();
    const receiver = jest.fn<void, [string]>();

    sender.on().thru(
        str => trackValue(str + '!'),
        tracker => nextAfterEvent(tracker),
    ).to(receiver);

    sender.send('test');

    expect(receiver).toHaveBeenCalledWith('test!');
  });
});
