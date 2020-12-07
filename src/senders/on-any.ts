/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { Supply } from '@proc7ts/primitives';
import { EventReceiver, EventSupplier } from '../base';
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
export function onAny<TEvent extends any[]>(...suppliers: EventSupplier<TEvent>[]): OnEvent<TEvent> {
  if (!suppliers.length) {
    return onNever as OnEvent<TEvent>;
  }

  return onEventBy<TEvent>(receiver => {

    const { supply } = receiver;
    let remained = suppliers.length;
    const removeSupplier = (reason?: any): void => {
      if (!--remained) {
        supply.off(reason);
      }
    };
    const receive = (context: EventReceiver.Context<TEvent>, ...event: TEvent): void => {
      receiver.receive(context, ...event);
    };

    suppliers.forEach(
        supplier => onSupplied(supplier).to({
          supply: new Supply(removeSupplier).needs(supply),
          receive,
        }),
    );
  }).share();
}
