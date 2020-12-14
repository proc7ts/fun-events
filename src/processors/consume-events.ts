/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { neverSupply, Supply, SupplyPeer } from '@proc7ts/primitives';
import { OnEvent } from '../on-event';

/**
 * Creates an event processor that consumes incoming events.
 *
 * @category Core
 * @typeParam TEvent - Incoming event type. This is a list of consumer function parameter types.
 * @param consume - A function consuming events. This function may return a {@link SupplyPeer peer of event supply},
 * e.g. when registers a nested event receiver. This supply will be cut off on new event, unless returned again.
 *
 * @returns A function accepting incoming event supplier and returning event supply that will stop consuming events once
 * cut off.
 */
export function consumeEvents<TEvent extends any[]>(
    consume: (this: void, ...event: TEvent) => SupplyPeer | void | undefined,
): (this: void, input: OnEvent<TEvent>) => Supply {
  return input => {

    let consumerSupply = neverSupply();

    // Do not use `.cuts()` here as `consumerSupply` is mutable
    const supply = new Supply(reason => consumerSupply.off(reason));

    input({
      supply,
      receive(_ctx, ...event: TEvent) {

        const prevSupply = consumerSupply;

        try {
          consumerSupply = (consume(...event) || neverSupply()).supply;
        } finally {
          if (consumerSupply !== prevSupply) {
            prevSupply.off();
          }
        }
      },
    });

    return supply;
  };
}
