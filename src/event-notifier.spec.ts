import { OnEvent__symbol } from './event-sender';
import { EventNotifier } from './event-notifier';
import Mock = jest.Mock;

describe('EventNotifier', () => {

  let notifier: EventNotifier<[string], string>;
  let consumerSpy: Mock<string, [string]>;

  beforeEach(() => {
    notifier = new EventNotifier();
  });
  beforeEach(() => {
    consumerSpy = jest.fn();
  });

  describe('[onEventKey]', () => {
    it('registers event consumers using `on()`', () => {

      const spy = jest.spyOn(notifier, 'on');

      notifier[OnEvent__symbol](consumerSpy);
      expect(spy).toHaveBeenCalledWith(consumerSpy);
      expect(spy.mock.instances[0]).toBe(notifier);
    });
  });
});
