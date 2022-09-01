import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import {
  AfterEvent__symbol,
  EventKeeper,
  eventReceiver,
  EventReceiver,
  OnEvent__symbol,
} from './base';
import { AfterEvent$noFallback, OnEvent$do, OnEvent$supplier, OnEvent$then } from './impl';
import { isOnEvent, OnEvent } from './on-event';

/**
 * Signature of {@link EventKeeper} implementation able to register the receivers of kept and upcoming events.
 *
 * The registered event receiver receives the kept event immediately upon registration, and all upcoming events
 * after that until the returned event supply is cut off.
 *
 * To convert a plain event receiver registration function to {@link AfterEvent} an {@link afterEventBy} function can
 * be used.
 *
 * May be constructed using {@link afterEventBy} function.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 */
export interface AfterEvent<TEvent extends any[]> extends OnEvent<TEvent>, EventKeeper<TEvent> {
  /**
   * Starts sending events to the given `receiver`.
   *
   * @param receiver - Target receiver of events.
   *
   * @returns A supply of events from this keeper to the given `receiver`.
   */
  (receiver: EventReceiver<TEvent>): Supply;

  [AfterEvent__symbol](): this;
}

/**
 * Converts a plain event receiver registration function to {@link AfterEvent} keeper with a fallback.
 *
 * The event constructed by `fallback` will be sent to the registered first receiver, unless `register` function sends
 * one.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param register - Generic event receiver registration function. It will be called on each receiver registration,
 * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
 * @param fallback - A function creating fallback event. When omitted, the initial event is expected to be sent by
 * `register` function. A receiver registration would lead to an error otherwise.
 * @param cleanup - A function that will be called once all registered event supplies cut off.
 *
 * @returns An {@link AfterEvent} keeper registering event receivers with the given `register` function.
 */
export function afterEventBy<TEvent extends any[]>(
  register: (this: void, receiver: EventReceiver.Generic<TEvent>) => void,
  fallback: (this: void) => TEvent = AfterEvent$noFallback,
  cleanup: (this: void, reason?: unknown) => void = AfterEvent$noCleanup,
): AfterEvent<TEvent> {
  let lastEvent: TEvent | undefined;
  let numReceivers = 0;

  const afterEvent = ((receiver: EventReceiver<TEvent>): Supply => {
    let dest: (context: EventReceiver.Context<TEvent>, ...event: TEvent) => void = noop;
    const generic = eventReceiver(receiver);

    if (generic.supply.isOff) {
      return generic.supply;
    }

    const supply = new Supply(noop).needs(generic);
    let reported = false;

    ++numReceivers;
    try {
      register({
        supply,
        receive: (context, ...event: TEvent) => {
          reported = true;
          lastEvent = event;
          dest(context, ...event);
        },
      });
    } catch (error) {
      supply.off(error);
    }

    if (!supply.isOff || reported) {
      if (!lastEvent) {
        try {
          lastEvent = fallback();
        } catch (error) {
          supply.off(error);
        }
      }
      if (lastEvent) {
        generic.receive(
          {
            onRecurrent(recurrent) {
              dest = (_context, ...event) => recurrent(...event);
            },
          },
          ...lastEvent,
        );
        dest = (context, ...event) => generic.receive(context, ...event);
      }
    }

    return supply.whenOff(reason => {
      if (!--numReceivers) {
        lastEvent = undefined;
      }
      generic.supply.off(reason);
      if (!numReceivers) {
        cleanup(reason);
      }
    });
  }) as AfterEvent<TEvent>;

  afterEvent[OnEvent__symbol] = OnEvent$supplier;
  afterEvent.do = OnEvent$do;
  afterEvent.then = OnEvent$then;
  afterEvent[AfterEvent__symbol] = OnEvent$supplier;

  return afterEvent;
}

function AfterEvent$noCleanup(_reason: unknown): void {
  // No-op `AfterEvent` cleanup
}

/**
 * Checks whether the given value is an {@link AfterEvent} keeper.
 *
 * @category Core
 * @typeParam TEvent - Expected event type.
 * @typeParam TOther - Another type the value may have.
 * @param value - A value to check.
 *
 * @returns `true` if the `value` has been created by {@link afterEventBy} function or in compatible way,
 * or `false` otherwise.
 */
export function isAfterEvent<TEvent extends any[], TOther = unknown>(
  value: AfterEvent<TEvent> | TOther,
): value is AfterEvent<TEvent> {
  return (
    isOnEvent(value)
    && (value as Partial<AfterEvent<TEvent>>)[AfterEvent__symbol] === OnEvent$supplier
  );
}
