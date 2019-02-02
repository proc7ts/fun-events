import { AIterable, itsIterator } from 'a-iterable';
import { EventConsumer } from './event-consumer';
import { EventInterest } from './event-interest';
import { EventSource } from './event-source';

/**
 * Event notifier can be used to register event consumers and notify them on events.
 *
 * It does not implement an `EventProducer` interface though. Use `EventEmitter` if you need one.
 *
 * Manages a list of registered event consumers, and removes them from the list once they lose their interest
 * (i.e. the `off()` is called on the returned event interest instance).
 *
 * Implements `AIterable` interface by iterating over registered event consumers in order of their registration.
 *
 * Can be used as `EventSource`.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export class EventNotifier<E extends any[], R = void>
    extends AIterable<EventConsumer<E, R>>
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
   * The number of registered event consumers.
   */
  get consumers(): number {
    return this._consumers.size;
  }

  [EventSource.on](consumer: EventConsumer<E, R>): EventInterest {
    return this.on(consumer);
  }

  [Symbol.iterator](): Iterator<EventConsumer<E, R>> {
    return itsIterator(this._consumers.values());
  }

  /**
   * Registers event consumer.
   *
   * Consumers registered with this method will be notified on emitted events.
   */
  on(consumer: EventConsumer<E, R>): EventInterest {

    const id = ++this._seq;

    this._consumers.set(id, consumer);
    return {
      off: () => {
        this._consumers.delete(id);
      },
    };
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
