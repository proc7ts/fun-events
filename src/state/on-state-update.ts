/**
 * @packageDocumentation
 * @module fun-events
 */
import { EventSupply, EventSupplyPeer } from '../base';
import { OnEvent } from '../on-event';
import { StatePath } from './state-path';
import { StateUpdateReceiver } from './state-update-receiver';

/**
 * An [[EventSender]] implementation able to register state update receivers.
 *
 * @category State Tracking
 */
export interface OnStateUpdate extends OnEvent<[StatePath, any, any]> {

  /**
   * Event receiver registration function of this state updates sender.
   *
   * Delegates to [[OnStateUpdate.to]] method.
   */
  readonly F: OnStateUpdate.Fn;

  /**
   * Returns a reference to itself.
   *
   * @returns `this` instance.
   */
  to(): this;

  /**
   * Starts sending state updates to the given `receiver`.
   *
   * @param receiver  Target receiver of state updates.
   *
   * @returns A supply of state updates from this sender to the given `receiver`.
   */
  to(receiver: StateUpdateReceiver): EventSupply;

  /**
   * Either starts sending state updates to the given `receiver`, or returns a reference to itself.
   *
   * @param receiver  Target receiver of state updates.
   *
   * @returns Either a supply of state updates from this sender to the given `receiver`, or `this` instance when
   * `receiver` is omitted.
   */
  to(receiver: StateUpdateReceiver): EventSupply;

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

}

export namespace OnStateUpdate {

  /**
   * A signature of function registering receivers of state updates.
   *
   * When called without parameters it returns an [[OnStateUpdate]] sender. When called with state updates receiver
   * as parameter it returns a supply of events from that sender.
   *
   * Available as [[OnStateUpdate.F]] property value.
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
