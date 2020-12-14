import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function OnEvent$do<TEvent extends any[]>(
    this: OnEvent<TEvent>,
    ...processors: ((this: void, arg: any) => any)[]
): any {
  return processors.reduce((arg, action) => action(arg), this);
}
