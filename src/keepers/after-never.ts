import { AfterEvent, afterEventBy } from '../after-event';
import { neverReceive } from '../base/impl';

/**
 * An {@link AfterEvent} keeper that never sends any events.
 *
 * @category Core
 */
export const afterNever: AfterEvent<any> = /*#__PURE__*/ afterEventBy(neverReceive);
