import { OnEvent__symbol } from './event-sender';
import { EventNotifier } from './event-notifier';
import Mock = jest.Mock;

describe('EventNotifier', () => {

  let notifier: EventNotifier<[string], string>;
  let mockReceiver: Mock<string, [string]>;

  beforeEach(() => {
    notifier = new EventNotifier();
  });
  beforeEach(() => {
    mockReceiver = jest.fn();
  });

  describe('[onEventKey]', () => {
    it('registers event receivers using `on()`', () => {

      const spy = jest.spyOn(notifier, 'on');

      notifier[OnEvent__symbol](mockReceiver);
      expect(spy).toHaveBeenCalledWith(mockReceiver);
      expect(spy.mock.instances[0]).toBe(notifier);
    });
  });
});
