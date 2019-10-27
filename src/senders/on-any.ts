/**
 * @module fun-events
 */
import { EventReceiver } from '../event-receiver';
import { EventSupplier } from '../event-supplier';
import { eventSupply } from '../event-supply';
import { OnEvent, onEventBy, onNever, onSupplied } from '../on-event';

/**
 * Builds an [[OnEvent]] sender of events sent by any of the given `suppliers`.
 *
 * The resulting event supply is cut off as soon as all source supplies do.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param suppliers  Original event suppliers.
 *
 * @returns An [[OnEvent]] sender of all supplied events.
 */
export function onAny<E extends any[]>(...suppliers: EventSupplier<E>[]): OnEvent<E> {
  if (!suppliers.length) {
    return onNever;
  }

  return onEventBy<E>(receiver => {

    const { supply } = receiver;
    let remained = suppliers.length;
    const removeSupplier = (reason?: any) => {
      if (!--remained) {
        supply.off(reason);
      }
    };
    const receive = (context: EventReceiver.Context<E>, ...event: E) => {
      receiver.receive(context, ...event);
    };

    suppliers.forEach(
        supplier => onSupplied(supplier)({
          supply: eventSupply(removeSupplier).needs(supply),
          receive,
        }),
    );
  }).share();
}
