/**
 * @packageDocumentation
 * @module fun-events
 */
import { neverReceive } from '../base/impl';
import { OnEvent, onEventBy } from '../on-event';

/**
 * An [[OnEvent]] sender that never sends any events.
 *
 * @category Core
 */
export const onNever: OnEvent<any> = (/*#__PURE__*/ onEventBy(neverReceive));