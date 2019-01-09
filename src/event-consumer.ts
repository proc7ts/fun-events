/**
 * Event consumer is a function that is called to notify on each event produced by `EventProducer` when registered.
 *
 * To register an event consumer in event producer just call the event producer with that event consumer as argument.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 * @param event An event represented by function call arguments.
 *
 * @return Event processing result.
 */
export type EventConsumer<E extends any[], R = void> = (this: void, ...event: E) => R;
