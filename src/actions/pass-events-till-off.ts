/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { Supply, SupplyPeer } from '@proc7ts/primitives';
import { AfterEvent } from '../after-event';
import { tillOff } from '../impl';
import { OnEvent } from '../on-event';

/**
 * Builds an {@link AfterEvent} keeper that passes events until the `required` supply is cut off.
 *
 * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
 * In the latter case that supply will be cut off instead.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event keeper to pass events from.
 * @param required - A peer of required event supply.
 * @param dependentSupply - The supply to cut off on cutting off the incoming events supply.
 *
 * @returns New event keeper.
 */
export function passEventsTillOff<TEvent extends any[]>(
    supplier: AfterEvent<TEvent>,
    required: SupplyPeer,
    dependentSupply?: Supply,
): AfterEvent<TEvent>;

/**
 * Builds an {@link OnEvent} sender that passes events until the `required` supply is cut off.
 *
 * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
 * In the latter case that supply will be cut off instead.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event sender to pass events from.
 * @param required - A peer of required event supply.
 * @param dependentSupply - The supply to cut off on cutting off the incoming events supply.
 *
 * @returns New event sender.
 */
export function passEventsTillOff<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
    required: SupplyPeer,
    dependentSupply?: Supply,
): OnEvent<TEvent>;

export function passEventsTillOff<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
    required: SupplyPeer,
    dependentSupply?: Supply,
): OnEvent<TEvent> | AfterEvent<TEvent> {
  return supplier.by(tillOff(supplier, required, dependentSupply));
}
