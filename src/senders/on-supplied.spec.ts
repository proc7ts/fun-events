import { AfterEvent__symbol, EventNotifier, EventReceiver, EventSupply, OnEvent__symbol } from '../base';
import { OnEvent } from '../on-event';
import { trackValue } from '../value';
import { EventEmitter } from './event-emitter';
import { onSupplied } from './on-supplied';

describe('onSupplied', () => {
  describe('from event sender', () => {

    let sender: EventNotifier<[string]>;
    let onEvent: OnEvent<[string]>;
    let mockReceiver: EventReceiver<[string]>;
    let supply: EventSupply;

    beforeEach(() => {
      sender = new EventNotifier();
      onEvent = onSupplied({
        [OnEvent__symbol](receiver) {
          return sender.on(receiver);
        },
      });
      mockReceiver = jest.fn();
      supply = onEvent(mockReceiver);
    });

    it('reports events sent by the given sender', () => {

      const event = 'event';

      sender.send(event);
      expect(mockReceiver).toHaveBeenCalledWith(event);
    });
    it('does not send events once their supply is cut off', () => {
      supply.off();

      sender.send('event');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
  });

  describe('from event sender with registrar implementing `OnEvent`', () => {
    it('returns the sender\'s registrar', () => {

      const sender = new EventEmitter<[string]>();

      expect(onSupplied(sender)).toBe(sender[OnEvent__symbol]);
    });
  });

  describe('from event keeper', () => {
    it('returns the keeper\'s registrar', () => {

      const tracker = trackValue(1);
      const keeper = {
        [AfterEvent__symbol]: tracker.read,
      };

      expect(onSupplied(keeper)).toBe(keeper[AfterEvent__symbol]);
    });
  });
});
