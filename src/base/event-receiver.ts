import { Supply } from '@proc7ts/supply';

/**
 * Event receiver is called on each event sent by {@link EventSender} when registered.
 *
 * A receiver may be represented either by {@link EventReceiver.Function function}, or by
 * {@link EventReceiver.Object object}. The former is a simplest form. The latter allows control all aspects of event
 * processing.
 *
 * To register an event receiver just call the event sender's `[OnEvent__symbol]` or event keeper's
 * `[AfterEvent__symbol]` method with this event receiver as argument.
 *
 * A _recurrent event_ is an event sent from inside event receiver and targeted the same receiver. Recurrent event
 * processing is scheduled until after the current event processing finishes. To handle recurrent events in a specific
 * way the event receiver may utilize an {@link EventReceiver.Context event processing context} available as
 * a first parameter of {@link EventReceiver.Object.receive} method.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
 */
export type EventReceiver<TEvent extends any[]> =
  | EventReceiver.Function<TEvent>
  | EventReceiver.Object<TEvent>;

/**
 * @category Core
 */
export namespace EventReceiver {
  /**
   * Event receiver function signature.
   *
   * It never receives event processing context.
   *
   * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
   */
  export type Function<TEvent extends any[]> =
    /**
     * @param event - An event represented by function call arguments.
     */
    (this: void, ...event: TEvent) => void;

  /**
   * Event receiver object.
   *
   * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
   */
  export interface Object<TEvent extends any[]> {
    /**
     * Event supply to this receiver.
     *
     * Events will be supplied to this receiver until this supply is {@link Supply.off cut off}.
     *
     * When omitted a new supply will be created per receiver registration within event supplier.
     */
    readonly supply?: Supply | undefined;

    /**
     * Receives an event.
     *
     * @param context - An event processing context.
     * @param event - An event represented as the rest of arguments.
     */
    receive(context: Context<TEvent>, ...event: TEvent): void;
  }

  /**
   * The most generic event receiver form.
   *
   * Any event receiver may be converted to generic form by {@link eventReceiver} function.
   *
   * In contrast to {@link EventReceiver.Object} this one always has a supply.
   *
   * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
   */
  export interface Generic<TEvent extends any[]> extends Object<TEvent> {
    /**
     * Event supply to this receiver.
     *
     * Events will be supplied to this receiver until this supply is {@link Supply.off cut off}.
     */
    readonly supply: Supply;

    /**
     * Receives an event.
     *
     * This method does not require a `this` context. So it is possible to deconstruct the event receiver like this:
     * ```typescript
     * const { supply, receive } = eventReceiver(receiver);
     * ```
     *
     * @param context - An event processing context.
     * @param event - An event represented as the rest of arguments.
     */
    receive(this: void, context: Context<TEvent>, ...event: TEvent): void;
  }

  /**
   * Event processing context.
   *
   * It is passed to {@link EventReceiver.Object} receivers.
   *
   * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
   */
  export interface Context<TEvent extends any[]> {
    /**
     * Schedules the given event receiver to be called to process recurrent event(s).
     *
     * If called during event processing the recurrent events will be sent to the given `receiver` after current event
     * processed instead of original one.
     *
     * If called multiple times the latest `receiver` will be used.
     *
     * If not called the recurrent events will be sent to original event receiver.
     *
     * > This method should be called __before__ the recurrent event issued. Otherwise it may happen that recurrent
     * > event will be ignored in some situations. E.g. when it is issued during receiver registration.
     *
     * @param receiver - Recurrent events receiver function.
     */
    onRecurrent(receiver: EventReceiver.Function<TEvent>): void;
  }
}

/**
 * Converts arbitrary event receiver to generic form.
 *
 * The returned event receiver would never send events to original receiver after event supply is cut off.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
 * @param receiver - An event receiver to convert.
 *
 * @returns Event `receiver` in most generic form.
 */
export function eventReceiver<TEvent extends any[]>(
  receiver: EventReceiver<TEvent>,
): EventReceiver.Generic<TEvent> {
  let supply: Supply;
  let receive: (context: EventReceiver.Context<TEvent>, ...event: TEvent) => void;

  if (typeof receiver === 'function') {
    supply = new Supply();
    receive = (_context, ...event) => receiver(...event);
  } else {
    supply = receiver.supply || new Supply();
    receive = (context, ...event) => {
      if (!supply.isOff) {
        // Supply cut off callback may be called before the receiver disabled.
        // Such callback may send an event that should not be received.
        receiver.receive(context, ...event);
      }
    };
  }

  // Disable receiver when event supply is cut off. But see the comment above.
  // For function receiver this callback is always the first one.
  supply.whenOff(() => (receive = EventReceiver$doDonReceive));

  return {
    supply,
    receive: (context, ...event) => receive(context, ...event),
  };
}

function EventReceiver$doDonReceive<TEvent extends any[]>(
  _context: EventReceiver.Context<TEvent>,
  ..._event: TEvent
): void {
  // Do not receive event.
}
