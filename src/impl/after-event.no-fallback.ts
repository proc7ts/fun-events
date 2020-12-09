/**
 * @internal
 */
export function AfterEvent$noFallback(): never {
  throw new Error('No events to send');
}
