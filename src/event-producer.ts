import { noop } from './noop';

/**
 * Event producer.
 *
 * This is a function accepting an event consumer as its only argument. Once called, the consumer will be notified on
 * events, while the consumer is interested in receiving them.
 *
 * Note that event producer is a function, not a method.
 *
 * An event producer also has a set of handy methods. More could be added at later time.
 *
 * To convert a plain function into `EventProducer` an `EventProducer.of()` function can be used.
 *
 * @param <C> A type of event consumer.
 */
export interface EventProducer<C extends EventConsumer<any[], any, any>> {

  /**
   * Registers event consumer that will be notified on events.
   *
   * @param consumer A consumer to notify on events. The call has no effect if the same consumer is passed again.
   *
   * @return An event interest. The event producer will notify the consumer on events, until the `off()` method
   * of returned event interest instance is called. If the same consumer is passed to event producer again,
   * the `EventInterest.none` will be returned.
   */
  (this: void, consumer: C): EventInterest;

  /**
   * Registers event consumer the will be notified on the next event at most once.
   *
   * @param consumer A consumer to notify on next event.
   */
  once(consumer: C): EventInterest;

}

/**
 * Event consumer.
 *
 * This is a function that is called to notify on each event produced by `EventProducer` after the latter is called
 * with this event consumer as argument.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 * @param <T> A `this` value type expected by event consumer.
 * @param event An event represented by function call arguments.
 *
 * @return Event processing result.
 */
export type EventConsumer<E extends any[], R = void, T = any> = (this: T, ...event: E) => R;

/**
 * An interest for the events.
 *
 * This instance is returned by `EventProducer` when registering an event consumer. Once the consumer is no longer
 * interested in receiving events, an `off()` method should be called, indicated the lost of interest.
 */
export interface EventInterest {

  /**
   * A method to call to indicate the lost of interest in receiving events.
   *
   * Once called, the corresponding event consumer would no longer be called.
   *
   * Calling this method for the second time has no effect.
   */
  off(): void;

}

export namespace EventInterest {

  /**
   * No-op event interest.
   *
   * This is handy to use e.g. to initialize the fields.
   */
  export const none: EventInterest = {
    off: noop,
  };

}

export namespace EventProducer {

  /**
   * Converts an event consumer registration function to event producer.
   *
   * @param register An event consumer registration function returning an event interest.
   *
   * @returns An event producer instance registering consumers with `register` function.
   */
  export function of<C extends EventConsumer<any[], any, any>>(
      register: (this: void, consumer: C) => EventInterest): EventProducer<C> {

    const producer = (consumer => register(consumer)) as EventProducer<C>;

    producer.once = function (this: EventProducer<C>, consumer: C) {

      let interest = EventInterest.none;
      let off = false;

      const wrapper = ((...args: Parameters<C>) => {
        interest.off();
        off = true;
        return consumer(...args) as ReturnType<C>;
      }) as C;

      interest = this(wrapper);

      if (off) {
        // The consumer is notified immediately during registration.
        // Unregister event interest right away.
        interest.off();
      }

      return interest;
    };

    return producer;
  }

  /**
   * An event producer that never produces any events.
   */
  export const never: EventProducer<(...event: any[]) => any> = of(() => EventInterest.none);

}
