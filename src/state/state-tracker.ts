/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop } from '@proc7ts/call-thru';
import { EventSender, eventSupply, EventSupply, OnEvent__symbol } from '../base';
import { onEventBy } from '../on-event';
import { EventEmitter } from '../senders';
import { OnStateUpdate } from './on-state-update';
import { statePath, StatePath } from './state-path';
import { StateUpdateReceiver } from './state-update-receiver';

class PathEntry {

  readonly emitter = new EventEmitter<[StatePath, any, any]>();
  private readonly _nested = new Map<PropertyKey, PathEntry>();

  constructor(private readonly _drop: () => void) {
    this.emitter.on((path, newValue, oldValue) => {
      path = statePath(path);

      const key = path[0];
      const nested = this._nested.get(key);

      if (nested) {
        nested.emitter.send(path.slice(1), newValue, oldValue);
      }
    });
  }

  on(receiver: StateUpdateReceiver): EventSupply {

    const supply = this.emitter.on(receiver);

    return eventSupply(reason => {
      supply.off(reason);
      this._dropIfEmpty();
    }).needs(supply);
  }

  nest(key: PropertyKey): PathEntry;

  nest(key: PropertyKey, dontCreateMissing: true): PathEntry | undefined;

  nest(key: PropertyKey, dontCreateMissing?: true): PathEntry | undefined;

  nest(key: PropertyKey, dontCreateMissing?: true): PathEntry | undefined {

    const found = this._nested.get(key);

    if (found || dontCreateMissing) {
      return found;
    }

    const created = new PathEntry(() => this._remove(key));

    this._nested.set(key, created);

    return created;
  }

  done(reason?: any): void {
    for (const nested of this._nested.values()) {
      nested.done(reason);
    }
    this.emitter.done(reason);
  }

  private _remove(key: PropertyKey): void {
    this._nested.delete(key);
    this._dropIfEmpty();
  }

  private _dropIfEmpty(): void {
    if (!this._nested.size && this.emitter.size <= 1) {
      this._drop();
    }
  }

}

class Trackers {

  private readonly _root = new PathEntry(noop);

  on(path: StatePath.Normalized, receiver: StateUpdateReceiver): EventSupply {
    return this._entry(path).on(receiver);
  }

  send<V>(path: StatePath.Normalized, newValue: V, oldValue: V): void {
    this._root.emitter.send(path, newValue, oldValue);
  }

  done(path: StatePath.Normalized, reason?: any): void {

    const entry = this._entry(path, true);

    if (entry) {
      entry.done(reason);
    }
  }

  private _entry(path: StatePath.Normalized): PathEntry;

  private _entry(path: StatePath.Normalized, dontCreateMissing: true): PathEntry | undefined;

  private _entry(path: StatePath.Normalized, dontCreateMissing?: true): PathEntry | undefined {

    let entry = this._root;

    for (const key of path) {

      const nested = entry.nest(key, dontCreateMissing);

      if (!nested) {
        return;
      }

      entry = nested;
    }

    return entry;
  }

}

class SubStateTracker implements StateTracker {

  readonly update: <V>(
      this: void,
      path: StatePath,
      newValue: V,
      oldValue: V,
  ) => void = (<V>(path: StatePath, newValue: V, oldValue: V) => {
    this._trackers.send([...this._path, ...statePath(path)], newValue, oldValue);
  });

  constructor(private readonly _trackers: Trackers, private readonly _path: StatePath.Normalized) {
  }

  get _tracker(): this {
    return this;
  }

  onUpdate(): OnStateUpdate;
  onUpdate(receiver: StateUpdateReceiver): EventSupply;
  onUpdate(receiver?: StateUpdateReceiver): OnStateUpdate | EventSupply {
    return (this.onUpdate = onEventBy<[StatePath, any, any]>(
        receiver => this._trackers.on(this._path, receiver),
    ).F as OnStateUpdate.Fn)(receiver);
  }

  [OnEvent__symbol](): OnStateUpdate {
    return this.onUpdate();
  }

  track(path: StatePath): SubStateTracker {
    path = statePath(path);
    if (!path.length) {
      return this; // Path to itself.
    }
    return new SubStateTracker(this._trackers, [...this._path, ...path]);
  }

  done(reason?: any): void {
    this._trackers.done(this._path, reason);
  }

}

/**
 * State changes tracker.
 *
 * A state is a tree-like structure of sub-states (nodes) available under [[StatePath]].
 *
 * When node modified a [[StateTracker.update]] should be called. Then all state update receivers registered by
 * [[StateTracker.onUpdate]] will receive this update.
 *
 * @category State Tracking
 */
export class StateTracker implements EventSender<[StatePath, any, any]> {

  /**
   * @internal
   */
  readonly _tracker: SubStateTracker = new SubStateTracker(new Trackers(), []);

  /**
   * Builds a {@link OnStateUpdate state updates sender}.
   *
   * A state update will be sent to it whenever an `update()` function is called.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   *
   * @returns State updates sender.
   */
  onUpdate(): OnStateUpdate;

  /**
   * Registers a receiver of state updates.
   *
   * @param receiver State updates receiver to register.
   *
   * @returns A supply of state updates.
   */
  onUpdate(receiver: StateUpdateReceiver): EventSupply;

  onUpdate(receiver?: StateUpdateReceiver): OnStateUpdate | EventSupply {
    return (this.onUpdate = this._tracker.onUpdate().F)(receiver);
  }

  [OnEvent__symbol](): OnStateUpdate {
    return this.onUpdate();
  }

  // noinspection JSCommentMatchesSignature
  /**
   * Updates the component state.
   *
   * All receivers registered with [[onUpdate]] will receive this update.
   *
   * @typeparam V  A type of changed value.
   * @param key  Changed value key.
   * @param newValue  New value.
   * @param oldValue  Previous value.
   */
  get update(): <V>(
      this: void,
      path: StatePath,
      newValue: V,
      oldValue: V,
  ) => void {
    return this._tracker.update;
  }

  /**
   * Starts tracking of partial state under the given path.
   *
   * @param path  A path to state part.
   *
   * @return New partial state tracker.
   */
  track(path: StatePath): StateTracker {

    const subTracker = this._tracker.track(path);

    return subTracker === this._tracker ? this : subTracker;
  }

  /**
   * Unregisters updates receivers and cuts off their supplies.
   *
   * After this method call the updates receivers of this partial state and all nested states won't receive any updates.
   *
   * @param reason  An optional reason to stop tracking.
   */
  done(reason?: any): void {
    this._tracker.done(reason);
  }

}
