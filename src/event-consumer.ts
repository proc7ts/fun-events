/**
 * Event consumer is a function that is called to notify on each event produced by `EventProducer` when registered.
 *
 * To register an event consumer in event producer just call the event producer with that event consumer as argument.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 * @param <T> A `this` value type expected by event consumer.
 * @param event An event represented by function call arguments.
 *
 * @return Event processing result.
 */
export type EventConsumer<E extends any[], R = void, T = void> = (this: T, ...event: E) => R;

export namespace EventConsumer {

  /**
   * A type of `this` argument of event consumer.
   */
  export type This<C extends EventConsumer<any, any, any>> = C extends EventConsumer<any, any, infer T> ? T  : never;

  /**
   * A type of event tuple of event consumer.
   */
  export type Event<C extends EventConsumer<any, any, any>> = C extends EventConsumer<infer E, any, any> ? E : never;

  /**
   * A type of return value of event consumer.
   */
  export type Result<C extends EventConsumer<any, any, any>> = C extends EventConsumer<any, infer R, any> ? R  : never;

}
