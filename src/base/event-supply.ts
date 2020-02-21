/**
 * @packageDocumentation
 * @module fun-events
 */
import { noop } from 'call-thru';

/**
 * A key of [[EventSupplyPeer]] property containing [[EventSupply]] instance.
 *
 * @category Core
 */
export const EventSupply__symbol = (/*#__PURE__*/ Symbol('events-supply'));

/**
 * A supply of events from {@link EventSupplier event supplier} to {@link EventReceiver event receiver}.
 *
 * When no longer needed the supply may be {@link off cut off}.
 *
 * May be constructed using [[eventSupply]] function.
 *
 * @category Core
 */
export abstract class EventSupply implements EventSupplyPeer {

  /**
   * Whether this supply is {@link off cut off} already.
   *
   * `true` means the events will no longer be supplied.
   */
  abstract readonly isOff: boolean;

  /**
   * `this` event supply.
   */
  get [EventSupply__symbol](): this {
    return this;
  }

  /**
   * Cuts off the supply of events.
   *
   * After this method call the receiver will no longer receive events.
   *
   * Calling this method for the second time has no effect.
   *
   * @param reason  An optional reason why supply is cut off. It will be reported to [[whenOff]] callbacks.
   * @returns A cut off event supply instance.
   */
  abstract off(reason?: any): EventSupply;

  /**
   * Registers a callback function that will be called as soon as this supply is {@link off cut off}. This callback
   * will be called immediately if [[isOff]] is `true`.
   *
   * @param callback  A callback function accepting optional cut off reason as its only parameter.
   * By convenience an `undefined` reason means normal completion.
   *
   * @returns `this` instance.
   */
  abstract whenOff(callback: (this: void, reason?: any) => void): this;

  /**
   * Declares this event supply depends on another one.
   *
   * Once `another` supply is {@link off cut off}, this one is will be cut off with the same reason.
   *
   * @param another  A peer of event supply this one depends on.
   *
   * @return `this` instance.
   */
  needs(another: EventSupplyPeer): this {
    eventSupplyOf(another).whenOff(reason => this.off(reason));
    return this;
  }

}

/**
 * A peer of event supply.
 *
 * Contains an [[EventSupply]] that can be extracted by [[eventSupplyOf]] function.
 *
 * To be implemented by objects that controls event supply. An [[EventSupply]] is a peer of itself.
 *
 * @category Core
 */
export interface EventSupplyPeer {

  /**
   * An event supply of this peer.
   */
  readonly [EventSupply__symbol]: EventSupply;

}

/**
 * Extracts an event supply from its peer.
 *
 * @category Core
 * @param peer  A peer of event supply.
 *
 * @returns Extracted event supply contained in [[EventSupply__symbol]] property.
 */
export function eventSupplyOf(peer: EventSupplyPeer): EventSupply {
  return peer[EventSupply__symbol];
}

/**
 * Constructs new {@link EventSupply event supply}.
 *
 * @category Core
 * @param off  A function to call when supply will supply is {@link EventSupply.off cut off}. Accepts optional
 * cut off reason as its only parameter. No-op by default.
 */
export function eventSupply(off: (this: void, reason?: any) => void = noop): EventSupply {

  let whenOff: (callback: (reason?: any) => void) => void;
  let cutOff: (reason?: any) => void = reason => {
    whenOff = callback => callback(reason);
    cutOff = noop;
    off(reason);
  };

  whenOff = callback => {

    const prev = cutOff;

    cutOff = reason => {
      prev(reason);
      callback(reason);
    };
  };

  class Supply extends EventSupply {

    get isOff(): boolean {
      return cutOff === noop;
    }

    off(reason?: any): EventSupply {
      cutOff(reason);
      return this;
    }

    whenOff(callback: (reason?: any) => void): this {
      whenOff(callback);
      return this;
    }

  }

  return new Supply();
}

/**
 * @internal
 */
class NoSupply extends EventSupply {

  get isOff(): true {
    return true;
  }

  off(): this {
    return this;
  }

  whenOff(callback: (reason?: any) => void): this {
    callback();
    return this;
  }

}

/**
 * @internal
 */
const noSupply = (/*#__PURE__*/ new NoSupply());

/**
 * Returns a no-event supply.
 *
 * @category Core
 *
 * @returns An event supply that is already cut off without any particular reason.
 */
export function noEventSupply(): EventSupply {
  return noSupply;
}