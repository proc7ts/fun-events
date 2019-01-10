import { EventProducer } from '../event-producer';
import { EventInterest } from '../event-interest';
import { EventConsumer } from '../event-consumer';

/**
 * DOM event listener.
 *
 * @param <E> Supported DOM event type.
 */
export type DomEventListener<E extends Event> = EventConsumer<[E]>;

/**
 * DOM event producer is an `EventProducer` accepting DOM event listener and its registration options as arguments.
 *
 * @param <E> Supported DOM event type.
 */
export abstract class DomEventProducer<E extends Event> extends EventProducer<[E]> {

  /**
   * Converts an event consumer registration function to event producer.
   *
   * This is a signature to work around type safety restrictions.
   */
  static of<E extends any[], R = void>(
      register: (this: void, consumer: EventConsumer<E, R>) => EventInterest): EventProducer<E, R>;

  /**
   * Converts an DOM event listener registration function to DOM event producer.
   *
   * @param register A DOM event listener registration function returning an event interest.
   *
   * @returns A DOM event producer instance registering DOM event listener with `register` function.
   */
  static of<E extends Event>(
      register: (
          this: void,
          listener: DomEventListener<E>,
          opts?: AddEventListenerOptions | boolean) => EventInterest):
      DomEventProducer<E>;

  static of<E extends Event>(
      register: (
          this: void,
          listener: DomEventListener<E>,
          opts?: AddEventListenerOptions | boolean) => EventInterest):
      DomEventProducer<E> {

    const producer = ((
        listener: (this: void, event: E) => void,
        opts?: AddEventListenerOptions | boolean) => register(listener, opts)) as DomEventProducer<E>;

    Object.setPrototypeOf(producer, DomEventProducer.prototype);

    return producer;
  }

  /**
   * An event producer derived from this one that enables event capturing by default.
   *
   * This corresponds to specifying `false` or `{ capture: true }` as a second argument to
   * `EventTarget.addEventListener()`.
   */
  get capture(): DomEventProducer<E> {

    const constructor: DomEventProducerFactory = this.constructor as any;

    return constructor.of((
        listener: DomEventListener<E>,
        opts?: AddEventListenerOptions | boolean) => {
      if (opts == null) {
        return this(listener, true);
      }
      if (typeof opts === 'object' && opts.capture == null) {
        return this(listener, { ...opts, capture: true });
      }
      return this(listener, opts);
    });
  }

  /**
   * An event producer derived from this one that accepts listeners that never call `Event.preventDefault()`.
   *
   * This corresponds to specifying `{ passive: true }` as a second argument to `EventTarget.addEventListener()`.
   */
  get passive(): DomEventProducer<E> {

    const constructor: DomEventProducerFactory = this.constructor as any;

    return constructor.of((
        listener: DomEventListener<E>,
        opts?: AddEventListenerOptions | boolean) => {
      if (opts == null) {
        return this(listener, { passive: true });
      }
      if (typeof opts === 'boolean') {
        return this(listener, { capture: opts, passive: true });
      }
      if (opts.passive == null) {
        return this(listener, { ...opts, passive: true });
      }
      return this(listener, opts);
    });
  }

  /**
   * An event producer derived from this one that registers listeners to invoke instead of default action.
   *
   * It invokes an `Event.preventDefault()` method prior to calling the registered listeners.
   */
  get instead(): DomEventProducer<E> {

    const constructor: DomEventProducerFactory = this.constructor as any;

    return constructor.of((
        listener: DomEventListener<E>,
        opts?: AddEventListenerOptions | boolean) => {
      return this(
          event => {
            event.preventDefault();
            listener(event);
          },
          opts);
    });
  }

  /**
   * An event producer derived from this one that registers listeners preventing further propagation of the current
   * event in the capturing and bubbling phases.
   *
   * It invokes an `Event.stopPropagation()` method prior to calling the registered listeners.
   */
  get just(): DomEventProducer<E> {

    const constructor: DomEventProducerFactory = this.constructor as any;

    return constructor.of((
        listener: DomEventListener<E>,
        opts?: AddEventListenerOptions | boolean) => {
      return this(
          event => {
            event.stopPropagation();
            listener(event);
          },
          opts);
    });
  }

  /**
   * An event producer derived from this one that registers the last event listener.
   *
   * It invokes an `Event.stopImmediatePropagation()` method prior to calling the registered listeners.
   */
  get last(): DomEventProducer<E> {

    const constructor: DomEventProducerFactory = this.constructor as any;

    return constructor.of((
        listener: DomEventListener<E>,
        opts?: AddEventListenerOptions | boolean) => {
      return this(
          event => {
            event.stopImmediatePropagation();
            listener(event);
          },
          opts);
    });
  }

}

export interface DomEventProducer<E extends Event> {

  /**
   * Registers event consumer that will be notified on events.
   *
   * @param listener A listener to notify on DOM events. The call has no effect if the same consumer is passed again.
   * @param opts DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @return An event interest. The event producer will notify the consumer on events, until the `off()` method
   * of returned event interest instance is called.
   */
  // tslint:disable-next-line:callable-types
  (this: void, listener: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): EventInterest;

}

interface  DomEventProducerFactory {

  of<E extends Event>(
      register: (
          this: void,
          listener: DomEventListener<E>,
          opts?: AddEventListenerOptions | boolean) => EventInterest):
      DomEventProducer<E>;

}
