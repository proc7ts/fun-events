import { Supply } from '@proc7ts/primitives';
import { OnEvent } from '../on-event';
import { StatePath } from './state-path';
import { StateUpdateReceiver } from './state-update-receiver';

/**
 * Signature of {@link EventSender} implementation able to register state update receivers.
 *
 * @category State Tracking
 */
export interface OnStateUpdate extends OnEvent<[StatePath.Normalized, any, any]> {

  /**
   * Starts sending state updates to the given `receiver`.
   *
   * @param receiver - Target receiver of state updates.
   *
   * @returns A supply of state updates from this sender to the given `receiver`.
   */
  (receiver: StateUpdateReceiver): Supply;

}
