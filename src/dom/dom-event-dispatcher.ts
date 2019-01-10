import { DomEventProducer } from './dom-event-producer';

/**
 * DOM events dispatcher is a DOM event producer along with event dispatching method.
 */
export class DomEventDispatcher {

  /**
   * @internal
   */
  private readonly _target: EventTarget;

  /**
   * Constructs DOM event dispatcher for the given event target.
   *
   * @param target Event target to construct event dispatcher for.
   */
  constructor(target: EventTarget) {
    this._target = target;
  }

  /**
   * Returns a DOM event producer for the given HTML body element event type.
   */
  on<K extends keyof HTMLBodyElementEventMap>(type: K): DomEventProducer<HTMLBodyElementEventMap[K]>;

  /**
   * Returns a DOM event producer for the given HTML marquee element event type.
   */
  on<K extends keyof HTMLMarqueeElementEventMap>(type: K): DomEventProducer<HTMLMarqueeElementEventMap[K]>;

  /**
   * Returns a DOM event producer for the given HTML media element event type.
   */
  on<K extends keyof HTMLMediaElementEventMap>(type: K): DomEventProducer<HTMLMediaElementEventMap[K]>;

  /**
   * Returns a DOM event producer for the given HTML video element event type.
   */
  on<K extends keyof HTMLVideoElementEventMap>(type: K): DomEventProducer<HTMLVideoElementEventMap[K]>;

  /**
   * Returns a DOM event producer for the given HTML element event type.
   */
  on<K extends keyof HTMLElementEventMap>(type: K): DomEventProducer<HTMLElementEventMap[K]>;

  /**
   * Returns a DOM event producer for the given window event type.
   */
  on<K extends keyof WindowEventHandlersEventMap>(type: K): DomEventProducer<WindowEventHandlersEventMap[K]>;

  /**
   * Returns a DOM event producer for the given event type.
   *
   * The listeners registered with returned event producer will be notified on DOM events.
   *
   * The returned DOM event producer calls an `EventTarget.addEventListener()` to register listeners. But, in contrast,
   * it allows to register the same listener multiple times.
   *
   * The `EventInterest` returned upon event listener registration, unregisters the given event listener with
   * `EventTarget.removeEventListener()` when its `off()` method is called.
   */
  on<E extends Event>(type: string): DomEventProducer<E>;

  on<E extends Event>(type: string): DomEventProducer<E> {
    return DomEventProducer.of<E>((listener, opts) => {

          const _listener: EventListener = event => listener(event as E);

          this._target.addEventListener(type, _listener, opts);

          return {
            off: () => this._target.removeEventListener(type, _listener),
          };
        }
    );
  }

  /**
   * Dispatches the given DOM event to event target.
   *
   * Calls `EventTarget.dispatchEvent()` method.
   *
   * @param event An event to dispatch.
   *
   * @returns `true` if either event's `cancelable` attribute value is `false` or its `preventDefault()` method was not
   * invoked, or `false` otherwise.
   */
  dispatch(event: Event): boolean {
    return this._target.dispatchEvent(event);
  }

}
