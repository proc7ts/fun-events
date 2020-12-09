/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent } from '../after-event';
import { map } from '../impl';
import { OnEvent } from '../on-event';
import { EventSupplierMapper } from './event-supplier-mapper';
import { shareEvents } from './share-events';

/**
 * A mapper of event sender.
 *
 * @typeParam TEvent - Input event type. This is a list of event receiver parameter types.
 */
export interface OnEventMapper<TEvent extends any[]> {

  /**
   * Creates an {@link OnEvent} sender of events converted from input ones.
   *
   * @typeParam TResult - Converted value type.
   * @param convert - Converted function that accepts event parameters and returns converted event value.
   *
   * @returns Event sender.
   */
  forAll<TResult>(convert: (this: void, ...event: TEvent) => TResult): OnEvent<[TResult]>;

  /**
   * Creates an {@link OnEvent} sender of events converted from input ones, that does no share the transformed events
   * supply.
   *
   * This method does the same as {@link forAll} one, except it does not share the supply of transformed events among
   * receivers. This may be useful e.g. when the result will be further transformed anyway. It is wise to
   * {@link shareEvents share} the supply of events from final result in this case.
   *
   * @typeParam TResult - Converted value type.
   * @param convert - Converted function that accepts event parameters and returns converted event value.
   *
   * @returns Event sender.
   */
  forEach<TResult>(convert: (this: void, ...event: TEvent) => TResult): OnEvent<[TResult]>;

}

/**
 * A mapper of event keeper.
 *
 * @typeParam TEvent - Input event type. This is a list of event receiver parameter types.
 */
export interface AfterEventMapper<TEvent extends any[]> {

  /**
   * Creates an {@link AfterEvent} keeper of events converted from input ones.
   *
   * @typeParam TResult - Converted value type.
   * @param convert - Converted function that accepts event parameters and returns converted event value.
   *
   * @returns Event keeper.
   */
  forAll<TResult>(convert: (this: void, ...event: TEvent) => TResult): AfterEvent<[TResult]>;

  /**
   * Creates an {@link AfterEvent} keeper of events converted from input ones, that does no share the transformed events
   * supply.
   *
   * @typeParam TResult - Converted value type.
   * @param convert - Converted function that accepts event parameters and returns converted event value.
   *
   * @returns Event keeper.
   */
  forEach<TResult>(convert: (this: void, ...event: TEvent) => TResult): AfterEvent<[TResult]>;

}

/**
 * Creates a mapper that converts input events with the given converter function.
 *
 * @typeParam TEvent - Input event type.
 * @typeParam TResult - Converted value type.
 * @param convert - Converter function that accepts event parameters and returns converted event value.
 *
 * @returns A mapping function of input event supplier.
 */
export function mapEvents<TEvent extends any[], TResult>(// eslint-disable-line @typescript-eslint/naming-convention
    convert: (this: void, ...event: TEvent) => TResult,
): EventSupplierMapper<TEvent, [TResult]> {

  const mapper = mapEvents_(convert);

  return (
      (supplier: OnEvent<TEvent>) => shareEvents(mapper(supplier))
  ) as EventSupplierMapper<TEvent, [TResult]>;
}

/**
 * Creates a mapper that converts input events with the given converter function and does not share the transformed
 * event supply.
 *
 * @typeParam TEvent - Input event type.
 * @typeParam TResult - Converted value type.
 * @param convert - Converter function that accepts event parameters and returns converted event value.
 *
 * @returns A mapping function of input event supplier.
 */
export function mapEvents_<TEvent extends any[], TResult>(// eslint-disable-line @typescript-eslint/naming-convention
    convert: (this: void, ...event: TEvent) => TResult,
): EventSupplierMapper<TEvent, [TResult]> {
  return (
      (supplier: OnEvent<TEvent>) => supplier.by(map(supplier, convert))
  ) as EventSupplierMapper<TEvent, [TResult]>;
}
