/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { Supply, SupplyPeer } from '@proc7ts/primitives';
import { tillOff } from '../impl';
import { OnEvent } from '../on-event';
import { EventSupplierMapper } from './event-supplier-mapper';
import { shareEvents } from './share-events';

/**
 * Creates an event supplier mapper function that passes incoming events until the `required` supply is cut off.
 *
 * The outgoing events supply will be cut off once incoming event supply does, unless a second supply passed in.
 * In the latter case that supply will be cut off instead.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param required - A peer of required event supply.
 * @param dependentSupply - The supply to cut off on cutting off the incoming events supply.
 *
 * @returns New event keeper.
 */
export function letInEvents<TEvent extends any[]>(
    required: SupplyPeer,
    dependentSupply?: Supply,
): EventSupplierMapper<TEvent> {

  const map = letInEvents_(required, dependentSupply);

  return (
      (input: OnEvent<TEvent>) => shareEvents(map(input))
  ) as EventSupplierMapper<TEvent>;
}

/**
 * Creates an event supplier mapper that passes incoming events until the the `required` supply is cut off, and does not
 * share the outgoing event supply.
 *
 * The outgoing events supply will be cut off once incoming event supply does, unless a second supply passed in.
 * In the latter case that supply will be cut off instead.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param required - A peer of required event supply.
 * @param dependentSupply - The supply to cut off on cutting off the incoming events supply.
 *
 * @returns New event keeper.
 */
export function letInEvents_<TEvent extends any[]>(// eslint-disable-line @typescript-eslint/naming-convention
    required: SupplyPeer,
    dependentSupply?: Supply,
): EventSupplierMapper<TEvent> {
  return (
      (input: OnEvent<TEvent>) => input.by(tillOff(input, required, dependentSupply))
  ) as EventSupplierMapper<TEvent>;
}
