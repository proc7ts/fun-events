import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function OnEvent$supplier<T extends OnEvent<any>>(this: T): T {
  return this;
}
