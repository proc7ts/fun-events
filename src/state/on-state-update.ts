/**
 * @packageDocumentation
 * @module fun-events
 */
import { EventSupply } from '../event-supply';
import { OnEvent } from '../on-event';
import { StatePath } from './state-path';
import { StateUpdateReceiver } from './state-update-receiver';

/**
 * A state update receivers registration function interface.
 *
 * @category State Tracking
 */
export interface OnStateUpdate extends OnEvent<[StatePath, any, any]> {

  /**
   * An [[OnStateUpdate]] sender derived from this one that stops sending updates to registered receiver after the
   * first one.
   */
  readonly once: OnStateUpdate;

  /**
   * Builds an [[OnStateEvent]] sender that sends updated from this one until the required `supply` is cut off.
   *
   * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
   * In the latter case that supply will be cut off instead.
   *
   * @param requiredSupply  The required event supply.
   * @param dependentSupply  The supply to cut off on cutting off the incoming events supply.
   *
   * @returns New updates sender.
   */
  tillOff(requiredSupply: EventSupply, dependentSupply?: EventSupply): OnStateUpdate;

  (receiver: StateUpdateReceiver): EventSupply;

}
