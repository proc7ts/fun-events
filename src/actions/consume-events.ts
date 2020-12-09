/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { neverSupply, Supply, SupplyPeer } from '@proc7ts/primitives';
import { OnEvent } from '../on-event';

/**
 * Creates an event consumer function.
 *
 * @category Core
 * @typeParam TEvent - Incoming event type. This is a list of consumer function parameter types.
 * @param consumer - A function consuming events. This function may return a {@link SupplyPeer peer of event
 * supply} when registers a nested event receiver. This supply will be cut off on new event, unless returned again.
 *
 * @returns A function accepting incoming event supplier and returning event supply that will stop consuming events once
 * {@link Supply.off cut off}.
 */
export function consumeEvents<TEvent extends any[]>(
    consumer: (this: void, ...event: TEvent) => SupplyPeer | void | undefined,
): (this: void, input: OnEvent<TEvent>) => Supply {
  return input => {

    let consumerSupply = neverSupply();

    // Do not use `.cuts()` here as `consumerSupply` is mutable
    const supply = new Supply(reason => consumerSupply.off(reason));

    input.to({
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
  };
}
