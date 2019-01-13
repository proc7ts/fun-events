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
