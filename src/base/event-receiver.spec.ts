import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { EventReceiver, eventReceiver } from './event-receiver';

describe('EventReceiver', () => {
  describe('eventReceiver', () => {
    let context: EventReceiver.Context<[string, string]>;

    beforeEach(() => {
      context = { onRecurrent: noop };
    });

    it('converts function to generic form', () => {
      const receiver = jest.fn();
      const generic = eventReceiver<[string, string]>(receiver);

      expect(generic.supply.isOff).toBe(false);
      generic.receive(context, 'a', 'b');
      expect(receiver).toHaveBeenCalledWith('a', 'b');
    });
    it('fulfills object with event supply', () => {
      const receiver = {
        receive: jest.fn(),
      };
      const generic = eventReceiver<[string, string]>(receiver);

      expect(generic.supply.isOff).toBe(false);
      generic.receive(context, 'a', 'b');
      expect(receiver.receive).toHaveBeenCalledWith(context, 'a', 'b');
    });
    it('reuses provided event supply', () => {
      const receiver = {
        supply: new Supply(),
        receive: jest.fn(),
      };
      const generic = eventReceiver<[string, string]>(receiver);

      expect(generic.supply).toBe(receiver.supply);
      generic.receive(context, 'a', 'b');
      expect(receiver.receive).toHaveBeenCalledWith(context, 'a', 'b');
    });
    it('disables event reception when event supply cut off', () => {
      const receiver = jest.fn();
      const { supply, receive } = eventReceiver<[string, string]>(receiver);

      supply.off();
      receive({} as EventReceiver.Context<[string, string]>, 'test', 'test');
      expect(receiver).not.toHaveBeenCalled();
    });
    it('prevents event reception during event supply cut off', () => {
      // eslint-disable-next-line prefer-const
      let generic: EventReceiver.Generic<[string, string]>;
      const receiver = {
        supply: new Supply(() => generic.receive(context, 'foo', 'bar')),
        receive: jest.fn(),
      };

      generic = eventReceiver(receiver);
      generic.supply.off();
      expect(receiver.receive).not.toHaveBeenCalled();
    });
    it('prevents receiver call during event supply cut off', () => {
      const receiver = jest.fn();
      const { supply, receive } = eventReceiver(receiver);

      supply.whenOff(() => receive(context, 'foo', 'bar'));
      supply.off();
      expect(receiver).not.toHaveBeenCalled();
    });
  });
});
