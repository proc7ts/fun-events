/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
/**
 * A path to state or its part. E.g. property value.
 *
 * May consist of one or more property keys.
 *
 * An array consisting of the only one property key is the same as this property key.
 *
 * An empty array is a path to the state itself.
 *
 * @category State Tracking
 */
export type StatePath = PropertyKey | StatePath.Normalized;

export namespace StatePath {

  /**
   * Normalized state path.
   *
   * This is always an array of property keys.
   */
  export type Normalized = readonly PropertyKey[];

}

/**
 * Normalizes a state path consisting of single key.
 *
 * @category State Tracking
 * @param key  A path key.
 *
 * @return Normalized state path.
 */
export function statePath<K extends PropertyKey>(key: K): [K];

/**
 * Normalizes arbitrary state path. I.e. converts it to array.
 *
 * @param path  Arbitrary state path.
 *
 * @return Normalized state path.
 */
export function statePath(path: StatePath): StatePath.Normalized;

export function statePath(path: StatePath): StatePath.Normalized {
  return Array.isArray(path) ? path : [path];
}
