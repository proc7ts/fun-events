/**
 * @packageDocumentation
 * @module fun-events
 */
import { EventSupply, EventSupplyPeer } from '../base';
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
   * Builds an [[OnStateUpdate]] sender of events originated from this one that stops sending them to registered
   * receiver after the first one.
   *
   * @returns State updates sender.
   */
  once(): OnStateUpdate;

  /**
   * Registers a receiver of state updates originated from this sender that stops receiving them after the first one.
   *
   * @param receiver  A receiver of state updates to register.
   *
   * @returns A supply of state updates.
   */
  once(receiver: StateUpdateReceiver): EventSupply;

  /**
   * Builds an [[OnStateEvent]] sender that sends updated from this one until the required `supply` is cut off.
   *
   * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
   * In the latter case that supply will be cut off instead.
   *
   * @param required  A peer of required event supply.
   * @param dependentSupply  The supply to cut off on cutting off the incoming events supply.
   *
   * @returns New updates sender.
   */
  tillOff(required: EventSupplyPeer, dependentSupply?: EventSupply): OnStateUpdate;

  (receiver: StateUpdateReceiver): EventSupply;

}

export namespace OnStateUpdate {

  /**
   * A signature of function registering receivers of state updates.
   *
   * When called without parameters it returns an [[OnStateUpdate]] sender. When called with state updates receiver
   * as parameter it returns a supply of events from that sender.
   */
  export interface Fn {

    /**
     * Returns the state updates sender.
     *
     * @returns [[OnStateUpdate]] sender the updates originated from.
     */
    (
        this: void,
    ): OnStateUpdate;

    /**
     * Registers a receiver of state updates sent by the sender.
     *
     * @param receiver  A receiver of state updates to register.
     *
     * @returns A supply of state updates from the sender to the given `receiver`.
     */
    (
        this: void,
        receiver: StateUpdateReceiver,
    ): EventSupply;

    /**
     * Either registers a receiver of state updates sent by the sender, or returns the sender itself.
     *
     * @param receiver  A receiver of state updates to register.
     *
     * @returns Either a supply of state updates from the sender to the given `receiver`, or [[OnStateUpdate]] sender
     * the updates originated from when `receiver` is omitted.
     */
    (
        this: void,
        receiver?: StateUpdateReceiver,
    ): EventSupply | OnStateUpdate;

  }

}

/**
 * Converts state updates sender to state update receivers registration function.
 *
 * This function delegates to [[OnStateUpdate.to]] method.
 *
 * @param onStateUpdate  State update sender to convert.
 *
 * @returns state update receivers registration function.
 */
export function receiveOnStateUpdate(onStateUpdate: OnEvent<[StatePath, any, any]>): OnStateUpdate.Fn {
  return onStateUpdate.to.bind(onStateUpdate) as OnStateUpdate.Fn;
}
