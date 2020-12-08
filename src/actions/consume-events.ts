/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { neverSupply, Supply, SupplyPeer } from '@proc7ts/primitives';
import { OnEvent } from '../on-event';

/**
 * Consumes events.
 *
 * @category Core
 * @typeParam TEvent - Incoming event type. This is a list of consumer function parameter types.
 * @param sender - A sender of events.
 * @param consumer - A function consuming events. This function may return a {@link SupplyPeer peer of event
 * supply} when registers a nested event receiver. This supply will be cut off on new event, unless returned again.
 *
 * @returns An event supply that will stop consuming events once {@link Supply.off cut off}.
 */
export function consumeEvents<TEvent extends any[]>(
    sender: OnEvent<TEvent>,
    consumer: (this: void, ...event: TEvent) => SupplyPeer | void | undefined,
): Supply {

  let consumerSupply = neverSupply();

  // Do not use `.cuts()` here as `consumerSupply` is mutable
  const supply = new Supply(reason => consumerSupply.off(reason));

  sender.to({
    supply,
    receive(_ctx, ...event: TEvent) {

      const prevSupply = consumerSupply;

      try {
        consumerSupply = (consumer(...event) || neverSupply()).supply;
      } finally {
        if (consumerSupply !== prevSupply) {
          prevSupply.off();
        }
      }
    },
  });

  return supply;
}
