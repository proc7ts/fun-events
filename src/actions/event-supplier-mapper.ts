/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent } from '../after-event';
import { OnEvent } from '../on-event';

/**
 * A signature of event supplier mapper function.
 *
 * Such mapper maps {@link OnEvent} sender or {@link AfterEvent} keeper to corresponding one.
 *
 * @category Core
 * @typeParam TInEvent - Incoming event type. This is a list of incoming event receiver parameter types.
 * @typeParam TOutEvent - Outgoing event type. This is a list of outgoing event receiver parameter types.
 */
export interface EventSupplierMapper<TInEvent extends any[], TOutEvent extends any[] = TInEvent> {

  /**
   * Maps {@link AfterEvent} keeper to another one.
   *
   * @param input - Incoming event keeper to map.
   *
   * @returns Outgoing mapped event keeper.
   */
  (this: void, input: AfterEvent<TInEvent>): AfterEvent<TOutEvent>;

  /**
   * Maps {@link OnEvent} sender to another one.
   *
   * @param input - Incoming event sender to map.
   *
   * @returns Outgoing mapped event sender.
   */
  (this: void, input: OnEvent<TInEvent>): OnEvent<TOutEvent>;

}
