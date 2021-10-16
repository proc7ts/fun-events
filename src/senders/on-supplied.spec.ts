import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { AfterEvent__symbol, EventKeeper, EventReceiver, EventSender, OnEvent__symbol } from '../base';
import { OnEvent } from '../on-event';
import { trackValue } from '../value';
import { EventEmitter } from './event-emitter';
import { onSupplied } from './on-supplied';

describe('onSupplied', () => {
  describe('from event sender', () => {

    let sender: EventEmitter<[string]>;
    let onEvent: OnEvent<[string]>;
    let mockReceiver: EventReceiver<[string]>;
    let supply: Supply;

    beforeEach(() => {
      sender = new EventEmitter();

      const supplier: EventSender<[string]> = {
        [OnEvent__symbol]() {
          return sender.on;
        },
      };

      onEvent = onSupplied(supplier);
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

      expect(onSupplied(sender)).toBe(sender[OnEvent__symbol]());
    });
  });

  describe('from event keeper', () => {
    it('returns the keeper\'s registrar', () => {

      const tracker = trackValue(1);
      const keeper: EventKeeper<[number]> = {
        [AfterEvent__symbol]() {
          return tracker.read;
        },
      };

      expect(onSupplied(keeper)).toBe(keeper[AfterEvent__symbol]());
    });
  });
});
