import { noop, Supply } from '@proc7ts/primitives';
import { EventSender, OnEvent__symbol } from '../base';
import { onEventBy } from '../on-event';
import { EventEmitter } from '../senders';
import { OnStateUpdate } from './on-state-update';
import { statePath, StatePath } from './state-path';
import { StateUpdateReceiver } from './state-update-receiver';

/**
 * @internal
 */
class PathEntry {

  readonly emitter = new EventEmitter<[StatePath.Normalized, any, any]>();
  private readonly _nested = new Map<PropertyKey, PathEntry>();

  constructor(private readonly _drop: () => void) {
    this.emitter.on((path, newValue, oldValue) => {

      const key = path[0];
      const nested = this._nested.get(key);

      if (nested) {
        nested.emitter.send(path.slice(1), newValue, oldValue);
      }
    });
  }

  on(receiver: StateUpdateReceiver): Supply {

    const supply = this.emitter.on(receiver);

    return new Supply(reason => {
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

  done(reason?: unknown): void {
    for (const nested of this._nested.values()) {
      nested.done(reason);
    }
    this.emitter.supply.off(reason);
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

/**
 * @internal
 */
class Trackers {

  private readonly _root = new PathEntry(noop);

  on(path: StatePath.Normalized, receiver: StateUpdateReceiver): Supply {
    return this._entry(path).on(receiver);
  }

  send<T>(path: StatePath.Normalized, newValue: T, oldValue: T): void {
    this._root.emitter.send(path, newValue, oldValue);
  }

  done(path: StatePath.Normalized, reason?: unknown): void {

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

/**
 * @internal
 */
class SubStateTracker implements StateTracker {

  readonly update: <T>(
      this: void,
      path: StatePath,
      newValue: T,
      oldValue: T,
  ) => void;

  readonly onUpdate: OnStateUpdate = onEventBy<[StatePath.Normalized, any, any]>(
      receiver => this._trackers.on(this._path, receiver),
  );

  constructor(private readonly _trackers: Trackers, private readonly _path: StatePath.Normalized) {
    this.update = <T>(path: StatePath, newValue: T, oldValue: T) => {
      this._trackers.send([...this._path, ...statePath(path)], newValue, oldValue);
    };
  }

  get _tracker(): this {
    return this;
  }

  [OnEvent__symbol](): OnStateUpdate {
    return this.onUpdate;
  }

  track(path: StatePath): SubStateTracker {
    path = statePath(path);
    if (!path.length) {
      return this; // Path to itself.
    }
    return new SubStateTracker(this._trackers, [...this._path, ...path]);
  }

  done(reason?: unknown): void {
    this._trackers.done(this._path, reason);
  }

}

/**
 * State changes tracker.
 *
 * A state is a tree-like structure of sub-states (nodes) available under {@link StatePath}.
 *
 * When node modified a {@link StateTracker.update} should be called. Then all state update receivers registered by
 * {@link StateTracker.onUpdate} will receive this update.
 *
 * @category State Tracking
 */
export class StateTracker implements EventSender<[StatePath.Normalized, any, any]> {

  /**
   * @internal
   */
  readonly _tracker: SubStateTracker = new SubStateTracker(new Trackers(), []);

  /**
   * {@link OnStateUpdate state updates sender}.
   *
   * A state update will be sent to it whenever an `update()` function is called.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   *
   * @returns State updates sender.
   */
  get onUpdate(): OnStateUpdate {
    return this._tracker.onUpdate;
  }

  [OnEvent__symbol](): OnStateUpdate {
    return this.onUpdate;
  }

  // noinspection JSCommentMatchesSignature
  /**
   * Updates the component state.
   *
   * All receivers registered with {@link onUpdate} will receive this update.
   *
   * @typeParam T - A type of changed value.
   * @param key - Changed value key.
   * @param newValue - New value.
   * @param oldValue - Previous value.
   */
  get update(): <T>(
      this: void,
      path: StatePath,
      newValue: T,
      oldValue: T,
  ) => void {
    return this._tracker.update;
  }

  /**
   * Starts tracking of partial state under the given path.
   *
   * @param path - A path to state part.
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
   * @param reason - An optional reason to stop tracking.
   */
  done(reason?: unknown): void {
    this._tracker.done(reason);
  }

}
