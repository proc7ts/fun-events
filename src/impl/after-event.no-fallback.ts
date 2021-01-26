import { NoEventsError } from '../base';

/**
 * @internal
 */
export function AfterEvent$noFallback(): never {
  throw new NoEventsError();
}
