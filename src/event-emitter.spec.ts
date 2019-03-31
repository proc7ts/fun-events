import { EventEmitter } from './event-emitter';
import { EventInterest } from './event-interest';
import { OnEvent__symbol } from './event-sender';
import Mock = jest.Mock;

describe('EventEmitter', () => {

  let emitter: EventEmitter<[string]>;
  let mockReceiver: Mock<string, [string]>;
  let mockReceiver2: Mock<string, [string]>;

  beforeEach(() => {
    emitter = new EventEmitter();
  });
  beforeEach(() => {
    mockReceiver = jest.fn();
    mockReceiver2 = jest.fn();
  });

  it('has no receiver initially', () => {
    expect(emitter.size).toBe(0);
  });

  describe('[OnEvent__symbol]', () => {
    it('refers to `on`', () => {
      expect(emitter[OnEvent__symbol]).toBe(emitter.on);
    });
  });

  describe('on', () => {

    let interest: EventInterest;

    beforeEach(() => {
      interest = emitter.on(mockReceiver);
    });

    it('registers event receiver', () => {
      expect(emitter.size).toBe(1);

      emitter.on(mockReceiver2);

      emitter.send('event');

      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(mockReceiver2).toHaveBeenCalledWith('event');
    });
    it('unregisters receiver when its interest is lost', () => {
      emitter.on(mockReceiver2);
      interest.off();

      emitter.send('event');

      expect(mockReceiver).not.toHaveBeenCalled();
      expect(mockReceiver2).toHaveBeenCalledWith('event');
    });
    it('registers event receiver again', () => {

      const interest2 = emitter.on(mockReceiver);

      expect(emitter.size).toBe(2);

      emitter.send('event');

      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(mockReceiver).toHaveBeenCalledTimes(2);

      mockReceiver.mockClear();
      interest2.off();

      expect(emitter.size).toBe(1);

      emitter.send('event2');

      expect(mockReceiver).toHaveBeenCalledWith('event2');
      expect(mockReceiver).toHaveBeenCalledTimes(1);
    });
  });

  describe('done', () => {
    it('removes all event receivers', () => {
      emitter.on(mockReceiver);
      emitter.on(mockReceiver2);
      emitter.done();

      expect(emitter.size).toBe(0);

      emitter.send('event');

      expect(mockReceiver).not.toHaveBeenCalled();
      expect(mockReceiver2).not.toHaveBeenCalled();
    });
    it('notifies `whenDone` callbacks', () => {

      const reason = 'some reason';
      const whenDone1 = jest.fn();
      const whenDone2 = jest.fn();

      emitter.on(mockReceiver).whenDone(whenDone1);
      emitter.on(mockReceiver2).whenDone(whenDone2);
      emitter.done(reason);

      expect(whenDone1).toHaveBeenCalledWith(reason);
      expect(whenDone2).toHaveBeenCalledWith(reason);
    });
  });
});
