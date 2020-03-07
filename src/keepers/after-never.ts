/**
 * @packageDocumentation
 * @module fun-events
 */
import { AfterEvent, afterEventBy } from '../after-event';

/**
 * An [[AfterEvent]] keeper that never sends any events.
 *
 * @category Core
 */
export const afterNever: AfterEvent<any> = (/*#__PURE__*/ afterEventBy(({ supply }) => supply.off()));
