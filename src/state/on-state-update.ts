/**
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

  (receiver: StateUpdateReceiver): EventSupply;

}
