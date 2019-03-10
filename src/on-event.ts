import { callThru, NextCall } from 'call-thru';
import { EventReceiver } from './event-receiver';
import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { EventSender, OnEvent__symbol } from './event-sender';
import { EventNotifier } from './event-notifier';
import Args = NextCall.Callee.Args;

/**
 * An event receiver registration function interface.
 *
 * Once called, the receiver will start receiving the events while still interested.
 *
 * An `OnEvent` function also has a set of handy methods. More could be added later. It also can be used as
 * `EventSender`.
 *
 * To convert a plain event receiver registration function to `OnEvent` an `OnEvent.by()` function can be used.
 *
 * @param <E> An event type. This is a list of event receiver parameter types.
 */
export abstract class OnEvent<E extends any[]> extends Function implements EventSender<E> {

  /**
   * Converts a plain event receiver registration function to `OnEvent` registrar.
   *
   * @param register An event receiver registration function returning an event interest.
   *
   * @returns An `OnEvent` registrar instance registering event receivers with the given `register` function.
   */
  static by<E extends any[]>(register: (this: void, receiver: EventReceiver<E>) => EventInterest): OnEvent<E> {

    const onEvent = ((receiver: EventReceiver<E>) => register(receiver)) as OnEvent<E>;

    Object.setPrototypeOf(onEvent, OnEvent.prototype);

    return onEvent;
  }

  /**
   * Builds an `OnEvent` registrar of receivers of events sent by the given `sender`.
   *
   * @param sender An event sender.
   *
   * @returns An `OnEvent` registrar instance.
   */
  static from<E extends any[]>(sender: EventSender<E>): OnEvent<E> {

    const onEvent = sender[OnEvent__symbol];

    if (onEvent instanceof OnEvent) {
      return onEvent;
    }

    return OnEvent.by(onEvent.bind(sender));
  }

  get [OnEvent__symbol](): this {
    return this;
  }

  /**
   * Registers the next event receiver. It won't receive any events after receiving the first one.
   *
   * @param receiver Next event receiver.
   *
   * @returns An event interest. The receiver won't receive any events if the `off()` method of returned event interest
   * is called before any event is sent.
   */
  once(receiver: EventReceiver<E>): EventInterest {

    let interest = noEventInterest();
    let off = false;

    const wrapper: EventReceiver<E> = (...args: E) => {
      interest.off();
      off = true;
      return receiver(...args);
    };

    interest = this(wrapper);

    if (off) {
      // The receiver is notified immediately during registration.
      // Unregister event interest right away.
      interest.off();
    }

    return interest;
  }

  thru<R1,
      TE extends Args<R1>>(
      fn1: (this: void, ...args: E) => R1):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      TE extends Args<R2>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      TE extends Args<R3>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      TE extends Args<R4>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      TE extends Args<R5>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      TE extends Args<R6>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      TE extends Args<R7>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      TE extends Args<R8>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      TE extends Args<R9>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      P10 extends Args<R9>, R10,
      TE extends Args<R10>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => R10):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      P10 extends Args<R9>, R10,
      P11 extends Args<R10>, R11,
      TE extends Args<R11>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => R10,
      fn11: (this: void, ...args: P11) => R11):
      OnEvent<TE>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      P10 extends Args<R9>, R10,
      P11 extends Args<R10>, R11,
      P12 extends Args<R11>, R12,
      TE extends Args<R12>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => R10,
      fn11: (this: void, ...args: P11) => R11,
      fn12: (this: void, ...args: P12) => R12):
      OnEvent<TE>;

  /**
   * Constructs an event receiver registrar that passes the original event trough the chain of transformation passes.
   *
   * The passes are preformed by `callThru()` function. The event receivers registered by resulting `OnEvent` registrar
   * are called by the last pass in chain. Thus they can be e.g. filtered out or called multiple times.
   *
   * @returns An `OnEvent` registrar of receivers of events transformed with provided passes.
   */
  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      P10 extends Args<R9>, R10,
      P11 extends Args<R10>, R11,
      P12 extends Args<R11>, R12,
      P13 extends Args<R12>, R13,
      TE extends Args<R13>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => R10,
      fn11: (this: void, ...args: P11) => R11,
      fn12: (this: void, ...args: P12) => R12,
      fn13: (this: void, ...args: P13) => R13):
      OnEvent<TE>;

  thru(...fns: any[]): OnEvent<any[]> {

    let shared: [EventNotifier<any[]>, EventInterest] | undefined;

    return OnEvent.by((receiver: EventReceiver<any[]>) => {

      const emitter = shared || (shared = thruNotifier(this, fns));
      const interest = shared[0].on(receiver);

      return eventInterest(reason => {
        interest.off(reason);
        if (!emitter[0].size) {
          emitter[1].off(reason);
          shared = undefined;
        }
      }).needs(interest).needs(emitter[1]);
    });
  }

}

/**
 * An `OnEvent` registrar of receivers that would never receive any events.
 */
export const onNever: OnEvent<any> = /*#__PURE__*/ OnEvent.by(() => noEventInterest());

function thruNotifier(receiver: OnEvent<any[]>, fns: any[]): [EventNotifier<any[]>, EventInterest] {

  const shared = new EventNotifier<any[]>();
  const thru = callThru as any;
  const transform = thru(...fns, (...event: any[]) => shared.send(...event));
  const interest = receiver(transform);

  return [shared, interest];
}

export interface OnEvent<E extends any[]> {

  /**
   * Registers a receiver of events.
   *
   * @param receiver A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the `off()` method of returned event
   * interest is called.
   */
  (this: void, receiver: EventReceiver<E>): EventInterest; // tslint:disable-line:callable-types

}
