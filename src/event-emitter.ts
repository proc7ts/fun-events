import { AIterable, itsIterator } from 'a-iterable';
import { EventConsumer, EventInterest, EventProducer } from './event-producer';

/**
 * Event emitter.
 *
 * This is a handy implementation of event producer along with methods for emitting events. It manages a list of
 * registered event consumers, and removes them from the list once they lose their interest (i.e. `EventInterest.off()`
 * method is called on returned event interest instance).
 *
 * Implements `AIterable` interface by iterating over registered event consumers in order of their registration.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export class EventEmitter<C extends EventConsumer<any[], any>> extends AIterable<C> {

  /**
   * @internal
   */
  private readonly _consumers = new Set<C>();

  /**
   * Call this method to start event consumption.
   *
   * This is an `EventProducer` implementation. Consumers registered with it will be notified on emitted events.
   */
  readonly on: EventProducer<C> = (consumer => {
    if (this._consumers.has(consumer)) {
      return EventInterest.none;
    }
    this._consumers.add(consumer);
    return {
      off: () => {
        this._consumers.delete(consumer);
      },
    };
  });

  /**
   * The number of registered event consumers.
   */
  get consumers(): number {
    return this._consumers.size;
  }

  [Symbol.iterator](): Iterator<C> {
    return itsIterator(this._consumers);
  }

  /**
   * Notifies all consumers on the given event.
   *
   * The event processing results are ignored by this method.
   *
   * @param event An event represented by function call arguments.
   */
  notify(...event: Parameters<C>): void {
    this.forEach(consumer => consumer(...event));
  }

  /**
   * Removes all registered event consumers.
   *
   * After this method call they won't be notified on events any more.
   */
  clear() {
    this._consumers.clear();
  }

}
