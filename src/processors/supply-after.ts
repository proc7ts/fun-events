import { asis } from '@proc7ts/primitives';
import { isAlwaysSupply, Supply, SupplyPeer } from '@proc7ts/supply';
import { AfterEvent, afterEventBy } from '../after-event';
import { supplyEvents } from '../impl';

/**
 * Creates an event processor that passes events incoming from {@link AfterEvent} keeper until the `required` supply
 * is cut off.
 *
 * The outgoing events supply will be cut off once incoming event supply does, unless a second supply passed in.
 * In the latter case that supply will be cut off instead.
 *
 * @category Event Processing
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param required - A peer of required event supply. The returned processor does nothing when `alwaysSupply()`
 * specified.
 * @param dependentSupply - The supply to cut off on cutting off the incoming events supply.
 *
 * @returns New event mapper.
 */
export function supplyAfter<TEvent extends any[]>(
  required: SupplyPeer,
  dependentSupply?: Supply,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {
  return isAlwaysSupply(required.supply)
    ? asis
    : (input: AfterEvent<TEvent>) => afterEventBy(supplyEvents(input, required, dependentSupply));
}
