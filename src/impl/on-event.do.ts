import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function OnEvent$do<TEvent extends any[]>(
    this: OnEvent<TEvent>,
    ...actions: ((this: void, arg: any) => any)[]
): any {
  return actions.reduce((arg, action) => action(arg), this);
}
