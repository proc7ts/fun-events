/**
 * @packageDocumentation
 * @module fun-events
 */
import { AfterEvent, afterEventBy } from '../after-event';
import { neverReceive } from '../impl';

/**
 * An [[AfterEvent]] keeper that never sends any events.
 *
 * @category Core
 */
export const afterNever: AfterEvent<any> = (/*#__PURE__*/ afterEventBy(/*#__PURE__*/ neverReceive()));
