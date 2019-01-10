import { AIterable, itsIterator } from 'a-iterable';
import { EventConsumer } from './event-consumer';
import { EventProducer } from './event-producer';
import { EventSource } from './event-source';

/**
 * Event emitter is a handy implementation of event producer along with methods for emitting events.
 *
 * It manages a list of registered event consumers, and removes them from the list once they lose their interest
 * (i.e. the `off()` is called on the returned event interest instance).
 *
 * Implements `AIterable` interface by iterating over registered event consumers in order of their registration.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export class EventEmitter<E extends any[], R = void> extends AIterable<EventConsumer<E, R>>
    implements EventSource<E, R> {

  /**
   * @internal
   */
  private readonly _consumers = new Map<number, EventConsumer<E, R>>();

  /**
   * @internal
   */
  private _seq = 0;

  /**
   * Call this method to start event consumption.
   *
   * This is an `EventProducer` implementation. Consumers registered with it will be notified on emitted events.
   */
  readonly on = EventProducer.of<E, R>(consumer => {

    const id = ++this._seq;

    this._consumers.set(id, consumer);
    return {
      off: () => {
        this._consumers.delete(id);
      },
    };
  });

  /**
   * The number of registered event consumers.
   */
  get consumers(): number {
    return this._consumers.size;
  }

  get [EventSource.on](): EventProducer<E, R> {
    return this.on;
  }

  [Symbol.iterator](): Iterator<EventConsumer<E, R>> {
    return itsIterator(this._consumers.values());
  }

  /**
   * Notifies all consumers on the given event.
   *
   * The event processing results are ignored by this method.
   *
   * @param event An event represented by function call arguments.
   */
  notify(...event: E): void {
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
