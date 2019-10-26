/**
 * @module fun-events
 */
import { EventSupplier } from '../event-supplier';
import { eventSupply, EventSupply } from '../event-supply';
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

    let remained = suppliers.length;
    let supplies: EventSupply[] = [];
    const supply = eventSupply(cutOff);

    supplies = suppliers.map(source => onSupplied(source)(receiver).whenOff(sourceDone));

    return supply;

    function cutOff(reason: any) {
      supplies.forEach(i => i.off(reason));
    }

    function sourceDone(reason: any) {
      if (!--remained) {
        supply.off(reason);
        supplies = [];
      }
    }
  }).share();
}
