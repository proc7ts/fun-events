import { Supply } from '@proc7ts/supply';
import { EventSupplier } from '../base';
import { shareEvents } from '../impl';
import { OnEvent, onEventBy } from '../on-event';
import { onNever } from './on-never';
import { onSupplied } from './on-supplied';

/**
 * Builds an {@link OnEvent} sender of events sent by any of the given `suppliers`.
 *
 * The resulting event supply is cut off as soon as all source supplies do.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param suppliers - Original event suppliers.
 *
 * @returns An {@link OnEvent} sender of all supplied events.
 */
export function onAny<TEvent extends any[]>(
  ...suppliers: EventSupplier<TEvent>[]
): OnEvent<TEvent> {
  if (!suppliers.length) {
    return onNever as OnEvent<TEvent>;
  }

  return onEventBy(
    shareEvents(
      onEventBy<TEvent>(({ supply, receive }) => {
        let remained = suppliers.length;
        const removeSupplier = (reason?: unknown): void => {
          if (!--remained) {
            supply.off(reason);
          }
        };

        suppliers.forEach(supplier => onSupplied(supplier)({
            supply: new Supply(removeSupplier).needs(supply),
            receive,
          }));
      }),
    ),
  );
}
