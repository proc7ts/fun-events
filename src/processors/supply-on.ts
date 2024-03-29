import { asis } from '@proc7ts/primitives';
import { isAlwaysSupply, Supply, SupplyPeer } from '@proc7ts/supply';
import { supplyEvents } from '../impl';
import { OnEvent, onEventBy } from '../on-event';

/**
 * Creates an event processor that passes events incoming from {@link OnEvent} sender until the `required` supply is
 * cut off.
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
export function supplyOn<TEvent extends any[]>(
  required: SupplyPeer,
  dependentSupply?: Supply,
): (this: void, input: OnEvent<TEvent>) => OnEvent<TEvent> {
  return isAlwaysSupply(required.supply)
    ? asis
    : (input: OnEvent<TEvent>) => onEventBy(supplyEvents(input, required, dependentSupply));
}
