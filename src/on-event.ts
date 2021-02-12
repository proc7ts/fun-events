import { Supply } from '@proc7ts/primitives';
import { eventReceiver, EventReceiver, EventSender, OnEvent__symbol } from './base';
import { OnEvent$do, OnEvent$supplier, OnEvent$then } from './impl';

/**
 * Signature of {@link EventSender} implementation able to register event receivers.
 *
 * The registered event receiver starts receiving upcoming events until the returned event supply is cut off.
 *
 * Contains additional event processing methods.
 *
 * May be constructed using {@link onEventBy} function.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 */
export interface OnEvent<TEvent extends any[]> extends EventSender<TEvent> {

  /**
   * Starts sending events to the given `receiver`.
   *
   * @param receiver - Target receiver of events.
   *
   * @returns A supply of events from this sender to the given `receiver`.
   */
  (receiver: EventReceiver<TEvent>): Supply;

  [OnEvent__symbol](): this;

  /**
   * Applies the given processor to events.
   *
   * @typeParam TResult - Action result type.
   * @param processor - An event processor accepting this supplier as its only parameter, and returning application
   * result.
   *
   * @returns Processing result.
   */
  do<TResult>(
      processor: (this: void, supplier: this) => TResult,
  ): TResult;

  /**
   * Applies the given processors to events.
   *
   * The value returned from each processor application is passed as argument to the next one. The value returned from
   * the last processor application is the result of this method call.
   *
   * @typeParam TResult1 - The first processor application result type.
   * @typeParam TResult1 - The second processor application result type.
   * @param processor1 - An event processor accepting this supplier as its only parameter, and returning application
   * result.
   * @param processor2 - An event processor accepting the first one's application result as its only parameter, and
   * returning its own application result.
   *
   * @returns The last processor application result.
   */
  do<
      TResult1,
      TResult2,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
  ): TResult2;

  do<
      TResult1,
      TResult2,
      TResult3,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
  ): TResult3;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
  ): TResult4;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
      processor5: (this: void, arg: TResult4) => TResult5,
  ): TResult5;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
      processor5: (this: void, arg: TResult4) => TResult5,
      processor6: (this: void, arg: TResult5) => TResult6,
  ): TResult6;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
      processor5: (this: void, arg: TResult4) => TResult5,
      processor6: (this: void, arg: TResult5) => TResult6,
      processor7: (this: void, arg: TResult6) => TResult7,
  ): TResult7;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
      processor5: (this: void, arg: TResult4) => TResult5,
      processor6: (this: void, arg: TResult5) => TResult6,
      processor7: (this: void, arg: TResult6) => TResult7,
      processor8: (this: void, arg: TResult7) => TResult8,
  ): TResult8;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
      processor5: (this: void, arg: TResult4) => TResult5,
      processor6: (this: void, arg: TResult5) => TResult6,
      processor7: (this: void, arg: TResult6) => TResult7,
      processor8: (this: void, arg: TResult7) => TResult8,
      processor9: (this: void, arg: TResult8) => TResult9,
  ): TResult9;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      TResult10,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
      processor5: (this: void, arg: TResult4) => TResult5,
      processor6: (this: void, arg: TResult5) => TResult6,
      processor7: (this: void, arg: TResult6) => TResult7,
      processor8: (this: void, arg: TResult7) => TResult8,
      processor9: (this: void, arg: TResult8) => TResult9,
      processor10: (this: void, arg: TResult9) => TResult10,
  ): TResult10;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      TResult10,
      TResult11,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
      processor5: (this: void, arg: TResult4) => TResult5,
      processor6: (this: void, arg: TResult5) => TResult6,
      processor7: (this: void, arg: TResult6) => TResult7,
      processor8: (this: void, arg: TResult7) => TResult8,
      processor9: (this: void, arg: TResult8) => TResult9,
      processor10: (this: void, arg: TResult9) => TResult10,
      processor11: (this: void, arg: TResult10) => TResult11,
  ): TResult11;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      TResult10,
      TResult11,
      TResult12,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
      processor5: (this: void, arg: TResult4) => TResult5,
      processor6: (this: void, arg: TResult5) => TResult6,
      processor7: (this: void, arg: TResult6) => TResult7,
      processor8: (this: void, arg: TResult7) => TResult8,
      processor9: (this: void, arg: TResult8) => TResult9,
      processor10: (this: void, arg: TResult9) => TResult10,
      processor11: (this: void, arg: TResult10) => TResult11,
      processor12: (this: void, arg: TResult11) => TResult12,
  ): TResult12;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      TResult10,
      TResult11,
      TResult12,
      TResult13,
      >(
      processor1: (this: void, supplier: this) => TResult1,
      processor2: (this: void, arg: TResult1) => TResult2,
      processor3: (this: void, arg: TResult2) => TResult3,
      processor4: (this: void, arg: TResult3) => TResult4,
      processor5: (this: void, arg: TResult4) => TResult5,
      processor6: (this: void, arg: TResult5) => TResult6,
      processor7: (this: void, arg: TResult6) => TResult7,
      processor8: (this: void, arg: TResult7) => TResult8,
      processor9: (this: void, arg: TResult8) => TResult9,
      processor10: (this: void, arg: TResult9) => TResult10,
      processor11: (this: void, arg: TResult10) => TResult11,
      processor12: (this: void, arg: TResult11) => TResult12,
      processor13: (this: void, arg: TResult12) => TResult13,
  ): TResult13;

  /**
   * Attaches callbacks to the next event and/or supply cut off reason.
   *
   * This method makes event sender act as promise-like for the first parameter of the next event. Thus it is possible
   * e.g. to use it in `await` expression.
   *
   * @param onEvent - The callback to execute when next event received.
   * @param onCutOff - The callback to execute when supply is cut off before the next event received.
   *
   * @returns A Promise for the next event.
   */
  then<TResult1 = TEvent extends [infer F, ...any[]] ? F : undefined, TResult2 = never>(
      onEvent?: ((...event: TEvent) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onCutOff?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2>;

}

/**
 * Converts a plain event receiver registration function to {@link OnEvent} sender.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param register - Generic event receiver registration function. It will be called on each receiver registration,
 * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
 *
 * @returns An {@link OnEvent} sender registering event receivers with the given `register` function.
 */
export function onEventBy<TEvent extends any[]>(
    register: (this: void, receiver: EventReceiver.Generic<TEvent>) => void,
): OnEvent<TEvent> {

  const onEvent = ((receiver: EventReceiver<TEvent>): Supply => {

    const generic = eventReceiver(receiver);
    const { supply } = generic;

    if (!supply.isOff) {
      try {
        register(generic);
      } catch (error) {
        supply.off(error);
      }
    }

    return supply;
  }) as OnEvent<TEvent>;

  onEvent[OnEvent__symbol] = OnEvent$supplier;
  onEvent.do = OnEvent$do;
  onEvent.then = OnEvent$then;

  return onEvent;
}

/**
 * Checks whether the given value is an {@link OnEvent} sender.
 *
 * @typeParam TEvent - Expected event type.
 * @typeParam TOther - Another type the value may have.
 * @param value - A value to check.
 *
 * @returns `true` if the `value` has been created by {@link onEventBy} function or in compatible way,
 * or `false` otherwise.
 */
export function isOnEvent<TEvent extends any[], TOther = unknown>(
    value: OnEvent<TEvent> | TOther,
): value is OnEvent<TEvent> {
  return typeof value === 'function'
      && (value as Partial<OnEvent<TEvent>>)[OnEvent__symbol] === OnEvent$supplier
      && (value as Partial<OnEvent<TEvent>>).do === OnEvent$do
      && (value as Partial<OnEvent<TEvent>>).then === OnEvent$then;
}
