import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { asis, noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { AfterEvent } from '../after-event';
import { AfterEvent__symbol, EventReceiver, NoEventsError } from '../base';
import { onceOn } from '../processors';
import { EventEmitter } from '../senders';
import { trackValue, ValueTracker } from '../value';
import { afterSupplied } from './after-supplied';

describe('afterSupplied', () => {
  describe('from event keeper', () => {
    let keeper: ValueTracker<string>;
    let afterEvent: AfterEvent<[string]>;
    let mockReceiver: EventReceiver<[string]>;
    let supply: Supply;

    beforeEach(() => {
      keeper = trackValue('initial');
      afterEvent = afterSupplied({
        [AfterEvent__symbol](): AfterEvent<[string]> {
          return keeper[AfterEvent__symbol]();
        },
      });
      mockReceiver = jest.fn();
      supply = afterEvent(mockReceiver);
    });

    it('sends the kept event upon receiver registration', () => {
      expect(mockReceiver).toHaveBeenCalledWith('initial');
    });
    it('sends events from the given keeper', () => {
      const event = 'other';

      keeper.it = event;
      expect(mockReceiver).toHaveBeenCalledWith(event);
    });
    it('does not send events once their supply is cut off', () => {
      supply.off();

      keeper.it = 'other';
      expect(mockReceiver).not.toHaveBeenCalledWith('other');
    });
  });

  describe('from event keeper with registrar implementing `AfterEvent`', () => {
    it("returns the keeper's registrar", () => {
      const keeper = trackValue('initial');

      expect(afterSupplied(keeper)).toBe(keeper[AfterEvent__symbol]());
    });
  });

  describe('from event sender', () => {
    let sender: EventEmitter<[string]>;
    let afterEvent: AfterEvent<[string]>;
    let mockReceiver: EventReceiver<[string]>;
    let supply: Supply;

    beforeEach(() => {
      sender = new EventEmitter();
      afterEvent = afterSupplied(sender, () => ['initial']);
      mockReceiver = jest.fn();
      supply = afterEvent(mockReceiver);
    });

    it('sends the initial event upon receiver registration', () => {
      expect(mockReceiver).toHaveBeenCalledWith('initial');
    });
    it('sends events from the given sender', () => {
      const event = 'other';

      sender.send(event);
      expect(mockReceiver).toHaveBeenCalledWith(event);
    });
    it('does not send events once their supply is cut off', () => {
      supply.off();

      sender.send('other');
      expect(mockReceiver).not.toHaveBeenCalledWith('other');
      afterEvent.do(onceOn)(event => expect(event).toBe('initial'));
    });
  });

  describe('from event sender without initial value', () => {
    let sender: EventEmitter<[string]>;
    let afterEvent: AfterEvent<[string]>;

    beforeEach(() => {
      sender = new EventEmitter();
      afterEvent = afterSupplied(sender);
    });

    it('cuts off event supply upon receiver registration', async () => {
      expect(await afterEvent(noop).whenDone().catch(asis)).toBeInstanceOf(NoEventsError);
    });
  });
});
