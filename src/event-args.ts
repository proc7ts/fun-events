/**
 * A special structure capturing the event consumer arguments.
 *
 * Constructed by the last pass of `EventProducer.thru()`. The extracted event arguments then passed to the event
 * consumers registered in the resulting event producer.
 */
export interface EventArgs<E extends any[]> {

  /**
   * Captured event consumer arguments.
   */
  [EventArgs.args]: E;

}

export namespace EventArgs {

  /**
   * A type of event consumer arguments tuple extracted from the given value type.
   */
  export type Of<T> = T extends EventArgs<infer E> ? E : [T];

  /**
   * A key of `EventArgs` property holding captured event consumer arguments.
   */
  export const args = Symbol('event-args');

  /**
   * Detects whether the given `value` is `EventArgs`.
   *
   * @param value A value to check.
   *
   * @return Always `true`.
   */
  export function is<A extends EventArgs<any>>(value: A): value is A;

  /**
   * Detects whether the given `value` is `EventArgs`.
   *
   * @param value A value to check.
   *
   * @return `true` if the given value is object containing `[EventArgs.args]` property, or `false` otherwise.
   */
  export function is<P extends any[]>(value: any): value is EventArgs<P>;

  export function is<P extends any[]>(value: any): value is EventArgs<P> {
    return typeof value === 'object' && args in value;
  }

  /**
   * Constructs event consumer arguments by the given value.
   *
   * @param value Captured arguments if `value` is `EventArgs`, or a tuple containing a single `value` otherwise.
   */
  export function of<T>(value: T): Of<T> {
    if (is(value)) {
      return value[args] as Of<T>;
    }
    return [value] as Of<T>;
  }

}
