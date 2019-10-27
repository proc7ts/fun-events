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

  (receiver: StateUpdateReceiver): EventSupply;

  once(receiver: StateUpdateReceiver): EventSupply;

}
